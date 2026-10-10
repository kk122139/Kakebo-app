import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BudgetDto, ExpenseDto, RegisterDto } from "./dto";
import { FinanceController } from "./finance.controller";
test("rechaza importes fraccionarios y campos adicionales", async () => {
  const d = plainToInstance(BudgetDto, {
    month: "2026-10",
    income: 10.5,
    fixed: 0,
    saving: 0,
    userId: "otro",
  });
  const errors = await validate(d, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  assert(errors.some((x) => x.property === "income"));
  assert(errors.some((x) => x.property === "userId"));
});
test("rechaza categoría desconocida", async () => {
  const errors = await validate(
    plainToInstance(ExpenseDto, {
      amount: 100,
      date: "2026-10-06",
      description: "Compra",
      category: "Otro",
    }),
  );
  assert(errors.some((x) => x.property === "category"));
});
test("contraseña unicode no excede límite real de bcrypt", async () => {
  const errors = await validate(
    plainToInstance(RegisterDto, {
      name: "Ana",
      email: "ana@example.com",
      password: "🌿".repeat(20),
    }),
  );
  assert(errors.some((x) => x.property === "password"));
});
test("Nest conserva metadatos DTO para validación en runtime", () => {
  const params = Reflect.getMetadata(
    "design:paramtypes",
    FinanceController.prototype,
    "budget",
  );
  assert.equal(params[1], BudgetDto);
});
