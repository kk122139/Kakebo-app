import { test } from "node:test";
import assert from "node:assert/strict";
import { weeklyAnalysis, weeklyBounds } from "./weekly";
test("análisis semanal cruza mes y año e incluye lunes y domingo", () => {
  const rows = [
    { date: "2026-12-28", amount: 100, category: "Ocio", necessary: false },
    { date: "2027-01-03", amount: 300, category: "Cultura", necessary: true },
    { date: "2026-12-21", amount: 200, category: "Ocio", necessary: null },
    { date: "2026-12-27", amount: 600, category: "Extras", necessary: null },
    { date: "2027-01-04", amount: 999, category: "Extras", necessary: false },
  ];
  const a = weeklyAnalysis("2026-12-28", rows);
  assert.equal(a.total, 400);
  assert.equal(a.previousTotal, 800);
  assert.equal(a.changePercent, -50);
  assert.equal(a.count, 2);
  assert.equal(a.impulsiveCount, 1);
  assert.equal(a.classifiedCount, 2);
  assert.equal(a.categories[0].category, "Cultura");
  assert.equal(a.categories[0].percent, 75);
});
test("sin gastos previos no inventa un porcentaje de variación", () => {
  const a = weeklyAnalysis("2026-11-16", [
    { date: "2026-11-17", amount: 50, category: "Ocio", necessary: null },
  ]);
  assert.equal(a.changePercent, null);
  assert.equal(a.classifiedCount, 0);
  assert.equal(a.impulsiveCount, 0);
  assert.equal(
    weeklyAnalysis("2026-11-16", []).categories.every((c) => c.percent === 0),
    true,
  );
});
test("rechaza fechas imposibles y semanas que no empiezan en lunes", () => {
  for (const date of ["2026-02-30", "2026-11-17", "mal", "2026-13-01"])
    assert.throws(() => weeklyBounds(date));
});
