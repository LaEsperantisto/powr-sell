export const TILE_SIZE = 40;
export const DIRECTIONS = ['RIGHT', 'DOWN', 'LEFT', 'UP'];
export const DIR_OFFSETS = {
    'RIGHT': { x: 1,  y: 0,  angle: 0 },
    'DOWN':  { x: 0,  y: 1,  angle: Math.PI / 2 },
    'LEFT':  { x: -1, y: 0,  angle: Math.PI },
    'UP':    { x: 0,  y: -1, angle: Math.PI * 1.5 }
};

export const RESOURCE_TYPES = {
    money: { color: '#ffcc00', name: 'Money' },
    iron_ore:    { color: '#7a7a7a', name: 'Iron Ore', cost: 1 },
    copper_ore:  { color: '#d16e3b', name: 'Copper Ore', cost: 1 },
    coal:        { color: '#111111', name: 'Coal', cost: 2 },
    pure_iron:   { color: '#b0c4de', name: 'Pure Iron', cost: 3 },
    pure_copper: { color: '#ff7f50', name: 'Pure Copper', cost: 3 },
    iron_ingot:   { color: '#74b0ff', name: 'Iron Ingot', cost: 5 },
    copper_ingot: { color: '#ff4400', name: 'Copper Ingot', cost: 5 },
    tar: { color: '#565656', name: 'Tar', cost: 5 },
    rubber: { color: '#7c5a37', name: 'Rubber', cost: 10 },
    plastic: { color: '#14a3e5', name: 'Plastic', cost: 20 },
};

export const RECIPES = {
    smelter: {
        iron_ore:   { count: 1, output: 'pure_iron' },
        copper_ore: { count: 1, output: 'pure_copper' }
    },
    moulder: {
        pure_iron: { count: 1, output: 'iron_ingot' },
        pure_copper: { count: 1, output: 'copper_ingot' },
        coal: { count: 1, output: 'tar'},
    },
    refinery: {
        tar: { count: 1, output: 'rubber' },
        rubber: { count: 1, output: 'plastic' },
    }
};

export const BUILD_RECIPES = {
    logistics: {
        conveyor: { name: 'Conveyor', cost: { iron_ore: 1 } },
        conveyor2: { name: 'Conveyor 2', cost: { pure_iron: 2 } },
        conveyor3: { name: 'Conveyor 3', cost: { iron_ingot: 5 } },
        conveyorultimate: { name: 'Conveyor Ultimate', cost: { tar: 100, iron_ingot: 100 } },
        bouncepad: { name: 'Bounce Pad', cost: { rubber: 25, iron_ingot: 50 } },
        bouncepad2: { name: 'Bounce Pad 2', cost: { rubber: 30, plastic: 15, pure_iron: 30, iron_ingot: 50 } },
        bouncepad3: { name: 'Bounce Pad 3', cost: { rubber: 45, plastic: 25, iron_ingot: 70, copper_ingot: 40 } },
        sorter: { name: 'Sorter', cost: { copper_ingot: 20, plastic: 15 } },
        sorterhead: { name: 'Sorter Head', cost: { iron_ingot: 10 } },
        splitter: { name: 'Splitter', cost: { pure_iron: 10, copper_ingot: 20 } },
        splitter2: { name: 'Splitter 2', cost: { iron_ingot: 10, copper_ingot: 30 } },
        splitter3: { name: 'Splitter 3', cost: { iron_ingot: 15, copper_ingot: 40, tar: 20 } },
        threewaysplitter: { name: 'Three Way Splitter', cost: { tar: 50, copper_ingot: 20 } },
        receiver: { name: 'Receiver', cost: { tar: 20, iron_ingot: 20 } },
        destroyer: { name: 'Destroyer', cost: { tar: 20, iron_ingot: 20 } },
        beacon: { name: 'Beacon', cost: { tar: 100, iron_ingot: 20 } },
    },
    production: {
        miner: { name: 'Miner', cost: { iron_ore: 3, copper_ore: 1 } },
        miner2: { name: 'Miner 2', cost: { pure_iron: 3, pure_copper: 1 } },
        miner3: { name: 'Miner 3', cost: { iron_ingot: 3, copper_ingot: 1 } },
        smelter: { name: 'Smelter', cost: { iron_ore: 5, coal: 10 } },
        smelter2: { name: 'Smelter 2', cost: { pure_iron: 5, coal: 20 } },
        smelter3: { name: 'Smelter 3', cost: { iron_ingot: 5, coal: 30 } },
        moulder: { name: 'Moulder', cost: { pure_iron: 10, pure_copper: 20, coal: 20 } },
        moulder2: { name: 'Moulder 2', cost: { iron_ingot: 10, copper_ingot: 20, coal: 30 } },
        moulder3: { name: 'Moulder 3', cost: { iron_ingot: 50, copper_ingot: 50, coal: 50 } },
        refinery: { name: 'Refinery', cost: { tar: 50, copper_ingot: 20, iron_ingot: 20 } },
        refinery2: { name: 'Refinery 2', cost: { rubber: 50, copper_ingot: 40, iron_ingot: 20 } },
        refinery3: { name: 'Refinery 3', cost: { plastic: 55, copper_ingot: 45, iron_ingot: 30 } },
    },
    economics: {
        seller: { name: 'Seller', cost: { pure_iron: 5, pure_copper: 7, coal: 10 } },
    }
};

// --- DYNAMIC DATA PROCESSORS ---

// Helper function to resolve localized raw keys into readable dictionary labels
const getResName = (key) => RESOURCE_TYPES[key] ? RESOURCE_TYPES[key].name : key;

// Generate production mapping strings dynamically
const generatedNormalRecipes = {};
Object.entries(RECIPES).forEach(([buildingKey, inputOptions]) => {
    let recipeText = '';
    Object.entries(inputOptions).forEach(([inputIngredient, processConfig]) => {
        recipeText += `• [${processConfig.count}x] ${getResName(inputIngredient)} ➔ ${getResName(processConfig.output)}\n`;
    });
    // Store under capitalized machine heading names
    const capitalizedName = buildingKey.charAt(0).toUpperCase() + buildingKey.slice(1);
    generatedNormalRecipes[capitalizedName] = recipeText.trim();
});

// Generate structural build cost strings dynamically
const generatedBuildRecipes = {};
Object.values(BUILD_RECIPES).forEach((section) => {
    Object.values(section).forEach((building) => {
        const costStrings = Object.entries(building.cost).map(([materialKey, materialAmt]) => {
            return `${materialAmt}x ${getResName(materialKey)}`;
        });
        generatedBuildRecipes[building.name] = `Construction Cost:\n➔ ${costStrings.join('\n➔ ')}`;
    });
});

// --- BASE LINE DATA CONTAINER ---
export const HANDBOOK_DATA = {
    "Getting Started": {
        "Core Loop": "Mine raw resources using [Q] while standing over a deposit, then use the Build Menu to automate processing pipelines.",
        "Controls": "WASD / Arrows: Move\nQ: Manual Mining\nE / R: Rotate Selected Placement\nLeft Click: Interact / Place"
    },
    "Logistics": {
        "Conveyors": "Moves items forward in the direction they face. Upgraded tiers increase velocity.",
        "Sorters": `
    Compares passing items against an adjacent Sorter Head. If the item matches, it travels straight; otherwise, it is filtered to the right.
    The item that should passed onto the Sorter Head by the Sorter is the last item that landed on the Sorter Head.
    `,
        "Splitters": "Splits a single structural lane's incoming item inventory into alternating output paths."
    },
    "Production": {
        "Miners": "Automatically extracts underground ore deposits and ejects them forward over time.\nPlace miners on top of the ore deposits.",
        "Smelters": "Consumes raw ores and coal fuel to produce refined ingots. They eject products out of the red part",
        "Moulders": "Shapes refined components into dense structural factory components."
    },
    "Item Recipes": generatedNormalRecipes,
    "Building Cost Recipes": generatedBuildRecipes
};

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');