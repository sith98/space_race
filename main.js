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

const defaultDimension = point(WIDTH, HEIGHT);

let canvas, ctx, screen, keyEventManager, saveGame, clickEventManager;

let lastFrame = undefined;
let dimension = defaultDimension;
let changedDimension = false;

let lastWindowWidth = 0;
let lastWindowHeight = 0;

class ScreenChangedError extends Error {}

const main = () => {
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");

    canvas.width = defaultDimension.x * SCALE;
    canvas.height = defaultDimension.y * SCALE;
    document.body.appendChild(canvas);

    keyEventManager = makeKeyEventManager();
    keyEventManager.activate();

    saveGame = makeSaveGame();
    clickEventManager = makeClickEventManager(canvas, getDimension)

    manualInitScreen(makeMainMenuScreen);
    globalThis.requestAnimationFrame(tick);
}

const tick = () => {
    const now = Date.now();
    const ms = Math.min(lastFrame === undefined ? DESIRED_FRAME_LENGTH : (now - lastFrame), MAX_FRAME_LENGTH);
    const timePassed = ms / 1000;
    lastFrame = now;
    
    try {
        update(timePassed, ms);
        render();
    } catch (e) {
        if (!(e instanceof ScreenChangedError)) {
            throw e;
        }
    }
    globalThis.requestAnimationFrame(tick);
}

const manualInitScreen = (stateConstructor) => {
    setDimension(defaultDimension);
    screen = {
        update: () => {},
        render: () => {},
        ...stateConstructor({
            canvas,
            getDimension,
            setDimension,
            getWindowAspectRatio,
            keyEventManager,
            saveGame,
            initScreen,
        }),
    }
}

const initScreen = (stateConstructor) => {
    manualInitScreen(stateConstructor);
    throw new ScreenChangedError();
}

const getDimension = () => dimension;
const setDimension = newDimension => {
    if (!newDimension.equals(dimension)) {
        changedDimension = true;
    }
    dimension = newDimension;
}
const getWindowAspectRatio = () => globalThis.innerWidth / globalThis.innerHeight;

const update = (time, ms) => {
    const click = clickEventManager.fetchClick();
    //console.log(clicks);
    screen.update(time, click, ms);
}

const render = () => {
    const windowWidth = globalThis.innerWidth;
    const windowHeight = globalThis.innerHeight;

    if (changedDimension || windowWidth != lastWindowWidth || windowHeight != lastWindowHeight) {
        const windowRatio = windowWidth / windowHeight;
        const myRatio = dimension.x / dimension.y;
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

    const scale = canvas.width / dimension.x;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    screen.render(ctx, scale);

    if (changedDimension) {
        changedDimension = false;
    }
}

window.addEventListener("load", main);

window.startMap = (mapName) => {
    screen = initScreen(makeGameScreen(maps[mapName]));
}
window.debug = true;
