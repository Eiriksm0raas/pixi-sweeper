const BORDER = 10;

const app = new PIXI.Application({
    width:  window.innerWidth - BORDER,
    height: window.innerHeight - BORDER,
    backgroundColor: 0x02395D,
});

document.body.appendChild(app.view);