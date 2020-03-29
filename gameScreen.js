import { makeShip, getShipStartPositions } from "./ship.js";
import { makeMap, parseJson } from "./map.js";
import { makeCamera } from "./camera.js";
import { makeCountdown } from "./countdown.js";
import { makeProgressTracker } from "./progressTracker.js";
import { playerColors } from "./colors.js";
import { makeAnnouncementMsgDisplay } from "./announceMsgDisplay.js";
import exampleMaps from "./exampleMaps.js";
import { makeGameoverLayer } from "./gameoverLayer.js";
import { makeMainMenuScreen } from "./mainMenuScreen.js";
import { point } from "./Point.js"
import { playerControls } from "./keyEventManager.js";

export const State = Object.freeze({
    COUNTDOWN: 0,
    GAME: 1,
    FINISHED: 2,
})

export const DEBUG = false;

export const makeGameScreen = (mapName, multiplayer = true) => ({ getDimension, setDimension, getWindowAspectRatio, keyEventManager, saveGame, initScreen }) => {
    const defaultDimension = getDimension();

    // init state basics
    let state = State.COUNTDOWN
    const colorScheme = playerColors.singlePlayer;
    const mapDefinition = exampleMaps[mapName];
    const parsedMapDefinition = parseJson(mapDefinition);

    // state changes
    const onCountdownOver = () => {
        state = State.GAME;
        for (const progressTracker of progressTrackers) {
            progressTracker.startTimer();
        }
    }

    const onRaceFinished = (time) => {
        state = State.FINISHED;
        const bestTime = saveGame.getBestTime(mapName);
        const isNewBestTime = bestTime === undefined || time < bestTime;
        if (isNewBestTime) {
            saveGame.setBestTime(mapName, time);
        }
        gameoverLayer.start(time, saveGame.getBestTime(mapName), isNewBestTime);
    }

    // init game objects
    let camera = makeCamera(getDimension);
    let announceMsgDisplay = makeAnnouncementMsgDisplay();
    let gameoverLayer = makeGameoverLayer(() => { initScreen(makeMainMenuScreen) });

    let countdown = makeCountdown(announceMsgDisplay, onCountdownOver);
    let map = makeMap(parsedMapDefinition);

    const nShips = multiplayer ? 2 : 1;

    const startPositions = getShipStartPositions(nShips, map.startPosition, map.startDirection)
    const ships = []
    const progressTrackers = [];
    for (let i = 0; i < nShips; i++) {
        const colorScheme = multiplayer ? playerColors.multiplayer[i] : playerColors.singlePlayer
        const ship = makeShip({
            startPosition: startPositions[i],
            startRotation: map.startDirection,
            controls: playerControls[i],
            colorScheme,
        });
        ships.push(ship);
        progressTrackers.push(makeProgressTracker({
            parsedMapDefinition,
            announceMsgDisplay,
            onFinished: onRaceFinished,
            colorScheme,
            secondPlayer: multiplayer && i === 1,
        }));
    }

    countdown.start();

    let nFrames = 0;
    const maxNFrames = 30;
    let elapsedTime = 0;
    let fps = 60;
    const update = (time, clicks) => {
        if (nFrames >= maxNFrames) {
            fps = 1 / elapsedTime * maxNFrames;
            nFrames = 0;
            elapsedTime = 0;
        }
        elapsedTime += time;
        nFrames += 1;

        map.update(time);
        for (const progressTracker of progressTrackers) {
            progressTracker.update(time);
        }
        
        for (const [index, ship] of ships.entries()) {
            ship.update({ time, keyEventManager, map, gameState: state, progressTracker: progressTrackers[index] });
        }
        
        countdown.update(time);
        announceMsgDisplay.update(time);
        gameoverLayer.update(time, clicks);
        const aspectRatio = getWindowAspectRatio();
        setDimension(point(
            aspectRatio > 1 ? defaultDimension.x * aspectRatio : defaultDimension.x,
            aspectRatio > 1 ? defaultDimension.y : defaultDimension.y / aspectRatio
        ));
    }
    const render = (ctx, scale) => {
        camera.focus(ships[0].position, map.dimension);
        
        const zoomFactor = camera.zoomFactor;
        ctx.save();
        ctx.scale(scale, scale);
        {
            ctx.save();
            ctx.scale(zoomFactor, zoomFactor);
            {
                map.renderBackground(ctx, camera);
                for (const progressTracker of progressTrackers) {
                    progressTracker.renderCheckpoints(ctx, camera);
                }
                map.renderForeground(ctx, camera, colorScheme);
                for (const ship of ships) {
                    ship.render(ctx, camera, colorScheme);
                }
            }
            ctx.restore();            

            if (state !== State.FINISHED) {
                for (const progressTracker of progressTrackers) {
                    progressTracker.renderOverlay(ctx, camera);
                }                
            }
            announceMsgDisplay.render(ctx, camera, colorScheme);
            gameoverLayer.render(ctx, camera);
            if (globalThis.debug) {
                ctx.fillStyle = "white";
                ctx.font = "10px Arial"
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(fps.toFixed(0), 10, 10);
            }
        }
        ctx.restore();
    };
    return {
        update,
        render,
    };
}