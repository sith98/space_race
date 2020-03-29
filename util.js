export const mod = (a, b) => {
    return a < 0 ? (b + a) % b : a % b;
}

export const clamp = (value, min, max) => {
    return Math.max(min, Math.min(value, max));
}

const ordinalRules = new Intl.PluralRules("en-US", { type: "ordinal" });
const suffixes = {
    "one": "st",
    "two": "nd",
    "few": "rd",
    "other": "th",
}

export const displayOrdinalNumber = number => {
    return number.toString() + suffixes[ordinalRules.select(number)];
}

export const displayTime = ms => {
    const as2Digits = n => n >= 10 ? n.toString() : "0" + n.toString();

    const hundredths = Math.floor(ms % 1000 / 10);
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${as2Digits(minutes)}:${as2Digits(seconds)}.${as2Digits(hundredths)}`;
}