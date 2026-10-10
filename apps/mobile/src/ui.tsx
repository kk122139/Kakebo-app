import React from "react";
import {
  Text,
  TextInput,
  Pressable,
  View,
  StyleSheet,
  Image,
} from "react-native";
export const colors = {
  green: "#285D48",
  cream: "#F7F0E5",
  ink: "#20382D",
  muted: "#718078",
  line: "#DDD9CF",
  white: "#FFFFFF",
};
export const money = (n: number) => "$" + n.toLocaleString("es-CL");
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.button, secondary && s.secondary, disabled && { opacity: 0.5 }]}
    >
      <Text
        style={{
          color: secondary ? colors.green : "white",
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  password = false,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (x: string) => void;
  password?: boolean;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 6, marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={password}
        autoCapitalize="none"
        keyboardType={
          numeric
            ? "number-pad"
            : label.includes("correo")
              ? "email-address"
              : "default"
        }
        style={s.input}
      />
    </View>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
export function Leaf() {
  return (
    <View style={{ alignItems: "center", marginVertical: 24 }}>
      <Image
        source={require("../assets/Logo.png")}
        resizeMode="contain"
        accessibilityLabel="Kakebo"
        style={{ width: 210, height: 105 }}
      />
      <Text style={s.subtitle}>Tu dinero, con más intención</Text>
    </View>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: {
    padding: 24,
    paddingBottom: 48,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.green,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.green,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  label: { fontSize: 13, color: colors.ink, fontWeight: "500" },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.ink,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 26,
    padding: 15,
    marginVertical: 6,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.green,
  },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 18,
    marginVertical: 8,
    gap: 8,
  },
  big: { fontSize: 32, fontWeight: "700", color: colors.green },
  text: { color: colors.ink, lineHeight: 22 },
  error: {
    backgroundColor: "#FFE8DE",
    padding: 12,
    borderRadius: 12,
    color: "#813828",
    marginVertical: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  nav: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 16 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 10,
    backgroundColor: "white",
  },
});
