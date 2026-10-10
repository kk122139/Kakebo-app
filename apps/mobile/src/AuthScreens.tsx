import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "./ui";

type Props = {
  screen: "login" | "register";
  name: string;
  email: string;
  password: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onRegister: () => void;
  busy: boolean;
  error: string;
};
const icons = {
  mail: require("../assets/auth/mail.png"),
  person: require("../assets/auth/person.png"),
  lock: require("../assets/auth/lock.png"),
  eye: require("../assets/auth/eye.png"),
  apple: require("../assets/auth/apple.png"),
};
function Input({
  placeholder,
  value,
  onChange,
  kind,
  icon,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  kind?: "email" | "password";
  icon: "mail" | "person" | "lock";
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.inputRow}>
      <Image source={icons[icon]} style={styles.icon} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor="#777"
        value={value}
        onChangeText={onChange}
        autoCapitalize={
          kind === "password" || kind === "email" ? "none" : "words"
        }
        autoCorrect={false}
        keyboardType={kind === "email" ? "email-address" : "default"}
        secureTextEntry={kind === "password" && !visible}
        textContentType={
          kind === "email"
            ? "emailAddress"
            : kind === "password"
              ? "password"
              : "name"
        }
        style={styles.input}
      />
      {kind === "password" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            visible ? "Ocultar contraseña" : "Mostrar contraseña"
          }
          hitSlop={8}
          onPress={() => setVisible(!visible)}
        >
          <Image
            source={icons.eye}
            style={[styles.icon, { opacity: visible ? 1 : 0.55 }]}
          />
        </Pressable>
      )}
    </View>
  );
}
export function AuthScreens(p: Props) {
  const register = p.screen === "register";
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const scale = Math.min(1.12, Math.max(0.82, width / 390));
  const unavailable = (feature: string) =>
    Alert.alert(
      feature,
      "Esta función todavía no está conectada. Puedes usar tu correo y contraseña.",
    );
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            minHeight: height,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 28,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          disabled={p.busy}
          onPress={p.onBack}
          style={styles.back}
        >
          <Text style={{ fontSize: 32, color: "#111" }}>‹</Text>
        </Pressable>
        <View
          style={[
            styles.heading,
            { marginTop: register ? 40 * scale : 12 * scale },
          ]}
        >
          {register ? (
            <Text style={styles.title}>Crear Cuenta</Text>
          ) : (
            <Image
              source={require("../assets/Logo.png")}
              resizeMode="contain"
              accessibilityLabel="Kakebo"
              style={{ width: 190 * scale, height: 95 * scale }}
            />
          )}
          <Text style={styles.subtitle}>
            {register
              ? "Nos alegra que estés aquí 😊"
              : "Tu dinero, con más intención"}
          </Text>
        </View>
        <View
          style={[
            styles.form,
            { marginTop: register ? 52 * scale : 56 * scale },
          ]}
        >
          {register && (
            <Input
              icon="person"
              placeholder="Nombre y apellido"
              value={p.name}
              onChange={p.onName}
            />
          )}
          <Input
            icon="mail"
            placeholder="Correo electrónico"
            value={p.email}
            onChange={p.onEmail}
            kind="email"
          />
          <Input
            icon="lock"
            placeholder="Contraseña"
            value={p.password}
            onChange={p.onPassword}
            kind="password"
          />
          {!register && (
            <Pressable
              accessibilityRole="button"
              onPress={() => unavailable("Recuperar contraseña")}
              style={styles.forgot}
            >
              <Text style={styles.small}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          )}
          {p.error !== "" && (
            <Text accessibilityRole="alert" style={styles.error}>
              {p.error}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={p.busy}
            accessibilityLabel={register ? "Crear cuenta" : "Iniciar sesión"}
            onPress={p.onSubmit}
            style={[
              styles.submit,
              { marginTop: register ? 12 : 24 },
              p.busy && { opacity: 0.6 },
            ]}
          >
            {p.busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>
                {register ? "Crear cuenta" : "Iniciar sesión"}
              </Text>
            )}
          </Pressable>
          {register ? (
            <Text style={styles.terms}>
              Al continuar, aceptas nuestros{"\n"}Términos y Condiciones y
              Política de Privacidad
            </Text>
          ) : (
            <>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>O continúa con</Text>
                <View style={styles.line} />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => unavailable("Continuar con Google")}
                style={styles.social}
              >
                <Text style={styles.google}>G</Text>
                <Text style={styles.socialText}>Continuar con Google</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => unavailable("Continuar con Apple")}
                style={styles.social}
              >
                <Image source={icons.apple} style={styles.icon} />
                <Text style={styles.socialText}>Continuar con Apple</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={p.onRegister}
                style={styles.signup}
              >
                <Text style={styles.small}>
                  ¿No tienes cuenta?{" "}
                  <Text style={{ fontWeight: "700" }}>Regístrate</Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "white" },
  content: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  back: {
    alignSelf: "flex-start",
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  heading: { alignItems: "center" },
  title: { fontSize: 26, fontWeight: "600", color: colors.green },
  subtitle: {
    fontSize: 16,
    color: colors.green,
    textAlign: "center",
    marginTop: 12,
  },
  form: { width: "78%", maxWidth: 320, alignSelf: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#AAA",
    borderRadius: 9,
    minHeight: 50,
    paddingHorizontal: 13,
    marginBottom: 24,
  },
  icon: { width: 20, height: 20, resizeMode: "contain" },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: "#222",
    paddingVertical: 12,
  },
  forgot: { alignSelf: "center", padding: 8, marginTop: -9 },
  small: { fontSize: 12, color: colors.green, textAlign: "center" },
  submit: {
    backgroundColor: colors.green,
    borderRadius: 28,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 16 },
  terms: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.green,
    textAlign: "center",
    marginTop: 18,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 23,
    marginHorizontal: -24,
  },
  line: { flex: 1, height: 1, backgroundColor: "#888" },
  or: { fontSize: 11, color: "#222" },
  social: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#AAA",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 18,
  },
  socialText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#111",
    paddingRight: 20,
  },
  google: { fontSize: 23, fontWeight: "700", color: "#4285F4", width: 20 },
  signup: { padding: 12, marginTop: 8 },
  error: {
    fontSize: 12,
    color: "#813828",
    backgroundColor: "#FFE8DE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
});
