export const TILE_SIZE = 40;
export const DIRECTIONS = ['RIGHT', 'DOWN', 'LEFT', 'UP'];
export const DIR_OFFSETS = {
    'RIGHT': { x: 1,  y: 0,  angle: 0 },
    'DOWN':  { x: 0,  y: 1,  angle: Math.PI / 2 },
    'LEFT':  { x: -1, y: 0,  angle: Math.PI },
    'UP':    { x: 0,  y: -1, angle: Math.PI * 1.5 }
};

export const RESOURCE_TYPES = {
    iron_ore:    { color: '#7a7a7a', name: 'Iron Ore' },
    copper_ore:  { color: '#d16e3b', name: 'Copper Ore' },
    coal:        { color: '#111111', name: 'Coal' },
    pure_iron:   { color: '#b0c4de', name: 'Pure Iron' },
    pure_copper: { color: '#ff7f50', name: 'Pure Copper' },
    iron_ingot:   { color: '#9ec7fc', name: 'Iron Ingot' },
    copper_ingot: { color: '#ff581c', name: 'Copper Ingot' },
};

export const RECIPES = {
    smelter: {
        iron_ore:   { count: 1, output: 'pure_iron' },
        copper_ore: { count: 1, output: 'pure_copper' }
    },
    moulder: {
        pure_iron: { count: 1, output: 'iron_ingot' },
        pure_copper: { count: 1, output: 'copper_ingot' },
    }
};

export const BUILD_RECIPES = {
    conveyor: { name: 'Conveyor', cost: { iron_ore: 1 } },
    miner:    { name: 'Miner',    cost: { iron_ore: 3, copper_ore: 1 } },
    smelter: { name: 'Smelter', cost: { iron_ore: 5, coal: 10 } },
    conveyor2: { name: 'Conveyor 2', cost: { pure_iron: 1 } },
    miner2:    { name: 'Miner 2',    cost: { pure_iron: 3, pure_copper: 1 } },
    smelter2: { name: 'Smelter 2', cost: { pure_iron: 5, coal: 20 } },
    moulder: { name: 'Moulder', cost: { pure_iron: 10, pure_copper: 20, coal: 20 } },
    conveyor3: { name: 'Conveyor 3', cost: { iron_ingot: 1 } },
    miner3:    { name: 'Miner 3',    cost: { iron_ingot: 3, copper_ingot: 1 } },
    smelter3: { name: 'Smelter 3', cost: { iron_ingot: 5, coal: 30 } },
    moulder2: { name: 'Moulder 2', cost: { iron_ingot: 10, copper_ingot: 20, coal: 30 } },
    moulder3: { name: 'Moulder 3', cost: { iron_ingot: 50, copper_ingot: 50, coal: 50 } },
    splitter: { name: 'Splitter', cost: { pure_iron: 10, copper_ingot: 20 } },
    splitter2: { name: 'Splitter 2', cost: { iron_ingot: 10, copper_ingot: 30 } },
    splitter3: { name: 'Splitter 3', cost: { iron_ingot: 15, copper_ingot: 40 }},
};

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');