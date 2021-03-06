import { point } from "./Point.js";
import { mod } from "./util.js";
import { checkpointDotColor } from "./colors.js";

const dashSpeed = 80;
const dashes = [15, 20];
const lineWidth = 3;
const totalDashLength = dashes.reduce((a, b) => a + b);

const checkpointDotRadius = 4.5;
const finishCheckpointDotRadius = 9;

const paralaxFactor = 0.4;
const starsPer100Pixels = 0.2;

export const parseJson = (json) => {
    const { width, height, path, padding = 0, laps = 5 } = json;
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
        laps,
        path: {
            spline,
            checkpoints,
        },
    }
};

export const makeMap = (mapDefinition) => {
    const { width, height, path, startDirection } = mapDefinition;
    const { checkpoints, spline } = path;

    let lineOffset = 0;

    const stars = [];
    for (let i = 0; i < width * height / 100 * starsPer100Pixels; i++) {
        stars.push({
            x: Math.round(Math.random() * width),
            y: Math.round(Math.random() * height),
            size: Math.random() < 1 / 3 ? 2 : 1,
        });
    }

    const prerenderBackground = (stars, starCtx) => {        
        starCtx.fillStyle = "black";
        starCtx.fillRect(0, 0, width, height);
        starCtx.fillStyle = "white"
        for (const { x, y, size } of stars) {
            starCtx.fillRect(x, y, size, size);
        }
        return starCanvas;
    }
    
    const starCanvas = document.createElement("canvas");
    starCanvas.width = width;
    starCanvas.height = height;
    const starCtx = starCanvas.getContext("2d");

    prerenderBackground(stars, starCtx);

    const update = (time) => {
        lineOffset = (lineOffset + time * dashSpeed) % totalDashLength;
    }

    const renderBackground = (ctx, camera) => {
        const backgroundX = camera.position.x * paralaxFactor;
        const backgroundY = camera.position.y * paralaxFactor;

        // prerenderBackground(stars, ctx);
        ctx.drawImage(
            starCanvas,
            backgroundX, backgroundY,
            camera.screenSize.x, camera.screenSize.y,
            0, 0,
            camera.screenSize.x, camera.screenSize.y,
        );

        camera.withFocus(ctx, () => {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = lineWidth;
            ctx.setLineDash(dashes);
            ctx.lineDashOffset = -lineOffset;
            ctx.beginPath();

            for (const { x, y } of spline) {
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();

        })        
    };

    const renderForeground = (ctx, camera, colorScheme) => {
        camera.withFocus(ctx, () => {
            ctx.fillStyle = checkpointDotColor;
            for (const [i, checkpoint] of checkpoints.entries()) {
                const radius = i === 0 ? finishCheckpointDotRadius : checkpointDotRadius;
                ctx.beginPath();
                ctx.arc(checkpoint.position.x, checkpoint.position.y, radius, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
            }
        });
    };

    return Object.freeze({
        update,
        renderBackground,
        renderForeground,
        get dimension() { return point(width, height) },
        get startPosition() { return checkpoints[0].position },
        get startDirection() { return startDirection },
        get checkpoints() { return checkpoints },
    })
}