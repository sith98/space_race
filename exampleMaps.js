export default {
    figureEight: {
        width: 1500,
        height: 1500,
        padding: 50,
        laps: 7,
        path: {
            splineTension: 0.7,
            defaultRadius: 150,
            checkpoints: [
                { interpolated: 0.5 },
                { x: 1200, y: 750 },
                { x: 1200, y: 1200 },
                { x: 750, y: 1200 },
                { interpolated: 0.5 },
                { x: 750, y: 300 },
                { x: 300, y: 300 },
                { x: 300, y: 750 },
            ]
        }
    },
    l: {
        width: 1000,
        height: 1000,
        padding: 400,
        laps: 6,
        path: {
            defaultRadius: 100,
            checkpoints: [
                { x: 300, y: 0 },
                { x: 300, y: 700 },
                { x: 1000, y: 700 },
                { x: 1000, y: 1000 },
                { x: 0, y: 1000 },
                { x: 0, y: 0 },
            ]
        }
    },
    u: {
        width: 1000,
        height: 1000,
        padding: 400,
        path: {
            defaultRadius: 100,
            checkpoints: [
                { x: 300, y: 0 },
                { x: 300, y: 700 },
                { x: 700, y: 700 },
                { x: 700, y: 0 },
                { x: 1000, y: 0 },
                { x: 1000, y: 1000 },
                { x: 0, y: 1000 },
                { x: 0, y: 0 },
            ]
        }
    },
    x: {
        width: 1000,
        height: 1000,
        padding: 400,
        laps: 3,
        path: {
            defaultRadius: 75,
            checkpoints: [
                { x: 500, y: 500 },
                { x: 1000, y: 1000 },
                { x: 500, y: 500 },
                { x: 0, y: 1000 },
                { x: 1000, y: 0 },
                { x: 500, y: 500 },
                { x: 0, y: 0 },
            ]
        }
    },
    quick: {
        width: 0,
        height: 500,
        padding: 1000,
        laps: 2,
        path: {
            defaultRadius: 100,
            checkpoints: [
                { x: 0, y: 0 },
                { x: 0, y: 500 },
            ]
        }
    },
    small: {
        width: 0,
        height: 1000,
        padding: 300,
        laps: 2,
        path: {
            defaultRadius: 100,
            checkpoints: [
                { x: 0, y: 0 },
                { x: 0, y: 1000 },
            ]
        }
    },
}