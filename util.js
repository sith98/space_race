export const mod = (a, b) => {
    return a < 0 ? (b + a) % b : a % b;
}

export const clamp = (value, min, max) => {
    return Math.max(min, Math.min(value, max));
}