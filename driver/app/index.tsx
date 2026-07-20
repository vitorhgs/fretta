import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Svg, { Path, Rect, Circle, LinearGradient, Stop, Defs } from "react-native-svg";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

export default function Splash() {
  const router = useRouter();
  const { session, loading } = useAuth();

  // Animações
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de entrada em cascata
    Animated.sequence([
      // 1. Logo aparece com bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 2. Texto aparece
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 3. Loader aparece
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotação suave do pino
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (session) {
        router.replace("/home" as any);
      } else {
        router.replace("/login" as any);
      }
    }, 1500); // Mais tempo pra ver a splash

    return () => clearTimeout(timer);
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Efeitos de fundo decorativos */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Svg width={110} height={110} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#1E56D4" />
                <Stop offset="1" stopColor="#0D3A9E" />
              </LinearGradient>
              <LinearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="1" stopColor="#E0E7FF" />
              </LinearGradient>
            </Defs>

            {/* Fundo com gradiente */}
            <Rect x="4" y="4" width="92" height="92" rx="22" fill="url(#bgGrad)" />

            {/* Brilho no topo */}
            <Rect
              x="4"
              y="4"
              width="92"
              height="46"
              rx="22"
              fill="rgba(255,255,255,0.08)"
            />

            {/* Trilha de rota tracejada */}
            <Path
              d="M 20 78 Q 35 78 45 62 T 78 40"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="4 4"
            />

            {/* Letra F */}
            <Rect x="30" y="22" width="14" height="58" rx="3" fill="url(#fGrad)" />
            <Rect x="30" y="22" width="42" height="14" rx="3" fill="url(#fGrad)" />
            <Rect x="30" y="46" width="30" height="12" rx="3" fill="url(#fGrad)" />

            {/* Pontinho de destino verde */}
            <Circle cx="78" cy="40" r="5" fill="#22C55E" />
            <Circle cx="78" cy="40" r="2.5" fill="#FFFFFF" />
          </Svg>
        </View>
      </Animated.View>

      {/* Textos */}
      <Animated.View
        style={[styles.textosContainer, { opacity: textOpacity }]}
      >
        <Text style={styles.logoText}>Fretta</Text>
        <Text style={styles.tagline}>DRIVER</Text>
        <Text style={styles.slogan}>Gestão inteligente de fretamento</Text>
      </Animated.View>

      {/* Loader no rodapé */}
      <Animated.View
        style={[styles.loadingContainer, { opacity: loaderOpacity }]}
      >
        <ActivityIndicator size="small" color={colors.white} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </Animated.View>

      {/* Versão no rodapé */}
      <Animated.View style={[styles.versao, { opacity: loaderOpacity }]}>
        <Text style={styles.versaoTexto}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width,
    backgroundColor: "rgba(30, 86, 212, 0.15)",
    top: -width * 0.4,
    left: -width * 0.3,
  },
  bgCircle2: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    bottom: -width * 0.3,
    right: -width * 0.2,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  logoWrapper: {
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 30,
    elevation: 20,
  },
  textosContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  logoText: {
    color: colors.white,
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginBottom: 2,
  },
  tagline: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 10,
    marginBottom: 16,
    opacity: 0.9,
  },
  slogan: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.7,
  },
  versao: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  versaoTexto: {
    color: colors.white,
    fontSize: 10,
    opacity: 0.4,
    letterSpacing: 2,
  },
});