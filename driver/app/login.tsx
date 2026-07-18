import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../contexts/AuthContext";
import { colors, shadows } from "../theme/colors";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleLogin = async () => {
    setErro("");

    if (!email.trim() || !password.trim()) {
      setErro("Preencha e-mail e senha");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos"
          : error.message
      );
      return;
    }

    router.replace("/home" as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>F</Text>
          </View>
          <Text style={styles.logoText}>Fretta</Text>
          <Text style={styles.tagline}>DRIVER</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.titulo}>Bem-vindo de volta</Text>
          <Text style={styles.subtitulo}>
            Entre com sua conta para começar
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputSenha}>
              <TextInput
                style={styles.inputSenhaField}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!mostrarSenha}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setMostrarSenha(!mostrarSenha)}
                style={styles.olho}
              >
                <Text style={styles.olhoTexto}>
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {erro ? (
            <View style={styles.erroBox}>
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.botao, loading && styles.botaoDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() =>
              Alert.alert(
                "Recuperar senha",
                "Entre em contato com o administrador da sua empresa para redefinir a senha."
              )
            }
          >
            <Text style={styles.link}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>Não tem acesso ainda?</Text>
          <Text style={styles.rodapeSubtexto}>
            Solicite ao administrador da sua empresa
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    ...shadows.lg,
  },
  logoIconText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "900",
  },
  logoText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 6,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    ...shadows.lg,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputSenha: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputSenhaField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  olho: {
    paddingHorizontal: 16,
  },
  olhoTexto: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  erroBox: {
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  erroTexto: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    ...shadows.md,
  },
  botaoDisabled: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  linkContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 8,
  },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  rodape: {
    alignItems: "center",
    marginTop: 32,
  },
  rodapeTexto: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.9,
  },
  rodapeSubtexto: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});