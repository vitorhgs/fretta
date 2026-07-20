import { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Rect, Circle, LinearGradient, Stop, Defs } from "react-native-svg";
import { useAuth } from "../contexts/AuthContext";
import { colors, shadows } from "../theme/colors";

const CHAVE_EMAIL_LEMBRADO = "@fretta:email_lembrado";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Carrega email salvo ao montar
  useEffect(() => {
    (async () => {
      try {
        const emailSalvo = await AsyncStorage.getItem(CHAVE_EMAIL_LEMBRADO);
        if (emailSalvo) {
          setEmail(emailSalvo);
          setLembrar(true);
        }
      } catch {}
    })();
  }, []);

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

    // Salva ou remove email baseado no checkbox
    try {
      if (lembrar) {
        await AsyncStorage.setItem(CHAVE_EMAIL_LEMBRADO, email);
      } else {
        await AsyncStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
      }
    } catch {}

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
        {/* Header com nova logo */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Svg width={80} height={80} viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="loginBg" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#1E56D4" />
                  <Stop offset="1" stopColor="#0D3A9E" />
                </LinearGradient>
                <LinearGradient id="loginF" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#E0E7FF" />
                </LinearGradient>
              </Defs>
              <Rect x="4" y="4" width="92" height="92" rx="22" fill="url(#loginBg)" />
              <Rect
                x="4"
                y="4"
                width="92"
                height="46"
                rx="22"
                fill="rgba(255,255,255,0.08)"
              />
              <Path
                d="M 20 78 Q 35 78 45 62 T 78 40"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="4 4"
              />
              <Rect x="30" y="22" width="14" height="58" rx="3" fill="url(#loginF)" />
              <Rect x="30" y="22" width="42" height="14" rx="3" fill="url(#loginF)" />
              <Rect x="30" y="46" width="30" height="12" rx="3" fill="url(#loginF)" />
              <Circle cx="78" cy="40" r="5" fill="#22C55E" />
              <Circle cx="78" cy="40" r="2.5" fill="#FFFFFF" />
            </Svg>
          </View>
          <Text style={styles.logoText}>Fretta</Text>
          <Text style={styles.tagline}>DRIVER</Text>
        </View>

        {/* Card do formulário */}
        <View style={styles.card}>
          <Text style={styles.titulo}>Bem-vindo de volta</Text>
          <Text style={styles.subtitulo}>
            Entre com sua conta para começar
          </Text>

          {/* E-mail */}
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

          {/* Senha */}
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

          {/* Lembrar de mim */}
          <TouchableOpacity
            style={styles.lembrarContainer}
            onPress={() => setLembrar(!lembrar)}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View
              style={[
                styles.checkbox,
                lembrar && styles.checkboxAtivo,
              ]}
            >
              {lembrar && (
                <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.white}>
                  <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </Svg>
              )}
            </View>
            <Text style={styles.lembrarTexto}>Lembrar meu e-mail</Text>
          </TouchableOpacity>

          {erro ? (
            <View style={styles.erroBox}>
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          ) : null}

          {/* Botão entrar */}
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

        {/* Rodapé */}
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
  logoWrapper: {
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 8,
    marginTop: 3,
    opacity: 0.9,
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
  // 🆕 Checkbox lembrar
  lembrarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  lembrarTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
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