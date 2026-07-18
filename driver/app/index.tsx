import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";

export default function Splash() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (session) {
        router.replace("/home" as any);
      } else {
        router.replace("/login" as any);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>F</Text>
        </View>
        <Text style={styles.logoText}>Fretta</Text>
        <Text style={styles.tagline}>DRIVER</Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.white} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
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
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 12,
  },
  logoIconText: {
    color: colors.white,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -2,
  },
  logoText: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 8,
  },
  loadingContainer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  loadingText: {
    color: colors.textInverse,
    fontSize: 13,
    marginTop: 12,
    opacity: 0.7,
  },
});