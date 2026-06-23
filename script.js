const DEBUG = true;

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
    smelter:  { name: 'Smelter',  cost: { iron_ore: 5 } }
};

// --- OBJECT-ORIENTED BUILDING LOGIC ---
class Building {
    constructor(direction, level) {
        this.direction = direction;
        this.level = level;
    }
    
    getAngle() {
        return DIR_OFFSETS[this.direction].angle;
    }

    applyRotationTransform(bx, by) {
        const centerX = bx * TILE_SIZE + TILE_SIZE / 2;
        const centerY = by * TILE_SIZE + TILE_SIZE / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.getAngle());
    }

    draw(bx, by) {
        // Implemented by subclasses
        console.warn("THIS SHOULD BE UNREACHABLE");
    }

    update(key, bx, by, engine) {
        // Optional override per subclass
    }
}

class Conveyor extends Building {
    draw(bx, by) {
        this.applyRotationTransform(bx, by);
        ctx.fillStyle = '#555';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -10);
        ctx.lineTo(-5, 10);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.fillText(this.level, -2, 3);

        ctx.restore();
    }
}

class Miner extends Building {
    constructor(direction, level) {
        super(direction, level);
        this.timer = 0
    }

    draw(bx, by) {
        this.applyRotationTransform(bx, by);
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(5, -5, 12, 10);

        ctx.fillStyle = '#000000';
        ctx.fillText(this.level, -2, 3);

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

class Smelter extends Building {
    constructor(direction, level) {
        super(direction, level);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 90;
    }

    draw(bx, by) {
        this.applyRotationTransform(bx, by);
        ctx.fillStyle = '#7b7b7b';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
        ctx.fillStyle = '#4dff00';
        ctx.fillRect(-16, -5, 12, 10);
        
        ctx.fillStyle = this.isProcessing ? '#ff4000' : '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.fillStyle = '#000000';
        ctx.fillText(this.level, -2, 3);
        
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

// Map factory to easily instantiate dynamic structures
const BuildingFactory = {
    conveyor: (dir, level) => new Conveyor(dir, level),
    miner:    (dir, level) => new Miner(dir, level),
    smelter:  (dir, level) => new Smelter(dir, level)
};

// --- CORE GAME ENGINE ---
class GameEngine {
    constructor() {
        this.player = { x: 100, y: 100, size: 20, speed: 4 };
        this.inventory = {};

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
        this.generateWorld();
        this.ui.setupBuildUI();
        this.ui.updateInventoryUI();
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        canvas.addEventListener('mousedown', (e) => this.handleCanvasClick(e));
        
        this.loop();
    }

    resizeCanvas() {
        canvas.width = window.innerWidth - 300;
        canvas.height = window.innerHeight;
    }

    generateWorld() {
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const rand = Math.random();
                if (rand < 0.03)      this.naturalResources[`${x},${y}`] = 'iron_ore';
                else if (rand < 0.05) this.naturalResources[`${x},${y}`] = 'copper_ore';
                else if (rand < 0.06) this.naturalResources[`${x},${y}`] = 'coal';
            }
        }
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
        const gridX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const gridY = Math.floor((e.clientY - rect.top) / TILE_SIZE);
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
            this.buildings[key] = BuildingFactory[this.currentSelectedBuild](this.getCurrentDirection(), 0);
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
            
            // 1. Check Player collection
            if (item.gridX === pGridX && item.gridY === pGridY) {
                this.inventory[item.type] = (this.inventory[item.type] || 0) + 1;
                this.ui.updateInventoryUI();
                this.movingItems.splice(i, 1);
                continue;
            }

            const currentBuilding = this.buildings[`${item.gridX},${item.gridY}`];
            
            if (currentBuilding) {
                // 2. Try to feed into machines (like Smelters)
                if (typeof currentBuilding.tryReceiveItem === 'function') {
                    const consumed = currentBuilding.tryReceiveItem(item);
                    if (consumed) {
                        this.movingItems.splice(i, 1); // Delete item from conveyor belt
                        continue;
                    }
                }

                // 3. Normal Conveyor belt movement
                if (currentBuilding instanceof Conveyor) {
                    item.progress += 0.02;
                    if (item.progress >= 1) {
                        const offset = DIR_OFFSETS[currentBuilding.direction];
                        item.gridX += offset.x;
                        item.gridY += offset.y;
                        item.progress = 0;
                    }
                } else {
                    item.progress = 0;
                }
            } else {
                item.progress = 0;
            }
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const endX = Math.ceil(canvas.width / TILE_SIZE);
        const endY = Math.ceil(canvas.height / TILE_SIZE);

        // 1. Grid & Background resources
        for (let x = 0; x < endX; x++) {
            for (let y = 0; y < endY; y++) {
                const key = `${x},${y}`;
                if (this.naturalResources[key]) {
                    ctx.fillStyle = RESOURCE_TYPES[this.naturalResources[key]].color;
                    ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else {
                    ctx.strokeStyle = '#333';
                    ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // 2. Buildings
        for (const [key, building] of Object.entries(this.buildings)) {
            const [bx, by] = key.split(',').map(Number);
            building.draw(bx, by);
        }

        // 3. Draw Moving Ore Items (FIXED)
        this.movingItems.forEach(item => {
            let offset = { x: 0, y: 0 };
            const currentBuilding = this.buildings[`${item.gridX},${item.gridY}`];
            
            if (currentBuilding instanceof Conveyor) {
                offset = DIR_OFFSETS[currentBuilding.direction];
            }

            const renderX = (item.gridX + (offset.x * item.progress)) * TILE_SIZE + TILE_SIZE / 2;
            const renderY = (item.gridY + (offset.y * item.progress)) * TILE_SIZE + TILE_SIZE / 2;

            ctx.fillStyle = RESOURCE_TYPES[item.type]?.color || '#fff';
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.arc(renderX, renderY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // 4. Player
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.player.x - this.player.size / 2, this.player.y - this.player.size / 2, this.player.size, this.player.size);
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
            newBuilding.innerText = value.name;
            buildOptions.appendChild(newBuilding);
        });

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
}

// Fire up engine instance
new GameEngine();