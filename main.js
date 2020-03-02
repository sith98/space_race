import { makeGameScreen } from "./gameScreen.js";
import { makeKeyEventManager } from "./keyEventManager.js";
import { MAX_FRAME_LENGTH, DESIRED_FRAME_LENGTH } from "./constants.js";
import { point } from "./Point.js";

const WIDTH = 800;
const HEIGHT = 600;
const SCALE = 1.5;

let canvas, ctx, state, keyEventManager;

let lastFrame = undefined;

const main = () => {
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");

    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT * SCALE;
    document.body.appendChild(canvas);

    keyEventManager = makeKeyEventManager();
    keyEventManager.activate();

    state = initState(makeGameScreen);
    globalThis.requestAnimationFrame(tick);
}

const tick = () => {
    const now = Date.now();
    const timePassed = lastFrame === undefined ? DESIRED_FRAME_LENGTH : (now - lastFrame) / 1000;
    update(Math.min(timePassed, MAX_FRAME_LENGTH));
    render();
    globalThis.requestAnimationFrame(tick);
}

const initState = (stateConstructor) => {
    return {
        update: () => {},
        render: () => {},
        ...stateConstructor({ dimension: point(WIDTH, HEIGHT), keyEventManager })
    }
}

const update = (time) => {
    state.update(time);
}

const render = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    state.render(ctx, SCALE);
}

window.addEventListener("load", main);