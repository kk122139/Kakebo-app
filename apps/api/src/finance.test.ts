import { test } from "node:test";
import assert from "node:assert/strict";
import { balance, projection } from "./finance";
test("presupuesto descuenta costos, ahorro y gastos", () => {
  assert.equal(
    balance(420000, 100000, 50000, 35000, "2026-10", new Date("2026-10-06"))
      .available,
    235000,
  );
});
test("febrero bisiesto y cuota diaria entera", () => {
  const x = balance(29000, 0, 0, 0, "2028-02", new Date("2028-02-01"));
  assert.equal(x.daysRemaining, 29);
  assert.equal(x.daily, 1000);
});
test("sobregasto no crea cuota negativa", () =>
  assert.equal(
    balance(100, 0, 0, 200, "2026-10", new Date("2026-10-06")).daily,
    0,
  ));
test("mes pasado no divide por cero", () =>
  assert.equal(balance(100, 0, 0, 0, "2020-01").daily, 0));
test("simulación calcula retraso y meta completada", () => {
  assert.deepEqual(projection(100000, 20000, 20000, 30000), {
    months: 4,
    monthsWithExtra: 6,
    delayMonths: 2,
  });
  assert.equal(projection(100, 100, 10).months, 0);
});
