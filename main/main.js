const BORDER = 10;
const SPRITE_TEXTURE = '';

const SQUARE_WIDTH  = 20;
const SQUARE_HEIGHT = 20;

let displayRules = {
    squareWidth:    SQUARE_WIDTH,
    squareHeight:   SQUARE_HEIGHT,
};

const app = new PIXI.Application({
    width:  window.innerWidth - BORDER,
    height: window.innerHeight - BORDER,
    backgroundColor: 0x02395D,
});
document.body.appendChild(app.view);

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

    const mineField = generateEmptyMineField(60, 30);
    populateMineField(mineField, 500, 15, 8);
    numerizeMineField(mineField);
    displayMineField(mineField, textures);

});

function displayMineField(mineField, textures) {
    for(let y = 0;y < mineField.length;y++) {
        for(let x = 0;x < mineField[0].length;x++) {
            let sprite;

            if(mineField[y][x].flag) {
                sprite = new PIXI.Sprite(textures.flag);
            } else if(!mineField[y][x].open) {
                sprite = new PIXI.Sprite(textures.closedTile);
            } else if(mineField[y][x].bomb) {
                sprite = new PIXI.Sprite(textures.openBomb[0]);
            } else {
                sprite = new PIXI.Sprite(textures.openTile[mineField[y][x].number]);
            }

            const square = mineField[y][x];
            //mineField[y][x].setSprite(sprite);
            square.setSprite(sprite);
            
            sprite.x = square.x * displayRules.squareWidth;
            sprite.y = square.y * displayRules.squareHeight;
            sprite.width    = displayRules.squareWidth;
            sprite.height   = displayRules.squareHeight; 

            app.stage.addChild(sprite);
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
        let iy = randY;
        for(;xIndex[iy] <= 0;iy++) {}

        const randX = Math.floor(Math.random() * xIndex[iy]);
        let ix = randX;
        for(;mineField[iy][ix].isOcupied();ix++) {}

        mineField[iy][ix].bomb = true;

        xIndex[iy]--;
        if(xIndex[iy] <= 0) yIndex--;
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
    return !(x < 0 || y < 0 || x >= mineField[0].length || y >= mineField.lenght);
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

        this.open           = true;
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
}

function getTexturesByName(prefix, variations) {
    const result = [];
    for(let variation of variations) {
        result.push(PIXI.Texture.from(prefix + variation));
    }
    return result;
}
