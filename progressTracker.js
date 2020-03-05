const animationTime = 0.4;
const rotateSpeed = 0.3;
const circleParts = 8;

const arrowSize = 12;

export const makeProgressTracker = (checkpoints) => {
    let index = 1;
    let timer = 0;
    let rotateOffset = 0;

    const advance = () => {
        index = (index + 1) % checkpoints.length;
        timer = animationTime;
    }

    const update = (time) => {
        timer = Math.max(timer - time, 0);
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
        ctx.fillStyle = "rgba(100, 255, 100, 0.5)";
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
    }

    const renderCheckpoints = (ctx, camera) => {
        camera.withFocus(ctx, () => {
            const radiusFactor = 1 - timer / animationTime;
            const currentCheckpoint = getCurrentCheckpoint();
            renderCheckpoint(currentCheckpoint, radiusFactor, ctx);
            if (timer > 0) {
                const previousCheckpoint = getPreviousCheckpoint()
                renderCheckpoint(previousCheckpoint, 1 - radiusFactor, ctx);
            }
        });
    };

    const renderOverlay = (ctx, camera) => {
        // render checkpoint arrow
        if (timer === 0 && !isCurrentCheckpointOnScreen(camera)) {
            const checkpointPosition = getCurrentCheckpoint().position
            const directionVector = checkpointPosition.sub(camera.position.add(camera.screenSize.mul(0.5)));
            const direction = directionVector.angle();

            const arrowDistance = 0.1
            const topLeft = camera.screenSize.mul(arrowDistance);
            const bottomRight = camera.screenSize.mul(1 - arrowDistance);

            const arrowPosition = checkpointPosition.sub(camera.position)
                .clampInRect(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y);
            
            ctx.save();

            ctx.translate(arrowPosition.x, arrowPosition.y);
            ctx.rotate(direction);

            ctx.fillStyle = "lightgreen";
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
        get currentCheckpoint() {
            return getCurrentCheckpoint();
        },
    })
}