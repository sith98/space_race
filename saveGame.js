const bestTimeKey = "BEST_TIMES";
const multiplayerKey = "MULTIPLAYER";

const load = (key, lazyDefault) => {
    const lsValue = localStorage.getItem(key);
    let value = lsValue === null ?
        (typeof lazyDefault === "function" ? lazyDefault() : lazyDefault) :
        JSON.parse(lsValue);
    const get = () => value;
    const set = newValue => {
        value = newValue;
        localStorage.setItem(key, JSON.stringify(value));
    }
    return [get, set]
}

export const makeSaveGame = () => {
    const [getBestTimes, setBestTimes] = load(bestTimeKey, {});
    const [getMultiplayer, setMultiplayer] = load(multiplayerKey, false)

    const getBestTime = mapName => getBestTimes()[mapName];

    const setBestTime = (mapName, newBestTime) => {
        setBestTimes({
            ...getBestTimes(),
            [mapName]: newBestTime,
        })
    }

    return Object.freeze({
        getBestTime, setBestTime, getMultiplayer, setMultiplayer,
    });
}