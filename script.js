const DEBUG = false;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- GAME CONFIGURATION ---
const TILE_SIZE = 40;
const DIRECTIONS = ['RIGHT', 'DOWN', 'LEFT', 'UP'];
const DIR_OFFSETS = {
    'RIGHT': { x: 1,  y: 0,  angle: 0 },
    'DOWN':  { x: 0,  y: 1,  angle: Math.PI / 2 },
    'LEFT':  { x: -1, y: 0,  angle: Math.PI },
    'UP':    { x: 0,  y: -1, angle: Math.PI * 1.5 }
};

const RESOURCE_TYPES = {
    iron_ore:    { color: '#7a7a7a', name: 'Iron Ore' },
    copper_ore:  { color: '#d16e3b', name: 'Copper Ore' },
    coal:        { color: '#111111', name: 'Coal' },
    pure_iron:   { color: '#b0c4de', name: 'Pure Iron' },
    pure_copper: { color: '#ff7f50', name: 'Pure Copper' },
};

const RECIPES = {
    smelter: {
        iron_ore:   { count: 1, output: 'pure_iron' },
        copper_ore: { count: 1, output: 'pure_copper' }
    }
};

const BUILD_RECIPES = {
    conveyor: { name: 'Conveyor', cost: { iron_ore: 1 } },
    miner:    { name: 'Miner',    cost: { iron_ore: 3, copper_ore: 1 } },
    smelter: { name: 'Smelter', cost: { iron_ore: 5, coal: 10 } },
    conveyor2: { name: 'Conveyor 2', cost: { pure_iron: 1 } },
    miner2:    { name: 'Miner 2',    cost: { pure_iron: 3, pure_copper: 1 } },
    smelter2:  { name: 'Smelter 2',  cost: { pure_iron: 5, coal: 20 } },
};


// Map factory to easily instantiate dynamic structures
const BuildingFactory = {
    conveyor: (dir) => new Conveyor(dir),
    miner:    (dir) => new Miner(dir),
    smelter: (dir) => new Smelter(dir),
    conveyor2: (dir) => new Conveyor2(dir),
    miner2:    (dir) => new Miner2(dir),
    smelter2:  { name: 'Smelter 2',  cost: { pure_iron: 5, coal: 20 } },
    conveyor2: (dir) => new Conveyor2(dir),
    miner2:    (dir) => new Miner2(dir),
    smelter2:  (dir) => new Smelter2(dir),
};

// --- OBJECT-ORIENTED BUILDING LOGIC ---
class Building {
    constructor(direction) {
        this.direction = direction;
    }
    
    getAngle() {
        return DIR_OFFSETS[this.direction].angle;
    }

    applyRotationTransform(bx, by, cameraX, cameraY) {
        const centerX = bx * TILE_SIZE + TILE_SIZE / 2 - cameraX;
        const centerY = by * TILE_SIZE + TILE_SIZE / 2 - cameraY;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.getAngle());
    }

    draw(bx, by, cameraX, cameraY) {
        // Implemented by subclasses
        console.warn("THIS SHOULD BE UNREACHABLE");
    }

    update(key, bx, by, engine) {
        // Optional override per subclass
    }

    handleItemOnTile(item, engine) {
        // Optional override per subclass
    }
}

class Conveyor extends Building {
    constructor(direction) {
        super(direction);
        this.speed = 0.02; // Base speed
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#555';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -10);
        ctx.lineTo(-5, 10);
        ctx.fill();
        ctx.restore();
    }

    handleItemOnTile(item, engine) {
        item.progress += this.speed;
        if (item.progress >= 1) {
            const offset = DIR_OFFSETS[this.direction];
            item.gridX += offset.x;
            item.gridY += offset.y;
            item.progress = 0;
        }
    }
}

class Conveyor2 extends Conveyor {
    constructor(direction) {
        super(direction);
        this.speed = 0.06;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#555';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#26ff00';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -10);
        ctx.lineTo(-5, 10);
        ctx.fill();
        ctx.restore();
    }
}

class Miner extends Building {
    constructor(direction) {
        super(direction);
        this.timer = 0
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(5, -5, 12, 10);
        ctx.restore();
    }

    update(key, bx, by, engine) {
        this.timer++;
        if (this.timer >= 120) {
            this.timer = 0;
            const minedRes = engine.naturalResources[key];
            if (minedRes) {
                const offset = DIR_OFFSETS[this.direction];
                engine.movingItems.push({
                    type: minedRes,
                    gridX: bx + offset.x,
                    gridY: by + offset.y,
                    progress: 0
                });
            }
        }
    }
}

class Miner2 extends Miner {
    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#dcbe10';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = '#ff00ae';
        ctx.fillRect(5, -5, 12, 10);
        ctx.restore();
    }

    update(key, bx, by, engine) {
        this.timer++;
        if (this.timer >= 90) {
            this.timer = 0;
            const minedRes = engine.naturalResources[key];
            if (minedRes) {
                const offset = DIR_OFFSETS[this.direction];
                engine.movingItems.push({
                    type: minedRes,
                    gridX: bx + offset.x,
                    gridY: by + offset.y,
                    progress: 0
                });
            }
        }
    }
}

class Smelter extends Building {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 90;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#7b7b7b';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
        ctx.fillStyle = '#4dff00';
        ctx.fillRect(-16, -5, 12, 10);
        
        ctx.fillStyle = this.isProcessing ? '#ff4000' : '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.restore();
    }

    update(key, bx, by, engine) {
        if (this.isProcessing) {
            this.timer++;
            if (this.timer >= this.processingTime) {
                const offset = DIR_OFFSETS[this.direction];
                
                engine.movingItems.push({
                    type: this.currentOutput,
                    gridX: bx + offset.x,
                    gridY: by + offset.y,
                    progress: 0.1
                });

                this.isProcessing = false;
                this.currentOutput = null;
                this.timer = 0;
            }
        }
    }

    
    tryReceiveItem(item) {
        if (this.isProcessing) return false;

        const smelterRecipes = RECIPES.smelter;
        const recipe = smelterRecipes[item.type];

        if (recipe) {
            this.isProcessing = true;
            this.currentOutput = recipe.output;
            this.timer = 0;
            return true; // Item consumed successfully
        }
        return false;
    }
}

class Smelter2 extends Smelter {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 60;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#b2fff2';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
        ctx.fillStyle = '#4dff00';
        ctx.fillRect(-16, -5, 12, 10);
        
        ctx.fillStyle = this.isProcessing ? '#ff4000' : '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.restore();
    }
}

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
        this.ui.setupSaveLoadUI(); // Setup Save/Load Buttons
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
            alert('Factory layout and resources loaded successfully!');
        } catch (e) {
            console.error("Failed to parse save data:", e);
            alert('Error loading save file: Data corrupted or incompatible.');
        }
    }

    resizeCanvas() {
        canvas.width = window.innerWidth - 300;
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
            if (Math.random() > 0.7) delete this.naturalResources[key];
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
new GameEngine();