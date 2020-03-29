import { fontName } from "./constants.js";
import { displayTime } from "./util.js";

const bgColor = "rgba(0, 0, 0, 0.5)"

const animationTime = 1;

export const makeGameoverLayer = (multiplayer, onClick) => {
    let timer = 0;

    let active = false;
    let info = undefined;

    const update = (time, click) => {
        if (!active) {
            return;
        }
        timer = Math.max(0, timer - time);

        if (click !== undefined) {
            onClick();
        }
    }

    const start = (time, bestTime, isNewBestTime, playerName) => {
        active = true;
        timer = animationTime;
        info = { time, bestTime, isNewBestTime, playerName }
    }

    const render = (ctx, camera) => {
        if (!active) {
            return;
        }
        const { time, bestTime, isNewBestTime, playerName } = info;
        const { screenSize } = camera;

        ctx.save();
        ctx.globalAlpha = 1 - timer / animationTime;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, screenSize.x, screenSize.y);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";

        const baseSize = screenSize.y * 0.1;
        
        
        if (multiplayer) {
            ctx.font = fontName(baseSize * 1.2);
            ctx.fillText(playerName + " wins!", screenSize.x / 2, screenSize.y * 0.25);
        }

        ctx.font = fontName(baseSize);
        ctx.fillText(displayTime(time), screenSize.x / 2, multiplayer ? screenSize.y * 0.4 : screenSize.y * 0.3);

        ctx.font = fontName(baseSize * 0.7);
        const bestTimeText = isNewBestTime ? "New Best Time!" : "Best Time: " + displayTime(bestTime);
        ctx.fillText(bestTimeText, screenSize.x / 2, screenSize.y * 0.5);

        ctx.font = fontName(baseSize * 0.4);
        ctx.fillText("CLICK to return to main menu.", screenSize.x / 2, screenSize.y * 0.7)


        ctx.restore();
    }

    return Object.freeze({
        update, render, start
    })
}