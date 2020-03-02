import { point } from "./Point.js";

const easeFactor = 1.3;

const easing = (value, lowerBound, upperBound, exponent) => {
    if (value < lowerBound) {
        return lowerBound;
    }
    if (value > upperBound) {
        return upperBound;
    }
    const factor = (value - lowerBound) / (upperBound - lowerBound) * 2;
    if (factor < 1) {
        return lowerBound + (factor ** exponent) * (upperBound - lowerBound) * 0.5;
    } else {
        return upperBound - ((2 - factor) ** exponent) * (upperBound - lowerBound) * 0.5;
    }
}
window.easing = easing;

export const makeCamera = (screenSize) => {
    let position = point(0, 0);
    
    const focus = (focusPosition, mapDimension) => {
        const { x, y } = focusPosition.sub(screenSize.mul(0.5));
        const maxPosition = mapDimension.sub(screenSize);

        position = point(
            easing(x, 0, maxPosition.x, easeFactor),
            easing(y, 0, maxPosition.y, easeFactor),
        );
    }

    const withFocus = (ctx, scale, callback) => {
        ctx.save();
        ctx.translate(-position.x * scale, -position.y * scale);
        callback();
        ctx.restore();
    }

    return Object.freeze({
        get position() { return position; },
        get screenSize() { return screenSize; },
        focus,
        withFocus
    })
}