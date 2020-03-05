import { fontName } from "./constants.js"

export const makeCountdown = (onCountdownFinish = () => {}) => {
    let finished = false;
    let timer = 0;

    const start = () => {
        finished = false;
        timer = texts[texts.length - 1].timer;
    }

    const update = (time) => {
        timer = Math.max(texts[0].timer - 1, timer - time);
        if (!finished && timer <= 0) {
            finished = true;
            onCountdownFinish();
        }
    }

    const render = (ctx, camera) => {
        let countdownText;
        for (const { timer: textTimer , text } of texts) {
            if (timer < textTimer) {
                countdownText = text;
                break;
            }
        }
        ctx.font = fontName(50);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";
        ctx.fillText(countdownText, camera.screenSize.x / 2, camera.screenSize.y / 4);
    }

    return Object.freeze({
        start, 
        update,
        render
    })
}

const texts = [
    {
        timer: 4,
        text: ""
    },
    {
        timer: 3,
        text: "3"
    },
    {
        timer: 2,
        text: "2"
    },
    {
        timer: 1,
        text: "1"
    },
    {
        timer: 0,
        text: "GO"
    },
    {
        timer: -2,
        text: ""
    },
];
texts.reverse();