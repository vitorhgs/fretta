import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, shadows } from "../theme/colors";

interface AlertaDesvioProps {
  visivel: boolean;
  distancia?: number; // distância até a rota
  distanciaRetorno?: number; // distância da rota de retorno calculada
  calculandoRota?: boolean;
}

function IconeAlerta() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </Svg>
  );
}

function IconeNavegacao() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
    </Svg>
  );
}

export default function AlertaDesvio({
  visivel,
  distancia,
  distanciaRetorno,
  calculandoRota,
}: AlertaDesvioProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const temRotaRetorno = distanciaRetorno && distanciaRetorno > 0;

  useEffect(() => {
    if (visivel) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [visivel, slideAnim, pulseAnim]);

  if (!visivel) return null;

  const formatarDistancia = (metros: number): string => {
    if (metros < 1000) return `${Math.round(metros)}m`;
    return `${(metros / 1000).toFixed(1)}km`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.card}>
        <View style={styles.iconeWrapper}>
          {temRotaRetorno ? <IconeNavegacao /> : <IconeAlerta />}
        </View>
        <View style={{ flex: 1 }}>
          {temRotaRetorno ? (
            <>
              <Text style={styles.titulo}>Retornando à rota</Text>
              <Text style={styles.subtitulo}>
                {formatarDistancia(distanciaRetorno!)} até voltar ao percurso
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.titulo}>Desvio de rota!</Text>
              <Text style={styles.subtitulo}>
                {calculandoRota
                  ? "Calculando caminho de retorno..."
                  : distancia && distancia > 0
                  ? `Você está a ${Math.round(
                      distancia
                    )}m da rota oficial. Retorne ao percurso.`
                  : "Você saiu da rota oficial. Retorne ao percurso."}
              </Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 130,
    left: 16,
    right: 16,
    zIndex: 998,
  },
  card: {
    backgroundColor: "#DC2626",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 2,
    borderColor: "#FEF2F2",
    ...shadows.lg,
  },
  iconeWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 2,
  },
  subtitulo: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
});