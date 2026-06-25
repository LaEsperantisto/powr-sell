import {
    Conveyor, Conveyor2, Conveyor3,
    Smelter, Smelter2, Smelter3,
    Miner, Miner2, Miner3,
    Moulder, Moulder2, Moulder3,
    Splitter,
    Splitter2,
    Splitter3,
    Receiver,
    ThreeWaySplitter,
    ThreeWaySplitterPart2,
    ThreeWaySplitterPart3,
    Beacon,
    Refinery,
    BouncePad,
    BouncePad2,
    BouncePad3,
    Sorter,
    SorterHead,
    ConveyorUltimate,
    Refinery2,
    Refinery3,
    Destroyer,
    Seller,
} from './buildings.js';

import {
    RESOURCE_TYPES,
    BUILD_RECIPES,
    TILE_SIZE,
    ctx,
    canvas,
    DIRECTIONS,
    DIR_OFFSETS,
    HANDBOOK_DATA,
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
    receiver: (dir) => new Receiver(dir),
    threewaysplitter: (dir) => new ThreeWaySplitter(dir),
    threewaysplitterpart2: (dir) => new ThreeWaySplitterPart2(dir),
    threewaysplitterpart3: (dir) => new ThreeWaySplitterPart3(dir),
    beacon: (dir) => new Beacon(dir),
    refinery: (dir) => new Refinery(dir),
    bouncepad: (dir) => new BouncePad(dir),
    bouncepad2: (dir) => new BouncePad2(dir),
    bouncepad3: (dir) => new BouncePad3(dir),
    sorter: (dir) => new Sorter(dir),
    sorterhead: (dir) => new SorterHead(dir),
    conveyorultimate: (dir) => new ConveyorUltimate(dir),
    refinery2: (dir) => new Refinery2(dir),
    refinery3: (dir) => new Refinery3(dir),
    destroyer: (dir) => new Destroyer(dir),
    seller: (dir) => new Seller(dir),
};

let permaDaws = [];

// --- CORE GAME ENGINE ---
class GameEngine {
    constructor() {
        this.player = { x: 100, y: 100, size: 20, speed: 4 };
        this.inventory = {};
        this.generatedTiles = new Set();
        this.mouseGridPosition = { x: null, y: null };
        this.mouseCanvasPosition = { x: 0, y: 0 }; 
        this.hoveredBuildingName = null;           

        Object.keys(RESOURCE_TYPES).forEach(resource => {
            this.inventory[resource] = 0;
        });

        this.naturalResources = {};
        this.buildings = {};
        this.movingItems = [];
        
        this.currentSelectedBuild = '';
        this.currentRotationIndex = 0;

        this.gameMinutes = 0;
        this.lastTimeUpdate = 0;

        // Edit Mode sub-states: 'select', 'paste'
        this.editState = 'select'; 
        this.selectionStart = null; // {x, y} grid coordinates
        this.selectionEnd = null;   // {x, y} grid coordinates
        this.clipboard = [];        // Array of {dx, dy, type, direction}
        this.isCutting = false;

        this.input = new InputHandler(this);
        this.ui = new UIManager(this);

        this.mouseDown = null;
        this.init();
    }

    init() {
        this.ui.setupBuildUI();
        this.ui.setupSaveLoadUI();
        this.ui.updateInventoryUI();
        this.ui.setupHandbookUI();
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = e;
            this.handleCanvasMouseDown(e);
        });
        canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
            if (this.mouseDown !== null) this.mouseDown = e;
        });
        canvas.addEventListener('mouseleave', () => {
            this.mouseGridPosition.x = null;
            this.mouseGridPosition.y = null;
            this.hoveredBuildingName = null;
            this.mouseDown = null;
        });
        canvas.addEventListener('mouseup', (e) => {
            this.handleCanvasMouseUp(e);
            this.mouseDown = null;
        });
    }

    getRecipe(type) {
        for (const section of Object.values(BUILD_RECIPES)) {
            if (section[type]) return section[type];
        }
        return null;
    }

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
                this.inventory[res] = saveData.inventory[res] !== undefined ? saveData.inventory[res] : 0;
            });

            this.naturalResources = saveData.naturalResources || {};
            this.generatedTiles = new Set(saveData.generatedTiles || []);
            if (saveData.player) this.player = saveData.player;

            this.buildings = {};
            this.movingItems = [];

            Object.entries(saveData.buildings).forEach(([key, data]) => {
                if (BuildingFactory[data.type]) {
                    this.buildings[key] = BuildingFactory[data.type](data.direction);
                    if (this.buildings[key].isPermaDraw()) permaDaws.push(key);
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
        if (rand < 0.03) this.naturalResources[key] = 'iron_ore';
        else if (rand < 0.05) this.naturalResources[key] = 'copper_ore';
        else if (rand < 0.06) this.naturalResources[key] = 'coal';
    }

    getCurrentDirection() {
        return DIRECTIONS[this.currentRotationIndex];
    }

    rotateSelection(isAnticlockwise = false) {
        this.currentRotationIndex = (this.currentRotationIndex + (isAnticlockwise ? -1 : 1)) % DIRECTIONS.length;
        if (this.currentRotationIndex < 0) this.currentRotationIndex = 3;
        this.ui.updateRotationDisplay();

        // Rotate clipboard entries if pasting
        if (this.currentSelectedBuild === 'edit' && this.editState === 'paste' && this.clipboard.length > 0) {
            this.clipboard = this.clipboard.map(item => {
                let dIdx = DIRECTIONS.indexOf(item.direction);
                dIdx = (dIdx + (isAnticlockwise ? -1 : 1)) % DIRECTIONS.length;
                if (dIdx < 0) dIdx = 3;
                
                // Transformed relative coordinates counter-clockwise vs clockwise
                const rx = isAnticlockwise ? item.dy : -item.dy;
                const ry = isAnticlockwise ? -item.dx : item.dx;

                return {
                    dx: rx,
                    dy: ry,
                    type: item.type,
                    direction: DIRECTIONS[dIdx]
                };
            });
        }
    }

    mineCurrentBlock() {
        const gridX = Math.floor(this.player.x / TILE_SIZE);
        const gridY = Math.floor(this.player.y / TILE_SIZE);
        const key = `${gridX},${gridY}`;
        
        const res = this.naturalResources[key];
        if (res) {
            if (Math.random() > 0.9) delete this.naturalResources[key];
            this.addItem(res);
        }
    }

    addItem(item) {
        this.inventory[item] = (this.inventory[item] || 0) + 1;
        this.ui.updateInventoryUI();
    }

    handleCanvasMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const cameraX = this.player.x - canvas.width / 2;
        const cameraY = this.player.y - canvas.height / 2;
        
        this.mouseCanvasPosition.x = e.clientX - rect.left;
        this.mouseCanvasPosition.y = e.clientY - rect.top;

        const worldX = this.mouseCanvasPosition.x + cameraX;
        const worldY = this.mouseCanvasPosition.y + cameraY;

        this.mouseGridPosition.x = Math.floor(worldX / TILE_SIZE);
        this.mouseGridPosition.y = Math.floor(worldY / TILE_SIZE);

        if (this.currentSelectedBuild === 'edit' && this.editState === 'select' && this.mouseDown) {
            this.selectionEnd = { ...this.mouseGridPosition };
        }
    }

    handleCanvasMouseDown(e) {
        if (this.currentSelectedBuild !== 'edit') return;

        if (this.editState === 'select') {
            this.selectionStart = { ...this.mouseGridPosition };
            this.selectionEnd = { ...this.mouseGridPosition };
        } else if (this.editState === 'paste') {
            this.executePaste();
        }
    }

    handleCanvasMouseUp(e) {
        if (this.currentSelectedBuild === 'edit' && this.editState === 'select' && this.selectionStart) {
            // Selection box is now locked, show contextual edit options panel
            this.ui.showEditPanel(true);
        }
    }

    handleCanvasClick(e) {
        if (this.currentSelectedBuild === '' || this.currentSelectedBuild === 'edit') return;

        const rect = canvas.getBoundingClientRect();
        const cameraX = this.player.x - canvas.width / 2;
        const cameraY = this.player.y - canvas.height / 2;
        const worldX = e.clientX - rect.left + cameraX;
        const worldY = e.clientY - rect.top + cameraY;
        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);
        const key = `${gridX},${gridY}`;

        if (this.currentSelectedBuild === 'delete') {
            const building = this.buildings[key];
            if (building) {
                const type = building.constructor.name.toLowerCase();
                const recipe = this.getRecipe(type)?.cost;
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

        const recipe = this.getRecipe(this.currentSelectedBuild)?.cost;
        if (!recipe) return;
        
        const canAfford = Object.keys(recipe).every(res => (this.inventory[res] || 0) >= recipe[res]);

        if (canAfford) {
            Object.keys(recipe).forEach(res => this.inventory[res] -= recipe[res]);
            this.buildings[key] = BuildingFactory[this.currentSelectedBuild](this.getCurrentDirection());
            if (this.buildings[key].isPermaDraw()) permaDaws.push(key);
            this.ui.updateInventoryUI();
        }
    }

    // --- BLUEPRINT ACTION METHODS ---
    copySelected(isCut = false) {
        if (!this.selectionStart || !this.selectionEnd) return;
        this.clipboard = [];
        this.isCutting = isCut;

        const xMin = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const xMax = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const yMin = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const yMax = Math.max(this.selectionStart.y, this.selectionEnd.y);

        for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
                const key = `${x},${y}`;
                if (this.buildings[key]) {
                    const b = this.buildings[key];
                    this.clipboard.push({
                        dx: x - xMin,
                        dy: y - yMin,
                        type: b.constructor.name.toLowerCase(),
                        direction: b.direction
                    });

                    if (isCut) {
                        // Return cost materials instantly to inventory on cut command
                        const recipe = this.getRecipe(b.constructor.name.toLowerCase())?.cost;
                        if (recipe) {
                            Object.keys(recipe).forEach(res => this.inventory[res] += recipe[res]);
                        }
                        delete this.buildings[key];
                    }
                }
            }
        }
        
        this.ui.updateInventoryUI();
        // Clear selection visual indicators and prepare paste state placement
        this.selectionStart = null;
        this.selectionEnd = null;
        this.ui.showEditPanel(false);
        this.editState = 'paste';
    }

    executePaste() {
        if (this.clipboard.length === 0) return;

        const mx = this.mouseGridPosition.x;
        const my = this.mouseGridPosition.y;

        // Validation Pass: Confirm placements don't overlap and determine layout costs
        const computedRequiredCost = {};
        let missingResources = false;

        this.clipboard.forEach(entry => {
            const targetKey = `${mx + entry.dx},${my + entry.dy}`;
            if (this.buildings[targetKey]) return; // Avoid processing overlaps

            const recipe = this.getRecipe(entry.type)?.cost;
            if (recipe) {
                Object.entries(recipe).forEach(([res, amt]) => {
                    computedRequiredCost[res] = (computedRequiredCost[res] || 0) + amt;
                });
            }
        });

        missingResources = Object.entries(computedRequiredCost).some(([res, amt]) => {
            return (this.inventory[res] || 0) < amt;
        });
        

        if (missingResources) {
            alert("Insufficient item inventory components to construct blueprint pattern.");
            return;
        }

        // Processing Pass: Apply placements
        this.clipboard.forEach(entry => {
            const targetKey = `${mx + entry.dx},${my + entry.dy}`;
            if (this.buildings[targetKey]) return; 

            
            const recipe = this.getRecipe(entry.type)?.cost;
            if (recipe) {
                Object.keys(recipe).forEach(res => this.inventory[res] -= recipe[res]);
            }
            

            this.buildings[targetKey] = BuildingFactory[entry.type](entry.direction);
            if (this.buildings[targetKey].isPermaDraw()) permaDaws.push(targetKey);
        });
        this.ui.updateInventoryUI();
    }

    payRent() {
        const rent = 10;
        this.inventory.money -= rent;
        if (this.inventory.money < 0) {
            this.loseGame();
        }
    }

    loseGame() {

    }

    update() {
        const now = performance.now();
        if (now - this.lastTimeUpdate >= 1000) {
            this.gameMinutes++;
            this.lastTimeUpdate = now;
            this.ui.updateClockUI(this.gameMinutes);

            if (this.gameMinutes > 1440) {
                this.payRent();
                this.gameMinutes = 0;
            }
        }
        
        if (this.mouseDown !== null) this.handleCanvasClick(this.mouseDown);
        if (this.input.isPressed('w') || this.input.isPressed('arrowup'))    this.player.y -= this.player.speed;
        if (this.input.isPressed('s') || this.input.isPressed('arrowdown'))  this.player.y += this.player.speed;
        if (this.input.isPressed('a') || this.input.isPressed('arrowleft'))  this.player.x -= this.player.speed;
        if (this.input.isPressed('d') || this.input.isPressed('arrowright')) this.player.x += this.player.speed;

        if (this.mouseGridPosition.x !== null && this.mouseGridPosition.y !== null) {
            const key = `${this.mouseGridPosition.x},${this.mouseGridPosition.y}`;
            const building = this.buildings[key];
            if (building) {
                this.hoveredBuildingName = building.constructor.name;
            } else {
                this.hoveredBuildingName = null;
            }
        } else {
            this.hoveredBuildingName = null;
        }

        for (const [key, building] of Object.entries(this.buildings)) {
            const [bx, by] = key.split(',').map(Number);
            building.update(key, bx, by, this);
        }

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
                    if (currentBuilding.tryReceiveItem(item, this, item.gridX, item.gridY)) {
                        this.movingItems.splice(i, 1);
                        continue;
                    }
                }
                currentBuilding.handleItemOnTile(item, this, item.gridX, item.gridY);
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

        for (const [key, building] of Object.entries(this.buildings)) {
            const [bx, by] = key.split(',').map(Number);
            if (permaDaws.includes(key) || ( bx >= startX - 1 && bx <= endX + 1 && by >= startY - 1 && by <= endY + 1 )) {
                building.draw(bx, by, cameraX, cameraY);
            }
        }

        // Dynamic Building Preview / Edit Clipboard Projection Matrix Rendering
        if (this.currentSelectedBuild !== '' && this.currentSelectedBuild !== 'delete') {
            if (this.currentSelectedBuild === 'edit') {
                if (this.editState === 'select' && this.selectionStart && this.selectionEnd) {
                    // Draw Drag Selection Box (Factorio Blueprint Tint)
                    const sx = this.selectionStart.x * TILE_SIZE - cameraX;
                    const sy = this.selectionStart.y * TILE_SIZE - cameraY;
                    const width = (this.selectionEnd.x - this.selectionStart.x + 1) * TILE_SIZE;
                    const height = (this.selectionEnd.y - this.selectionStart.y + 1) * TILE_SIZE;

                    ctx.fillStyle = 'rgba(0, 110, 255, 0.2)';
                    ctx.fillRect(sx, sy, width, height);
                    ctx.strokeStyle = '#0088ff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(sx, sy, width, height);
                    ctx.lineWidth = 1;
                } else if (this.editState === 'paste' && this.clipboard.length > 0) {
                    // Draw Phantom Blueprint Projection Preview Boundaries
                    this.clipboard.forEach(entry => {
                        const targetX = this.mouseGridPosition.x + entry.dx;
                        const targetY = this.mouseGridPosition.y + entry.dy;
                        const previewBuilding = BuildingFactory[entry.type](entry.direction);
                        if (previewBuilding && typeof previewBuilding.preview === 'function') {
                            ctx.globalAlpha = 0.4;
                            previewBuilding.preview(targetX, targetY, cameraX, cameraY);
                            ctx.globalAlpha = 1.0;
                        }
                    });
                }
            } else {
                const mx = this.mouseGridPosition.x;
                const my = this.mouseGridPosition.y;
                const key = `${mx},${my}`;
                
                if (!this.buildings[key]) {
                    const previewBuilding = BuildingFactory[this.currentSelectedBuild](this.getCurrentDirection());
                    if (previewBuilding && typeof previewBuilding.preview === 'function') {
                        previewBuilding.preview(mx, my, cameraX, cameraY);
                    }
                }
            }
        }

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

        ctx.fillStyle = '#00da00';
        ctx.fillRect(canvas.width / 2 - this.player.size / 2, canvas.height / 2 - this.player.size / 2, this.player.size, this.player.size);

        if (this.hoveredBuildingName && this.currentSelectedBuild === '') {
            ctx.save();
            ctx.font = '14px sans-serif';
            
            const text = this.hoveredBuildingName;
            const textWidth = ctx.measureText(text).width;
            const padding = 6;
            
            const tooltipX = this.mouseCanvasPosition.x + 10;
            const tooltipY = this.mouseCanvasPosition.y - 15;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(tooltipX - padding, tooltipY - 14, textWidth + (padding * 2), 20);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, tooltipX, tooltipY);
            ctx.restore();
        }
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
            if (key === 'e') engine.rotateSelection(true);
            
            // Factorio standard short-cuts integrations for edit configurations
            if (engine.currentSelectedBuild === 'edit') {
                if (e.ctrlKey && key === 'c') { e.preventDefault(); engine.copySelected(false); }
                if (e.ctrlKey && key === 'x') { e.preventDefault(); engine.copySelected(true); }
                if (key === 'escape') { 
                    engine.editState = 'select'; 
                    engine.selectionStart = null; 
                    engine.selectionEnd = null;
                    engine.ui.showEditPanel(false);
                }
            }
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
        this.editPanel = null;
    }

    updateClockUI(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;

        document.getElementById('time-hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('time-minutes').innerText = String(minutes).padStart(2, '0');
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

        this.updateButtonAffordability();
    }

    updateButtonAffordability() {
        document.querySelectorAll('.build-btn').forEach(btn => {
            const type = btn.getAttribute('data-type');
            if (type === 'delete' || type === 'edit') return;

            const recipe = this.engine.getRecipe(type)?.cost;
            if (!recipe) return;

            const canAfford = Object.keys(recipe).every(res => (this.engine.inventory[res] || 0) >= recipe[res]);

            if (!canAfford) {
                btn.classList.add('disabled');
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    this.engine.currentSelectedBuild = '';
                }
            } else {
                btn.classList.remove('disabled');
            }
        });
    }

    showEditPanel(show) {
        if (!this.editPanel) {
            this.editPanel = document.createElement('div');
            this.editPanel.style.position = 'fixed';
            this.editPanel.style.bottom = '80px';
            this.editPanel.style.right = '320px';
            this.editPanel.style.background = '#1f1f1f';
            this.editPanel.style.padding = '10px';
            this.editPanel.style.border = '2px solid #0088ff';
            this.editPanel.style.borderRadius = '6px';
            this.editPanel.style.display = 'none';
            this.editPanel.style.gap = '8px';
            this.editPanel.style.zIndex = '150';

            const copyBtn = document.createElement('button');
            copyBtn.innerText = '📋 Copy (Ctrl+C)';
            copyBtn.onclick = () => this.engine.copySelected(false);

            const cutBtn = document.createElement('button');
            cutBtn.innerText = '✂️ Cut / Move (Ctrl+X)';
            cutBtn.onclick = () => this.engine.copySelected(true);

            const unselectBtn = document.createElement('button');
            unselectBtn.innerText = 'Unselect (Escape)';
            unselectBtn.onclick = () => {
                this.engine.editState = 'select'; 
                this.engine.selectionStart = null; 
                this.engine.selectionEnd = null;
                this.engine.ui.showEditPanel(false);
            };

            this.editPanel.appendChild(copyBtn);
            this.editPanel.appendChild(cutBtn);
            this.editPanel.appendChild(unselectBtn);
            document.body.appendChild(this.editPanel);
        }
        this.editPanel.style.display = show ? 'flex' : 'none';
    }

    setupBuildUI() {
        const buildOptions = document.getElementById('build-options');
        
        Object.entries(BUILD_RECIPES).forEach(([sectionKey, sectionContent]) => {
            const sectionHeader = document.createElement('button');
            sectionHeader.classList.add('section-header-btn');
            sectionHeader.style.width = "100%";
            sectionHeader.style.textAlign = "left";
            sectionHeader.style.margin = "10px 0 5px 0";
            sectionHeader.style.padding = "8px";
            sectionHeader.style.fontWeight = "bold";
            sectionHeader.style.cursor = "pointer";
            sectionHeader.innerText = sectionKey.toUpperCase();
            buildOptions.appendChild(sectionHeader);

            const sectionContainer = document.createElement('div');
            sectionContainer.classList.add('section-container');
            sectionContainer.style.display = 'none';
            
            sectionHeader.addEventListener('click', () => {
                const isHidden = sectionContainer.style.display === 'none';
                sectionContainer.style.display = isHidden ? 'block' : 'none';
            });

            Object.entries(sectionContent).forEach(([key, value]) => {
                const newBuilding = document.createElement('button');
                newBuilding.classList.add('build-btn');
                newBuilding.setAttribute('data-type', key);
                
                const nameSpan = document.createElement('span');
                nameSpan.classList.add('btn-name');
                nameSpan.innerText = value.name;
                newBuilding.appendChild(nameSpan);

                const costEntries = Object.entries(value.cost).map(([resKey, amt]) => {
                    const prettyResName = RESOURCE_TYPES[resKey] ? RESOURCE_TYPES[resKey].name : resKey;
                    return `${amt} ${prettyResName}`;
                });
                
                const recipeSpan = document.createElement('span');
                recipeSpan.classList.add('btn-recipe');
                recipeSpan.innerText = `Cost:\n${costEntries.join(', ')}`;
                newBuilding.appendChild(recipeSpan);

                sectionContainer.appendChild(newBuilding);
            });

            buildOptions.appendChild(sectionContainer);
        });

        buildOptions.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.build-btn');
            if (!targetBtn || targetBtn.classList.contains('disabled')) return;

            const isAlreadyActive = targetBtn.classList.contains('active');
            document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));

            if (!isAlreadyActive) {
                targetBtn.classList.add('active');
                this.engine.currentSelectedBuild = targetBtn.getAttribute('data-type');
                
                // Reset internal variables if switching configuration contexts
                this.engine.editState = 'select';
                this.engine.selectionStart = null;
                this.engine.selectionEnd = null;
                this.showEditPanel(false);
            } else {
                this.engine.currentSelectedBuild = '';
                this.showEditPanel(false);
            }
        });
    }

    setupSaveLoadUI() {
        document.getElementById('save-btn').addEventListener('click', () => this.engine.saveGame());
        document.getElementById('load-btn').addEventListener('click', () => this.engine.loadGame());
    }

    setupHandbookUI() {
        const toggleBtn = document.getElementById('book-toggle-btn');
        const overlay = document.getElementById('book-modal-overlay');
        const closeX = document.getElementById('book-close-x');
        const headersContainer = document.getElementById('book-headers');
        const contentContainer = document.getElementById('book-content');

        const openBook = () => overlay.style.display = 'flex';
        const closeBook = () => overlay.style.display = 'none';

        toggleBtn.addEventListener('click', openBook);
        closeX.addEventListener('click', closeBook);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeBook();
        });

        Object.entries(HANDBOOK_DATA).forEach(([category, topics], index) => {
            const catBtn = document.createElement('button');
            catBtn.innerText = category;
            catBtn.style.padding = "6px 12px";
            catBtn.style.fontSize = "12px";
            
            catBtn.addEventListener('click', () => {
                contentContainer.innerHTML = '';
                
                Object.entries(topics).forEach(([title, description]) => {
                    const block = document.createElement('div');
                    block.style.marginBottom = "12px";
                    block.innerHTML = `<strong style="color: #00ffcc; font-size: 15px;">${title}</strong><br>${description}`;
                    contentContainer.appendChild(block);
                });
            });

            headersContainer.appendChild(catBtn);
            if (index === 0) catBtn.click();
        });
    }
}

const engine = new GameEngine();

engine.loop();