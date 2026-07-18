import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface ProgressoParadasProps {
  total: number;
  atual: number; // índice da próxima parada (0-based)
}

export default function ProgressoParadas({
  total,
  atual,
}: ProgressoParadasProps) {
  if (total === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barra}>
        <View
          style={[
            styles.progresso,
            { width: `${(atual / (total - 1 || 1)) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.bolinhas}>
        {Array.from({ length: total }).map((_, i) => {
          const concluida = i < atual;
          const ehAtual = i === atual;
          return (
            <View
              key={i}
              style={[
                styles.bolinha,
                concluida && styles.bolinhaConcluida,
                ehAtual && styles.bolinhaAtual,
              ]}
            >
              {concluida ? (
                <Text style={styles.check}>✓</Text>
              ) : (
                <Text
                  style={[
                    styles.numero,
                    ehAtual && styles.numeroAtual,
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  barra: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progresso: {
    height: "100%",
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  bolinhas: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bolinha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  bolinhaConcluida: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  bolinhaAtual: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    transform: [{ scale: 1.15 }],
  },
  check: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  numero: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "800",
  },
  numeroAtual: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
});
