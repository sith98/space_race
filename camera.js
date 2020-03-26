import { point } from "./Point.js";

const easeFactor = 1.4;

const easing = (value, lowerBound, upperBound, exponent) => {
    if (value <= lowerBound) {
        return lowerBound;
    }
    if (value >= upperBound) {
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
    let zoomFactor = 1;
    
    const focus = (focusPosition, mapDimension) => {
        const scalingFactors = point(screenSize.x / mapDimension.x, screenSize.y / mapDimension.y)
        const maxScaling = Math.max(scalingFactors.x, scalingFactors.y);

        // if screen larger than map
        let virtualScreenSize;
        if (maxScaling > 1) {
            zoomFactor = maxScaling;
            const x = maxScaling === scalingFactors.x ? mapDimension.x : screenSize.x / maxScaling;
            const y = maxScaling === scalingFactors.y ? mapDimension.y : screenSize.y / maxScaling;
            virtualScreenSize = point(x, y);
        } else {
            virtualScreenSize = screenSize;
            zoomFactor = 1;
        }

        const { x, y } = focusPosition.sub(virtualScreenSize.mul(0.5));
        const maxPosition = mapDimension.sub(virtualScreenSize);

        position = point(
            easing(x, 0, maxPosition.x, easeFactor),
            easing(y, 0, maxPosition.y, easeFactor),
        );
    }

    const withFocus = (ctx, callback) => {
        ctx.save();
        ctx.translate(-position.x, -position.y);
        callback();
        ctx.restore();
    }

    return Object.freeze({
        get position() { return position; },
        get screenSize() { return screenSize; },
        get zoomFactor() { return zoomFactor; },
        focus,
        withFocus
    })
}