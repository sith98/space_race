import { point } from "./Point.js";

export const makeClickEventManager = (canvas, getDimension) => {
    let click = undefined;
    const onClick = (evt) => {
        const dimension = getDimension();
        const x = evt.offsetX / canvas.width * dimension.x;
        const y = evt.offsetY / canvas.height * dimension.y;
        click = point(x, y);
    };
    const fetchClick = () => {
        const latestClick = click;
        click = undefined;
        return latestClick;
    };

    canvas.addEventListener("click", onClick);

    return Object.freeze({
        fetchClick,
    })
}