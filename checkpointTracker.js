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

    const renderCheckpoint = (checkpoint, radiusFactor, ctx, scale) => {
        ctx.fillStyle = "rgba(100, 255, 100, 0.5)";
        const radius = checkpoint.radius * scale * Math.sin(radiusFactor * (0.5 * Math.PI));
        const partAngle = 2 * Math.PI / circleParts / 2;
        const center = checkpoint.position.mul(scale);
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

    const render = (ctx, scale, camera) => {
        camera.withFocus(ctx, scale, () => {
            const radiusFactor = 1 - timer / animationTime;
            const currentCheckpoint = getCurrentCheckpoint();
            renderCheckpoint(currentCheckpoint, radiusFactor, ctx, scale);
            if (timer > 0) {
                const previousCheckpoint = getPreviousCheckpoint()
                renderCheckpoint(previousCheckpoint, 1 - radiusFactor, ctx, scale);
            }
        });        
    }

    const getCurrentCheckpoint = () => checkpoints[index];
    const getPreviousCheckpoint = () => checkpoints[(index + checkpoints.length - 1) % checkpoints.length];

    return Object.freeze({
        advance,
        update,
        render,
        get currentCheckpoint() {
            return getCurrentCheckpoint();
        }
    })
}