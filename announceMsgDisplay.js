import { point } from "./Point.js";
import { fontName } from "./constants.js";

const State = Object.freeze({
    DELAY: -1,
    FADE_IN: 0,
    IDLE: 1,
    FADE_OUT: 2,
    OVER: 3,
});

const fadeInScale = 0;
const fadeOutScale = 1.5;

const ease = (from, to, portion) => (
    from * (1 - portion) + to * portion
);

const makeMsg = (text, { delay = 0, fadeIn = 0.2, idle = 1, fadeOut = 0.2} = {}) => ({
    text, delay, fadeIn, idle, fadeOut,
    state: delay > 0 ? State.DELAY : State.FADE_IN,
    timer: delay > 0 ? delay : fadeIn,
})

export const makeAnnouncementMsgDisplay = () => {
    let messages = [];

    const update = time => {
        for (const msg of messages) {
            msg.timer -= time;
            const { state, timer } = msg;
            if (timer < 0) {
                const nextState =
                    state === State.DELAY ? State.FADE_IN :
                    state === State.FADE_IN ? State.IDLE :
                    state === State.IDLE ? State.FADE_OUT : State.OVER;
                const nextTimer =
                    nextState === State.FADE_IN ? msg.fadeIn :
                    nextState === State.IDLE ? msg.idle :
                    nextState === State.FADE_OUT ? msg.fadeOut : 0;
                msg.state = nextState;
                msg.timer = nextTimer;
            }
        }
        messages = messages.filter(({ state }) => state !== State.OVER);
    }

    const render = (ctx, camera, colorScheme) => {
        ctx.font = fontName(70);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = colorScheme.text;

        const position = point(camera.screenSize.x / 2, camera.screenSize.y / 4);

        for (const msg of messages) {
            const { state, text, timer } = msg;
            if (state === State.DELAY || state === State.OVER) {
                continue;
            }
            const scale = (
                state === State.FADE_IN ? ease(fadeInScale, 1, 1 - timer / msg.fadeIn) : 
                state === State.FADE_OUT ? ease(1, fadeOutScale, 1 - timer / msg.fadeOut) :
                1
            );
            
            const alpha = (
                state === State.FADE_IN ? ease(0, 1, 1 - timer / msg.fadeIn) : 
                state === State.FADE_OUT ? ease(1, 0, 1 - timer / msg.fadeOut) :
                1
            );
            
            ctx.save();
            ctx.translate(position.x, position.y);
            ctx.scale(scale, scale);
            ctx.globalAlpha = alpha;
            ctx.fillText(text, 0, 0);
            ctx.restore();
        }
    }

    const addMsg = (text, props) => {
        messages.push(makeMsg(text, props));
    }

    return Object.freeze({
        update, render, addMsg,
    })
}