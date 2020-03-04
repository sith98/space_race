const animationTime = 0.4;
const rotateSpeed = 0.3;
const circleParts = 8;

export const makeCheckpointTracker = (checkpoints) => {
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

    const render = (ctx, camera) => {
        camera.withFocus(ctx, () => {
            const radiusFactor = 1 - timer / animationTime;
            const currentCheckpoint = getCurrentCheckpoint();
            renderCheckpoint(currentCheckpoint, radiusFactor, ctx);
            if (timer > 0) {
                const previousCheckpoint = getPreviousCheckpoint()
                renderCheckpoint(previousCheckpoint, 1 - radiusFactor, ctx);
            }
        });        
    }

    const getCurrentCheckpoint = () => checkpoints[index];
    const getPreviousCheckpoint = () => checkpoints[(index + checkpoints.length - 1) % checkpoints.length];

    return Object.freeze({
        advance,
        update,
        render,
        isCurrentCheckpointOnScreen,
        get currentCheckpoint() {
            return getCurrentCheckpoint();
        },
        get animationRunning() {
            return timer > 0;
        }
    })
}