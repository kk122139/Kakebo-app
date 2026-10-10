import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { api, restore, storeSession, logout } from "./src/api";
import { ObjectiveHomeScreens } from "./src/ObjectiveHomeScreens";
import { AuthScreens } from "./src/AuthScreens";
import { IntroScreens } from "./src/IntroScreens";
import { Button, Field, Card, Leaf, s, colors, money } from "./src/ui";
const categories = ["Supervivencia", "Ocio", "Cultura", "Extras"];
const objectives = [
  "Ahorrar más dinero",
  "Controlar mis gastos",
  "Planificar mis metas",
  "Conocer mis hábitos",
];
const today = () => new Date().toISOString().slice(0, 10);
export default function App() {
  const [screen, setScreen] = useState("welcome"),
    [slide, setSlide] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [user, setUser] = useState<any>(null);
  const [month, setMonth] = useState(today().slice(0, 7)),
    [summary, setSummary] = useState<any>(null),
    [expenses, setExpenses] = useState<any[]>([]),
    [goals, setGoals] = useState<any[]>([]),
    [closures, setClosures] = useState<any[]>([]);
  const [income, setIncome] = useState(""),
    [fixed, setFixed] = useState(""),
    [saving, setSaving] = useState("");
  const [amount, setAmount] = useState(""),
    [description, setDescription] = useState(""),
    [date, setDate] = useState(today()),
    [category, setCategory] = useState(categories[0]);
  const [goalName, setGoalName] = useState(""),
    [target, setTarget] = useState(""),
    [saved, setSaved] = useState("0"),
    [monthly, setMonthly] = useState(""),
    [extra, setExtra] = useState("0"),
    [contribution, setContribution] = useState(""),
    [simulation, setSimulation] = useState<any>(null),
    [selectedGoal, setSelectedGoal] = useState("");
  const [reflection, setReflection] = useState(""),
    [objective, setObjective] = useState(objectives[0]),
    [confirmClose, setConfirmClose] = useState(false);
  async function load(m = month) {
    const [a, b, c, d] = await Promise.all([
      api("/summary?month=" + m),
      api("/expenses?month=" + m),
      api("/goals"),
      api("/closures"),
    ]);
    setSummary(a);
    setExpenses(b);
    setGoals(c);
    setClosures(d);
    if (a) {
      setIncome(String(a.income));
      setFixed(String(a.fixed));
      setSaving(String(a.saving));
    }
  }
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const go = (x: string) => {
    setError("");
    setNotice("");
    setConfirmClose(false);
    setScreen(x);
  };
  useEffect(() => {
    void run(async () => {
      if (await restore()) {
        const u = await api("/auth/me");
        setUser(u);
        await load();
        setScreen(u.objective ? "home" : "objective");
      }
    });
  }, []);
  async function auth() {
    const tokens = await api(
      "/auth/" + (screen === "register" ? "register" : "login"),
      "POST",
      screen === "register" ? { name, email, password } : { email, password },
    );
    await storeSession(tokens);
    setPassword("");
    const u = await api("/auth/me");
    setUser(u);
    await load();
    setScreen(u.objective ? "home" : "objective");
  }
  function num(x: string) {
    if (!/^\d+$/.test(x) || !Number.isSafeInteger(Number(x)))
      throw new Error("Ingresa montos enteros en pesos, sin puntos ni comas.");
    return Number(x);
  }
  const field = (
    label: string,
    value: string,
    set: (x: string) => void,
    numeric = false,
  ) => <Field label={label} value={value} onChange={set} numeric={numeric} />;
  const btn = (title: string, fn: () => Promise<void>) => (
    <Button title={title} disabled={busy} onPress={() => void run(fn)} />
  );
  if (screen === "welcome" || screen === "intro") {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <IntroScreens
          screen={screen}
          slide={slide}
          onSlide={setSlide}
          onStart={() => {
            setSlide(0);
            go("intro");
          }}
          onFinish={() => go("login")}
        />
      </SafeAreaProvider>
    );
  }
  if (screen === "login" || screen === "register") {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreens
          screen={screen}
          name={name}
          email={email}
          password={password}
          onName={setName}
          onEmail={setEmail}
          onPassword={setPassword}
          onSubmit={() => void run(auth)}
          onBack={() => go(screen === "register" ? "login" : "intro")}
          onRegister={() => go("register")}
          busy={busy}
          error={error}
        />
      </SafeAreaProvider>
    );
  }
  if (screen === "objective" || screen === "home") {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ObjectiveHomeScreens
          screen={screen}
          name={user?.name || ""}
          objective={objective}
          onObjective={setObjective}
          summary={summary}
          busy={busy}
          error={error}
          onNavigate={go}
          onRefresh={() =>
            run(async () => {
              await load();
            })
          }
          onContinue={() =>
            void run(async () => {
              await api("/profile/objective", "PUT", { objective });
              setUser({ ...user, objective });
              go("home");
            })
          }
          onBack={() =>
            void run(async () => {
              await logout();
              setUser(null);
              go("login");
            })
          }
          onLogout={() =>
            void run(async () => {
              await logout();
              setUser(null);
              setSummary(null);
              setExpenses([]);
              setGoals([]);
              setClosures([]);
              go("login");
            })
          }
        />
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.page}>
        <StatusBar style="dark" />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          {user &&
            !["login", "register", "objective", "welcome", "intro"].includes(
              screen,
            ) && (
              <>
                <View style={s.row}>
                  <Text style={s.title}>
                    Hola, {user.name.split(" ")[0]} 🌿
                  </Text>
                  <Pressable
                    onPress={() =>
                      void run(async () => {
                        await logout();
                        setUser(null);
                        setSummary(null);
                        setExpenses([]);
                        setGoals([]);
                        setClosures([]);
                        go("login");
                      })
                    }
                  >
                    <Text style={s.text}>Salir</Text>
                  </Pressable>
                </View>
                <Text style={s.text}>Aquí está tu resumen de este mes</Text>
                <View style={s.nav}>
                  {[
                    ["home", "Inicio"],
                    ["budget", "Presupuesto"],
                    ["expenses", "Gastos"],
                    ["goals", "Metas"],
                    ["closure", "Cierre"],
                  ].map(([x, label]) => (
                    <Pressable
                      key={x}
                      style={[
                        s.chip,
                        screen === x && { backgroundColor: colors.green },
                      ]}
                      onPress={() => go(x)}
                    >
                      <Text
                        style={{ color: screen === x ? "white" : colors.green }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {field("Mes (AAAA-MM)", month, setMonth)}
                {btn("Consultar mes", async () => {
                  await load();
                  setNotice("Datos actualizados");
                })}
              </>
            )}
          {screen === "budget" && (
            <>
              <Text style={s.title}>Planifica tu mes</Text>
              <Text style={s.text}>
                Los costos fijos se descuentan aquí. Registra en Gastos solo
                compras adicionales para evitar contarlas dos veces.
              </Text>
              {field("Ingresos mensuales", income, setIncome, true)}
              {field("Costos fijos", fixed, setFixed, true)}
              {field("Meta de ahorro mensual", saving, setSaving, true)}
              {btn("Guardar presupuesto", async () => {
                await api("/budget", "PUT", {
                  month,
                  income: num(income),
                  fixed: num(fixed),
                  saving: num(saving),
                });
                await load();
                go("home");
              })}
            </>
          )}
          {screen === "expenses" && (
            <>
              <Text style={s.title}>Registro de gastos</Text>
              {summary?.closed ? (
                <Text style={s.text}>Este mes está cerrado.</Text>
              ) : (
                <>
                  {field("Monto en pesos", amount, setAmount, true)}
                  {field("Descripción", description, setDescription)}
                  {field("Fecha (AAAA-MM-DD)", date, setDate)}
                  <View style={s.nav}>
                    {categories.map((c) => (
                      <Button
                        key={c}
                        secondary={category !== c}
                        title={c}
                        onPress={() => setCategory(c)}
                      />
                    ))}
                  </View>
                  {btn("Registrar gasto", async () => {
                    await api("/expenses", "POST", {
                      amount: num(amount),
                      description,
                      date,
                      category,
                    });
                    setAmount("");
                    setDescription("");
                    await load();
                    setNotice("Gasto registrado");
                  })}
                </>
              )}
              {expenses.length === 0 && (
                <Text style={s.text}>Sin gastos registrados en este mes.</Text>
              )}
              {expenses.map((e) => (
                <Card key={e.id}>
                  <View style={s.row}>
                    <Text style={s.text}>{e.description}</Text>
                    <Text style={s.text}>{money(e.amount)}</Text>
                  </View>
                  <Text style={s.text}>
                    {e.category} · {e.date}
                  </Text>
                  {!summary?.closed &&
                    btn("Eliminar gasto", async () => {
                      await api("/expenses/" + e.id, "DELETE");
                      await load();
                    })}
                </Card>
              ))}
            </>
          )}
          {screen === "goals" && (
            <>
              <Text style={s.title}>Ahorra con propósito</Text>
              <Text style={s.text}>
                Las alcancías registran ahorro declarado; no mueven dinero
                bancario ni modifican el presupuesto.
              </Text>
              {field("Nombre de la meta", goalName, setGoalName)}
              {field("Monto objetivo", target, setTarget, true)}
              {field("Ya ahorrado", saved, setSaved, true)}
              {field("Aporte mensual previsto", monthly, setMonthly, true)}
              {btn("Crear meta", async () => {
                await api("/goals", "POST", {
                  name: goalName,
                  target: num(target),
                  saved: num(saved),
                  monthly: num(monthly),
                });
                setGoalName("");
                setTarget("");
                await load();
                setNotice("Meta creada");
              })}
              {goals.map((g) => (
                <Card key={g.id}>
                  <Text style={s.title}>{g.name}</Text>
                  <Text style={s.text}>
                    {money(g.saved)} de {money(g.target)} · {g.months} meses
                    estimados
                  </Text>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: colors.cream,
                      borderRadius: 8,
                    }}
                  >
                    <View
                      style={{
                        height: 8,
                        width: `${Math.min(100, (g.saved / g.target) * 100)}%`,
                        backgroundColor: colors.green,
                        borderRadius: 8,
                      }}
                    />
                  </View>
                  <Button
                    title="Seleccionar para aportar o simular"
                    secondary={selectedGoal !== g.id}
                    onPress={() => {
                      setSelectedGoal(g.id);
                      setSimulation(null);
                    }}
                  />
                  {selectedGoal === g.id && (
                    <>
                      {field(
                        "Aporte a esta alcancía",
                        contribution,
                        setContribution,
                        true,
                      )}
                      {btn("Registrar aporte", async () => {
                        await api("/goals/" + g.id + "/contributions", "POST", {
                          amount: num(contribution),
                        });
                        setContribution("");
                        await load();
                      })}
                      {field(
                        "Gasto extraordinario hipotético",
                        extra,
                        setExtra,
                        true,
                      )}
                      {btn("Simular impacto", async () => {
                        setSimulation(
                          await api("/goals/" + g.id + "/simulate", "POST", {
                            extra: num(extra),
                          }),
                        );
                      })}
                      {simulation && (
                        <Text style={s.text}>
                          Retraso: {simulation.delayMonths} meses. Fecha
                          estimada: {simulation.estimatedDate}. La simulación no
                          registra un gasto.
                        </Text>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </>
          )}
          {screen === "closure" && (
            <>
              <Text style={s.title}>Reflexiona sobre tu mes</Text>
              {summary && (
                <Card>
                  <Text style={s.text}>Ingresos: {money(summary.income)}</Text>
                  <Text style={s.text}>
                    Costos fijos: {money(summary.fixed)}
                  </Text>
                  <Text style={s.text}>
                    Gastos adicionales: {money(summary.spent)}
                  </Text>
                  <Text style={s.text}>
                    Ahorro real disponible:{" "}
                    {money(summary.income - summary.fixed - summary.spent)}
                  </Text>
                  <Text style={s.text}>
                    Ahorro planificado: {money(summary.saving)}
                  </Text>
                </Card>
              )}
              {summary && !summary.closed && (
                <>
                  {field(
                    "¿Qué mejorarás en el siguiente ciclo?",
                    reflection,
                    setReflection,
                  )}
                  {confirmClose ? (
                    <>
                      <Text style={s.text}>
                        El cierre bloqueará cambios en el presupuesto y los
                        gastos de {month}.
                      </Text>
                      {btn("Confirmar cierre mensual", async () => {
                        await api("/closures", "POST", { month, reflection });
                        await load();
                        setConfirmClose(false);
                        setNotice("Mes cerrado");
                      })}
                      <Button
                        title="Cancelar"
                        secondary
                        onPress={() => setConfirmClose(false)}
                      />
                    </>
                  ) : (
                    <Button
                      title="Cerrar mes"
                      onPress={() => setConfirmClose(true)}
                    />
                  )}
                </>
              )}
              {closures.map((c) => (
                <Card key={c.month}>
                  <Text style={s.title}>{c.month}</Text>
                  <Text style={s.text}>
                    Ahorro real: {money(c.actualSaving)}
                  </Text>
                  <Text style={s.text}>
                    {c.reflection || "Sin reflexión escrita."}
                  </Text>
                </Card>
              ))}
            </>
          )}
          {busy && (
            <ActivityIndicator color={colors.green} style={{ margin: 12 }} />
          )}
          {error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          {notice && <Text style={s.subtitle}>{notice}</Text>}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
