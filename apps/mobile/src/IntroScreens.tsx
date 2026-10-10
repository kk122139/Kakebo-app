import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, colors } from "./ui";

const slides = [
  {
    image: require("../assets/foto_1.png"),
    title: "Conoce tus hábitos",
    description: "Registra tus gastos de forma simple y visual",
  },
  {
    image: require("../assets/foto_2.png"),
    title: "Ahorra con propósito",
    description: "Establece metas que te motiven y acompáñalas paso a paso",
  },
  {
    image: require("../assets/foto_3.png"),
    title: "Construye la vida que quieres",
    description: "Pequeñas decisiones hoy, grandes resultados mañana",
  },
];

export function IntroScreens({
  screen,
  slide,
  onSlide,
  onStart,
  onFinish,
}: {
  screen: "welcome" | "intro";
  slide: number;
  onSlide: (index: number) => void;
  onStart: () => void;
  onFinish: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [frame, setFrame] = useState({ width, height });
  const usableHeight = Math.max(240, height - insets.top - insets.bottom);
  const imageSize = Math.max(
    100,
    Math.min(300, Math.min(width, 520) - 64, usableHeight * 0.38),
  );

  if (screen === "welcome") {
    return (
      <View
        style={[styles.welcome, { height, minHeight: 0 }]}
        onLayout={({ nativeEvent }) => {
          const next = nativeEvent.layout;
          if (next.width > 0 && next.height > 0) {
            setFrame((previous) =>
              previous.width === next.width && previous.height === next.height
                ? previous
                : { width: next.width, height: next.height },
            );
          }
        }}
      >
        {/* El fondo no participa del layout: sus píxeles no pueden agrandar el contenedor. */}
        <Image
          source={require("../assets/foto_inicial.png")}
          resizeMode="cover"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: frame.width,
            height: frame.height,
          }}
          accessibilityLabel="Kakebo. Tu dinero, con más intención. Registra tus gastos, entiende tus hábitos y construye la vida que quieres."
        />
        <View
          style={{
            position: "absolute",
            bottom: Math.max(insets.bottom + 24, frame.height * 0.075),
            width: Math.min(320, frame.width * 0.68),
            left: (frame.width - Math.min(320, frame.width * 0.68)) / 2,
          }}
        >
          <Button title="Comenzar →" onPress={onStart} />
        </View>
      </View>
    );
  }

  const current = slides[slide];
  return (
    <ScrollView
      style={styles.shell}
      contentContainerStyle={[
        styles.intro,
        {
          minHeight: height,
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(32, insets.bottom + 20),
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saltar introducción"
          hitSlop={12}
          onPress={onFinish}
        >
          <Text style={styles.skip}>Saltar</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <Image
          source={current.image}
          resizeMode="contain"
          accessibilityLabel={current.title}
          style={{ width: imageSize, height: imageSize }}
        />
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((item, index) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              accessibilityLabel={`Ver introducción ${index + 1}`}
              accessibilityState={{ selected: index === slide }}
              hitSlop={10}
              onPress={() => onSlide(index)}
              style={[
                styles.dot,
                index === slide && { backgroundColor: colors.green },
              ]}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            slide < 2 ? "Siguiente pantalla" : "Ir al inicio de sesión"
          }
          onPress={() => (slide < 2 ? onSlide(slide + 1) : onFinish())}
          style={styles.next}
        >
          <Text style={styles.arrow}>→</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.cream },
  welcome: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.cream,
    overflow: "hidden",
  },
  intro: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 32,
  },
  header: { alignItems: "flex-end" },
  skip: { color: colors.green, fontSize: 13, padding: 8 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    color: colors.green,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 31,
    marginTop: 26,
    marginBottom: 18,
  },
  description: {
    color: colors.green,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 25,
    maxWidth: 290,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 44,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#D9D9D9" },
  next: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { color: "white", fontSize: 26 },
});
