import assert from "node:assert/strict";
import { test } from "node:test";
import { placeLabels } from "../src/lib/labels.ts";

const bounds = { x: 0, y: 0, w: 1000, h: 600 };
const opts = { offset: 20, gap: 8, marker: 14 };
const overlap = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test("a lone label goes above its point", () => {
  const [box] = placeLabels([[500, 300]], [{ w: 100, h: 40 }], bounds, opts);
  assert.deepEqual(box, { x: 450, y: 240, w: 100, h: 40, leader: false });
});

test("labels of nearby points never overlap", () => {
  const pts = [
    [500, 300],
    [512, 306],
    [520, 296],
  ];
  const boxes = placeLabels(
    pts,
    pts.map(() => ({ w: 160, h: 40 })),
    bounds,
    opts,
  );
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      assert.ok(!overlap(boxes[i], boxes[j]), `labels ${i} and ${j} overlap`);
});

test("crowded labels move to a further tier and get a leader line", () => {
  const pts = [
    [500, 300],
    [512, 306],
    [520, 296],
  ];
  const boxes = placeLabels(
    pts,
    pts.map(() => ({ w: 160, h: 40 })),
    bounds,
    opts,
  );
  assert.equal(boxes[0].leader, false);
  assert.ok(boxes.some((b) => b.leader));
});

test("labels stay inside the bounds", () => {
  const boxes = placeLabels(
    [
      [5, 5],
      [995, 595],
    ],
    [
      { w: 120, h: 40 },
      { w: 120, h: 40 },
    ],
    bounds,
    opts,
  );
  for (const b of boxes) {
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1000 && b.y + b.h <= 600);
  }
});

test("placement is deterministic", () => {
  const pts = [
    [100, 100],
    [110, 110],
  ];
  const s = [
    { w: 90, h: 40 },
    { w: 90, h: 40 },
  ];
  assert.deepEqual(
    placeLabels(pts, s, bounds, opts),
    placeLabels(pts, s, bounds, opts),
  );
});
