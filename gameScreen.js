import { makeShip } from "./ship.js";
import { makeMap, parseJson } from "./map.js";
import { makeCamera } from "./camera.js";
import { makeCountdown } from "./countdown.js";
import { makeProgressTracker } from "./progressTracker.js";

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
    let progressTracker = makeProgressTracker(map.checkpoints);
    
    let camera = makeCamera(dimension);

    countdown.start();

    const update = (time) => {
        map.update(time);
        progressTracker.update(time);
        ship.update({ time, keyEventManager, map, gameState: state, progressTracker });
        countdown.update(time);
    }
    const render = (ctx, scale) => {
        camera.focus(ship.position, map.dimension);
        
        ctx.save();
        {
            ctx.scale(scale, scale);

            map.render(ctx, camera);
            progressTracker.renderCheckpoints(ctx, camera);
            ship.render(ctx, camera);
            progressTracker.renderOverlay(ctx, camera);
            countdown.render(ctx, camera);
        }
        ctx.restore();
    };
    return {
        update,
        render,
    };
}