import { fontName } from "./constants.js";
import { displayTime } from "./util.js";

const bgColor = "rgba(0, 0, 0, 0.5)"

const animationTime = 1;

export const makeGameoverLayer = (onClick) => {
    let timer = 0;

    let active = false;
    let info = undefined;

    const update = (time) => {
        if (!active) {
            return;
        }
        timer = Math.max(0, timer - time);
    }

    const start = (time, bestTime, isNewBestTime) => {
        active = true;
        timer = animationTime;
        info = { time, bestTime, isNewBestTime }
    }

    const render = (ctx, camera) => {
        if (!active) {
            return;
        }
        const { time, bestTime, isNewBestTime } = info;
        const { screenSize } = camera;

        ctx.save();
        ctx.globalAlpha = 1 - timer / animationTime;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, screenSize.x, screenSize.y);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";

        const baseSize = screenSize.y * 0.1;
        
        ctx.font = fontName(baseSize);
        ctx.fillText(displayTime(time), screenSize.x / 2, screenSize.y * 0.3);

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