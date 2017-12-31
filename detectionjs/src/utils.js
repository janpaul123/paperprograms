export function norm(vector) {
  if (vector.x !== undefined) return norm([vector.x, vector.y]);
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

export function add(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x + v2.x, y: v1.y + v2.y };
  return v1.map((value, index) => value + v2[index]);
}

export function diff(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x - v2.x, y: v1.y - v2.y };
  return v1.map((value, index) => value - v2[index]);
}

export function mult(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x * v2.x, y: v1.y * v2.y };
  return v1.map((value, index) => value * v2[index]);
}

export function div(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x / v2.x, y: v1.y / v2.y };
  return v1.map((value, index) => value / v2[index]);
}

export function cross(v1, v2) {
  if (v1.x === undefined || v2.x === undefined) throw new Error('Must be points');
  return v1.x * v2.y - v1.y * v2.x;
}

export function clip(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
