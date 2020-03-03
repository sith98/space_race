import { point } from "./Point.js";

const DRAW_SCALE = 1;

const dashSpeed = 80;
const dashes = [15, 20];
const lineWidth = 3;
const totalDashLength = dashes.reduce((a, b) => a + b);

const checkpointDotRadius = 3;

const paralaxFactor = 0.4;
const starsPer100Pixels = 0.2;

export const parseJson = (json) => {
    const { width, height, path, padding = 0 } = json;
    const { splineTension = 0.5, checkpoints: checkpointArray, defaultRadius } = path;
    return {
        width: width + 2 * padding,
        height: height + 2 * padding,
        path: {
            splineTension,
            checkpoints: checkpointArray.map(({x, y, radius = defaultRadius}) => ({
                position: point(x + padding, y + padding),
                radius
            })),
        },
    }
};

export const makeMap = (mapDefinition) => {
    const { width, height, path } = mapDefinition;
    const { checkpoints } = path;

    const splinePointArray = checkpoints.flatMap(c => [c.position.x, c.position.y]);
    const splinePath = getCurvePoints(splinePointArray, path.splineTension, 20, true);
    const startDirection = point(splinePath[2], splinePath[3]).sub(point(splinePath[0], splinePath[1])).angle();

    let lineOffset = 0

    const prerenderBackground = () => {

        const stars = [];
        for (let i = 0; i < width * height / 100 * starsPer100Pixels; i++) {
            stars.push({
                x: Math.round(Math.random() * width),
                y: Math.round(Math.random() * height),
                size: Math.random() < 1 / 3 ? 2 : 1,
            });
        }
        
        const starCanvas = document.createElement("canvas");
        starCanvas.width = width * DRAW_SCALE;
        starCanvas.height = height * DRAW_SCALE;
        const starCtx = starCanvas.getContext("2d");
        starCtx.fillStyle = "black";
        starCtx.fillRect(0, 0, width * DRAW_SCALE, height * DRAW_SCALE);
        starCtx.fillStyle = "white"
        for (const { x, y, size } of stars) {
            starCtx.fillRect(x * DRAW_SCALE, y * DRAW_SCALE, size * DRAW_SCALE, size * DRAW_SCALE);
        }
        return starCanvas;
    }

    const starCanvas = prerenderBackground();

    const update = (time) => {
        lineOffset = (lineOffset + time * dashSpeed) % totalDashLength;
    }

    const render = (ctx, scale, camera) => {
        const backgroundX = -camera.position.x * scale * paralaxFactor;
        const backgroundY = -camera.position.y * scale * paralaxFactor;

        ctx.drawImage(starCanvas, backgroundX, backgroundY, width * scale / DRAW_SCALE, height * scale / DRAW_SCALE);

        camera.withFocus(ctx, scale, () => {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = lineWidth * scale;
            ctx.setLineDash(dashes.map(n => n * scale));
            ctx.lineDashOffset = -lineOffset * scale;
            ctx.beginPath();

            for (let i = 0; i < splinePath.length; i += 2) {
                const x = splinePath[i];
                const y = splinePath[i + 1];
                ctx.lineTo(x * scale, y * scale);
            }
            ctx.stroke();
    
            ctx.fillStyle = "#70ff8f";
            for (const checkpoint of checkpoints) {
                ctx.beginPath();
                ctx.arc(checkpoint.position.x * scale, checkpoint.position.y * scale, checkpointDotRadius * scale, 0, 2 * Math.PI);
                ctx.fill();
            }
        })        
    }

    return Object.freeze({
        update,
        render,
        get dimension() { return point(width, height) },
        get startPosition() { return checkpoints[0].position },
        get startDirection() { return startDirection },
        get checkpoints() { return checkpoints },
    })
}