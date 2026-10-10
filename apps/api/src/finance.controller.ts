import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Req,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import { db, transaction, event } from "./db";
import { AuthGuard } from "./auth";
import { balance, projection } from "./finance";
import {
  BudgetDto,
  ExpenseDto,
  GoalDto,
  ContributionDto,
  SimulationDto,
  ObjectiveDto,
  CloseDto,
} from "./dto";
function monthValid(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || ""))
    throw new BadRequestException("Mes inválido");
}
async function summary(c: any, userId: string, month: string) {
  const { rows } = await c.query(
    "SELECT * FROM budgets WHERE user_id=$1 AND month=$2",
    [userId, month],
  );
  if (!rows[0]) return null;
  const b = rows[0];
  const sums = await c.query(
    "SELECT category,SUM(amount)::text AS total FROM expenses WHERE user_id=$1 AND month=$2 GROUP BY category",
    [userId, month],
  );
  const spent = sums.rows.reduce((a: number, x: any) => a + Number(x.total), 0);
  return {
    ...balance(
      Number(b.income),
      Number(b.fixed),
      Number(b.saving),
      spent,
      month,
    ),
    month,
    closed: b.closed,
    categories: sums.rows.map((x: any) => ({
      category: x.category,
      total: Number(x.total),
    })),
  };
}
@ApiTags("Finanzas")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class FinanceController {
  @Put("profile/objective") async objective(
    @Req() r: any,
    @Body() d: ObjectiveDto,
  ) {
    await db.query("UPDATE users SET objective=$1 WHERE id=$2", [
      d.objective,
      r.userId,
    ]);
    return { ok: true };
  }
  @Get("summary") async getSummary(@Req() r: any, @Query("month") m: string) {
    monthValid(m);
    return summary(db, r.userId, m);
  }
  @Put("budget") async budget(@Req() r: any, @Body() d: BudgetDto) {
    if (d.fixed + d.saving > d.income)
      throw new BadRequestException(
        "Costos fijos y ahorro superan los ingresos",
      );
    return transaction(async (c) => {
      await c.query(
        "INSERT INTO budgets(user_id,month,income,fixed,saving) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,month) DO NOTHING",
        [r.userId, d.month, d.income, d.fixed, d.saving],
      );
      const { rows } = await c.query(
        "SELECT closed FROM budgets WHERE user_id=$1 AND month=$2 FOR UPDATE",
        [r.userId, d.month],
      );
      if (rows[0].closed) throw new ConflictException("Mes cerrado");
      await c.query(
        "UPDATE budgets SET income=$3,fixed=$4,saving=$5 WHERE user_id=$1 AND month=$2",
        [r.userId, d.month, d.income, d.fixed, d.saving],
      );
      await event(c, r.userId, "budget.updated", d);
      return summary(c, r.userId, d.month);
    });
  }
  @Get("expenses") async expenses(@Req() r: any, @Query("month") m: string) {
    monthValid(m);
    return (
      await db.query(
        "SELECT id,amount::text,category,description,to_char(date,'YYYY-MM-DD') AS date FROM expenses WHERE user_id=$1 AND month=$2 ORDER BY date DESC,created_at DESC",
        [r.userId, m],
      )
    ).rows.map((x) => ({ ...x, amount: Number(x.amount) }));
  }
  @Post("expenses") async addExpense(@Req() r: any, @Body() d: ExpenseDto) {
    const date = new Date(d.date + "T00:00:00Z");
    if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== d.date)
      throw new BadRequestException("Fecha inválida");
    return transaction(async (c) => {
      const month = d.date.slice(0, 7);
      const { rows } = await c.query(
        "SELECT closed FROM budgets WHERE user_id=$1 AND month=$2 FOR UPDATE",
        [r.userId, month],
      );
      if (!rows[0])
        throw new BadRequestException(
          "Configura el presupuesto del mes primero",
        );
      if (rows[0].closed) throw new ConflictException("Mes cerrado");
      const id = randomUUID();
      await c.query(
        "INSERT INTO expenses(id,user_id,month,amount,category,description,date) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [id, r.userId, month, d.amount, d.category, d.description, d.date],
      );
      await event(c, r.userId, "expense.created", { id, ...d });
      return { id };
    });
  }
  @Delete("expenses/:id") async remove(
    @Req() r: any,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return transaction(async (c) => {
      const x = await c.query(
        "SELECT month FROM expenses WHERE id=$1 AND user_id=$2",
        [id, r.userId],
      );
      if (!x.rows[0]) throw new NotFoundException();
      const b = await c.query(
        "SELECT closed FROM budgets WHERE user_id=$1 AND month=$2 FOR UPDATE",
        [r.userId, x.rows[0].month],
      );
      if (b.rows[0].closed) throw new ConflictException("Mes cerrado");
      await c.query("DELETE FROM expenses WHERE id=$1 AND user_id=$2", [
        id,
        r.userId,
      ]);
      await event(c, r.userId, "expense.deleted", { id });
      return { ok: true };
    });
  }
  @Get("goals") async goals(@Req() r: any) {
    return (
      await db.query("SELECT * FROM goals WHERE user_id=$1 ORDER BY name", [
        r.userId,
      ])
    ).rows.map((x) => ({
      ...x,
      target: Number(x.target),
      saved: Number(x.saved),
      monthly: Number(x.monthly),
      ...projection(Number(x.target), Number(x.saved), Number(x.monthly)),
    }));
  }
  @Post("goals") async goal(@Req() r: any, @Body() d: GoalDto) {
    if (d.saved > d.target) throw new BadRequestException("Ahorro supera meta");
    return transaction(async (c) => {
      const id = randomUUID();
      await c.query(
        "INSERT INTO goals(id,user_id,name,target,saved,monthly) VALUES($1,$2,$3,$4,$5,$6)",
        [id, r.userId, d.name, d.target, d.saved, d.monthly],
      );
      await event(c, r.userId, "goal.created", { id, ...d });
      return { id };
    });
  }
  @Post("goals/:id/contributions") async contribution(
    @Req() r: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: ContributionDto,
  ) {
    return transaction(async (c) => {
      const { rows } = await c.query(
        "SELECT * FROM goals WHERE id=$1 AND user_id=$2 FOR UPDATE",
        [id, r.userId],
      );
      if (!rows[0]) throw new NotFoundException();
      if (Number(rows[0].saved) + d.amount > Number(rows[0].target))
        throw new BadRequestException("Aporte supera la meta");
      await c.query("UPDATE goals SET saved=saved+$1 WHERE id=$2", [
        d.amount,
        id,
      ]);
      await event(c, r.userId, "goal.contribution", { id, ...d });
      return { ok: true };
    });
  }
  @Post("goals/:id/simulate") async simulate(
    @Req() r: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: SimulationDto,
  ) {
    const { rows } = await db.query(
      "SELECT * FROM goals WHERE id=$1 AND user_id=$2",
      [id, r.userId],
    );
    if (!rows[0]) throw new NotFoundException();
    const g = rows[0];
    const p = projection(
      Number(g.target),
      Number(g.saved),
      Number(g.monthly),
      d.extra,
    );
    const estimatedDate = new Date();
    estimatedDate.setUTCMonth(estimatedDate.getUTCMonth() + p.monthsWithExtra);
    return { ...p, estimatedDate: estimatedDate.toISOString().slice(0, 10) };
  }
  @Post("closures") async close(@Req() r: any, @Body() d: CloseDto) {
    return transaction(async (c) => {
      const { rows } = await c.query(
        "SELECT closed FROM budgets WHERE user_id=$1 AND month=$2 FOR UPDATE",
        [r.userId, d.month],
      );
      if (!rows[0]) throw new BadRequestException("No hay presupuesto");
      if (rows[0].closed) throw new ConflictException("Mes ya cerrado");
      const s = await summary(c, r.userId, d.month);
      const actualSaving = s!.income - s!.fixed - s!.spent;
      await c.query(
        "UPDATE budgets SET closed=true WHERE user_id=$1 AND month=$2",
        [r.userId, d.month],
      );
      await event(c, r.userId, "month.closed", {
        ...s,
        actualSaving,
        reflection: d.reflection,
      });
      return { ...s, closed: true, actualSaving, reflection: d.reflection };
    });
  }
  @Get("closures") async closures(@Req() r: any) {
    return (
      await db.query(
        "SELECT payload FROM outbox WHERE user_id=$1 AND kind='month.closed' ORDER BY created_at DESC",
        [r.userId],
      )
    ).rows.map((x) => x.payload);
  }
}
