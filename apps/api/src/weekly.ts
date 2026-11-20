export type WeeklyExpense = {
  amount: number;
  category: string;
  date: string;
  necessary: boolean | null;
};
const categoryNames = ["Supervivencia", "Ocio", "Cultura", "Extras"];
function offset(value: string, days: number): string {
  const d = new Date(value + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function weeklyBounds(week: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) throw Error("Semana inválida");
  const d = new Date(week + "T12:00:00Z");
  if (
    !Number.isFinite(d.getTime()) ||
    d.toISOString().slice(0, 10) !== week ||
    d.getUTCDay() !== 1
  )
    throw Error("La semana debe comenzar en una fecha válida de lunes");
  return {
    weekStart: week,
    weekEnd: offset(week, 6),
    previousStart: offset(week, -7),
  };
}
export function weeklyAnalysis(week: string, rows: WeeklyExpense[]) {
  const bounds = weeklyBounds(week);
  const current = rows.filter(
    (e) => e.date >= bounds.weekStart && e.date <= bounds.weekEnd,
  );
  const previous = rows.filter(
    (e) => e.date >= bounds.previousStart && e.date < bounds.weekStart,
  );
  const total = current.reduce((s, e) => s + Number(e.amount), 0);
  const previousTotal = previous.reduce((s, e) => s + Number(e.amount), 0);
  return {
    weekStart: bounds.weekStart,
    weekEnd: bounds.weekEnd,
    total,
    previousTotal,
    changePercent: previousTotal
      ? Math.round(((total - previousTotal) / previousTotal) * 1000) / 10
      : null,
    count: current.length,
    impulsiveCount: current.filter((e) => e.necessary === false).length,
    classifiedCount: current.filter((e) => typeof e.necessary === "boolean")
      .length,
    categories: categoryNames
      .map((category) => {
        const sum = current
          .filter((e) => e.category === category)
          .reduce((s, e) => s + Number(e.amount), 0);
        return {
          category,
          total: sum,
          percent: total ? Math.round((sum / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.total - a.total),
  };
}
