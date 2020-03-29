import { makeShip, getShipStartPositions } from "./ship.js";
import { makeMap, parseJson } from "./map.js";
import { makeCamera } from "./camera.js";
import { makeCountdown } from "./countdown.js";
import { makeProgressTracker, progressRanking } from "./progressTracker.js";
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

export const makeGameScreen = (mapName, multiplayer = false) => ({ getDimension, setDimension, getWindowAspectRatio, keyEventManager, saveGame, initScreen }) => {
    const defaultDimension = getDimension();

    // init state basics
    let state = State.COUNTDOWN
    const colorScheme = playerColors.singleplayer;
    const mapDefinition = exampleMaps[mapName];
    const parsedMapDefinition = parseJson(mapDefinition);

    // state changes
    const onCountdownOver = () => {
        state = State.GAME;
        for (const progressTracker of progressTrackers) {
            progressTracker.startTimer();
        }
    }

    const onRaceFinished = (time, playerName) => {
        state = State.FINISHED;
        const bestTime = saveGame.getBestTime(mapName);
        const isNewBestTime = bestTime === undefined || time < bestTime;
        if (isNewBestTime) {
            saveGame.setBestTime(mapName, time);
        }
        gameoverLayer.start(time, saveGame.getBestTime(mapName), isNewBestTime, playerName);
    }

    const nShips = multiplayer ? 2 : 1;

    // init game objects
    const gameoverLayer = makeGameoverLayer(multiplayer, () => { initScreen(makeMainMenuScreen) });

    const map = makeMap(parsedMapDefinition);

    const startPositions = getShipStartPositions(nShips, map.startPosition, map.startDirection);
    const ships = []
    const progressTrackers = [];
    const cameras = [];
    const globalCamera = makeCamera(getDimension);
    const announcementMsgDisplays = [];
    for (let i = 0; i < nShips; i++) {
        const colorScheme = multiplayer ? playerColors.multiplayer[i] : playerColors.singleplayer
        const ship = makeShip({
            startPosition: startPositions[i],
            startRotation: map.startDirection,
            controls: multiplayer ? playerControls.multiplayer[i] : playerColors.singleplayer,
            colorScheme,
        });
        ships.push(ship);
        const announcementMsgDisplay = makeAnnouncementMsgDisplay();
        progressTrackers.push(makeProgressTracker({
            parsedMapDefinition,
            announcementMsgDisplay,
            onFinished: onRaceFinished,
            colorScheme,
            multiplayer,
            secondPlayer: multiplayer && i === 1,
        }));
        cameras.push(makeCamera(getDimension, nShips, i))
        announcementMsgDisplays.push(announcementMsgDisplay);
    }
    const countdown = makeCountdown(announcementMsgDisplays, onCountdownOver);

    countdown.start();

    let nFrames = 0;
    const maxNFrames = 30;
    let elapsedTime = 0;
    let fps = 60;




    const update = (time, clicks, ms) => {
        if (nFrames >= maxNFrames) {
            fps = 1 / elapsedTime * maxNFrames;
            nFrames = 0;
            elapsedTime = 0;
        }
        elapsedTime += time;
        nFrames += 1;

        map.update(time);
        for (const progressTracker of progressTrackers) {
            progressTracker.update(ms);
        }
        
        for (const [index, ship] of ships.entries()) {
            ship.update({ time, keyEventManager, map, gameState: state, progressTracker: progressTrackers[index] });
        }
        
        countdown.update(time);
        for (const display of announcementMsgDisplays) {
            display.update(time);
        }
        gameoverLayer.update(time, clicks);

        if (multiplayer) {
            const progresses = ships.map((ship, index) => progressTrackers[index].getProgress(ship.position))
            const ranks = progressRanking(progresses);
            for (const [index, rank] of ranks.entries()) {
                progressTrackers[index].rank = rank;
            }
        }

        const aspectRatio = getWindowAspectRatio();
        setDimension(point(
            aspectRatio > 1 ? defaultDimension.x * aspectRatio : defaultDimension.x,
            aspectRatio > 1 ? defaultDimension.y : defaultDimension.y / aspectRatio
        ));
    }




    const render = (ctx, scale) => {
        ctx.save();
        ctx.scale(scale, scale);
        for (const [index, camera] of cameras.entries()) {
            const ship = ships[index];
            camera.focus(ship.position, map.dimension);
        
            const zoomFactor = camera.zoomFactor;
            camera.withCamera(ctx, () => {
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
                    progressTrackers[index].renderOverlay(ctx, camera);
                }
                announcementMsgDisplays[index].render(ctx, camera, colorScheme);
            });
            camera.renderBorder(ctx);
        }
        globalCamera.focus(point(0, 0), map.dimension);
        gameoverLayer.render(ctx, globalCamera);
        if (globalThis.debug) {
            ctx.fillStyle = "white";
            ctx.font = "10px Arial"
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(fps.toFixed(0), 10, 10);
        }   
        ctx.restore();
    };
    return {
        update,
        render,
    };
}