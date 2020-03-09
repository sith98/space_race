import { fontName } from "./constants.js"

const startDelay = 1;
const nNumbers = 3;
const numberDuration = 1;
const animationTime = 0.2;
const goDuration = 2;

const totalDelay = startDelay + nNumbers * numberDuration;

const addMessages = (msgDisplay) => {
    let currentDelay = startDelay;
    for (let i = nNumbers; i >= 1; i--) {
        msgDisplay.addMsg(i.toString(), {
            delay: currentDelay,
            fadeIn: animationTime,
            idle: numberDuration - animationTime,
            fadeOut: animationTime
        });
        currentDelay += numberDuration;
    }
    msgDisplay.addMsg("GO!", {
        delay: currentDelay,
        fadeIn: animationTime,
        idle: goDuration,
        fadeOut: animationTime,
    })
}

export const makeCountdown = (announcementMsgDisplay, onCountdownFinish = () => {}) => {
    let finished = false;
    let timer = 0;

    const start = () => {
        finished = false;
        timer = totalDelay;
        addMessages(announcementMsgDisplay);
    }

    const update = (time) => {
        timer -= time;
        if (!finished && timer <= 0) {
            finished = true;
            timer = 0;
            onCountdownFinish();
        }
    }

    return Object.freeze({
        start, 
        update,
    })
}