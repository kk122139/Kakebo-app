import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, money } from "./ui";
const leaves = require("../assets/hojas.png");
const glyphs = {
  bell: require("../assets/home-icons/bell.png"),
  home: require("../assets/home-icons/home.png"),
  bank: require("../assets/home-icons/bank.png"),
  chart: require("../assets/home-icons/chart.png"),
  list: require("../assets/home-icons/list.png"),
  money: require("../assets/home-icons/money.png"),
  wallet: require("../assets/home-icons/wallet.png"),
};
function Glyph({
  name,
  size = 24,
}: {
  name: keyof typeof glyphs;
  size?: number;
}) {
  return (
    <Image
      source={glyphs[name]}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

const choices = [
  { icon: "🐖", label: "Ahorrar más dinero" },
  { icon: "🪴", label: "Controlar mis gastos" },
  { icon: "▥", label: "Planificar mis metas" },
  { icon: "⭐", label: "Conocer mis hábitos" },
];
type Summary = {
  income: number;
  fixed: number;
  saving: number;
  spent: number;
  available: number;
  closed: boolean;
};
type Props = {
  screen: "objective" | "home";
  name: string;
  objective: string;
  onObjective: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  summary: Summary | null;
  busy: boolean;
  error: string;
};
function Progress({
  value,
  color,
  background,
}: {
  value: number;
  color: string;
  background: string;
}) {
  return (
    <View style={[st.track, { backgroundColor: background }]}>
      <View
        style={{
          height: "100%",
          width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`,
          backgroundColor: color,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
function Action({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[st.action, disabled && { opacity: 0.5 }]}
    >
      <Text style={st.actionText}>{label}</Text>
    </Pressable>
  );
}
export function ObjectiveHomeScreens(p: Props) {
  const insets = useSafeAreaInsets(),
    { height, width } = useWindowDimensions();
  const [more, setMore] = useState(false);
  const objective = p.screen === "objective";
  const scale = Math.max(0.8, Math.min(1.15, width / 390));
  const ratio = (n: number) =>
    p.summary && p.summary.income > 0 ? n / p.summary.income : 0;
  return (
    <View style={st.page}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={leaves}
          resizeMode="contain"
          style={
            objective
              ? [st.topRight, { width: 120 * scale, height: 215 * scale }]
              : [st.topLeft, { width: 95 * scale, height: 175 * scale }]
          }
        />
        <Image
          source={leaves}
          resizeMode="contain"
          style={
            objective
              ? [st.bottomLeaves, { width: 170 * scale, height: 315 * scale }]
              : [
                  st.homeLeaves,
                  {
                    width: 240 * scale,
                    height: 450 * scale,
                    bottom: 70 + insets.bottom,
                  },
                ]
          }
        />
      </View>
      <ScrollView
        refreshControl={
          !objective ? (
            <RefreshControl
              refreshing={p.busy}
              onRefresh={() => void p.onRefresh()}
              tintColor={colors.green}
            />
          ) : undefined
        }
        contentContainerStyle={[
          st.content,
          {
            paddingTop: insets.top + 14,
            paddingBottom: objective ? insets.bottom + 36 : 110 + insets.bottom,
            minHeight: height,
          },
        ]}
      >
        {objective ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={p.onBack}
              disabled={p.busy}
              style={st.back}
            >
              <Text style={{ fontSize: 32, color: "#111" }}>‹</Text>
            </Pressable>
            <Text style={[st.objectiveTitle, { marginTop: 10 * scale }]}>
              ¿Cuál es tu objetivo{"\n"}principal?
            </Text>
            <View style={[st.choices, { marginTop: 46 * scale }]}>
              {choices.map((c) => (
                <Pressable
                  key={c.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: p.objective === c.label }}
                  onPress={() => p.onObjective(c.label)}
                  style={[st.choice, p.objective === c.label && st.selected]}
                >
                  <Text
                    style={[
                      st.choiceIcon,
                      c.label === "Planificar mis metas" && {
                        color: "#A663F5",
                      },
                    ]}
                  >
                    {c.icon}
                  </Text>
                  <Text style={st.choiceLabel}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={[st.continue, { marginTop: 30 * scale }]}>
              <Action
                label={p.busy ? "Guardando…" : "Continuar"}
                onPress={p.onContinue}
                disabled={p.busy}
              />
            </View>
          </>
        ) : (
          <>
            <View style={[st.header, { marginTop: 68 * scale }]}>
              <View style={{ flex: 1 }}>
                <Text style={st.greeting}>
                  Hola, {p.name.split(" ")[0] || "bienvenido"}
                </Text>
                <Text style={st.subtitle}>
                  Aquí está tu resumen de este mes
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notificaciones"
                onPress={() =>
                  Alert.alert(
                    "Notificaciones",
                    "No tienes notificaciones por ahora.",
                  )
                }
                style={st.bell}
              >
                <Glyph name="bell" />
              </Pressable>
            </View>
            {p.summary ? (
              <>
                <View style={st.balance}>
                  <View style={st.row}>
                    <Text style={st.label}>Dinero disponible</Text>
                    <Glyph name="wallet" size={34} />
                  </View>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={st.amount}
                  >
                    {money(p.summary.available)}
                  </Text>
                  <Progress
                    value={ratio(p.summary.available)}
                    color={colors.green}
                    background="#C6C5C2"
                  />
                  <Text style={st.balanceCaption}>
                    de {money(p.summary.income)}
                  </Text>
                </View>
                <View style={st.stats}>
                  <View style={[st.stat, { backgroundColor: "#F0E7EA" }]}>
                    <View style={st.row}>
                      <Text style={st.label}>Gastado</Text>
                      <Text style={{ fontSize: 25 }}>💸</Text>
                    </View>
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      style={[st.statAmount, { color: "#B60000" }]}
                    >
                      {money(p.summary.spent + p.summary.fixed)}
                    </Text>
                    <Progress
                      value={ratio(p.summary.spent + p.summary.fixed)}
                      color="#FF7F80"
                      background="#F8CFD6"
                    />
                  </View>
                  <View style={[st.stat, { backgroundColor: "#F7F0E5" }]}>
                    <View style={st.row}>
                      <Text style={st.label}>Ahorro previsto</Text>
                      <Text style={{ fontSize: 25 }}>🐖</Text>
                    </View>
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      style={st.statAmount}
                    >
                      {money(p.summary.saving)}
                    </Text>
                    <Progress
                      value={ratio(p.summary.saving)}
                      color="#46971A"
                      background="#A9CDB0"
                    />
                  </View>
                </View>
                <View style={{ marginTop: 32 * scale, paddingHorizontal: 10 }}>
                  <Action
                    label={
                      p.summary.closed ? "Mes cerrado" : "+ Registrar Gasto"
                    }
                    onPress={() => p.onNavigate("expenses")}
                    disabled={p.summary.closed}
                  />
                </View>
              </>
            ) : (
              <View style={st.empty}>
                <Text style={st.greeting}>Tu primer presupuesto</Text>
                <Text style={st.subtitle}>
                  Define tus ingresos, costos fijos y ahorro para ver tu
                  resumen.
                </Text>
                <Action
                  label="Configurar presupuesto"
                  onPress={() => p.onNavigate("budget")}
                />
              </View>
            )}
          </>
        )}
        {p.error !== "" && (
          <Text accessibilityRole="alert" style={st.error}>
            {p.error}
          </Text>
        )}
        {p.busy && (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.green} />
        )}
      </ScrollView>
      {!objective && (
        <View style={[st.nav, { paddingBottom: Math.max(10, insets.bottom) }]}>
          {[
            { label: "Inicio", icon: "home", screen: "home" },
            { label: "Gastos", icon: "money", screen: "expenses" },
            { label: "Presupuesto", icon: "bank", screen: "budget" },
            { label: "Análisis", icon: "chart", screen: "closure" },
            { label: "Más", icon: "list", screen: "more" },
          ].map((tab) => (
            <Pressable
              key={tab.label}
              accessibilityRole="button"
              accessibilityState={{ selected: tab.screen === "home" }}
              onPress={() =>
                tab.screen === "more" ? setMore(true) : p.onNavigate(tab.screen)
              }
              style={st.navItem}
            >
              <Glyph name={tab.icon as keyof typeof glyphs} />
              <Text style={st.navLabel}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Modal
        visible={more}
        transparent
        animationType="slide"
        onRequestClose={() => setMore(false)}
      >
        <Pressable style={st.overlay} onPress={() => setMore(false)}>
          <Pressable
            style={[st.menu, { paddingBottom: 24 + insets.bottom }]}
            onPress={() => {}}
          >
            <Text style={st.greeting}>Más opciones</Text>
            {[
              { label: "Metas de ahorro", screen: "goals" },
              { label: "Cierre mensual", screen: "closure" },
            ].map((item) => (
              <Action
                key={item.screen}
                label={item.label}
                onPress={() => {
                  setMore(false);
                  p.onNavigate(item.screen);
                }}
              />
            ))}
            <Action
              label="Cerrar sesión"
              onPress={() => {
                setMore(false);
                p.onLogout();
              }}
            />
            <Pressable onPress={() => setMore(false)} style={{ padding: 12 }}>
              <Text style={st.subtitle}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF", overflow: "hidden" },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  topRight: {
    position: "absolute",
    top: -36,
    right: -20,
    transform: [{ rotate: "180deg" }],
  },
  topLeft: {
    position: "absolute",
    top: -34,
    left: -28,
    transform: [{ rotate: "180deg" }],
  },
  bottomLeaves: { position: "absolute", left: -48, bottom: -65 },
  homeLeaves: { position: "absolute", left: -90 },
  back: { width: 44, height: 44, justifyContent: "center" },
  objectiveTitle: {
    textAlign: "center",
    fontSize: 26,
    lineHeight: 34,
    color: "#111",
    fontWeight: "500",
  },
  choices: { width: "78%", maxWidth: 300, alignSelf: "center", gap: 22 },
  choice: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#AAA",
    borderRadius: 15,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 12,
  },
  selected: { borderColor: colors.green, backgroundColor: "#F4F8F4" },
  choiceIcon: { fontSize: 30, width: 36, textAlign: "center" },
  choiceLabel: { fontSize: 13, flex: 1, color: "#111" },
  continue: { width: "78%", maxWidth: 300, alignSelf: "center" },
  action: {
    minHeight: 50,
    borderRadius: 28,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  actionText: { fontSize: 16, color: "white", textAlign: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  greeting: { fontSize: 23, color: colors.green, fontWeight: "600" },
  subtitle: { fontSize: 12, lineHeight: 19, color: colors.green, marginTop: 8 },
  bell: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  balance: {
    backgroundColor: "#F3F3F3",
    borderRadius: 10,
    padding: 18,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  label: { fontSize: 13, color: "#111", flexShrink: 1 },
  amount: { fontSize: 32, fontWeight: "600", color: colors.green },
  balanceCaption: { fontSize: 13, color: colors.green },
  track: { height: 13, borderRadius: 8, overflow: "hidden" },
  stats: { flexDirection: "row", gap: 18, marginTop: 24 },
  stat: { flex: 1, padding: 14, borderRadius: 10, gap: 12 },
  statAmount: { fontSize: 23, fontWeight: "600", color: "#111" },
  empty: { backgroundColor: "#F3F3F3", padding: 20, borderRadius: 14, gap: 18 },
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#34573D",
    flexDirection: "row",
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  navIcon: { fontSize: 25, color: "#FFF" },
  navLabel: { fontSize: 10, color: "#FFF", marginTop: 3 },
  error: {
    color: "#813828",
    backgroundColor: "#FFE8DE",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  overlay: { flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" },
  menu: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
});
