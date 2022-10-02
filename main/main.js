
const BORDER = 10;
const SPRITE_TEXTURE = '';

const SQUARE_WIDTH  = 50;
const SQUARE_HEIGHT = 50;

const MIN_SCALE     = 0.1;

// Mac chrome
// open /Applications/Google\ Chrome.app/ --args --allow-file-access-from-files

let displayRules = {
    squareWidth:    SQUARE_WIDTH,
    squareHeight:   SQUARE_HEIGHT,
};

let gameRules = {
    bombCount: 99,
    width: 30,
    height: 16,
}

let gameState = {
    firstOpened: false,
    triedToOpen: {
        x: 0,
        y: 0,
    },
    triedToFlag: {
        x: 0,
        y: 0,
    },
    smiley: {
        sprite: null,
    },
    opened: 0,
    flagged: 0,
    time: {
        started: false,
        time: null,
        digits: [],
        container: null,
    },
    score: {
        digits: [],
        container: null,
    },
    ctrl: false,
};

const app = new PIXI.Application({
    width:  window.innerWidth - 5,
    height: window.innerHeight - 5,
    backgroundColor: 0x000000,
});
document.body.appendChild(app.view);
document.oncontextmenu = document.body.oncontextmenu = e => e.preventDefault();

const gameContainer = new PIXI.Container();
const topGroup      = new PIXI.Container();

app.stage.addChild(gameContainer);

function centerContainer() {
    while((gameContainer.width < app.width / 2
        || gameContainer.height < app.height / 2)
        && gameContainer.width > 0
        && gameContainer.height > 0
    ) {
        gameContainer.scale.x += 0.2;
        gameContainer.scale.y += 0.2;
    }

    while(gameContainer.width >= app.width || gameContainer.height >= app.height) {
        gameContainer.scale.x -= 0.2;
        gameContainer.scale.y -= 0.2;
    }

    if(gameContainer.scale.x <= MIN_SCALE) {
        gameContainer.scale.x = MIN_SCALE;
        gameContainer.scale.y = MIN_SCALE;
    }
    
    gameContainer.x = app.width / 2 - gameContainer.width / 2;
    gameContainer.y = 100;
    topGroup.x = app.width / 2 - topGroup.width / 2;
}

function resizeEvent() {
    console.log('changed');
    app.width =     window.innerWidth - 5;
    app.height =    window.innerHeight - 5;
    centerContainer();
}
window.addEventListener('resize', () => resizeEvent());
resizeEvent();

document.addEventListener('keydown', e => {
    if(e.key === 'ArrowUp') {
        gameContainer.scale.x += 0.2;
        gameContainer.scale.y += 0.2;
        centerContainer();
    }
    if(e.key === 'ArrowDown') {
        gameContainer.scale.x -= 0.2;
        gameContainer.scale.y -= 0.2;
        
        if(gameContainer.scale.x <= MIN_SCALE) {
            gameContainer.scale.x = MIN_SCALE;
            gameContainer.scale.y = MIN_SCALE;
        }
        centerContainer();
    }
    if(e.key === 'Control') {
        gameState.ctrl = true;
    }
});

document.addEventListener('keyup', e => {
    if(e.key === 'Control') {
        gameState.ctrl = false;
    }
});


const spriteLoader = PIXI.Loader.shared;
spriteLoader.add('tileset', '../images/sprites.json').load((loader, resource) => {
    const textures = {};

    textures.openTile   = getTexturesByName('openTile', [...Array(9).keys()]);
    textures.score      = getTexturesByName('score', [...Array(10).keys()]);
    textures.smile      = getTexturesByName('smile', ['', 'Scared', 'Cool']);
    textures.openBomb   = getTexturesByName('openBomb', ['', 'Red', 'Cross']);

    textures.closedTile = PIXI.Texture.from('closedTile');
    textures.flag       = PIXI.Texture.from('flag');

    // Smiley
    gameState.smiley.sprite = new PIXI.Sprite(textures.smile[0]);
    topGroup.addChild(gameState.smiley.sprite);

    gameState.smiley.sprite.width   = 100;
    gameState.smiley.sprite.height  = 100;

    gameState.smiley.sprite.interactive = true;
    gameState.smiley.sprite.buttonMode = true;

    gameState.smiley.sprite.on('mousedown', () => {
        location.reload();
    });

    // Score
    gameState.score.digits = setupDigits(textures);
    gameState.score.container = new PIXI.Container();
    gameState.score.container.addChild(...gameState.score.digits);
    updateScore(textures);
    topGroup.addChild(gameState.score.container);

    // Time
    gameState.time.digits = setupDigits(textures);
    gameState.time.container = new PIXI.Container();
    gameState.time.container.addChild(...gameState.time.digits);

    // Top group positions
    gameState.smiley.sprite.x = gameState.score.container.width + 100;
    gameState.time.container.x = topGroup.width + 100;
    topGroup.addChild(gameState.time.container);

    topGroup.x = (app.width / 2) - (topGroup.width / 2);

    app.stage.addChild(topGroup);

    const mineField = generateEmptyMineField(gameRules.width, gameRules.height);
    fakeMineField(mineField, textures);

    while(gameContainer.width >= app.width
        || gameContainer.height - 100 >= app.height    
    ) {
        gameContainer.scale.x -= 0.2;
        gameContainer.scale.y -= 0.2;
    }

    if(gameContainer.scale.x <= 0) {
        gameContainer.scale.x = MIN_SCALE;
        gameContainer.scale.y = MIN_SCALE;
    }
    centerContainer();
});

function updateTime(textures) {
    if(gameState.time.started) {
        const time = Math.floor((Date.now() - gameState.time.time) / 1000);
        const display = getDisplayNumber(time);
        gameState.time.digits[0].texture = textures.score[parseInt(display[0])];
        gameState.time.digits[1].texture = textures.score[parseInt(display[1])];
        gameState.time.digits[2].texture = textures.score[parseInt(display[2])];
    }
}

function setupDigits(textures) {
    const digits = [];
    for(let i = 0;i < 3;i++) {
        const sprite = new PIXI.Sprite(textures.score[0]);

        sprite.width =  50;
        sprite.height = 100;

        sprite.x = i * 50;
        digits.push(sprite);
    }
    return digits;
}

function openAroundZeros(x, y, mineField, textures) {
    for(let iy = y - 1;iy <= y + 1;iy++) {
        for(let ix = x - 1;ix <= x + 1;ix++) {
            if(testForInbounds(mineField, ix, iy) && !mineField[iy][ix].open) {
                open(ix, iy, mineField, textures);
            }
        }
    }
}

function open(x, y, mineField, textures) {
    if(!gameState.firstOpened) {
        gameState.firstOpened = true;
        populateBrute(x, y, gameRules.bombCount, mineField);
        numerizeMineField(mineField);

        // Start the timer
        gameState.time.time = Date.now();
        gameState.time.started = true;
        app.ticker.add(d => timeLoop(d, textures));

        open(x, y, mineField, textures);
    } else {
        if(mineField[y][x].open) return;

        mineField[y][x].open = true;
        setTileTexture(x, y, mineField, textures);
        if(mineField[y][x].bomb) {
            lose(mineField, textures);
        } else {
            gameState.opened++;
            if(gameState.opened + gameRules.bombCount === gameRules.width * gameRules.height) {
                win(mineField, textures);
            }

            if(mineField[y][x].number == 0) {
                openAroundZeros(x, y, mineField, textures);
            }
        }
    }
}

function win(mineField, textures) {
    for(let y = 0;y < mineField.length;y++) {
        for(let x = 0;x < mineField[0].length;x++) {
            if(mineField[y][x].bomb) {
                mineField[y][x].flag = true;
                setTileTexture(x, y, mineField, textures);
                addToScore(textures);
            }
        }
    }
    gameState.smiley.sprite.texture = textures.smile[2];
    gameState.time.started = false;
    textures.smile[0] = textures.smile[1] = textures.smile[2];
}

function lose(mineField, textures) {
    for(let y = 0;y < mineField.length;y++) {
        for(let x = 0;x < mineField[0].length;x++) {
            if(!mineField[y][x].bomb && mineField[y][x].flag) {
                mineField[y][x].setTexture(textures.openBomb[2]);
            } else if(mineField[y][x].bomb && !mineField[y][x].flag && !mineField[y][x].open) {
                mineField[y][x].setTexture(textures.openBomb[0]);
            }
            mineField[y][x].open = true;
        }
    }
    gameState.time.started = false;
}

function getDisplayNumber(number) {
    if(number > 999) {
        return '999';
    } else if(number > 99) {
        return number.toString();
    } else if(number > 9) {
        return '0' + number;
    } else {
        return '00' + number;
    }
}

function updateScore(textures) {
    const display = getDisplayNumber(gameRules.bombCount - gameState.flagged);
    gameState.score.digits[0].texture = textures.score[parseInt(display[0])];
    gameState.score.digits[1].texture = textures.score[parseInt(display[1])];
    gameState.score.digits[2].texture = textures.score[parseInt(display[2])];
}

function addToScore(textures, positive = true) {
    gameState.flagged += positive? 1 : -1;
    updateScore(textures); 
}

function clickedOnTile(x, y, mineField, textures) {
    gameState.triedToOpen.x = x;
    gameState.triedToOpen.y = y;

    if(!mineField[y][x].open && !mineField[y][x].flag) {
        mineField[y][x].setTexture(textures.openTile[0]);
        gameState.smiley.sprite.texture = textures.smile[1];
    }
}

function tryToOpen(x, y, mineField, textures) {
    if(mineField[y][x].flag) {
        return;
    } else if(gameState.triedToOpen.x == x && gameState.triedToOpen.y == y) {
        open(x, y, mineField, textures);
    } else {
        setTileTexture(gameState.triedToOpen.x, gameState.triedToOpen.y, mineField, textures);
    }
    gameState.smiley.sprite.texture = textures.smile[0];
}

function tryToFlag(x, y, mineField, textures) {
    if(gameState.triedToFlag.x === x && gameState.triedToFlag.y === y && !mineField[y][x].open) {
        mineField[y][x].flag = !mineField[y][x].flag;
        setTileTexture(x, y, mineField, textures);
        addToScore(textures, mineField[y][x].flag);
    }
}

function fakeMineField(mineField, textures) {
    for(let y = 0;y < mineField.length;y++) {
        for(let x = 0;x < mineField[0].length;x++) {
            const sprite = new PIXI.Sprite(textures.closedTile);
            const square = mineField[y][x];

            sprite.x = square.x * displayRules.squareWidth;
            sprite.y = square.y * displayRules.squareHeight;
            sprite.width    = displayRules.squareWidth;
            sprite.height   = displayRules.squareHeight; 

            sprite.interactive  = true;
            sprite.buttonMode   = true;

            sprite.on('mousedown', (e) => {
                if(gameState.ctrl) {
                    gameState.triedToFlag.x = x;
                    gameState.triedToFlag.y = y;   
                } else {
                    clickedOnTile(x, y, mineField, textures);
                }
            });

            sprite.on('mouseup', () => {
                if(gameState.ctrl) {
                    tryToFlag(x, y, mineField, textures);
                } else {
                    tryToOpen(x, y, mineField, textures);
                }
            });

            sprite.on('rightdown', () => {
                gameState.triedToFlag.x = x;
                gameState.triedToFlag.y = y;
            });

            sprite.on('rightup', () => {
                tryToFlag(x, y, mineField, textures);
            });

            gameContainer.addChild(sprite);
            square.setSprite(sprite);
        }
    }  
}

function setTileTexture(x, y, mineField, textures) {
    if(mineField[y][x].flag) {
        mineField[y][x].setTexture(textures.flag);
    } else if(!mineField[y][x].open) {
        mineField[y][x].setTexture(textures.closedTile);
    } else if(mineField[y][x].bomb) {
        mineField[y][x].setTexture(textures.openBomb[1]);
    } else {
        mineField[y][x].setTexture(textures.openTile[mineField[y][x].number]);
    }
}

// TODO: change this with a solution that scales
function populateBrute(x, y, bombs, mineField) {
    for(let iy = y - 1;iy <= y + 1;iy++) {
        for(let ix = x - 1;ix <= x + 1;ix++) {
            if(testForInbounds(mineField, ix, iy)) {
                mineField[iy][ix].pickedFirst = true;
            }
        }
    }

    let placed = 0;
    while(placed < bombs) {
        const randomY = Math.floor(Math.random() * mineField.length);
        const randomX = Math.floor(Math.random() * mineField[0].length);

        if(!mineField[randomY][randomX].isOcupied()) {
            mineField[randomY][randomX].bomb = true;
            placed++;
        }
    }
}

function numerizeMineField(mineField) {
    for(let y = 0;y < mineField.length;y++) {
        for(let x = 0;x < mineField[0].length;x++) {
            if(mineField[y][x].bomb) {
                // Above
                if(y - 1 >= 0) {
                    if(testForInbounds(mineField, x - 1, y - 1)) mineField[y - 1][x - 1].number++;
                    mineField[y - 1][x].number++;
                    if(testForInbounds(mineField, x + 1, y - 1)) mineField[y - 1][x + 1].number++;
                }
                // Same row
                if(testForInbounds(mineField, x - 1, y)) mineField[y][x - 1].number++;
                if(testForInbounds(mineField, x + 1, y)) mineField[y][x + 1].number++;

                // Below
                if(y + 1 < mineField.length) {
                    if(testForInbounds(mineField, x - 1, y + 1)) mineField[y + 1][x - 1].number++;
                    mineField[y + 1][x].number++;
                    if(testForInbounds(mineField, x + 1, y + 1)) mineField[y + 1][x + 1].number++;
                }
            }
        }
    }
}

function testForInbounds(mineField, x, y) {
    return !(x < 0 || y < 0 || x >= mineField[0].length || y >= mineField.length);
}

function generateEmptyMineField(width, height) {
    const mineField = [];
    for(let y = 0;y < height;y++) {
        const row = [];
        for(let x = 0;x < width;x++) {
            row.push(new Square(x, y));
        }
        mineField.push(row);
    }
    return mineField;
}

class Square {
    constructor(x, y, bomb = false, number = 0, flag = false, pickedFirst = false) {
        this.x = x;
        this.y = y;

        this.open           = false;
        this.bomb           = bomb;
        this.number         = number;
        this.flag           = flag;
        this.pickedFirst    = pickedFirst;

        this._sprite        = null;
    }

    isOcupied() {
        return this.bomb || this.pickedFirst;
    }

    getSprite() {
        return this._sprite;
    }

    setSprite(sprite) {
        this._sprite = sprite;
    }

    setTexture(texture) {
        this._sprite.texture = texture;
    }
}

function getTexturesByName(prefix, variations) {
    const result = [];
    for(let variation of variations) {
        result.push(PIXI.Texture.from(prefix + variation));
    }
    return result;
}

function timeLoop(delta, textures) {
    updateTime(textures);
}