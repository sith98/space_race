import { point } from "./Point.js";
import { fontName } from "./constants.js";

const animationTime = 0.4;
const rotateSpeed = 0.3;
const circleParts = 8;

const arrowSize = 12;

const overlaySize = 80;

const displayTime = ms => {
    const as2Digits = n => n >= 10 ? n.toString() : "0" + n.toString();

    const hundredths = Math.floor(ms % 1000 / 10);
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${as2Digits(minutes)}:${as2Digits(seconds)}.${as2Digits(hundredths)}`;
}

export const makeProgressTracker = (parsedMapDefinition) => {
    const { path: { checkpoints }, laps } = parsedMapDefinition;
    let index = 1;
    let animationTimer = 0;
    let rotateOffset = 0;
    let currentLap = 1;

    let raceFinished = false;
    let finishedTime = 0;

    let startingTime = undefined;

    const advance = () => {
        if (raceFinished) {
            return;
        }
        if (index === 0) {
            currentLap += 1;
        }
        if (currentLap > laps) {
            raceFinished = true;
            finishedTime = Date.now();
        }
        index = (index + 1) % checkpoints.length;
        animationTimer = animationTime;
    }

    const startTimer = () => {
        startingTime = Date.now();
    }

    const update = (time) => {
        animationTimer = Math.max(animationTimer - time, 0);
        rotateOffset = (rotateOffset + time * rotateSpeed) % 1;
    }

    const isCurrentCheckpointOnScreen = camera => {
        const { position: {x, y}, radius } = getCurrentCheckpoint();
        const { position, screenSize } = camera;
        return (
            x + radius > position.x &&
            x - radius < position.x + screenSize.x &&
            y + radius > position.y &&
            y - radius < position.y + screenSize.y
        );
    }

    const renderCheckpoint = (checkpoint, radiusFactor, ctx, colorScheme) => {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = colorScheme.checkpointMarker;
        const radius = checkpoint.radius * Math.sin(radiusFactor * (0.5 * Math.PI));
        const partAngle = 2 * Math.PI / circleParts / 2;
        const center = checkpoint.position;
        const offset = rotateOffset * partAngle * 2;
        for (let i = 0; i < circleParts; i++) {
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.arc(
                center.x, center.y, radius,
                partAngle * 2 * i + offset, partAngle * (2 * i + 1) + offset
            );
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    const renderCheckpoints = (ctx, camera, colorScheme) => {
        camera.withFocus(ctx, () => {
            const radiusFactor = 1 - animationTimer / animationTime;
            const currentCheckpoint = getCurrentCheckpoint();
            if (!raceFinished) {
                renderCheckpoint(currentCheckpoint, radiusFactor, ctx, colorScheme);
            }
            if (animationTimer > 0) {
                const previousCheckpoint = getPreviousCheckpoint()
                renderCheckpoint(previousCheckpoint, 1 - radiusFactor, ctx, colorScheme);
            }
        });
    };

    const renderOverlay = (ctx, camera, colorScheme) => {
        ctx.font = fontName(overlaySize / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";

        ctx.fillStyle = colorScheme.text;
        if (!raceFinished) {
            ctx.fillText(
                `Lap ${currentLap}/${laps}`,
                overlaySize / 3,
                camera.screenSize.y - overlaySize / 3,
            );
        }
        
        const elapsedTime = 
            startingTime === undefined ? 0 :
            (raceFinished ? finishedTime : Date.now()) - startingTime;
        
        ctx.textAlign = "right";
        ctx.fillText(
            displayTime(elapsedTime),
            camera.screenSize.x - overlaySize / 3,
            camera.screenSize.y - overlaySize / 3,
        );

        // render checkpoint arrow
        if (!raceFinished && animationTimer === 0 && !isCurrentCheckpointOnScreen(camera)) {
            const checkpointPosition = getCurrentCheckpoint().position
            const directionVector = checkpointPosition.sub(camera.position.add(camera.screenSize.mul(0.5)));
            const direction = directionVector.angle();

            const topLeft = point(overlaySize, overlaySize);
            const bottomRight = camera.screenSize.sub(topLeft);

            const arrowPosition = checkpointPosition.sub(camera.position)
                .clampInRect(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y);
            
            ctx.save();

            ctx.translate(arrowPosition.x, arrowPosition.y);
            ctx.rotate(direction);

            ctx.fillStyle = colorScheme.checkpointArrow;
            ctx.beginPath();
            ctx.moveTo(0, arrowSize);
            ctx.lineTo(arrowSize * 0.5, arrowSize);
            ctx.lineTo(arrowSize * 1, 0);
            ctx.lineTo(arrowSize * 0.5, -arrowSize);
            ctx.lineTo(0, -arrowSize);
            ctx.lineTo(arrowSize * 0.5, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }  
    }

    const getCurrentCheckpoint = () => checkpoints[index];
    const getPreviousCheckpoint = () => checkpoints[(index + checkpoints.length - 1) % checkpoints.length];

    return Object.freeze({
        advance,
        update,
        renderCheckpoints,
        renderOverlay,
        isCurrentCheckpointOnScreen,
        startTimer,
        get currentCheckpoint() {
            return getCurrentCheckpoint();
        },
    })
}