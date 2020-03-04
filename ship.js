import { point } from "./Point.js"
import * as keyEventManager from "./keyEventManager.js";
import { DESIRED_FRAME_LENGTH } from "./constants.js";
import { makeCheckpointTracker } from "./checkpointTracker.js";
import { State as GameState, DEBUG } from "./gameScreen.js";
import { mod } from "./util.js";

const acceleration = 0.1;
const rotationSpeed = 0.02;
const friction = 0.01;
const brakeFriction = 0.05;
const angularInertia = 0.7;

const deadTime = 1;
const blinkTime = 1;
const blinkRate = 0.1;

const shipSize = 12;

const deadBorder = shipSize;
const recoverBorder = 60;
const checkpointBorder = shipSize;

const State = Object.freeze({
    ALIVE: 0,
    DEAD: 1,
    BLINKING: 2,
});

export const makeShip = ({ startPosition = point(0, 0), startRotation = 0, color = "#f3e2dc", checkpoints} = {}) => {
    let position = startPosition;
    let rotation = startRotation;
    let desiredRotation = startRotation;
    let speed = point(0, 0);
    let state = State.ALIVE;
    let timer = 0;
    let plume = false;

    const checkpointTracker = makeCheckpointTracker(checkpoints);

    const die = () => {
        state = State.DEAD;
        timer = deadTime;
    }

    const recover = (mapDimension) => {
        state = State.BLINKING;
        timer = blinkTime;
        const newPosition = point(
            Math.min(mapDimension.x - recoverBorder, Math.max(recoverBorder, position.x)),
            Math.min(mapDimension.y - recoverBorder, Math.max(recoverBorder, position.y)),
        );;
        // turn around
        rotation = desiredRotation = newPosition.sub(position).angle();
        // move
        position = newPosition;
        // stop
        speed = point(0, 0);
    }

    const stopBlinking = () => {
        state = State.ALIVE;
        timer = 0;
    }

    const update = (time, kem, map, gameState) => {
        checkpointTracker.update(time);

        // state management

        if (timer > 0) {
            timer -= time;
            if (timer <= 0) {
                if (state === State.DEAD) {
                    recover(map.dimension);
                } else if (state === State.BLINKING) {
                    stopBlinking();
                }
            }
        }

        if (state === State.DEAD) {
            return;
        }

        // controls
        const timeFactor = time / DESIRED_FRAME_LENGTH;

        if (kem.isPressed(keyEventManager.LEFT)) {
            desiredRotation -= Math.PI * rotationSpeed * timeFactor;
        } else if (kem.isPressed(keyEventManager.RIGHT)) {
            desiredRotation += Math.PI * rotationSpeed * timeFactor;
        }
        rotation = mod(rotation, 2 * Math.PI);
        desiredRotation = mod(desiredRotation, 2 * Math.PI);

        const angleDifference = desiredRotation - rotation;
        const normalizedAngleDifference =
            angleDifference > Math.PI ? angleDifference - 2 * Math.PI :
            angleDifference < -Math.PI ? angleDifference + 2 * Math.PI :
            angleDifference;
        rotation += (1 - angularInertia * timeFactor) * normalizedAngleDifference;

        const drive = kem.isPressed(keyEventManager.UP);
        if (drive && gameState === GameState.GAME) {
            speed = speed.add(point(Math.cos(rotation), Math.sin(rotation)).mul(acceleration * timeFactor));
        }
        position = position.add(speed);
        speed = speed.mul(kem.isPressed(keyEventManager.DOWN) ? 1 - brakeFriction * timeFactor : 1 - friction * timeFactor);

        // environment interactions

        const { x: width, y: height } = map.dimension;

        if (position.x < -deadBorder || position.x > width + deadBorder || position.y < -deadBorder || position.y > height + deadBorder) {
            die();
        }

        const currentCheckpoint = checkpointTracker.currentCheckpoint;
        if (currentCheckpoint.position.sub(position).abs() <= currentCheckpoint.radius + checkpointBorder) {
            checkpointTracker.advance();
        }

        // cosmetics

        plume = drive;
    };

    const render = (ctx, scale, camera) => {
        checkpointTracker.render(ctx, scale, camera);

        if (state === State.DEAD || state === State.BLINKING && Math.floor(timer / blinkRate) % 2 === 0) {
            return;
        }

        camera.withFocus(ctx, scale, () => {
            ctx.save();

            ctx.translate(position.x * scale, position.y * scale);
            ctx.rotate(rotation);
    
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(shipSize * scale, 0);
            ctx.lineTo(-shipSize * scale, shipSize * 0.7 * scale);
            ctx.lineTo(-shipSize * 0.5 * scale, 0);
            ctx.lineTo(-shipSize * scale, -shipSize * 0.7 * scale);
            ctx.closePath();
            ctx.fill();
    
            if (plume) {
                ctx.fillStyle = "#efd451";
                const width = shipSize * (0.5 + (Math.random() - 0.5) * 0.3);
                const length = shipSize * (2 + (Math.random() - 0.5) * 0.6);
                ctx.beginPath();
                ctx.moveTo(-shipSize * scale * 0.7, 0);
                ctx.lineTo(-length * scale * 0.5, width * scale * 0.5);
                ctx.lineTo(-length * scale, width * scale);
                ctx.lineTo(-length * scale * 0.8, width * scale * 0.3);
                ctx.lineTo(-length * scale * 1.3, 0);
                ctx.lineTo(-length * scale * 0.8, -width * scale * 0.3);
                ctx.lineTo(-length * scale, -width * scale);
                ctx.lineTo(-length * scale * 0.5, -width * scale * 0.5);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
            if (DEBUG) {
                ctx.save();
                ctx.translate(position.x * scale, position.y * scale);
                ctx.rotate(desiredRotation);
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 2 * scale;
    
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(3 * shipSize, 0);
                ctx.stroke();
        
                ctx.restore();
            }
            
        });
        
    }

    return {
        update, render,
        get position() { return position; }
    }
}