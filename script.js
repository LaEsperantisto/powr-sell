const DEBUG = false;

import {
    Conveyor, Conveyor2, Conveyor3,
    Smelter, Smelter2, Smelter3,
    Miner, Miner2, Miner3,
    Moulder, Moulder2, Moulder3,
    Splitter,
    Splitter2,
    Splitter3,
} from './buildings.js';

import {
    RESOURCE_TYPES,
    BUILD_RECIPES,
    TILE_SIZE,
    ctx,
    canvas,
    DIRECTIONS,
    DIR_OFFSETS
} from './globals.js';

const BuildingFactory = {
    conveyor: (dir) => new Conveyor(dir),
    miner:    (dir) => new Miner(dir),
    smelter: (dir) => new Smelter(dir),
    conveyor2: (dir) => new Conveyor2(dir),
    miner2: (dir) => new Miner2(dir),
    smelter2: (dir) => new Smelter2(dir),
    conveyor3: (dir) => new Conveyor3(dir),
    miner3:    (dir) => new Miner3(dir),
    smelter3: (dir) => new Smelter3(dir),
    moulder: (dir) => new Moulder(dir),
    moulder2: (dir) => new Moulder2(dir),
    moulder3: (dir) => new Moulder3(dir),
    splitter: (dir) => new Splitter(dir),
    splitter2: (dir) => new Splitter2(dir),
    splitter3: (dir) => new Splitter3(dir),
};

// --- CORE GAME ENGINE ---
class GameEngine {
    constructor() {
        this.player = { x: 100, y: 100, size: 20, speed: 4 };
        this.inventory = {};
        this.generatedTiles = new Set();

        Object.keys(RESOURCE_TYPES).forEach(resource => {
            this.inventory[resource] = DEBUG ? 999 : 0;
        });

        this.naturalResources = {};
        this.buildings = {};
        this.movingItems = [];
        
        this.currentSelectedBuild = '';
        this.currentRotationIndex = 0;

        this.input = new InputHandler(this);
        this.ui = new UIManager(this);

        this.init();
    }

    init() {
        this.ui.setupBuildUI();
        this.ui.setupSaveLoadUI();
        this.ui.updateInventoryUI();
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        canvas.addEventListener('mousedown', (e) => this.handleCanvasClick(e));
        
        this.loop();
    }

    // --- SAVE / LOAD SYSTEM ---
    saveGame() {
        const validation = confirm("Are you sure you want to override the current save file?");
        if (!validation) return;
        const saveData = {
            inventory: this.inventory,
            naturalResources: this.naturalResources,
            generatedTiles: Array.from(this.generatedTiles),
            player: this.player,
            buildings: Object.entries(this.buildings).reduce((acc, [key, building]) => {
                acc[key] = {
                    type: building.constructor.name.toLowerCase(),
                    direction: building.direction
                };
                return acc;
            }, {})
        };

        localStorage.setItem('factory_survival_save', JSON.stringify(saveData));
        alert('Factory layout and resources saved successfully!');
    }

    loadGame() {
        const validation = confirm("Are you sure you want to override the current world?");
        if (!validation) return;

        const rawData = localStorage.getItem('factory_survival_save');
        if (!rawData) {
            alert('No saved factory layout found.');
            return;
        }

        try {
            const saveData = JSON.parse(rawData);

            Object.keys(RESOURCE_TYPES).forEach(res => {
                this.inventory[res] = saveData.inventory[res] !== undefined ? saveData.inventory[res] : (DEBUG ? 999 : 0);
            });

            this.naturalResources = saveData.naturalResources || {};
            this.generatedTiles = new Set(saveData.generatedTiles || []);
            if (saveData.player) this.player = saveData.player;

            this.buildings = {};
            this.movingItems = [];

            Object.entries(saveData.buildings).forEach(([key, data]) => {
                if (BuildingFactory[data.type]) {
                    this.buildings[key] = BuildingFactory[data.type](data.direction);
                } else {
                    console.warn(`Building type "${data.type}" not recognized in this game version.`);
                }
            });

            this.ui.updateInventoryUI();
        } catch (e) {
            console.error("Failed to parse save data:", e);
            alert('Error loading save file: Data corrupted or incompatible.');
        }
    }

    resizeCanvas() {
        canvas.width = window.innerWidth - 600;
        canvas.height = window.innerHeight;
    }

    generateTileIfNeeded(x, y) {
        const key = `${x},${y}`;
        if (this.generatedTiles.has(key)) return;

        this.generatedTiles.add(key);
        const rand = Math.random();
        if (rand < 0.03)      this.naturalResources[key] = 'iron_ore';
        else if (rand < 0.05) this.naturalResources[key] = 'copper_ore';
        else if (rand < 0.06) this.naturalResources[key] = 'coal';
    }

    getCurrentDirection() {
        return DIRECTIONS[this.currentRotationIndex];
    }

    rotateSelection() {
        this.currentRotationIndex = (this.currentRotationIndex + 1) % DIRECTIONS.length;
        this.ui.updateRotationDisplay();
    }

    mineCurrentBlock() {
        const gridX = Math.floor(this.player.x / TILE_SIZE);
        const gridY = Math.floor(this.player.y / TILE_SIZE);
        const key = `${gridX},${gridY}`;
        
        const res = this.naturalResources[key];
        if (res) {
            if (Math.random() > 0.9) delete this.naturalResources[key];
            this.inventory[res] = (this.inventory[res] || 0) + 1;
            this.ui.updateInventoryUI();
        }
    }

    handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const cameraX = this.player.x - canvas.width / 2;
        const cameraY = this.player.y - canvas.height / 2;
        
        const worldX = e.clientX - rect.left + cameraX;
        const worldY = e.clientY - rect.top + cameraY;

        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);
        const key = `${gridX},${gridY}`;

        if (this.currentSelectedBuild === '') return;

        if (this.currentSelectedBuild === 'delete') {
            const building = this.buildings[key];
            if (building) {
                const type = building.constructor.name.toLowerCase();
                const recipe = BUILD_RECIPES[type]?.cost;
                if (recipe) {
                    Object.keys(recipe).forEach(res => {
                        this.inventory[res] = (this.inventory[res] || 0) + recipe[res];
                    });
                }
                delete this.buildings[key];
                this.ui.updateInventoryUI();
            }
            return;
        }

        if (this.buildings[key]) return;

        const recipe = BUILD_RECIPES[this.currentSelectedBuild]?.cost;
        const canAfford = Object.keys(recipe).every(res => (this.inventory[res] || 0) >= recipe[res]);

        if (canAfford) {
            Object.keys(recipe).forEach(res => this.inventory[res] -= recipe[res]);
            this.buildings[key] = BuildingFactory[this.currentSelectedBuild](this.getCurrentDirection());
            this.ui.updateInventoryUI();
        }
    }

    update() {
        // Player Movement
        if (this.input.isPressed('w') || this.input.isPressed('arrowup'))    this.player.y -= this.player.speed;
        if (this.input.isPressed('s') || this.input.isPressed('arrowdown'))  this.player.y += this.player.speed;
        if (this.input.isPressed('a') || this.input.isPressed('arrowleft'))  this.player.x -= this.player.speed;
        if (this.input.isPressed('d') || this.input.isPressed('arrowright')) this.player.x += this.player.speed;

        // Process Buildings
        for (const [key, building] of Object.entries(this.buildings)) {
            const [bx, by] = key.split(',').map(Number);
            building.update(key, bx, by, this);
        }

        // Process Transport Items
        const pGridX = Math.floor(this.player.x / TILE_SIZE);
        const pGridY = Math.floor(this.player.y / TILE_SIZE);

        for (let i = this.movingItems.length - 1; i >= 0; i--) {
            const item = this.movingItems[i];
            
            if (item.gridX === pGridX && item.gridY === pGridY) {
                this.inventory[item.type] = (this.inventory[item.type] || 0) + 1;
                this.ui.updateInventoryUI();
                this.movingItems.splice(i, 1);
                continue;
            }

            const currentBuilding = this.buildings[`${item.gridX},${item.gridY}`];
            
            if (currentBuilding) {
                if (typeof currentBuilding.tryReceiveItem === 'function') {
                    if (currentBuilding.tryReceiveItem(item)) {
                        this.movingItems.splice(i, 1);
                        continue;
                    }
                }
                currentBuilding.handleItemOnTile(item, this);
            } else {
                item.progress = 0;
            }
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cameraX = this.player.x - canvas.width / 2;
        const cameraY = this.player.y - canvas.height / 2;

        const startX = Math.floor(cameraX / TILE_SIZE);
        const startY = Math.floor(cameraY / TILE_SIZE);
        const endX = Math.ceil((cameraX + canvas.width) / TILE_SIZE);
        const endY = Math.ceil((cameraY + canvas.height) / TILE_SIZE);

        // 1. Grid & Dynamic generation of viewport tiles
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                this.generateTileIfNeeded(x, y);
                const key = `${x},${y}`;
                
                const screenX = x * TILE_SIZE - cameraX;
                const screenY = y * TILE_SIZE - cameraY;

                if (this.naturalResources[key]) {
                    ctx.fillStyle = RESOURCE_TYPES[this.naturalResources[key]].color;
                    ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else {
                    ctx.strokeStyle = '#333';
                    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // 2. Buildings
        for (const [key, building] of Object.entries(this.buildings)) {
            const [bx, by] = key.split(',').map(Number);
            // Culling optimization: only draw if within boundary reach
            if (bx >= startX - 1 && bx <= endX + 1 && by >= startY - 1 && by <= endY + 1) {
                building.draw(bx, by, cameraX, cameraY);
            }
        }

        // 3. Draw Moving Ore Items
        this.movingItems.forEach(item => {
            let offset = { x: 0, y: 0 };
            const currentBuilding = this.buildings[`${item.gridX},${item.gridY}`];
            
            if (currentBuilding instanceof Conveyor) {
                offset = DIR_OFFSETS[currentBuilding.direction];
            }

            const worldRenderX = (item.gridX + (offset.x * item.progress)) * TILE_SIZE + TILE_SIZE / 2;
            const worldRenderY = (item.gridY + (offset.y * item.progress)) * TILE_SIZE + TILE_SIZE / 2;

            const screenRenderX = worldRenderX - cameraX;
            const screenRenderY = worldRenderY - cameraY;

            ctx.fillStyle = RESOURCE_TYPES[item.type]?.color || '#fff';
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.arc(screenRenderX, screenRenderY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // 4. Player (Stays in the center of the camera viewport screen)
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(canvas.width / 2 - this.player.size / 2, canvas.height / 2 - this.player.size / 2, this.player.size, this.player.size);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// --- SYSTEM HANDLERS ---
class InputHandler {
    constructor(engine) {
        this.keys = {};
        
        window.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            if (e.key === 'q') engine.mineCurrentBlock();
            if (key === 'r') engine.rotateSelection();
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
        document.getElementById('rotate-btn').addEventListener('click', () => engine.rotateSelection());
    }

    isPressed(key) {
        return !!this.keys[key];
    }
}

class UIManager {
    constructor(engine) {
        this.engine = engine;
    }

    updateRotationDisplay() {
        document.getElementById('rotation-display').innerText = this.engine.getCurrentDirection();
    }

    updateInventoryUI() {
        const container = document.getElementById('inventory-list');
        container.innerHTML = '';
        
        for (const [key, value] of Object.entries(this.engine.inventory)) {
            const itemRow = document.createElement('div');
            itemRow.className = 'inventory-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.innerText = RESOURCE_TYPES[key] ? RESOURCE_TYPES[key].name : key;
            
            const countSpan = document.createElement('span');
            countSpan.innerText = value;
            
            itemRow.appendChild(nameSpan);
            itemRow.appendChild(countSpan);
            container.appendChild(itemRow);
        }
    }

    setupBuildUI() {
        const buildOptions = document.getElementById('build-options');
        
        Object.entries(BUILD_RECIPES).forEach(([key, value]) => {
            const newBuilding = document.createElement('button');
            newBuilding.classList.add('build-btn');
            newBuilding.setAttribute('data-type', key);
            
            // Create a span for the Building Title
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('btn-name');
            nameSpan.innerText = value.name;
            newBuilding.appendChild(nameSpan);

            // Construct and clean up the recipe string format dynamically
            const costEntries = Object.entries(value.cost).map(([resKey, amt]) => {
                const prettyResName = RESOURCE_TYPES[resKey] ? RESOURCE_TYPES[resKey].name : resKey;
                return `${amt} ${prettyResName}`;
            });
            
            // Create a span for the Recipe text underneath
            const recipeSpan = document.createElement('span');
            recipeSpan.classList.add('btn-recipe');
            recipeSpan.innerText = `Cost:\n${costEntries.join(', ')}`;
            newBuilding.appendChild(recipeSpan);

            buildOptions.appendChild(newBuilding);
        });

        // Set up click handlers for all buttons
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                const isAlreadyActive = targetBtn.classList.contains('active');

                document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));

                if (!isAlreadyActive) {
                    targetBtn.classList.add('active');
                    this.engine.currentSelectedBuild = targetBtn.getAttribute('data-type');
                } else {
                    this.engine.currentSelectedBuild = '';
                }
            });
        });
    }

    setupSaveLoadUI() {
        document.getElementById('save-btn').addEventListener('click', () => this.engine.saveGame());
        document.getElementById('load-btn').addEventListener('click', () => this.engine.loadGame());
    }
}

// Fire up engine instance
const engine = new GameEngine();