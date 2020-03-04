export const mod = (a, b) => {
    return a < 0 ? (b + a) % b : a % b;
}