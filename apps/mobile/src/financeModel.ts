export const categories = [
  {
    name: "Supervivencia",
    image: require("../assets/categories/survival.png"),
    icon: "⌂",
    color: "#285D48",
    background: "#D2E5BB",
    detail: "Comida, vivienda, transporte, salud",
  },
  {
    name: "Ocio",
    image: require("../assets/categories/leisure.png"),
    icon: "♧",
    color: "#F34A34",
    background: "#FFE6C2",
    detail: "Restaurantes, salidas, entretenimiento",
  },
  {
    name: "Cultura",
    image: require("../assets/categories/culture.png"),
    icon: "▤",
    color: "#9D51DB",
    background: "#EEE6EC",
    detail: "Libros, cursos, museos",
  },
  {
    name: "Extras",
    image: require("../assets/categories/extras.png"),
    icon: "▣",
    color: "#EC7590",
    background: "#F7EFE3",
    detail: "Compras, regalos, impulsos",
  },
] as const;
export const paymentMethods = [
  "Efectivo",
  "Tarjeta de débito",
  "Tarjeta de crédito",
  "Transferencia",
] as const;
export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string | null;
  necessary: boolean | null;
};
export type Summary = {
  income: number;
  fixed: number;
  saving: number;
  spent: number;
  available: number;
  closed: boolean;
  categories: { category: string; total: number }[];
};
export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  monthly: number;
  months: number;
};
export type Closure = Summary & {
  month: string;
  actualSaving: number;
  reflection: string;
};
export type WeeklyAnalysis = {
  weekStart: string;
  weekEnd: string;
  total: number;
  previousTotal: number;
  changePercent: number | null;
  count: number;
  impulsiveCount: number;
  classifiedCount: number;
  categories: { category: string; total: number; percent: number }[];
};
export function localDate(d = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
export function shiftDate(value: string, days: number): string {
  const [y, m, d] = value.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + days, 12));
}
export function weekStart(value = localDate()): string {
  const [y, m, d] = value.split("-").map(Number);
  const day = new Date(y, m - 1, d, 12).getDay();
  return shiftDate(value, -(day + 6) % 7);
}
export function shiftMonth(value: string, delta: number): string {
  const [y, m] = value.split("-").map(Number);
  return localDate(new Date(y, m - 1 + delta, 1, 12)).slice(0, 7);
}
export function monthLabel(value: string): string {
  const [y, m] = value.split("-").map(Number);
  return new Date(y, m - 1, 1, 12).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
}
export function dateLabel(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export function pesos(value: string, positive = false): number {
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 1000000000000 ||
    (positive && Number(value) < 1)
  )
    throw new Error(
      positive
        ? "Ingresa un monto entero mayor que cero, sin puntos ni comas."
        : "Ingresa montos enteros en pesos, sin puntos ni comas.",
    );
  return Number(value);
}
