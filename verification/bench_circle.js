
function isInsideCircleBaseline(x, y, cx, cy, radiusSq) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy < radiusSq;
}

function isInsideRectThenCircle(x, y, cx, cy, radius, radiusSq) {
    const dx = x - cx;
    if (Math.abs(dx) > radius) return false;
    const dy = y - cy;
    if (Math.abs(dy) > radius) return false;
    return dx * dx + dy * dy < radiusSq;
}

const cx = 500, cy = 500, radius = 200, radiusSq = 200*200;
let points = [];
for (let i = 0; i < 10000; i++) {
    points.push({x: Math.random() * 1000, y: Math.random() * 1000});
}

let m1 = 0;
console.time('Baseline');
for (let i = 0; i < 1000; i++) {
    for (let j = 0; j < 10000; j++) {
        if (isInsideCircleBaseline(points[j].x, points[j].y, cx, cy, radiusSq)) m1++;
    }
}
console.timeEnd('Baseline');

let m2 = 0;
console.time('Opt');
for (let i = 0; i < 1000; i++) {
    for (let j = 0; j < 10000; j++) {
        if (isInsideRectThenCircle(points[j].x, points[j].y, cx, cy, radius, radiusSq)) m2++;
    }
}
console.timeEnd('Opt');

console.log(m1, m2);
