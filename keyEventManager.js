export const UP = 38;
export const DOWN = 40;
export const LEFT = 37;
export const RIGHT = 39;
export const makeKeyEventManager = () => {
    const pressedKeys = new Set();

    const onKeyDown = evt => {
        pressedKeys.add(evt.keyCode);
    }

    const onKeyUp = evt => {
        pressedKeys.delete(evt.keyCode);
    }

    const activate = () => {
        globalThis.addEventListener("keydown", onKeyDown);
        globalThis.addEventListener("keyup", onKeyUp);
    }

    const deactivate = () => {
        globalThis.removeEventListener("keydown", onKeyDown);
        globalThis.removeEventListener("keyup", onKeyUp);
    }

    const isPressed = (keyCode) => pressedKeys.has(keyCode);

    const toString = () => {
        return Array.from(pressedKeys.keys()).toString();
    }

    return Object.freeze({
        activate,
        deactivate,
        isPressed,
        toString,
    });
}