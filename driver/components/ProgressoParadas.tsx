import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../theme/colors";

interface ProgressoParadasProps {
  total: number;
  atual: number; // índice da parada atual (0-based)
  concluidas?: number; // opcional: quantidade concluída
}

export default function ProgressoParadas({
  total,
  atual,
  concluidas,
}: ProgressoParadasProps) {
  const qtdConcluidas = concluidas ?? atual;
  const percentual = total > 0 ? (qtdConcluidas / total) * 100 : 0;

  // Animação suave da barra
  const larguraAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(larguraAnim, {
      toValue: percentual,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [percentual, larguraAnim]);

  const larguraInterpolada = larguraAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Header com contador */}
      <View style={styles.header}>
        <Text style={styles.label}>PROGRESSO DA ROTA</Text>
        <Text style={styles.contador}>
          <Text style={styles.contadorAtual}>{qtdConcluidas}</Text>
          <Text style={styles.contadorTotal}> / {total} paradas</Text>
        </Text>
      </View>

      {/* Barra de progresso */}
      <View style={styles.barraFundo}>
        <Animated.View
          style={[
            styles.barraPreenchida,
            { width: larguraInterpolada },
          ]}
        />
        {/* Bolinhas de marcação (se poucas paradas) */}
        {total <= 8 && (
          <View style={styles.marcadores}>
            {Array.from({ length: total }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.marcador,
                  i < qtdConcluidas && styles.marcadorConcluido,
                  i === atual && styles.marcadorAtual,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Próxima parada em destaque */}
      {atual < total && (
        <Text style={styles.proximaLabel}>
          Próxima:{" "}
          <Text style={styles.proximaNumero}>
            Parada {atual + 1}
            {atual === total - 1 ? " (final)" : ""}
          </Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.8,
  },
  contador: {
    fontSize: 13,
    fontWeight: "700",
  },
  contadorAtual: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  contadorTotal: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },

  barraFundo: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  barraPreenchida: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  marcadores: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 3,
    alignItems: "center",
  },
  marcador: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  marcadorConcluido: {
    backgroundColor: colors.white,
  },
  marcadorAtual: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  proximaLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginTop: 6,
  },
  proximaNumero: {
    color: colors.white,
    fontWeight: "900",
  },
});