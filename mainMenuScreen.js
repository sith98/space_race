import { fontName } from "./constants.js"
import exampleMaps from "./exampleMaps.js";
import { makeGameScreen } from "./gameScreen.js";

const mapTextHeight = 50;

export const makeMainMenuScreen = ({ initScreen, getDimension }) => {
    const dimension = getDimension();
    let startY = dimension.y * 0.3

    const buttons = Object.keys(exampleMaps).map((name, index) => ({
        name,
        map: name,
        y: startY + index * mapTextHeight,
    }));

    const update = (_, click) => {
        if (click !== undefined) {
            const { y: canvasY } = click;
            for (const { map, y } of buttons) {
                if (canvasY > y && canvasY < y + mapTextHeight) {
                    initScreen(makeGameScreen(map));
                    return;
                }
            }
        }
    }

    const render = (ctx, scale) => {
        ctx.save();

        ctx.scale(scale, scale);
        ctx.font = fontName(50);
        ctx.textAlign = "center";
        ctx.textBaseLine = "bottom";
        ctx.fillStyle = "white";
        
        ctx.fillText("Select Map", dimension.x * 0.5, dimension.y * 0.25);

        ctx.font = fontName(mapTextHeight * 0.7);
        ctx.textBaseLine = "center";
        for (const {name, y} of buttons) {
            ctx.fillText(name, dimension.x * 0.5, y + 0.5 * mapTextHeight)
        }


        ctx.restore();
    }

    return Object.freeze({
        update,
        render,
    });
}