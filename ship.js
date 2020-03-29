import Point, { point } from "./Point.js"
import { LEFT, RIGHT, UP, DOWN } from "./keyEventManager.js";
import { DESIRED_FRAME_LENGTH } from "./constants.js";
import { makeProgressTracker } from "./progressTracker.js";
import { State as GameState, DEBUG } from "./gameScreen.js";
import { mod } from "./util.js";
import { playerColors } from "./colors.js";

const acceleration = 0.1;
const friction = 0.01;
const brakeFriction = 0.05;

const angularAcceleration = 0.005;
const angularFriction = 0.04;

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

export const makeShip = ({ startPosition = point(0, 0), startRotation = 0 } = {}) => {
    let position = startPosition;
    let rotation = startRotation;
    let angularSpeed = 0;
    let speed = point(0, 0);
    let state = State.ALIVE;
    let timer = 0;
    let plume = false;

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
        );
        // turn around
        rotation = newPosition.sub(position).angle();
        // move
        position = newPosition;
        // stop
        speed = point(0, 0);
        angularSpeed = 0;
    }

    const stopBlinking = () => {
        state = State.ALIVE;
        timer = 0;
    }

    const update = ({ time, keyEventManager, map, progressTracker, gameState }) => {
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
        if (gameState !== GameState.FINISHED) {
            if (keyEventManager.isPressed(LEFT)) {
                angularSpeed -= angularAcceleration;
            } else if (keyEventManager.isPressed(RIGHT)) {
                angularSpeed += angularAcceleration;
            }
        }
        rotation = (rotation + angularSpeed) % (2 * Math.PI);
        angularSpeed *= 1 - angularFriction;

        const drive = keyEventManager.isPressed(UP);
        if (drive && gameState === GameState.GAME) {
            speed = speed.add(point(Math.cos(rotation), Math.sin(rotation)).mul(acceleration * timeFactor));
        }
        position = position.add(speed);
        const currentFriction = gameState !== GameState.FINISHED && keyEventManager.isPressed(DOWN) ? brakeFriction : friction
        speed = speed.mul(1 - currentFriction * timeFactor);

        // environment interactions

        if (gameState === GameState.GAME) {
            const { x: width, y: height } = map.dimension;

            if (position.x < -deadBorder || position.x > width + deadBorder || position.y < -deadBorder || position.y > height + deadBorder) {
                die();
            }

            const currentCheckpoint = progressTracker.currentCheckpoint;
            if (currentCheckpoint.position.sub(position).abs() <= currentCheckpoint.radius + checkpointBorder) {
                progressTracker.advance();
            }
        }

        // cosmetics

        if (gameState === GameState.FINISHED) {
            plume = false;
        } else {
            plume = drive;
        }
    };

    const render = (ctx, camera, colorScheme) => {

        if (state === State.DEAD || state === State.BLINKING && Math.floor(timer / blinkRate) % 2 === 0) {
            return;
        }

        camera.withFocus(ctx, () => {
            ctx.save();

            ctx.translate(position.x, position.y);
            ctx.rotate(rotation);
    
            ctx.fillStyle = colorScheme.ship;
            ctx.beginPath();
            ctx.moveTo(shipSize, 0);
            ctx.lineTo(-shipSize, shipSize * 0.7);
            ctx.lineTo(-shipSize * 0.5, 0);
            ctx.lineTo(-shipSize, -shipSize * 0.7);
            ctx.closePath();
            ctx.fill();
    
            if (plume) {
                ctx.fillStyle = colorScheme.plume;
                const width = shipSize * (0.5 + (Math.random() - 0.5) * 0.3);
                const length = shipSize * (2 + (Math.random() - 0.5) * 0.6);
                ctx.beginPath();
                ctx.moveTo(-shipSize * 0.7, 0);
                ctx.lineTo(-length * 0.5, width * 0.5);
                ctx.lineTo(-length, width);
                ctx.lineTo(-length * 0.8, width * 0.3);
                ctx.lineTo(-length * 1.3, 0);
                ctx.lineTo(-length * 0.8, -width * 0.3);
                ctx.lineTo(-length, -width);
                ctx.lineTo(-length * 0.5, -width * 0.5);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();

            if (globalThis.debug && false) {
                ctx.save();
                ctx.translate(position.x, position.y);
                ctx.rotate(desiredRotation);
                
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
    
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
