const BORDER = 10;
const SPRITE_TEXTURE = '';

const SQUARE_WIDTH  = 50;
const SQUARE_HEIGHT = 50;

// Mac chrome
// open /Applications/Google\ Chrome.app/ --args --allow-file-access-from-files

let displayRules = {
    squareWidth:    SQUARE_WIDTH,
    squareHeight:   SQUARE_HEIGHT,
};

let gameRules = {
    bombCount: 99,
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
};

const app = new PIXI.Application({
    width:  window.innerWidth - BORDER,
    height: window.innerHeight - BORDER,
    backgroundColor: 0x02395D,
});
document.body.appendChild(app.view);
document.oncontextmenu = document.body.oncontextmenu = e => {
    e.preventDefault();
}

const spriteLoader = PIXI.Loader.shared;

const textures1 = {};

spriteLoader.add('tileset', '../images/sprites.json').load((loader, resource) => {
   
    const textures = {};

    textures.openTile   = getTexturesByName('openTile', [...Array(9).keys()]);
    textures.score      = getTexturesByName('score', [...Array(10).keys()]);
    textures.smile      = getTexturesByName('smile', ['', 'Scared', 'Cool']);
    textures.openBomb   = getTexturesByName('openBomb', ['', 'Red', 'Cross']);

    textures.closedTile = PIXI.Texture.from('closedTile');
    textures.flag       = PIXI.Texture.from('flag');

    const mineField = generateEmptyMineField(30, 16);
    fakeMineField(mineField, textures);
    /*
    populateMineField(mineField, 500, 15, 8);
    numerizeMineField(mineField);
    displayMineField(mineField, textures);
    */

});

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
        //populateMineField(mineField, gameRules.bombCount, x, y);
        //populate2(x, y, gameRules.bombCount, mineField);
        populateBrute(x, y, gameRules.bombCount, mineField);
        numerizeMineField(mineField);
        open(x, y, mineField, textures);
    } else {
        mineField[y][x].open = true;
        setTileTexture(x, y, mineField, textures);
        if(mineField[y][x].bomb) {
            lose(mineField, textures);
        } else if(mineField[y][x].number == 0) {
            openAroundZeros(x, y, mineField, textures);
        }
    }
}

function testFail(mineField) {
    let count = 0;
    for(let y = 0;y < mineField.length;y++) {
        for(let x = 0;x < mineField[0].length;x++) {
            const square = mineField[y][x];

            if(square.bomb) count++;
            /*
            if(square.pickedFirst && !square.isOcupied()) {
                console.log(square.x, square.y, 'fuck me');
            }

            if(square.bomb && square.pickedFirst) {
                console.log(square.x, square.y);
                if(!square.isOcupied()) console.log('???');
            }   */
        }
    }
    console.log('bombs: ', count);
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
}

function clickedOnTile(x, y, mineField, textures) {
    gameState.triedToOpen.x = x;
    gameState.triedToOpen.y = y;

    if(!mineField[y][x].open && !mineField[y][x].flag) {
        mineField[y][x].setTexture(textures.openTile[0]);
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
}

function tryToFlag(x, y, mineField, textures) {
    if(gameState.triedToFlag.x === x && gameState.triedToFlag.y === y && !mineField[y][x].open) {
        mineField[y][x].flag = !mineField[y][x].flag;
        setTileTexture(x, y, mineField, textures);
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

            sprite.on('mousedown', () => {
                clickedOnTile(x, y, mineField, textures);
            });

            sprite.on('mouseup', () => {
                tryToOpen(x, y, mineField, textures);
            });

            sprite.on('rightdown', () => {
                gameState.triedToFlag.x = x;
                gameState.triedToFlag.y = y;
            });

            sprite.on('rightup', () => {
                tryToFlag(x, y, mineField, textures);
            });

            app.stage.addChild(sprite);
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

function populate2(x, y, bombs, mineField) {
    // Setting up the indexes
    let yIndex      = mineField.length;
    const xIndex    = [];
    for(let iy = 0;iy < mineField.length;iy++) {
        xIndex[iy] = mineField[0].length;

        if(iy >= y - 1 && iy <= y + 1) {
            for(let ix = x - 1;ix < x + 1;ix++) {
                if(testForInbounds(mineField, ix, iy)) {
                    xIndex[iy]--;
                    mineField[iy][ix].pickedFirst = true;
                }
            }
        }
        if(xIndex[iy] <= 0) yIndex--;
    }

    // Put in the bombs
    for(let placed = 0;placed < bombs;placed++) {
        const randomY = Math.floor(Math.random() * yIndex);
        let realY = 0;
        for(let iy = 0;iy < randomY;) {
            if(xIndex[realY] > 0) iy++;
            realY++;
        }

        const randomX = Math.floor(Math.random() * xIndex[realY]);
        let realX = 0;
        for(let ix = 0;ix < randomX;) {
            if(!mineField[realY][realX].isOcupied()) ix++;
            realX++;
        }

        mineField[realY][realX].bomb = true;
        xIndex[realY]--;
        if(xIndex[realY] <= 0) yIndex--;

        console.log(realY, ':', xIndex[realY]);
    }
}

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

// Populate the minefield, making sure x, y is an empty square
function populateMineField(mineField, bombs, x, y) {
    let yIndex = 0;
    const xIndex = [];

    for(let iy = 0;iy < mineField.length;iy++) {
        xIndex[iy] = mineField[0].length;

        if(iy === y - 1 || iy === y || iy === y + 1) {
            for(let ix = x - 1;ix <= x + 1;ix++) {
                if(testForInbounds(mineField, ix, iy)) {
                    mineField[iy][ix].pickedFirst = true;
                    xIndex[iy]--;
                }
            }
        }
        
        if(xIndex[iy] > 0) yIndex++;
    }

    for(let count = 0;count < bombs;count++) {
        const randY = Math.floor(Math.random() * yIndex);
        let bombY = 0;
        for(let iy = 0;iy < randY;bombY++) {
            if(xIndex[bombY] > 0) iy++;
        }

        const randX = Math.floor(Math.random() * xIndex[bombY]);
        
        let bombX = 0;
        for(let ix = 0;ix < randX;bombX++) {
            //if(!mineField[bombY][bombX].isOcupied()) ix++;
            console.log(bombY, bombX);
            if(!mineField[bombY][bombX].bomb && !mineField[bombY][bombX].pickedFirst) {
                ix++;
            } else {
                
            }
        }

        if(mineField[bombY][bombX].bomb) {
            console.log(bombY, bombX, 'g');
        }

        mineField[bombY][bombX].bomb = true;
        xIndex[bombY]--;
        if(xIndex[bombY] <= 0) yIndex--;
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
