import { point } from "./Point.js";
import { mod } from "./util.js";

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
    const { splineTension = 0.5, nInterpolationPoints = 20, checkpoints: checkpointArray, defaultRadius } = path;

    const splineAnchors = []
    const rawCheckpoints = [];
    let anchorIndex = -1;
    for (const { x, y, radius = defaultRadius, interpolated } of checkpointArray) {
        if (typeof interpolated === "number") {
            rawCheckpoints.push({
                interpolated: anchorIndex + interpolated,
                radius
            });
        } else {
            const position = point(x + padding, y + padding);
            rawCheckpoints.push({
                position,
                radius,
            });
            splineAnchors.push(position.x);
            splineAnchors.push(position.y);
            anchorIndex += 1;
        }
    }

    const nAnchors = anchorIndex + 1;

    const rawSplinePoints = getCurvePoints(splineAnchors, splineTension, nInterpolationPoints, true);
    const spline = []
    for (let i = 0; i < rawSplinePoints.length; i += 2) {
        spline.push(point(rawSplinePoints[i], rawSplinePoints[i + 1]));
    }

    let splineStartIndex = 0;

    const checkpoints = [];
    for (const [index, checkpoint] of rawCheckpoints.entries()) {
        if (typeof checkpoint.interpolated === "number") {
            const { radius, interpolated } = checkpoint;
            const closestPointIndex = mod(
                Math.round(interpolated * nInterpolationPoints),
                nAnchors * nInterpolationPoints
            );
            const closestPoint = spline[closestPointIndex];
            // special case: if first checkpoint is interpolated, starting direction is based on its spline position
            if (index === 0) {
                splineStartIndex = closestPointIndex;
            }
            checkpoints.push({
                position: closestPoint,
                radius
            })
        } else {
            const { position, radius } = checkpoint
            checkpoints.push({ position, radius });
        }
    };

    const startDirection = spline[splineStartIndex + 1].sub(spline[splineStartIndex]).angle();
    
    return {
        width: width + 2 * padding,
        height: height + 2 * padding,
        startDirection,
        path: {
            spline,
            checkpoints,
        },
    }
};

export const makeMap = (mapDefinition) => {
    const { width, height, path, startDirection } = mapDefinition;
    const { checkpoints, spline } = path;

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

            for (const { x, y } of spline) {
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