/**
 * Greedy label placement for map markers. Each label tries, in order:
 * above, below, right, left of its point, then further-out tiers above and
 * below (drawn with a leader line). It takes the first spot that stays in
 * bounds and doesn't overlap an earlier label or another marker.
 * Deterministic: same input → same layout.
 */
export type Box = { x: number; y: number; w: number; h: number };
export type Placed = Box & { leader: boolean };

const overlaps = (a: Box, b: Box, gap: number) =>
  a.x < b.x + b.w + gap &&
  b.x < a.x + a.w + gap &&
  a.y < b.y + b.h + gap &&
  b.y < a.y + a.h + gap;

export const placeLabels = (
  points: [number, number][],
  sizes: { w: number; h: number }[],
  bounds: Box,
  { offset, gap, marker }: { offset: number; gap: number; marker: number },
  tiers = 3,
): Placed[] => {
  const placed: Placed[] = [];
  // Markers are obstacles too, so a label never covers another stop.
  const markers: Box[] = points.map(([x, y]) => ({
    x: x - marker,
    y: y - marker,
    w: marker * 2,
    h: marker * 2,
  }));
  const clamp = (c: Box): Box => ({
    ...c,
    x: Math.min(Math.max(c.x, bounds.x), bounds.x + bounds.w - c.w),
    y: Math.min(Math.max(c.y, bounds.y), bounds.y + bounds.h - c.h),
  });

  points.forEach(([px, py], i) => {
    const { w, h } = sizes[i];
    const near: Box[] = [
      { x: px - w / 2, y: py - offset - h, w, h }, // above
      { x: px - w / 2, y: py + offset, w, h }, // below
      { x: px + offset, y: py - h / 2, w, h }, // right
      { x: px - offset - w, y: py - h / 2, w, h }, // left
    ];
    const far: Box[] = [];
    for (let k = 1; k < tiers; k++) {
      const step = k * (h + gap * 2);
      far.push({ x: px - w / 2, y: py - offset - h - step, w, h });
      far.push({ x: px - w / 2, y: py + offset + step, w, h });
    }
    const candidates = [
      ...near.map((b) => ({ ...clamp(b), leader: false })),
      ...far.map((b) => ({ ...clamp(b), leader: true })),
    ];
    const free = (c: Box) =>
      !placed.some((p) => overlaps(c, p, gap)) &&
      !markers.some((m, j) => j !== i && overlaps(c, m, gap / 2));
    placed.push(candidates.find(free) ?? candidates[0]);
  });
  return placed;
};
