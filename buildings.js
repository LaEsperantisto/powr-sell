import { TILE_SIZE, ctx, DIR_OFFSETS, DIRECTIONS, RECIPES } from "./globals.js";


// --- OBJECT-ORIENTED BUILDING LOGIC ---
export class Building {
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

export class Conveyor extends Building {
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

export class Conveyor2 extends Conveyor {
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

export class Conveyor3 extends Conveyor {
    constructor(direction) {
        super(direction);
        this.speed = 0.12;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#555';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -10);
        ctx.lineTo(-5, 10);
        ctx.fill();
        ctx.restore();
    }
}

export class Miner extends Building {
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

export class Miner2 extends Miner {
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

export class Miner3 extends Miner {
    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#68dc10';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = '#ff00ae';
        ctx.fillRect(5, -5, 12, 10);
        ctx.restore();
    }

    update(key, bx, by, engine) {
        this.timer++;
        if (this.timer >= 60) {
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

export class Smelter extends Building {
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

export class Smelter2 extends Smelter {
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

export class Smelter3 extends Smelter {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 30;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#b2c3ff';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
        ctx.fillStyle = '#4dff00';
        ctx.fillRect(-16, -5, 12, 10);
        
        ctx.fillStyle = this.isProcessing ? '#ff4000' : '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.restore();
    }
}

export class Moulder extends Building {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 200;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#b75703';
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

        const moulderRecipes = RECIPES.moulder;
        const recipe = moulderRecipes[item.type];

        if (recipe) {
            this.isProcessing = true;
            this.currentOutput = recipe.output;
            this.timer = 0;
            return true; // Item consumed successfully
        }
        return false;
    }
}

export class Moulder2 extends Moulder {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 150;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#b67843';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
        ctx.fillStyle = '#4dff00';
        ctx.fillRect(-16, -5, 12, 10);
        
        ctx.fillStyle = this.isProcessing ? '#ff4000' : '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.restore();
    }
}

export class Moulder3 extends Moulder {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 100;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#d4af8f';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
        ctx.fillStyle = '#4dff00';
        ctx.fillRect(-16, -5, 12, 10);
        
        ctx.fillStyle = this.isProcessing ? '#ff4000' : '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.restore();
    }
}


export class Splitter extends Conveyor {
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
        ctx.moveTo(14, 0);
        ctx.lineTo(2, -8);
        ctx.lineTo(2, 8);
        ctx.fill();
        
        ctx.rotate(Math.PI / 2);
        
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(2, -8);
        ctx.lineTo(2, 8);
        ctx.fill();
        
        ctx.restore();
    }

    handleItemOnTile(item, engine) {
        item.progress += this.speed;
        if (item.progress >= 1) {
            let offset;
            if (Math.random() >= 0.5) {
                offset = DIR_OFFSETS[this.direction];
            }
            else {
                const currentIndex = DIRECTIONS.indexOf(this.direction);
                const rightDirection = DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
                offset = DIR_OFFSETS[rightDirection];
            }
            item.gridX += offset.x;
            item.gridY += offset.y;
            item.progress = 0;
        }
    }
}

export class Splitter2 extends Splitter {
    constructor(direction) {
        super(direction);
        this.speed = 0.06; // Base speed
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#555';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#26ff00';
        
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(2, -8);
        ctx.lineTo(2, 8);
        ctx.fill();
        
        ctx.rotate(Math.PI / 2);
        
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(2, -8);
        ctx.lineTo(2, 8);
        ctx.fill();
        
        ctx.restore();
    }

    handleItemOnTile(item, engine) {
        item.progress += this.speed;
        if (item.progress >= 1) {
            let offset;
            if (Math.random() >= 0.5) {
                offset = DIR_OFFSETS[this.direction];
            }
            else {
                const currentIndex = DIRECTIONS.indexOf(this.direction);
                const rightDirection = DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
                offset = DIR_OFFSETS[rightDirection];
            }
            item.gridX += offset.x;
            item.gridY += offset.y;
            item.progress = 0;
        }
    }
}

export class Splitter3 extends Splitter {
    constructor(direction) {
        super(direction);
        this.speed = 0.12; // Base speed
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#555';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#ff0000';
        
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(2, -8);
        ctx.lineTo(2, 8);
        ctx.fill();
        
        ctx.rotate(Math.PI / 2);
        
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(2, -8);
        ctx.lineTo(2, 8);
        ctx.fill();
        
        ctx.restore();
    }

    handleItemOnTile(item, engine) {
        item.progress += this.speed;
        if (item.progress >= 1) {
            let offset;
            if (Math.random() >= 0.5) {
                offset = DIR_OFFSETS[this.direction];
            }
            else {
                const currentIndex = DIRECTIONS.indexOf(this.direction);
                const rightDirection = DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
                offset = DIR_OFFSETS[rightDirection];
            }
            item.gridX += offset.x;
            item.gridY += offset.y;
            item.progress = 0;
        }
    }
}