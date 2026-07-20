import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, shadows } from "../theme/colors";
import { useSincronizacao } from "../hooks/useSincronizacao";

function IconeSync() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
    </Svg>
  );
}

function IconeCheck() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </Svg>
  );
}

interface StatusSincronizacaoProps {
  posicaoTop?: number;
}

export default function StatusSincronizacao({
  posicaoTop = 60,
}: StatusSincronizacaoProps) {
  const { sincronizando, pendentes, ultimoResultado } = useSincronizacao();
  const [visivelSucesso, setVisivelSucesso] = useState(false);

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (sincronizando) {
      // Entra
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Rotação
      const rotacao = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rotacao.start();

      return () => {
        rotacao.stop();
        rotateAnim.setValue(0);
      };
    } else {
      // Parou de sincronizar
      if (ultimoResultado && ultimoResultado.enviadas > 0) {
        setVisivelSucesso(true);

        // Anima entrada do sucesso
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }).start();

        // Some depois de 3s
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setVisivelSucesso(false));
        }, 3000);
      } else {
        // Nenhum sucesso, só some
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisivelSucesso(false));
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sincronizando, ultimoResultado]);

  if (!sincronizando && !visivelSucesso) {
    return null;
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { top: posicaoTop, transform: [{ translateY: slideAnim }] },
        sincronizando ? styles.containerSync : styles.containerSucesso,
      ]}
      pointerEvents="none"
    >
      {sincronizando ? (
        <>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <IconeSync />
          </Animated.View>
          <Text style={styles.texto}>
            Sincronizando {pendentes} {pendentes === 1 ? "posição" : "posições"}...
          </Text>
        </>
      ) : (
        <>
          <IconeCheck />
          <Text style={styles.texto}>
            {ultimoResultado?.enviadas}{" "}
            {ultimoResultado?.enviadas === 1
              ? "posição enviada"
              : "posições enviadas"}
          </Text>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    zIndex: 1001,
    ...shadows.lg,
  },
  containerSync: {
    backgroundColor: "#3B82F6",
  },
  containerSucesso: {
    backgroundColor: "#059669",
  },
  texto: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
});