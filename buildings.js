import { TILE_SIZE, ctx, DIR_OFFSETS, DIRECTIONS, RECIPES, canvas, RESOURCE_TYPES } from "./globals.js";


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

    preview(bx, by, cameraX, cameraY) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        this.draw(bx, by, cameraX, cameraY);
        ctx.restore();
    }

    isPermaDraw() {
        return false;
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

export class ConveyorUltimate extends Conveyor {
    constructor(direction) {
        super(direction);
        this.speed = 1;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#555';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#ffff00';
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

    
    tryReceiveItem(item, engine) {
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

    
    tryReceiveItem(item, engine) {
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
        
        ctx.fillStyle = this.isProcessing ? '#ff4000' : '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.restore();
    }
}

export class Splitter extends Building {
    constructor(direction) {
        super(direction);
        this.speed = 0.02; // Base speed
        this.nextDirIsForwards = true;
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
            if (this.nextDirIsForwards) {
                offset = DIR_OFFSETS[this.direction];
            }
            else {
                const currentIndex = DIRECTIONS.indexOf(this.direction);
                const rightDirection = DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
                offset = DIR_OFFSETS[rightDirection];
            }
            this.nextDirIsForwards = !this.nextDirIsForwards;
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
}

export class Receiver extends Building {
    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#73ff00';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        
        ctx.restore();
    }

    tryReceiveItem(item, engine) {
        engine.addItem(item.type);
        return true;
    }
}

export class ThreeWaySplitter extends Building {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.outputCycle = 0; 
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#b72103';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 - TILE_SIZE + 4, TILE_SIZE - 4, TILE_SIZE * 3 - 8);
        
        ctx.fillStyle = '#444';
        ctx.fillRect(8, -5, 12, 10);
        ctx.fillRect(8, TILE_SIZE - 5, 12, 10);
        ctx.fillRect(8, -TILE_SIZE - 5, 12, 10);
        ctx.restore();
    }

    update(key, bx, by, engine) {
        const currentIndex = DIRECTIONS.indexOf(this.direction);

        // Place Part 2 (Below)
        const dirBelow = DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
        const offsetBelow = DIR_OFFSETS[dirBelow];
        const p2Key = `${bx + offsetBelow.x},${by + offsetBelow.y}`;
        if (!engine.buildings[p2Key]) {
            engine.buildings[p2Key] = new ThreeWaySplitterPart2(this.direction);
        }

        // Place Part 3 (Above)
        const dirAbove = DIRECTIONS[(currentIndex + 3) % DIRECTIONS.length];
        const offsetAbove = DIR_OFFSETS[dirAbove];
        const p3Key = `${bx + offsetAbove.x},${by + offsetAbove.y}`;
        if (!engine.buildings[p3Key]) {
            engine.buildings[p3Key] = new ThreeWaySplitterPart3(this.direction);
        }

        if (this.isProcessing) {
            this.timer++;
            
            let finalX = bx;
            let finalY = by;
            const forwardOffset = DIR_OFFSETS[this.direction];

            if (this.outputCycle === 0) {
                finalX += forwardOffset.x;
                finalY += forwardOffset.y;
            } else {
                const rotStep = this.outputCycle === 1 ? 1 : 3;
                const lateralDir = DIRECTIONS[(currentIndex + rotStep) % DIRECTIONS.length];
                const lateralOffset = DIR_OFFSETS[lateralDir];
                finalX += forwardOffset.x + lateralOffset.x;
                finalY += forwardOffset.y + lateralOffset.y;
            }

            engine.movingItems.push({
                type: this.currentOutput,
                gridX: finalX,
                gridY: finalY,
                progress: 0.1
            });

            this.outputCycle = (this.outputCycle + 1) % 3;
            this.isProcessing = false;
            this.currentOutput = null;
            this.timer = 0;
            
        }
    }
    
    tryReceiveItem(item, engine) {
        if (this.isProcessing) return false;
        this.currentOutput = item.type;
        this.isProcessing = true;
        this.timer = 0;
        return true;
    }
}

export class ThreeWaySplitterPart2 extends Building {
    getHead(bx, by, engine) {
        const currentIndex = DIRECTIONS.indexOf(this.direction);
        const oppositeDir = DIRECTIONS[(currentIndex + 3) % DIRECTIONS.length];
        const offset = DIR_OFFSETS[oppositeDir];
        return engine.buildings[`${bx + offset.x},${by + offset.y}`];
    }

    tryReceiveItem(item, engine, bx, by) {
        const head = this.getHead(bx, by, engine);
        return head && typeof head.tryReceiveItem === 'function' ? head.tryReceiveItem(item, engine) : false;
    }

    draw() {}
}

export class ThreeWaySplitterPart3 extends Building {
    getHead(bx, by, engine) {
        const currentIndex = DIRECTIONS.indexOf(this.direction);
        const oppositeDir = DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
        const offset = DIR_OFFSETS[oppositeDir];
        return engine.buildings[`${bx + offset.x},${by + offset.y}`];
    }

    tryReceiveItem(item, engine, bx, by) {
        const head = this.getHead(bx, by, engine);
        return head && typeof head.tryReceiveItem === 'function' ? head.tryReceiveItem(item, engine) : false;
    }

    draw() {}
}

export class Beacon extends Building {
    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#0066ff';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.restore();

        const screenX = bx * TILE_SIZE + TILE_SIZE / 2 - cameraX;
        const screenY = by * TILE_SIZE + TILE_SIZE / 2 - cameraY;

        const padding = 15;
        const minX = padding;
        const maxX = canvas.width - padding;
        const minY = padding;
        const maxY = canvas.height - padding;

        const isOffScreen = screenX < 0 || screenX > canvas.width || screenY < 0 || screenY > canvas.height;

        if (isOffScreen) {
            const indicatorX = Math.max(minX, Math.min(screenX, maxX));
            const indicatorY = Math.max(minY, Math.min(screenY, maxY));

            ctx.save();
            ctx.translate(indicatorX, indicatorY);
            ctx.rotate(this.getAngle());

            ctx.fillStyle = '#0066ff';
            ctx.fillRect(-6, -6, 12, 12);

            ctx.restore();
        }
    }

    isPermaDraw() {
        return true;
    }
}

export class Refinery extends Building {
    constructor(direction) {
        super(direction);
        this.timer = 0;
        this.isProcessing = false;
        this.currentOutput = null;
        this.processingTime = 200;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#e5924a';
        ctx.fillRect(-TILE_SIZE / 2 + 4, -TILE_SIZE / 2 + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
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

    
    tryReceiveItem(item, engine) {
        if (this.isProcessing) return false;

        const refineryRecipes = RECIPES.refinery;
        const recipe = refineryRecipes[item.type];

        if (recipe) {
            this.isProcessing = true;
            this.currentOutput = recipe.output;
            this.timer = 0;
            return true; // Item consumed successfully
        }
        return false;
    }
}

export class BouncePad extends Building {
    constructor(direction) {
        super(direction);
        this.speed = 0.02; // Base speed
        this.range = 2;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#3aa332';
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
            if (offset.x !== 0) {
                item.gridX += offset.x * this.range;
                item.gridY += offset.y;
            }
            else {
                item.gridX += offset.x;
                item.gridY += offset.y * this.range;
            }
            item.progress = 0;
        }
    }
}

export class BouncePad2 extends BouncePad {
    constructor(direction) {
        super(direction);
        this.speed = 0.06; // Base speed
        this.range = 3;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#3aa332';
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

export class BouncePad3 extends BouncePad {
    constructor(direction) {
        super(direction);
        this.speed = 0.12; // Base speed
        this.range = 5;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#3aa332';
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

export class Sorter extends Building {
    constructor(direction) {
        super(direction);
        this.speed = 0.02; // Base speed
        this.x = 0;
        this.y = 0;
    }

    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#f562ff';
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

        ctx.rotate(Math.PI / 2);

        ctx.fillStyle = '#444';
        ctx.fillRect(4, -5, 12, 10);
        
        ctx.restore();

        this.x = bx;
        this.y = by;
    }

    handleItemOnTile(item, engine) {
        item.progress += this.speed;
        if (item.progress >= 1) {
            const head = this.getHead(this.x, this.y, engine);

            let offset;
            // If there is a filter head and its recorded item matches the current item
            if (head && head.item === item.type) {
                // Keep moving straight forward
                offset = DIR_OFFSETS[this.direction];
            } else {
                // Otherwise, turn right
                const currentIndex = DIRECTIONS.indexOf(this.direction);
                const rightDirection = DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
                offset = DIR_OFFSETS[rightDirection];
            }
            
            item.gridX += offset.x;
            item.gridY += offset.y;
            item.progress = 0;
        }
    }

    getHead(bx, by, engine) {
        // Since the grey parts touch, the head is directly in front of the sorter's direction
        const offset = DIR_OFFSETS[this.direction];
        const targetBuilding = engine.buildings[`${bx + offset.x},${by + offset.y}`];
        
        // Ensure the building found is actually a SorterHead
        if (targetBuilding && targetBuilding instanceof SorterHead) {
            return targetBuilding;
        }
        return null;
    }
}

export class SorterHead extends Building {
    constructor(dir) {
        super(dir);
        this.item = null;
    }
    
    draw(bx, by, cameraX, cameraY) {
        this.applyRotationTransform(bx, by, cameraX, cameraY);
        ctx.fillStyle = '#f562ff';
        ctx.fillRect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        ctx.rotate(Math.PI / 2);
        ctx.rotate(Math.PI / 2);

        ctx.fillStyle = '#444';
        ctx.fillRect(4, -5, 12, 10);

        ctx.restore();
    }

    handleItemOnTile(item, engine) {
        this.item = item.type;
        
        /*
        const offset = DIR_OFFSETS[this.direction];
        item.progress += this.speed || 0.02; 
        if (item.progress >= 1) {
            item.gridX += offset.x;
            item.gridY += offset.y;
            item.progress = 0;
        }
        
        */
    }
}