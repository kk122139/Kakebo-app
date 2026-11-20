import React, { useEffect, useRef, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { api, restore, storeSession, logout } from "./src/api";
import { ObjectiveHomeScreens } from "./src/ObjectiveHomeScreens";
import { AuthScreens } from "./src/AuthScreens";
import { IntroScreens } from "./src/IntroScreens";
import { FinanceScreens } from "./src/FinanceScreens";
import {
  localDate,
  weekStart,
  Summary,
  Expense,
  Goal,
  Closure,
  WeeklyAnalysis,
} from "./src/financeModel";

export default function App() {
  const [screen, setScreen] = useState("welcome"),
    [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const lock = useRef(false);
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [user, setUser] = useState<{
    name: string;
    email: string;
    objective?: string;
  } | null>(null);
  const [objective, setObjective] = useState("Ahorrar más dinero");
  const [month, setMonth] = useState(localDate().slice(0, 7)),
    [week, setWeek] = useState(weekStart());
  const [summary, setSummary] = useState<Summary | null>(null),
    [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]),
    [closures, setClosures] = useState<Closure[]>([]);
  const [analysis, setAnalysis] = useState<WeeklyAnalysis | null>(null);
  async function load(m = month, w = week) {
    const [a, b, c, d, e] = await Promise.all([
      api("/summary?month=" + m),
      api("/expenses?month=" + m),
      api("/goals"),
      api("/closures"),
      api("/analysis?week=" + w),
    ]);
    setSummary(a);
    setExpenses(b);
    setGoals(c);
    setClosures(d);
    setAnalysis(e);
    setMonth(m);
    setWeek(w);
  }
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (lock.current) return undefined;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      return await fn();
    } catch (e: any) {
      setError(e.message || "No se pudo completar la operación.");
      return undefined;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function go(next: string) {
    if (lock.current) return;
    setError("");
    setNotice("");
    setScreen(next);
  }
  async function authenticate() {
    const tokens = await api(
      "/auth/" + (screen === "register" ? "register" : "login"),
      "POST",
      screen === "register"
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password },
    );
    await storeSession(tokens);
    setPassword("");
    const u = await api("/auth/me");
    setUser(u);
    setObjective(u.objective || "Ahorrar más dinero");
    setScreen(u.objective ? "home" : "objective");
    await load();
  }
  async function signOut() {
    await run(async () => {
      await logout();
      setUser(null);
      setSummary(null);
      setExpenses([]);
      setGoals([]);
      setClosures([]);
      setAnalysis(null);
      setEmail("");
      setName("");
      setMonth(localDate().slice(0, 7));
      setWeek(weekStart());
      setScreen("login");
    });
  }
  async function save(
    path: string,
    method: string,
    data: unknown,
    message: string,
    m = month,
  ): Promise<boolean> {
    const result = await run(async () => {
      await api(path, method, data);
      // A committed write must not be presented as a failed write if refreshing fails.
      try {
        await load(m);
      } catch {
        setNotice(
          message +
            " No se pudo actualizar la vista. Vuelve a Inicio y desliza para actualizar.",
        );
        return true;
      }
      setNotice(message);
      return true;
    });
    return result === true;
  }
  useEffect(() => {
    void run(async () => {
      if (await restore()) {
        const u = await api("/auth/me");
        setUser(u);
        setObjective(u.objective || "Ahorrar más dinero");
        setScreen(u.objective ? "home" : "objective");
        await load();
      }
    });
  }, []);
  let content: React.ReactNode;
  if (screen === "welcome" || screen === "intro")
    content = (
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
    );
  else if (screen === "login" || screen === "register")
    content = (
      <AuthScreens
        screen={screen}
        name={name}
        email={email}
        password={password}
        onName={setName}
        onEmail={setEmail}
        onPassword={setPassword}
        onSubmit={() => void run(authenticate)}
        onBack={() => go(screen === "register" ? "login" : "intro")}
        onRegister={() => go("register")}
        busy={busy}
        error={error}
      />
    );
  else if ((screen === "objective" || screen === "home") && user)
    content = (
      <ObjectiveHomeScreens
        screen={screen}
        name={user.name}
        objective={objective}
        onObjective={setObjective}
        summary={summary}
        busy={busy}
        error={error}
        onNavigate={go}
        onRefresh={async () => {
          await run(() => load());
        }}
        onContinue={() =>
          void run(async () => {
            await api("/profile/objective", "PUT", { objective });
            setUser({ ...user, objective });
            setScreen("home");
          })
        }
        onBack={() => (user.objective ? go("settings") : void signOut())}
        onLogout={() => void signOut()}
      />
    );
  else if (user)
    content = (
      <FinanceScreens
        screen={screen}
        user={user}
        summary={summary}
        month={month}
        expenses={expenses}
        goals={goals}
        closures={closures}
        analysis={analysis}
        week={week}
        busy={busy}
        error={error}
        notice={notice}
        onNavigate={go}
        onMonth={(m) => void run(() => load(m))}
        onWeek={(w) =>
          void run(async () => {
            const a = await api("/analysis?week=" + w);
            setAnalysis(a);
            setWeek(w);
          })
        }
        onExpense={async (d) => {
          const ok = await save(
            "/expenses",
            "POST",
            d,
            "Gasto registrado.",
            d.date.slice(0, 7),
          );
          if (ok) setScreen("expenses");
          return ok;
        }}
        onDelete={(id) =>
          save("/expenses/" + id, "DELETE", undefined, "Gasto eliminado.")
        }
        onBudget={(d) =>
          save("/budget", "PUT", { ...d, month }, "Presupuesto guardado.")
        }
        onGoal={(d) => save("/goals", "POST", d, "Meta creada.")}
        onContribution={(id, amount) =>
          save(
            "/goals/" + id + "/contributions",
            "POST",
            { amount },
            "Aporte registrado.",
          )
        }
        onSimulate={(id, extra) =>
          run(() => api("/goals/" + id + "/simulate", "POST", { extra }))
        }
        onClose={(reflection) =>
          save("/closures", "POST", { month, reflection }, "Mes cerrado.")
        }
        onLogout={() => void signOut()}
      />
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {content}
    </SafeAreaProvider>
  );
}
