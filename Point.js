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
}

export const point = (x, y) => new Point(x, y);