import { makeShip } from "./ship.js";
import { makeMap, parseJson } from "./map.js";
import { makeCamera } from "./camera.js";
import { makeCountdown } from "./countdown.js";
import { makeProgressTracker } from "./progressTracker.js";
import { playerColors } from "./colors.js";

export const State = Object.freeze({
    COUNTDOWN: 0,
    GAME: 1,
})

export const DEBUG = false;

export const makeGameScreen = mapDefinition => ({ dimension, keyEventManager }) => {
    let state = State.COUNTDOWN
    const colorScheme = playerColors.singlePlayer;

    let countdown = makeCountdown(() => {
        state = State.GAME;
        progressTracker.startTimer();
    });
    let parsedMapDefinition = parseJson(mapDefinition);
    let map = makeMap(parsedMapDefinition);
    let ship = makeShip({
        startPosition: map.startPosition,
        startRotation: map.startDirection,
    });
    let progressTracker = makeProgressTracker(parsedMapDefinition);
    
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

            map.renderBackground(ctx, camera);
            progressTracker.renderCheckpoints(ctx, camera, colorScheme);
            map.renderForeground(ctx, camera, colorScheme);
            ship.render(ctx, camera, colorScheme);
            progressTracker.renderOverlay(ctx, camera, colorScheme);
            countdown.render(ctx, camera, colorScheme);
        }
        ctx.restore();
    };
    return {
        update,
        render,
    };
}