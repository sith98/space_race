import { makeShip } from "./ship.js";
import { makeMap, parseJson } from "./map.js";
import { makeCamera } from "./camera.js";
import { makeCountdown } from "./countdown.js";

export const State = Object.freeze({
    COUNTDOWN: 0,
    GAME: 1,
})

export const DEBUG = false;

export const makeGameScreen = mapDefinition => ({ dimension, keyEventManager }) => {
    let state = State.COUNTDOWN

    let countdown = makeCountdown(() => {
        state = State.GAME;
    });
    let map = makeMap(parseJson(mapDefinition));
    let ship = makeShip({
        startPosition: map.startPosition,
        startRotation: map.startDirection,
        checkpoints: map.checkpoints
    });
    
    let camera = makeCamera(dimension);

    countdown.start();

    const update = (time) => {
        map.update(time);
        ship.update(time, keyEventManager, map, state);
        countdown.update(time);
    }
    const render = (ctx, scale) => {
        camera.focus(ship.position, map.dimension);

        map.render(ctx, scale, camera);
        ship.render(ctx, scale, camera);
        countdown.render(ctx, scale, camera);

        // document.getElementById("debug").innerHTML = keyEventManager.toString();
    };
    return {
        update,
        render,
    };
}