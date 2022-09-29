const BORDER = 10;
const SPRITE_TEXTURE = '';

const app = new PIXI.Application({
    width:  window.innerWidth - BORDER,
    height: window.innerHeight - BORDER,
    backgroundColor: 0x02395D,
});
document.body.appendChild(app.view);

const spriteLoader = PIXI.Loader.shared;

const textures = {};

spriteLoader.add('tileset', '../images/sprites.json').load((loader, resource) => {
    
    textures.openTile   = getTexturesByName('openTile', [...Array(9).keys()]);
    textures.score      = getTexturesByName('score', [...Array(9).keys()]);
    textures.smile      = getTexturesByName('smile', ['', 'Scared', 'Cool']);
    textures.openBomb   = getTexturesByName('openBomb', ['', 'Red', 'Cross']);

    textures.closedTile = PIXI.Texture.from('closedTile');
    textures.flag       = PIXI.Texture.from('flag');

    for(let i = 0;i < 9;i++) {
        const sprite = new PIXI.Sprite(textures.openTile[i]);
        sprite.x = i * 64;
        app.stage.addChild(sprite);
    }
});



function getTexturesByName(prefix, variations) {
    const result = [];
    for(const variation of variations) {
        result.push(PIXI.Texture.from(prefix + variation));
    }
    return result;
}

function createTileSprite(x, y) {
    const tileSprite = new PIXI.Sprite.from(SPRITE_TEXTURE);
}