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

const getCameraWindow = (screenSize, totalPlayers, playerIndex) => {
    if (totalPlayers === 2) {
        const wide = screenSize.x / screenSize.y > 1;
        const size = wide ? point(screenSize.x / 2, screenSize.y) : point(screenSize.x, screenSize.y / 2);
        if (wide) {
            return [point(size.x, 0).mul(playerIndex), size]
        } else {
            return [point(0, size.y).mul(playerIndex), size];
        }
    } else {
        return [point(0, 0), screenSize];
    }
}

export const makeCamera = (getScreenSize, totalPlayers = 1, playerIndex = 0) => {
    let position = point(0, 0);
    let zoomFactor = 1;
    let [windowOffset, screenSize] = getCameraWindow(getScreenSize(), totalPlayers, playerIndex);
    
    const focus = (focusPosition, mapDimension) => {
        [windowOffset, screenSize] = getCameraWindow(getScreenSize(), totalPlayers, playerIndex);
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

    const withCamera = (ctx, callback) => {
        ctx.save();
        ctx.translate(windowOffset.x, windowOffset.y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(screenSize.x, 0);
        ctx.lineTo(screenSize.x, screenSize.y);
        ctx.lineTo(0, screenSize.y);
        ctx.closePath();
        ctx.clip();

        callback();

        ctx.restore();
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
        withCamera,
        withFocus,
    })
}