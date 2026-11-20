import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Field, colors, money } from "./ui";
import {
  categories,
  paymentMethods,
  monthLabel,
  dateLabel,
  localDate,
  shiftMonth,
  shiftDate,
  pesos,
  Expense,
  Summary,
  Goal,
  Closure,
  WeeklyAnalysis,
} from "./financeModel";

type Props = {
  screen: string;
  user: { name: string; email: string; objective?: string };
  summary: Summary | null;
  month: string;
  expenses: Expense[];
  goals: Goal[];
  closures: Closure[];
  analysis: WeeklyAnalysis | null;
  week: string;
  busy: boolean;
  error: string;
  notice: string;
  onNavigate: (screen: string) => void;
  onMonth: (month: string) => void;
  onWeek: (week: string) => void;
  onExpense: (data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    paymentMethod: string;
    necessary: boolean;
  }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onBudget: (data: {
    income: number;
    fixed: number;
    saving: number;
  }) => Promise<boolean>;
  onGoal: (data: {
    name: string;
    target: number;
    saved: number;
    monthly: number;
  }) => Promise<boolean>;
  onContribution: (id: string, amount: number) => Promise<boolean>;
  onSimulate: (id: string, extra: number) => Promise<any>;
  onClose: (reflection: string) => Promise<boolean>;
  onLogout: () => void;
};
const icons = {
  home: require("../assets/home-icons/home.png"),
  expenses: require("../assets/home-icons/money.png"),
  budget: require("../assets/home-icons/bank.png"),
  analysis: require("../assets/home-icons/chart.png"),
  profile: require("../assets/home-icons/list.png"),
};
export function BottomNav({
  screen,
  onNavigate,
  disabled = false,
}: {
  screen: string;
  onNavigate: (screen: string) => void;
  disabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const active = ["categories", "newExpense"].includes(screen)
    ? "expenses"
    : ["goals", "closure", "help", "settings", "categoryInfo"].includes(screen)
      ? "profile"
      : screen;
  return (
    <View style={[st.nav, { paddingBottom: Math.max(8, insets.bottom) }]}>
      {Object.entries(icons).map(([key, icon], i) => (
        <Pressable
          key={key}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ selected: active === key, disabled }}
          onPress={() => onNavigate(key)}
          style={[st.tab, active === key && st.activeTab]}
        >
          <Image
            source={icon}
            style={{ width: 25, height: 25 }}
            resizeMode="contain"
          />
          <Text style={st.tabText}>
            {["Inicio", "Gastos", "Presupuesto", "Análisis", "Más"][i]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Progress({
  value,
  color = colors.green,
}: {
  value: number;
  color?: string;
}) {
  return (
    <View style={st.track}>
      <View
        style={{
          height: 11,
          borderRadius: 10,
          backgroundColor: color,
          width: `${Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))}%`,
        }}
      />
    </View>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.row}>
      <Text style={st.text}>{label}</Text>
      <Text style={st.bold}>{value}</Text>
    </View>
  );
}
function CategoryIcon({ name }: { name: string }) {
  const c = categories.find((c) => c.name === name) || categories[0];
  return (
    <View style={[st.categoryIcon, { backgroundColor: c.background }]}>
      <Image
        source={c.image}
        style={{ width: 44, height: 44, borderRadius: 22 }}
        resizeMode="cover"
      />
    </View>
  );
}
export function FinanceScreens(p: Props) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    setLocalError("");
    setConfirmClose(false);
    setConfirmDelete("");
  }, [p.screen]);
  const [category, setCategory] = useState("Supervivencia"),
    [amount, setAmount] = useState(""),
    [date, setDate] = useState(
      p.month === localDate().slice(0, 7) ? localDate() : p.month + "-01",
    ),
    [note, setNote] = useState(""),
    [payment, setPayment] = useState<string>(paymentMethods[0]),
    [necessary, setNecessary] = useState(true);
  const [picker, setPicker] = useState<"category" | "payment" | null>(null),
    [localError, setLocalError] = useState("");
  const [income, setIncome] = useState(String(p.summary?.income ?? "")),
    [fixed, setFixed] = useState(String(p.summary?.fixed ?? "")),
    [saving, setSaving] = useState(String(p.summary?.saving ?? ""));
  const [goalName, setGoalName] = useState(""),
    [target, setTarget] = useState(""),
    [saved, setSaved] = useState("0"),
    [monthly, setMonthly] = useState(""),
    [selected, setSelected] = useState(""),
    [contribution, setContribution] = useState(""),
    [extra, setExtra] = useState("0"),
    [simulation, setSimulation] = useState<any>(null);
  const [reflection, setReflection] = useState(""),
    [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [budgetEdit, setBudgetEdit] = useState(!p.summary);
  useEffect(() => {
    setIncome(String(p.summary?.income ?? ""));
    setFixed(String(p.summary?.fixed ?? ""));
    setSaving(String(p.summary?.saving ?? ""));
    setBudgetEdit(!p.summary);
    setConfirmClose(false);
    setReflection("");
    setConfirmDelete("");
    setLocalError("");
    setDate(
      p.month === localDate().slice(0, 7) ? localDate() : p.month + "-01",
    );
  }, [p.month]);
  const closed = !!p.summary?.closed;
  const titles: Record<string, string> = {
    expenses: "Mis gastos",
    categories: "Registrar Gasto",
    newExpense: "Nuevo gasto",
    budget: "Presupuesto mensual",
    analysis: "Análisis semanal",
    profile: "Perfil",
    goals: "Mis metas",
    closure: "Cierre de mes",
    categoryInfo: "Categorías",
    settings: "Configuración",
    help: "Ayuda",
  };
  async function act(fn: () => Promise<void>) {
    setLocalError("");
    try {
      await fn();
    } catch (e: any) {
      setLocalError(e.message || "Revisa los datos ingresados.");
    }
  }
  const changeMonth = (delta: number) => {
    setLocalError("");
    p.onMonth(shiftMonth(p.month, delta));
  };
  const monthPicker = (
    <View style={st.period}>
      <Pressable
        disabled={p.busy}
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        onPress={() => changeMonth(-1)}
        style={st.arrow}
      >
        <Text style={st.arrowText}>‹</Text>
      </Pressable>
      <Text style={st.periodText}>{monthLabel(p.month)}</Text>
      <Pressable
        disabled={p.busy}
        accessibilityRole="button"
        accessibilityLabel="Mes siguiente"
        onPress={() => changeMonth(1)}
        style={st.arrow}
      >
        <Text style={st.arrowText}>›</Text>
      </Pressable>
    </View>
  );
  const budgetEmpty = (
    <Card>
      <Text style={st.heading}>Define tu presupuesto</Text>
      <Text style={st.text}>
        Primero configura ingresos, gastos fijos y ahorro para este mes.
      </Text>
      <Button
        title="Configurar presupuesto"
        onPress={() => p.onNavigate("budget")}
      />
    </Card>
  );
  const total = p.summary ? p.summary.fixed + p.summary.spent : 0;
  const actual = p.summary ? p.summary.income - total : 0;
  const biggest = p.summary?.categories
    ?.slice()
    .sort((a, b) => b.total - a.total)[0];
  return (
    <KeyboardAvoidingView
      style={st.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={require("../assets/hojas.png")}
          style={st.leaves}
          resizeMode="contain"
        />
      </View>
      <View style={[st.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          disabled={p.busy}
          onPress={() =>
            p.onNavigate(
              p.screen === "newExpense"
                ? "categories"
                : p.screen === "categories"
                  ? "expenses"
                  : "home",
            )
          }
          style={st.arrow}
        >
          <Text style={st.arrowText}>‹</Text>
        </Pressable>
        <Text accessibilityRole="header" style={st.title}>
          {titles[p.screen] || "Kakebo"}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={st.content}
      >
        {["expenses", "budget", "closure"].includes(p.screen) && monthPicker}
        {closed && ["expenses", "budget", "closure"].includes(p.screen) && (
          <Text style={st.banner}>
            Este mes está cerrado. Puedes consultar sus datos.
          </Text>
        )}
        {p.screen === "expenses" && (
          <>
            {!p.summary ? (
              budgetEmpty
            ) : (
              <>
                <Card>
                  <Row
                    label="Gastos registrados"
                    value={money(p.summary.spent)}
                  />
                  <Text style={st.caption}>
                    {p.expenses.length} registros · Los gastos fijos están en tu
                    presupuesto.
                  </Text>
                </Card>
                {!closed && (
                  <Button
                    title="+ Registrar gasto"
                    disabled={p.busy}
                    onPress={() => {
                      setDate(
                        p.month === localDate().slice(0, 7)
                          ? localDate()
                          : p.month + "-01",
                      );
                      p.onNavigate("categories");
                    }}
                  />
                )}
              </>
            )}
            {p.expenses.length === 0 && (
              <Text style={st.empty}>
                Aún no tienes gastos registrados en este mes.
              </Text>
            )}
            {p.expenses.map((e) => (
              <Card key={e.id}>
                <View style={st.row}>
                  <CategoryIcon name={e.category} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.bold}>{e.description}</Text>
                    <Text style={st.caption}>
                      {e.category} · {dateLabel(e.date)}
                    </Text>
                  </View>
                  <Text style={st.bold}>{money(e.amount)}</Text>
                </View>
                <Text style={st.caption}>
                  {e.paymentMethod || "Sin método registrado"} ·{" "}
                  {e.necessary === null
                    ? "Sin clasificar"
                    : e.necessary
                      ? "Necesario"
                      : "No necesario"}
                </Text>
                {!closed &&
                  (confirmDelete === e.id ? (
                    <>
                      <Text style={st.text}>¿Eliminar este gasto?</Text>
                      <Button
                        title="Confirmar eliminación"
                        disabled={p.busy}
                        onPress={() =>
                          void act(async () => {
                            if (await p.onDelete(e.id)) setConfirmDelete("");
                          })
                        }
                      />
                      <Button
                        title="Cancelar"
                        secondary
                        onPress={() => setConfirmDelete("")}
                      />
                    </>
                  ) : (
                    <Pressable
                      disabled={p.busy}
                      accessibilityRole="button"
                      accessibilityLabel={"Eliminar " + e.description}
                      onPress={() => setConfirmDelete(e.id)}
                      style={st.linkButton}
                    >
                      <Text style={st.danger}>Eliminar gasto</Text>
                    </Pressable>
                  ))}
              </Card>
            ))}
          </>
        )}
        {p.screen === "categories" && (
          <>
            {!p.summary ? (
              budgetEmpty
            ) : closed ? (
              <Text style={st.banner}>Este mes está cerrado.</Text>
            ) : (
              <>
                <Text style={[st.heading, { marginTop: 28 }]}>
                  ¿En qué categoría fue?
                </Text>
                <View style={st.grid}>
                  {categories.map((c) => (
                    <Pressable
                      accessibilityRole="button"
                      disabled={p.busy}
                      key={c.name}
                      onPress={() => {
                        setCategory(c.name);
                        p.onNavigate("newExpense");
                      }}
                      style={[
                        st.categoryCard,
                        { backgroundColor: c.background },
                      ]}
                    >
                      <Image
                        source={c.image}
                        style={{ width: 96, height: 84 }}
                        resizeMode="contain"
                      />
                      <Text style={[st.bold, { color: c.color }]}>
                        {c.name}
                      </Text>
                      <Text style={[st.categoryDetail, { color: c.color }]}>
                        {c.detail}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
        {p.screen === "newExpense" && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar categoría"
              onPress={() => setPicker("category")}
              style={st.select}
            >
              <CategoryIcon name={category} />
              <Text style={[st.bold, { flex: 1 }]}>{category}</Text>
              <Text>⌄</Text>
            </Pressable>
            <Text style={st.caption}>Monto en pesos</Text>
            <TextInput
              accessibilityLabel="Monto del gasto"
              placeholder="$0"
              placeholderTextColor="#89978A"
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              style={st.amountInput}
            />
            <Field label="Fecha (AAAA-MM-DD)" value={date} onChange={setDate} />
            <Text style={st.caption}>Método de pago</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPicker("payment")}
              style={st.select}
            >
              <Text style={st.text}>{payment}</Text>
              <Text>⌄</Text>
            </Pressable>
            <Text style={st.heading}>¿Era necesario?</Text>
            <View style={st.row}>
              {[true, false].map((value) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: necessary === value }}
                  key={String(value)}
                  onPress={() => setNecessary(value)}
                  style={[
                    st.option,
                    necessary === value && {
                      borderColor: value ? colors.green : "#D94C59",
                      backgroundColor: value ? "#E4EEDD" : "#FFDADB",
                    },
                  ]}
                >
                  <Text style={st.bold}>{value ? "Sí" : "No"}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Nota (opcional)" value={note} onChange={setNote} />
            <Button
              title="Guardar gasto"
              disabled={p.busy || closed}
              onPress={() =>
                void act(async () => {
                  const d = new Date(date + "T12:00:00Z");
                  if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                    !Number.isFinite(d.getTime()) ||
                    d.toISOString().slice(0, 10) !== date
                  )
                    throw Error(
                      "Ingresa una fecha válida con formato AAAA-MM-DD.",
                    );
                  if (note.trim().length > 200)
                    throw Error("La nota puede tener hasta 200 caracteres.");
                  if (
                    await p.onExpense({
                      amount: pesos(amount, true),
                      date,
                      category,
                      description: note.trim() || category,
                      paymentMethod: payment,
                      necessary,
                    })
                  ) {
                    setAmount("");
                    setNote("");
                  }
                })
              }
            />
          </>
        )}
        {p.screen === "budget" && (
          <>
            {p.summary && (
              <>
                <Card>
                  <Row label="Ingresos" value={money(p.summary.income)} />
                  <Row label="Gastos fijos" value={money(p.summary.fixed)} />
                  <Row
                    label="Ahorro objetivo"
                    value={money(p.summary.saving)}
                  />
                </Card>
                <View style={st.callout}>
                  <Text style={st.text}>💡 Dinero disponible</Text>
                  <Text style={st.heading}>{money(p.summary.available)}</Text>
                </View>
                <Card>
                  <Text style={st.bold}>Tu progreso</Text>
                  <Progress
                    value={
                      p.summary.income - p.summary.fixed - p.summary.saving > 0
                        ? (p.summary.spent /
                            (p.summary.income -
                              p.summary.fixed -
                              p.summary.saving)) *
                          100
                        : 0
                    }
                  />
                  <Text style={st.caption}>
                    Has gastado {money(p.summary.spent)} de{" "}
                    {money(
                      p.summary.income - p.summary.fixed - p.summary.saving,
                    )}{" "}
                    para gastos variables.
                  </Text>
                </Card>
                <Card>
                  <Text style={st.bold}>Distribución del ingreso</Text>
                  {[
                    ["Gastos fijos", p.summary.fixed],
                    ["Ahorro previsto", p.summary.saving],
                    ["Gastos registrados", p.summary.spent],
                  ].map(([label, value]) => (
                    <View key={String(label)} style={{ gap: 6 }}>
                      <Row label={String(label)} value={money(Number(value))} />
                      <Progress
                        value={
                          p.summary!.income
                            ? (Number(value) / p.summary!.income) * 100
                            : 0
                        }
                      />
                    </View>
                  ))}
                </Card>
                {!closed && !budgetEdit && (
                  <Button
                    title="Editar presupuesto"
                    secondary
                    disabled={p.busy}
                    onPress={() => {
                      setIncome(String(p.summary!.income));
                      setFixed(String(p.summary!.fixed));
                      setSaving(String(p.summary!.saving));
                      setBudgetEdit(true);
                    }}
                  />
                )}
              </>
            )}
            {(!p.summary || budgetEdit) && !closed && (
              <Card>
                <Text style={st.heading}>
                  {p.summary ? "Editar presupuesto" : "Planifica tu mes"}
                </Text>
                <Field
                  label="Ingresos mensuales"
                  value={income}
                  onChange={setIncome}
                  numeric
                />
                <Field
                  label="Gastos fijos"
                  value={fixed}
                  onChange={setFixed}
                  numeric
                />
                <Field
                  label="Ahorro objetivo"
                  value={saving}
                  onChange={setSaving}
                  numeric
                />
                <Text style={st.caption}>
                  Registra aquí tus costos fijos. En Gastos agrega solo compras
                  adicionales para evitar contarlas dos veces.
                </Text>
                <Button
                  title="Guardar presupuesto"
                  disabled={p.busy}
                  onPress={() =>
                    void act(async () => {
                      const data = {
                        income: pesos(income),
                        fixed: pesos(fixed),
                        saving: pesos(saving),
                      };
                      if (data.fixed + data.saving > data.income)
                        throw Error(
                          "Los gastos fijos y el ahorro no pueden superar los ingresos.",
                        );
                      if (await p.onBudget(data)) setBudgetEdit(false);
                    })
                  }
                />
                {p.summary && (
                  <Button
                    title="Cancelar"
                    secondary
                    onPress={() => setBudgetEdit(false)}
                  />
                )}
              </Card>
            )}
          </>
        )}
        {p.screen === "analysis" && (
          <>
            <View style={st.period}>
              <Pressable
                disabled={p.busy}
                accessibilityRole="button"
                accessibilityLabel="Semana anterior"
                style={st.arrow}
                onPress={() => p.onWeek(shiftDate(p.week, -7))}
              >
                <Text style={st.arrowText}>‹</Text>
              </Pressable>
              <Text style={[st.periodText, { flex: 1 }]}>
                {dateLabel(p.week)}
                {"\n"}al {dateLabel(shiftDate(p.week, 6))}
              </Text>
              <Pressable
                disabled={p.busy}
                accessibilityRole="button"
                accessibilityLabel="Semana siguiente"
                style={st.arrow}
                onPress={() => p.onWeek(shiftDate(p.week, 7))}
              >
                <Text style={st.arrowText}>›</Text>
              </Pressable>
            </View>
            {p.analysis ? (
              <>
                <Card>
                  <Text style={st.bold}>¿Cuánto gastaste?</Text>
                  <Text style={st.large}>{money(p.analysis.total)}</Text>
                  <Text style={st.caption}>
                    {p.analysis.changePercent === null
                      ? "Sin gastos en la semana anterior para comparar."
                      : (p.analysis.changePercent > 0
                          ? "↑ "
                          : p.analysis.changePercent < 0
                            ? "↓ "
                            : "") +
                        Math.abs(p.analysis.changePercent) +
                        "% respecto a la semana anterior"}
                  </Text>
                </Card>
                <Card>
                  <Text style={st.heading}>¿En qué gastaste más?</Text>
                  {p.analysis.categories.map((c) => (
                    <View key={c.category} style={st.row}>
                      <CategoryIcon name={c.category} />
                      <Text style={[st.text, { flex: 1 }]}>{c.category}</Text>
                      <Text style={st.caption}>{c.percent}%</Text>
                      <Text style={st.bold}>{money(c.total)}</Text>
                    </View>
                  ))}
                  {p.analysis.count === 0 && (
                    <Text style={st.text}>No hay gastos en esta semana.</Text>
                  )}
                </Card>
                <View style={st.callout}>
                  <Text style={st.bold}>
                    Hubo {p.analysis.impulsiveCount} gastos no necesarios de{" "}
                    {p.analysis.classifiedCount} clasificados.
                  </Text>
                  {p.analysis.classifiedCount < p.analysis.count && (
                    <Text style={st.caption}>
                      Hay {p.analysis.count - p.analysis.classifiedCount} gastos
                      anteriores sin clasificar.
                    </Text>
                  )}
                </View>
                <Text style={st.caption}>
                  El análisis considera gastos registrados; los costos fijos
                  están en el presupuesto mensual.
                </Text>
              </>
            ) : (
              !p.busy && (
                <Text style={st.empty}>
                  No se pudo cargar el análisis. Vuelve a entrar para
                  reintentar.
                </Text>
              )
            )}
            <Button
              title="Ver cierre mensual"
              secondary
              onPress={() => p.onNavigate("closure")}
            />
          </>
        )}
        {p.screen === "closure" && (
          <>
            {!p.summary ? (
              budgetEmpty
            ) : (
              <>
                <Card>
                  <Row label="Ingresos" value={money(p.summary.income)} />
                  <Row label="Gastos totales" value={money(total)} />
                  <Text style={st.caption}>
                    Incluye {money(p.summary.fixed)} de gastos fijos.
                  </Text>
                  <Row label="Ahorro real disponible" value={money(actual)} />
                  <Row label="Meta de ahorro" value={money(p.summary.saving)} />
                  <Progress
                    value={
                      p.summary.saving > 0
                        ? (actual / p.summary.saving) * 100
                        : actual >= 0
                          ? 100
                          : 0
                    }
                  />
                  <Text
                    style={[
                      st.bold,
                      {
                        color:
                          actual >= p.summary.saving ? colors.green : "#8E4C35",
                      },
                    ]}
                  >
                    {actual >= p.summary.saving
                      ? "¡Meta alcanzada!"
                      : "Sigue avanzando hacia tu meta"}
                  </Text>
                </Card>
                {biggest && (
                  <Card>
                    <Text style={st.bold}>Tu mayor categoría</Text>
                    <View style={st.row}>
                      <CategoryIcon name={biggest.category} />
                      <Text style={[st.text, { flex: 1 }]}>
                        {biggest.category}
                      </Text>
                      <Text style={st.bold}>{money(biggest.total)}</Text>
                    </View>
                    <Text style={st.caption}>
                      {p.summary.spent
                        ? Math.round((biggest.total / p.summary.spent) * 1000) /
                          10
                        : 0}
                      % de los gastos registrados.
                    </Text>
                  </Card>
                )}
                {!closed && (
                  <>
                    <Field
                      label="¿Qué mejorarás el siguiente mes?"
                      value={reflection}
                      onChange={setReflection}
                    />
                    {confirmClose ? (
                      <Card>
                        <Text style={st.text}>
                          El cierre bloqueará los cambios del presupuesto y los
                          gastos de {monthLabel(p.month)}.
                        </Text>
                        <Button
                          title="Confirmar cierre mensual"
                          disabled={p.busy}
                          onPress={() =>
                            void act(async () => {
                              if (await p.onClose(reflection))
                                setConfirmClose(false);
                            })
                          }
                        />
                        <Button
                          title="Cancelar"
                          secondary
                          disabled={p.busy}
                          onPress={() => setConfirmClose(false)}
                        />
                      </Card>
                    ) : (
                      <Button
                        title="Cerrar mes"
                        disabled={p.busy}
                        onPress={() => setConfirmClose(true)}
                      />
                    )}
                  </>
                )}
              </>
            )}
            <Text style={st.heading}>Historial de cierres</Text>
            {p.closures.length === 0 && (
              <Text style={st.caption}>Todavía no hay meses cerrados.</Text>
            )}
            {p.closures.map((c) => (
              <Card key={c.month}>
                <Text style={st.bold}>{monthLabel(c.month)}</Text>
                <Row label="Ahorro real" value={money(c.actualSaving)} />
                <Text style={st.text}>
                  {c.reflection || "Sin reflexión escrita."}
                </Text>
              </Card>
            ))}
          </>
        )}
        {p.screen === "profile" && (
          <>
            <View style={st.profile}>
              <View style={st.avatar}>
                <Text style={{ fontSize: 30, color: colors.green }}>
                  {p.user.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.heading}>{p.user.name}</Text>
                <Text style={st.caption}>{p.user.email}</Text>
                <Text style={st.caption}>
                  {p.user.objective || "Pequeños hábitos, grandes resultados"}
                </Text>
              </View>
            </View>
            <View style={st.menu}>
              {[
                ["◎", "Mis metas", "goals"],
                ["◇", "Categorías", "categoryInfo"],
                ["◷", "Cierre de mes", "closure"],
                ["⚙", "Configuración", "settings"],
                ["?", "Ayuda", "help"],
              ].map(([icon, label, screen]) => (
                <Pressable
                  accessibilityRole="button"
                  key={screen}
                  style={st.menuRow}
                  onPress={() => p.onNavigate(screen)}
                >
                  <Text
                    style={{ fontSize: 24, width: 30, color: colors.green }}
                  >
                    {icon}
                  </Text>
                  <Text style={[st.bold, { flex: 1 }]}>{label}</Text>
                  <Text>›</Text>
                </Pressable>
              ))}
            </View>
            <Image
              source={require("../assets/foto_1.png")}
              style={{ width: 130, height: 130, alignSelf: "center" }}
              resizeMode="contain"
            />
            <Text style={[st.heading, { textAlign: "center" }]}>
              Pequeños hábitos, grandes resultados
            </Text>
            <Button
              title="Cerrar sesión"
              secondary
              disabled={p.busy}
              onPress={p.onLogout}
            />
          </>
        )}
        {p.screen === "categoryInfo" &&
          categories.map((c) => (
            <Card key={c.name}>
              <View style={st.row}>
                <CategoryIcon name={c.name} />
                <Text style={[st.heading, { flex: 1, color: c.color }]}>
                  {c.name}
                </Text>
              </View>
              <Text style={st.text}>{c.detail}</Text>
            </Card>
          ))}
        {p.screen === "settings" && (
          <Card>
            <Text style={st.heading}>Tu cuenta</Text>
            <Row label="Nombre" value={p.user.name} />
            <Text style={st.text}>{p.user.email}</Text>
            <Text style={st.caption}>
              Moneda: peso chileno (CLP). Los montos se registran sin decimales.
            </Text>
            <Button
              title="Cambiar objetivo principal"
              secondary
              onPress={() => p.onNavigate("objective")}
            />
            <Button
              title="Cerrar sesión"
              secondary
              disabled={p.busy}
              onPress={p.onLogout}
            />
          </Card>
        )}
        {p.screen === "help" && (
          <>
            <Card>
              <Text style={st.heading}>Cómo usar Kakebo</Text>
              <Text style={st.text}>
                1. Define tus ingresos, costos fijos y ahorro mensual.{"\n\n"}2.
                Registra cada gasto adicional en una de las cuatro categorías.
                {"\n\n"}3. Revisa tu análisis semanal para entender tus hábitos.
                {"\n\n"}4. Al terminar el mes, escribe una reflexión y realiza
                el cierre.
              </Text>
            </Card>
            <Card>
              <Text style={st.heading}>Tus metas</Text>
              <Text style={st.text}>
                Los aportes registran ahorro declarado. No mueven dinero
                bancario ni modifican el presupuesto. Las simulaciones muestran
                una estimación según el aporte mensual previsto.
              </Text>
            </Card>
            <Card>
              <Text style={st.heading}>Antes de cerrar el mes</Text>
              <Text style={st.text}>
                Revisa los datos: el cierre impide modificar el presupuesto o
                agregar y eliminar gastos de ese mes.
              </Text>
            </Card>
          </>
        )}
        {p.screen === "goals" && (
          <>
            <Text style={st.caption}>
              Tus alcancías registran ahorro declarado; no mueven dinero
              bancario ni modifican tu presupuesto.
            </Text>
            {p.goals.length === 0 && (
              <Text style={st.empty}>Crea tu primera meta de ahorro.</Text>
            )}
            {p.goals.map((g) => (
              <Card key={g.id}>
                <Text style={st.heading}>{g.name}</Text>
                <Row
                  label="Ahorrado"
                  value={money(g.saved) + " de " + money(g.target)}
                />
                <Progress value={(g.saved / g.target) * 100} />
                <Text style={st.caption}>
                  {g.saved >= g.target
                    ? "¡Meta alcanzada!"
                    : g.months +
                      " meses estimados con aportes de " +
                      money(g.monthly)}
                </Text>
                <Button
                  title={
                    selected === g.id ? "Ocultar opciones" : "Aportar o simular"
                  }
                  secondary
                  onPress={() => {
                    setSelected(selected === g.id ? "" : g.id);
                    setSimulation(null);
                    setContribution("");
                    setExtra("0");
                  }}
                />
                {selected === g.id && (
                  <>
                    <Field
                      label="Aporte a esta meta"
                      value={contribution}
                      onChange={setContribution}
                      numeric
                    />
                    <Button
                      title="Registrar aporte"
                      disabled={p.busy || g.saved >= g.target}
                      onPress={() =>
                        void act(async () => {
                          if (
                            await p.onContribution(
                              g.id,
                              pesos(contribution, true),
                            )
                          )
                            setContribution("");
                        })
                      }
                    />
                    <Field
                      label="Gasto extraordinario hipotético"
                      value={extra}
                      onChange={setExtra}
                      numeric
                    />
                    <Button
                      title="Simular impacto"
                      secondary
                      disabled={p.busy}
                      onPress={() =>
                        void act(async () => {
                          setSimulation(await p.onSimulate(g.id, pesos(extra)));
                        })
                      }
                    />
                    {simulation && (
                      <Text style={st.text}>
                        Retraso: {simulation.delayMonths} meses. Fecha estimada:{" "}
                        {dateLabel(simulation.estimatedDate)}. La simulación no
                        registra gastos.
                      </Text>
                    )}
                  </>
                )}
              </Card>
            ))}
            <Card>
              <Text style={st.heading}>Nueva meta</Text>
              <Field
                label="Nombre de la meta"
                value={goalName}
                onChange={setGoalName}
              />
              <Field
                label="Monto objetivo"
                value={target}
                onChange={setTarget}
                numeric
              />
              <Field
                label="Ya ahorrado"
                value={saved}
                onChange={setSaved}
                numeric
              />
              <Field
                label="Aporte mensual previsto"
                value={monthly}
                onChange={setMonthly}
                numeric
              />
              <Button
                title="Crear meta"
                disabled={p.busy}
                onPress={() =>
                  void act(async () => {
                    if (!goalName.trim())
                      throw Error("Escribe el nombre de tu meta.");
                    const data = {
                      name: goalName.trim(),
                      target: pesos(target, true),
                      saved: pesos(saved),
                      monthly: pesos(monthly, true),
                    };
                    if (data.saved > data.target)
                      throw Error("El ahorro no puede superar la meta.");
                    if (await p.onGoal(data)) {
                      setGoalName("");
                      setTarget("");
                      setSaved("0");
                      setMonthly("");
                    }
                  })
                }
              />
            </Card>
          </>
        )}
        {p.busy && (
          <ActivityIndicator style={{ margin: 16 }} color={colors.green} />
        )}
        {!!(localError || p.error) && (
          <Text accessibilityRole="alert" style={st.error}>
            {localError || p.error}
          </Text>
        )}
        {!!p.notice && (
          <Text accessibilityRole="alert" style={st.banner}>
            {p.notice}
          </Text>
        )}
      </ScrollView>
      <BottomNav
        screen={p.screen}
        onNavigate={p.onNavigate}
        disabled={p.busy}
      />
      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <View style={st.overlay}>
          <View style={[st.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={st.heading}>
              {picker === "category"
                ? "Selecciona una categoría"
                : "Método de pago"}
            </Text>
            {(picker === "category"
              ? categories.map((c) => c.name)
              : [...paymentMethods]
            ).map((v) => (
              <Button
                key={v}
                title={v}
                secondary
                onPress={() => {
                  picker === "category" ? setCategory(v) : setPayment(v);
                  setPicker(null);
                }}
              />
            ))}
            <Button title="Cancelar" onPress={() => setPicker(null)} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FCF5EC" },
  leaves: {
    position: "absolute",
    left: -90,
    bottom: 35,
    width: 200,
    height: 370,
    opacity: 0.65,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "600",
    color: "#18271E",
  },
  arrow: {
    minHeight: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { fontSize: 32, color: "#18271E" },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 32,
    gap: 14,
  },
  nav: { backgroundColor: "#34573D", flexDirection: "row", paddingTop: 7 },
  tab: {
    flex: 1,
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: { backgroundColor: "#FFFFFF1C" },
  tabText: { color: "white", fontSize: 10, marginTop: 4 },
  heading: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 24,
  },
  text: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  bold: { fontSize: 14, fontWeight: "600", color: colors.ink, flexShrink: 1 },
  caption: { fontSize: 12, lineHeight: 19, color: "#506057" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  period: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  periodText: {
    fontSize: 14,
    color: colors.ink,
    textAlign: "center",
    textTransform: "capitalize",
  },
  track: {
    height: 11,
    backgroundColor: "#C9C6C2",
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 5,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  categoryCard: {
    width: "47%",
    minHeight: 195,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
  },
  categoryDetail: { fontSize: 12, textAlign: "center", lineHeight: 17 },
  select: {
    backgroundColor: "white",
    padding: 14,
    borderWidth: 1,
    borderColor: "#B8B4AE",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 58,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.ink,
    minHeight: 65,
    paddingHorizontal: 12,
  },
  option: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#B8B4AE",
    alignItems: "center",
    backgroundColor: "white",
  },
  large: {
    fontSize: 34,
    fontWeight: "600",
    color: colors.ink,
    marginVertical: 12,
  },
  callout: {
    backgroundColor: "#F0F0EC",
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  empty: {
    color: "#637369",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 26,
    lineHeight: 22,
  },
  banner: {
    backgroundColor: "#E6EFDF",
    color: colors.green,
    padding: 14,
    borderRadius: 10,
    lineHeight: 20,
  },
  error: {
    backgroundColor: "#FFE8DE",
    color: "#813828",
    padding: 14,
    borderRadius: 10,
    lineHeight: 20,
  },
  profile: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    paddingVertical: 28,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#DBE7D5",
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D5D1CB",
    borderRadius: 12,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E1DB",
    minHeight: 68,
  },
  linkButton: { alignSelf: "flex-end", padding: 10 },
  danger: { color: "#9D3636", fontSize: 13 },
  overlay: { flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FCF5EC",
    padding: 24,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    gap: 8,
  },
});
