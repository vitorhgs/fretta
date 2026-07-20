import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, shadows } from "../theme/colors";
import { useConexao } from "../hooks/useConexao";

function IconeOffline() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.18 13.8 23.64 7zM3.41 1.31L2 2.72l2.05 2.05C1.91 5.76.59 6.82.36 7L12 21.5l3.91-4.87 3.32 3.32 1.41-1.41L3.41 1.31z" />
    </Svg>
  );
}

function IconeOnline() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
    </Svg>
  );
}

interface BadgeOfflineProps {
  posicaoTop?: number; // permite ajustar altura em telas diferentes
}

export default function BadgeOffline({ posicaoTop = 60 }: BadgeOfflineProps) {
  const { online } = useConexao();
  const [mensagem, setMensagem] = useState<null | "offline" | "online">(null);
  const [mostrarBadgeFixo, setMostrarBadgeFixo] = useState(false);

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const primeiraMontagem = useRef(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Primeira montagem: se estiver offline, mostra badge fixo direto
    if (primeiraMontagem.current) {
      primeiraMontagem.current = false;
      if (!online) {
        setMostrarBadgeFixo(true);
      }
      return;
    }

    // Mudou de estado — mostra toast animado
    if (online) {
      setMensagem("online");
      setMostrarBadgeFixo(false); // remove badge fixo
    } else {
      setMensagem("offline");
      setMostrarBadgeFixo(true); // mostra badge fixo
    }

    // Anima entrada
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Timer pra sumir o toast depois de 3 segundos
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMensagem(null);
      });
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [online]);

  // Badge fixo (sempre visível quando offline)
  const BadgeFixo = () =>
    mostrarBadgeFixo && !mensagem ? (
      <View style={[styles.badgeFixo, { top: posicaoTop }]}>
        <IconeOffline />
        <Text style={styles.badgeFixoTexto}>OFFLINE</Text>
      </View>
    ) : null;

  // Toast animado (aparece quando muda de estado)
  const Toast = () =>
    mensagem ? (
      <Animated.View
        style={[
          styles.toast,
          { top: posicaoTop, transform: [{ translateY: slideAnim }] },
          mensagem === "online" ? styles.toastOnline : styles.toastOffline,
        ]}
        pointerEvents="none"
      >
        {mensagem === "online" ? <IconeOnline /> : <IconeOffline />}
        <Text style={styles.toastTexto}>
          {mensagem === "online"
            ? "Conexão restabelecida"
            : "Sem conexão — modo offline"}
        </Text>
      </Animated.View>
    ) : null;

  return (
    <>
      <BadgeFixo />
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  // Badge fixo (top-center)
  badgeFixo: {
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    marginHorizontal: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 999,
    maxWidth: 130,
    ...shadows.md,
  },
  badgeFixoTexto: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  // Toast (aparece por 3s)
  toast: {
    position: "absolute",
    alignSelf: "center",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    zIndex: 1000,
    ...shadows.lg,
  },
  toastOffline: {
    backgroundColor: "#DC2626",
  },
  toastOnline: {
    backgroundColor: "#059669",
  },
  toastTexto: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
});