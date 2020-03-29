import { point } from "./Point.js";
import { fontName } from "./constants.js";
import { displayTime, displayOrdinalNumber } from "./util.js";
import { playerColors } from "./colors.js";

const animationTime = 0.4;
const rotateSpeed = 0.3;
const circleParts = 8;

const arrowSize = 12;

const overlaySize = 80;

const State = Object.freeze({
    NOT_STARTED: 0,
    ONGOING: 1,
    FINISHED: 2,
})


const listComparison = (a, b, keys) => {
    for (const key of keys) {
        const value = key(a) - key(b);
        if (value !== 0) {
            return value;
        }
    }
    return 0;
}

const compareProgresses = (a, b) => listComparison(
    a, b,
    [it => it.lap, it => it.checkpoint, it => -it.distance]
)

export const progressRanking = (progresses) => {
    const copy = progresses.slice(0);
    copy.sort(compareProgresses);
    copy.reverse();
    return progresses.map(progress => copy.indexOf(progress) + 1);
}

export const makeProgressTracker = ({
    parsedMapDefinition,
    announcementMsgDisplay,
    onFinished,
    colorScheme = playerColors.singlePlayer,
    multiplayer = false,
    secondPlayer = false
} = {}) => {
    const { path: { checkpoints }, laps } = parsedMapDefinition;
    let index = 1;
    let animationTimer = 0;
    let rotateOffset = 0;
    let currentLap = 1;

    let state = State.NOT_STARTED;

    let elapsedTime = 0;
    let rank = 1;

    const advance = () => {
        if (state === State.FINISHED) {
            return;
        }
        if (index === 0) {
            currentLap += 1;
        }
        if (currentLap > laps) {
            state = State.FINISHED;
            onFinished(elapsedTime, colorScheme.name);
        }
        index = (index + 1) % checkpoints.length;
        animationTimer = animationTime;
        if (laps > 1 && currentLap === laps && index === 1) {
            announcementMsgDisplay.addMsg("FINAL LAP", {
                idle: 2,
            })
        }
    }

    const startTimer = () => {
        state = State.ONGOING;
    }

    const update = (ms) => {
        if (state === State.ONGOING) {
            elapsedTime += ms;
        }
        const time = ms / 1000;
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

    const renderCheckpoint = (checkpoint, radiusFactor, ctx) => {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = colorScheme.checkpointMarker;
        const radius = checkpoint.radius * Math.sin(radiusFactor * (0.5 * Math.PI));
        const partAngle = 2 * Math.PI / circleParts / 2;
        const center = checkpoint.position;
        const offset = (rotateOffset + (secondPlayer ? 0.5 : 0)) * partAngle * 2;
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

    const renderCheckpoints = (ctx, camera) => {
        camera.withFocus(ctx, () => {
            const radiusFactor = 1 - animationTimer / animationTime;
            const currentCheckpoint = getCurrentCheckpoint();
            if (state !== State.FINISHED) {
                renderCheckpoint(currentCheckpoint, radiusFactor, ctx, colorScheme);
            }
            if (animationTimer > 0) {
                const previousCheckpoint = getPreviousCheckpoint()
                renderCheckpoint(previousCheckpoint, 1 - radiusFactor, ctx, colorScheme);
            }
        });
    };

    const renderOverlay = (ctx, camera) => {
        ctx.font = fontName(overlaySize * 0.6);
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";

        ctx.fillStyle = colorScheme.text;
        if (state !== State.FINISHED) {
            ctx.fillText(
                `Lap ${currentLap}/${laps}`,
                overlaySize / 3,
                camera.screenSize.y - overlaySize / 3,
            );
        }
        
        ctx.textAlign = "right";
        ctx.font = fontName(overlaySize * 0.6);
        ctx.fillText(
            displayTime(elapsedTime),
            camera.screenSize.x - overlaySize / 3,
            camera.screenSize.y - overlaySize / 3,
        );

        if (multiplayer) {
            ctx.textBaseline = "top";
            ctx.font = fontName(overlaySize * 1);
            ctx.fillText(
                displayOrdinalNumber(rank),
                camera.screenSize.x - overlaySize / 3,
                overlaySize / 3,
            );
        }

        // render checkpoint arrow
        if (state !== State.FINISHED && animationTimer === 0 && !isCurrentCheckpointOnScreen(camera)) {
            const checkpointPosition = getCurrentCheckpoint().position.mul(camera.zoomFactor);
            const cameraPosition = camera.position.mul(camera.zoomFactor);
            const directionVector = checkpointPosition.sub(cameraPosition.add(camera.screenSize.mul(0.5)));
            const direction = directionVector.angle();

            const topLeft = point(overlaySize, overlaySize);
            const bottomRight = camera.screenSize.sub(topLeft);

            const arrowPosition = checkpointPosition.sub(cameraPosition)
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
        getProgress(shipPosition) {
            return {
                lap: currentLap,
                checkpoint: index === 0 ? checkpoints.length : index,
                distance: getCurrentCheckpoint().position.sub(shipPosition).abs()
            }
        },
        get rank() { return rank; },
        set rank(newValue) { rank = newValue; },
    })
}