export const categories = [
  "Supervivencia",
  "Ocio",
  "Cultura",
  "Extras",
] as const;
export function balance(
  income: number,
  fixed: number,
  saving: number,
  spent: number,
  month: string,
  today = new Date(),
) {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const current = today.toISOString().slice(0, 7);
  const remaining =
    month < current
      ? 0
      : month === current
        ? days - today.getUTCDate() + 1
        : days;
  const available = income - fixed - saving - spent;
  return {
    income,
    fixed,
    saving,
    spent,
    available,
    daysRemaining: remaining,
    daily: remaining ? Math.floor(Math.max(0, available) / remaining) : 0,
  };
}
export function projection(
  target: number,
  saved: number,
  monthly: number,
  extra = 0,
) {
  const months = Math.ceil(Math.max(0, target - saved) / monthly);
  const withExtra = Math.ceil(Math.max(0, target - saved + extra) / monthly);
  return {
    months,
    monthsWithExtra: withExtra,
    delayMonths: withExtra - months,
  };
}
