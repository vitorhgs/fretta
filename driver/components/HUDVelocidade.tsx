import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../theme/colors";

interface HUDVelocidadeProps {
  velocidade: number;
  limite?: number;
}

export default function HUDVelocidade({
  velocidade,
  limite = 40,
}: HUDVelocidadeProps) {
  const excedendo = velocidade > limite;
  const piscarAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (excedendo) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(piscarAnim, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(piscarAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      piscarAnim.setValue(1);
    }
  }, [excedendo]);

  return (
    <View style={styles.container}>
      {/* Velocidade atual — sempre visível */}
      <Animated.View
        style={[
          styles.circuloVelocidade,
          excedendo && styles.circuloExcedendo,
          excedendo && { opacity: piscarAnim },
        ]}
      >
        <Text
          style={[
            styles.numero,
            excedendo && styles.numeroExcedendo,
          ]}
        >
          {velocidade}
        </Text>
        <Text style={styles.unidade}>km/h</Text>
      </Animated.View>

      {/* Placa de limite — SÓ aparece quando excede */}
      {excedendo && (
        <View style={styles.placaLimite}>
          <Text style={styles.placaNumero}>{limite}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  circuloVelocidade: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  circuloExcedendo: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  numero: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30,
  },
  numeroExcedendo: {
    color: colors.white,
  },
  unidade: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.8,
    marginTop: 1,
  },

  placaLimite: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.danger,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  placaNumero: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
});