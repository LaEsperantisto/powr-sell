const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas dynamically
function resizeCanvas() {
    canvas.width = window.innerWidth - 300; // minus sidebar width
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- GAME CONFIG & DICTIONARIES ---
const TILE_SIZE = 40;
const DIRECTIONS = ['RIGHT', 'DOWN', 'LEFT', 'UP']; // Clockwise rotations
const DIR_OFFSETS = {
    'RIGHT': {x: 1, y: 0, angle: 0},
    'DOWN':  {x: 0, y: 1, angle: Math.PI / 2},
    'LEFT':  {x: -1, y: 0, angle: Math.PI},
    'UP':    {x: 0, y: -1, angle: Math.PI * 1.5}
};

// Extensible lists of data
const RESOURCE_TYPES = {
    iron_ore: { color: '#7a7a7a', name: 'Iron Ore' },
    copper_ore: { color: '#d16e3b', name: 'Copper Ore' },
    coal: { color: '#111111', name: 'Coal' }
};

// Cost to build structures
const BUILD_RECIPES = {
    conveyor: { iron_ore: 1 },
    miner: { iron_ore: 3, copper_ore: 1 }
};

// --- GAME STATE ---
const player = {
    x: 100,
    y: 100,
    size: 20,
    speed: 4
};

const inventory = {
    iron_ore: 5,   // Starter resources
    copper_ore: 2,
    coal: 0
};

// World Data Maps
const naturalResources = {}; // Key: "x,y" => resource type
const buildings = {};        // Key: "x,y" => {type, direction, progress}
let movingItems = [];       // Array of items currently transporting on conveyors

// UI Selection States
let currentSelectedBuild = 'delete'; // default mode
let currentRotationIndex = 0; // Index pointing to DIRECTIONS (0 = RIGHT)

// --- GENERATE RANDOM WORLD RESOURCES ---
function generateWorld() {
    for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
            // Randomly seed small resource patches
            let rand = Math.random();
            if (rand < 0.03) {
                naturalResources[`${x},${y}`] = 'iron_ore';
            } else if (rand < 0.05) {
                naturalResources[`${x},${y}`] = 'copper_ore';
            } else if (rand < 0.06) {
                naturalResources[`${x},${y}`] = 'coal';
            }
        }
    }
}
generateWorld();

// --- INPUT HANDLING ---
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    
    // Spacebar to manually mine
    if (e.key === ' ') {
        mineCurrentBlock();
    }
    // R to rotate
    if (e.key.toLowerCase() === 'r') {
        rotateSelection();
    }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Sidebar build selection
document.querySelectorAll('.build-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentSelectedBuild = e.target.getAttribute('data-type');
    });
});

// Rotation handling
document.getElementById('rotate-btn').addEventListener('click', rotateSelection);

function rotateSelection() {
    currentRotationIndex = (currentRotationIndex + 1) % DIRECTIONS.length;
    document.getElementById('rotation-display').innerText = DIRECTIONS[currentRotationIndex];
}

// Canvas Click Interaction (Building / Deleting)
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert click position to Grid coordinate
    const gridX = Math.floor(clickX / TILE_SIZE);
    const gridY = Math.floor(clickY / TILE_SIZE);
    const key = `${gridX},${gridY}`;

    if (currentSelectedBuild === 'delete') {
        if (buildings[key]) {
            delete buildings[key];
        }
    } else {
        // Check if player has resources to build it
        const recipe = BUILD_RECIPES[currentSelectedBuild];
        let canAfford = true;
        for (let res in recipe) {
            if ((inventory[res] || 0) < recipe[res]) canAfford = false;
        }

        if (canAfford && !buildings[key]) {
            // Deduct cost
            for (let res in recipe) {
                inventory[res] -= recipe[res];
            }
            // Create Building
            buildings[key] = new Building(
                currentSelectedBuild,
                DIRECTIONS[currentRotationIndex],
                0,
            );
            updateInventoryUI();
        }
    }
});

// --- BUILDINGS ---

class Building {
    constructor(type, direction, progress) {
        this.type = type;
        this.direction = direction;
        this.progress = progress;
    }

    draw(bx, by) {
        let centerX = bx * TILE_SIZE + TILE_SIZE / 2;
        let centerY = by * TILE_SIZE + TILE_SIZE / 2;
        let angle = DIR_OFFSETS[this.direction].angle;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        if (this.type === 'conveyor') {
            ctx.fillStyle = '#555';
            ctx.fillRect(-TILE_SIZE/2 + 2, -TILE_SIZE/2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, -10);
            ctx.lineTo(-5, 10);
            ctx.fill();
        } else if (this.type === 'miner') {
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(-TILE_SIZE/2 + 4, -TILE_SIZE/2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(5, -5, 12, 10);
        }
        ctx.restore();
    }

    update() {

    }
}

// --- GAME MECHANICS ---

function mineCurrentBlock() {
    const gridX = Math.floor(player.x / TILE_SIZE);
    const gridY = Math.floor(player.y / TILE_SIZE);
    const key = `${gridX},${gridY}`;
    
    if (naturalResources[key]) {
        const res = naturalResources[key];
        inventory[res] = (inventory[res] || 0) + 1;
        updateInventoryUI();
    }
}

// Dynamic UI System
function updateInventoryUI() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = ''; // Wipe and re-render completely dynamically
    
    for (const [key, value] of Object.entries(inventory)) {
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
updateInventoryUI(); // Initial run

// --- UPDATE LOOP ---
function update() {
    // Player Movement
    if (keys['w'] || keys['arrowup']) player.y -= player.speed;
    if (keys['s'] || keys['arrowdown']) player.y += player.speed;
    if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
    if (keys['d'] || keys['arrowright']) player.x += player.speed;

    // Process Buildings (Miners and Factory Logic)
    for (let key in buildings) {
        let b = buildings[key];
        let [bx, by] = key.split(',').map(Number);
        let dir = b.direction;
        let offset = DIR_OFFSETS[dir];

        if (b.type === 'miner') {
            b.timer++;
            if (b.timer >= 120) { // Every 2 seconds (at 60fps)
                b.timer = 0;
                // Miner needs a natural resource directly underneath it to work
                if (naturalResources[key]) {
                    let minedRes = naturalResources[key];
                    // Target tile to excrete resource into
                    let targetX = bx + offset.x;
                    let targetY = by + offset.y;
                    
                    // Create moving item on target square
                    movingItems.push({
                        type: minedRes,
                        gridX: targetX,
                        gridY: targetY,
                        progress: 0 // 0 to 1 movement across a tile
                    });
                }
            }
        }
    }

    // Process conveyor logistics items
    for (let i = movingItems.length - 1; i >= 0; i--) {
        let item = movingItems[i];
        let currentTileKey = `${item.gridX},${item.gridY}`;
        let currentBuilding = buildings[currentTileKey];

        // If item hits player, player picks it up!
        let pGridX = Math.floor(player.x / TILE_SIZE);
        let pGridY = Math.floor(player.y / TILE_SIZE);
        if (item.gridX === pGridX && item.gridY === pGridY) {
            inventory[item.type] = (inventory[item.type] || 0) + 1;
            updateInventoryUI();
            movingItems.splice(i, 1);
            continue;
        }

        if (currentBuilding && currentBuilding.type === 'conveyor') {
            item.progress += 0.02; // Item transport speed
            if (item.progress >= 1) {
                // Determine next tile based on conveyor directional output
                let offset = DIR_OFFSETS[currentBuilding.direction];
                item.gridX += offset.x;
                item.gridY += offset.y;
                item.progress = 0;
            }
        } else {
            // Item is sitting stagnant if not on a conveyor belt
            item.progress = 0;
        }
    }
}

// --- RENDER LOOP ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dynamic grid size parameters
    const startX = 0;
    const startY = 0;
    const endX = Math.ceil(canvas.width / TILE_SIZE);
    const endY = Math.ceil(canvas.height / TILE_SIZE);

    // 1. Draw Natural Resources Background
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            let key = `${x},${y}`;
            if (naturalResources[key]) {
                ctx.fillStyle = RESOURCE_TYPES[naturalResources[key]].color;
                ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else {
                ctx.strokeStyle = '#333';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 2. Draw Factory Buildings
    for (let key in buildings) {
        let [bx, by] = key.split(',').map(Number);
        let b = buildings[key];
        b.draw(bx, by);
    }

    // 3. Draw Moving Ore Items
    movingItems.forEach(item => {
        let offset = {x: 0, y: 0};
        let currentBuilding = buildings[`${item.gridX},${item.gridY}`];
        
        if (currentBuilding && currentBuilding.type === 'conveyor') {
            offset = DIR_OFFSETS[currentBuilding.direction];
        }

        // Calculate item position interpolation smoothly between tiles
        let renderX = (item.gridX + (offset.x * item.progress)) * TILE_SIZE + TILE_SIZE / 2;
        let renderY = (item.gridY + (offset.y * item.progress)) * TILE_SIZE + TILE_SIZE / 2;

        ctx.fillStyle = RESOURCE_TYPES[item.type].color;
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.arc(renderX, renderY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });

    // 4. Draw Player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

// --- MAIN ENGINE LOOP ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Fire up the loop
gameLoop();