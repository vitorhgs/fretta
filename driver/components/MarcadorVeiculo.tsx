import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../theme/colors";

interface MarcadorVeiculoProps {
  heading?: number; // rotação em graus
  emViagem?: boolean;
}

export default function MarcadorVeiculo({
  heading = 0,
  emViagem = false,
}: MarcadorVeiculoProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animação de pulso quando em viagem
  useEffect(() => {
    if (emViagem) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [emViagem]);

  const opacityAnim = pulseAnim.interpolate({
    inputRange: [1, 1.6],
    outputRange: [0.4, 0],
  });

  return (
    <View style={styles.container}>
      {/* Pulso animado (só em viagem) */}
      {emViagem && (
        <Animated.View
          style={[
            styles.pulse,
            {
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
      )}

      {/* Círculo base branco */}
      <View style={styles.baseCirculo}>
        {/* Seta triangular estilo Waze */}
        <View
          style={[
            styles.setaContainer,
            { transform: [{ rotate: `${heading}deg` }] },
          ]}
        >
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path
              d="M12 2 L20 20 L12 16 L4 20 Z"
              fill={colors.primary}
              stroke="white"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <Circle cx="12" cy="14" r="1.5" fill="white" />
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  pulse: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  baseCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  setaContainer: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});