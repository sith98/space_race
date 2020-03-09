const bestTimeKey = "BEST_TIMES"

const loadOr = (key, lazyDefault) => {
    const lsValue = localStorage.getItem(key);
    return lsValue === null ?
        (typeof lazyDefault === "function" ? lazyDefault() : lazyDefault) :
        JSON.parse(lsValue);
}

export const makeSaveGame = () => {
    const bestTimes = loadOr(bestTimeKey, {});

    const saveBestTimes = () => {
        localStorage.setItem(bestTimeKey, JSON.stringify(bestTimes));
    }

    const getBestTime = mapName => bestTimes[mapName];

    const setBestTime = (mapName, newBestTime) => {
        bestTimes[mapName] = newBestTime;
        saveBestTimes();
    }

    return Object.freeze({
        getBestTime, setBestTime
    });
}