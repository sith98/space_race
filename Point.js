import { clamp } from "./util.js";

export default class Point {
    constructor(x, y) {
        this.x = x; 
        this.y = y;
        Object.freeze(this);
    }

    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }

    sub(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }

    mul(scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    }

    abs() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    equals(other) {
        return Math.abs(this.x - other.x) < Number.EPSILON && Math.abs(this.y - other.y) < Number.EPSILON;
    }

    clampInRect(left, top, right, bottom) {
        return point(clamp(this.x, left, right), clamp(this.y, top, bottom));
    }

    static unit(direction) {
        return point(Math.cos(direction), Math.sin(direction));
    }
}

export const point = (x, y) => new Point(x, y);