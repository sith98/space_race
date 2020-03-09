import { makeMainMenuScreen } from "./mainMenuScreen.js";
import { makeGameScreen } from "./gameScreen.js";
import { makeKeyEventManager } from "./keyEventManager.js";
import { MAX_FRAME_LENGTH, DESIRED_FRAME_LENGTH } from "./constants.js";
import { point } from "./Point.js";
import maps from "./exampleMaps.js"
import { makeSaveGame } from "./saveGame.js";
import { makeClickEventManager } from "./clickEventManager.js";

const WIDTH = 800;
const HEIGHT = 800;
const SCALE = 1.5;

const dimension = point(WIDTH, HEIGHT);

let canvas, ctx, screen, keyEventManager, saveGame, clickEventManager;

let lastFrame = undefined;

let lastWindowWidth = 0;
let lastWindowHeight = 0;

const main = () => {
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");

    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT * SCALE;
    document.body.appendChild(canvas);

    keyEventManager = makeKeyEventManager();
    keyEventManager.activate();

    saveGame = makeSaveGame();
    clickEventManager = makeClickEventManager(canvas, dimension)

    initScreen(makeMainMenuScreen);
    globalThis.requestAnimationFrame(tick);
}

const tick = () => {
    const now = Date.now();
    const timePassed = lastFrame === undefined ? DESIRED_FRAME_LENGTH : (now - lastFrame) / 1000;
    update(Math.min(timePassed, MAX_FRAME_LENGTH));
    render();
    globalThis.requestAnimationFrame(tick);
}

const initScreen = (stateConstructor) => {
    screen = {
        update: () => {},
        render: () => {},
        ...stateConstructor({
            canvas,
            dimension,
            keyEventManager,
            saveGame,
            initScreen,
        }),
    }
}

const update = (time) => {
    const click = clickEventManager.fetchClick();
    //console.log(clicks);
    screen.update(time, click);
}

const render = () => {
    const windowWidth = globalThis.innerWidth;
    const windowHeight = globalThis.innerHeight;

    if (windowWidth != lastWindowWidth || windowHeight != lastWindowHeight) {
        const windowRatio = windowWidth / windowHeight;
        const myRatio = WIDTH / HEIGHT;
        const wider = windowRatio > myRatio;
        
        const width = wider ? windowHeight * myRatio : windowWidth;
        const height = wider ? windowHeight : windowWidth / myRatio;
    
        canvas.width = canvas.style.width = width;
        canvas.height = canvas.style.height = height;
        canvas.style.top = (wider ? 0 : (windowHeight - height) / 2) + "px";
        canvas.style.left = (wider ? (windowWidth - width) / 2 : 0) + "px";
    }

    lastWindowWidth = windowWidth;
    lastWindowHeight = windowHeight;    

    const scale = canvas.width / WIDTH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    screen.render(ctx, scale);
}

window.addEventListener("load", main);

window.startMap = (mapName) => {
    screen = initScreen(makeGameScreen(maps[mapName]));
}