import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../contexts/AuthContext";
import { colors, shadows } from "../../theme/colors";
import {
  mascararCPF,
  formatarCPF,
  mascararTelefone,
  formatarTelefone,
  mascararCNH,
  mascararEmail,
} from "../../lib/masks";

const TEMPO_REVELACAO = 30; // segundos

/* =========================
   ÍCONES SVG
========================= */
function IconeCadeado({ aberto, size = 18 }: { aberto: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.white}>
      {aberto ? (
        <Path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6a5 5 0 00-9.9-.9.75.75 0 001.48.26A3.5 3.5 0 0115.5 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2z" />
      ) : (
        <Path d="M18 8h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3.1-9H8.9V6a3.1 3.1 0 016.2 0v2z" />
      )}
    </Svg>
  );
}

function IconeLogout({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.danger}>
      <Path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </Svg>
  );
}

function IconeChave({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.textSecondary}>
      <Path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </Svg>
  );
}

function IconeAtualizar({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.textSecondary}>
      <Path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </Svg>
  );
}

/* =========================
   HELPERS
========================= */
function iniciais(nome: string): string {
  if (!nome) return "?";
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* =========================
   COMPONENTE
========================= */
export default function Perfil() {
  const router = useRouter();
  const { motorista, signOut } = useAuth();

  const [revelado, setRevelado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(TEMPO_REVELACAO);
  const [autenticando, setAutenticando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);
  const contadorRef = useRef<any>(null);

  // Anima o fade ao revelar/esconder
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: revelado ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [revelado]);

  // Contador regressivo
  useEffect(() => {
    if (revelado) {
      setTempoRestante(TEMPO_REVELACAO);
      contadorRef.current = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(contadorRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(() => {
        setRevelado(false);
      }, TEMPO_REVELACAO * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (contadorRef.current) clearInterval(contadorRef.current);
    };
  }, [revelado]);

  const revelarDados = async () => {
    if (autenticando) return;
    setAutenticando(true);

    try {
      // Verifica se o dispositivo suporta biometria
      const compativel = await LocalAuthentication.hasHardwareAsync();
      const cadastrado = await LocalAuthentication.isEnrolledAsync();

      if (compativel && cadastrado) {
        // Usa biometria (Face ID / Digital)
        const resultado = await LocalAuthentication.authenticateAsync({
          promptMessage: "Confirme sua identidade",
          fallbackLabel: "Usar senha",
          cancelLabel: "Cancelar",
          disableDeviceFallback: false,
        });

        if (resultado.success) {
          setRevelado(true);
        } else if (resultado.error !== "user_cancel") {
          Alert.alert(
            "Autenticação falhou",
            "Não foi possível verificar sua identidade. Tente novamente."
          );
        }
      } else {
        // Sem biometria - pede confirmação simples
        Alert.alert(
          "Mostrar dados sensíveis?",
          "Seu dispositivo não tem biometria configurada. Deseja mostrar os dados mesmo assim?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Mostrar",
              onPress: () => setRevelado(true),
            },
          ]
        );
      }
    } catch (err) {
      console.log("Erro na autenticação:", err);
      Alert.alert("Erro", "Não foi possível autenticar. Tente novamente.");
    } finally {
      setAutenticando(false);
    }
  };

  const esconderAgora = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (contadorRef.current) clearInterval(contadorRef.current);
    setRevelado(false);
  };

  const confirmarSair = () => {
    Alert.alert(
      "Sair do app",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login" as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {iniciais(motorista?.nome || "")}
          </Text>
        </View>
        <Text style={styles.nome}>{motorista?.nome || "Motorista"}</Text>
        {motorista?.email && (
          <Text style={styles.emailHeader}>
            {revelado ? motorista.email : mascararEmail(motorista.email)}
          </Text>
        )}
      </View>

      <View style={styles.body}>
        {/* SEÇÃO: Dados Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            {revelado && (
              <View style={styles.contadorContainer}>
                <View style={styles.contadorPonto} />
                <Text style={styles.contadorTexto}>
                  Ocultando em {tempoRestante}s
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <InfoRow
              label="CPF"
              valor={
                revelado
                  ? formatarCPF(motorista?.cpf)
                  : mascararCPF(motorista?.cpf)
              }
              sensivel={!revelado}
              fadeAnim={fadeAnim}
            />
            <InfoRow
              label="Telefone"
              valor={
                revelado
                  ? formatarTelefone(motorista?.telefone)
                  : mascararTelefone(motorista?.telefone)
              }
              sensivel={!revelado}
              fadeAnim={fadeAnim}
            />
            <InfoRow
              label="CNH"
              valor={
                revelado
                  ? motorista?.cnh || "-"
                  : mascararCNH(motorista?.cnh)
              }
              sensivel={!revelado}
              fadeAnim={fadeAnim}
              ultimo
            />
          </View>

          {/* Botão de mostrar/esconder */}
          {!revelado ? (
            <TouchableOpacity
              style={styles.btnMostrar}
              onPress={revelarDados}
              disabled={autenticando}
              activeOpacity={0.8}
            >
              <IconeCadeado aberto={false} />
              <Text style={styles.btnMostrarTexto}>
                {autenticando ? "Autenticando..." : "Mostrar dados sensíveis"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnEsconder}
              onPress={esconderAgora}
              activeOpacity={0.8}
            >
              <IconeCadeado aberto={true} />
              <Text style={styles.btnEsconderTexto}>Ocultar agora</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SEÇÃO: Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <TouchableOpacity
            style={styles.opcao}
            onPress={() =>
              Alert.alert(
                "Trocar senha",
                "Em breve! Por enquanto, peça ao administrador da sua empresa."
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.opcaoIconeContainer}>
              <IconeChave />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.opcaoTitulo}>Trocar senha</Text>
              <Text style={styles.opcaoSubtitulo}>Alterar sua senha atual</Text>
            </View>
            <Text style={styles.opcaoSeta}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opcao}
            onPress={() =>
              Alert.alert(
                "Atualizar dados",
                "Peça ao administrador da sua empresa para atualizar seus dados cadastrais."
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.opcaoIconeContainer}>
              <IconeAtualizar />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.opcaoTitulo}>Atualizar dados</Text>
              <Text style={styles.opcaoSubtitulo}>
                Corrigir informações cadastrais
              </Text>
            </View>
            <Text style={styles.opcaoSeta}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opcaoDanger}
            onPress={confirmarSair}
            activeOpacity={0.7}
          >
            <View style={styles.opcaoIconeContainerDanger}>
              <IconeLogout />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.opcaoTitulo, { color: colors.danger }]}>
                Sair do app
              </Text>
              <Text style={styles.opcaoSubtitulo}>Encerrar sua sessão</Text>
            </View>
            <Text style={[styles.opcaoSeta, { color: colors.danger }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versao}>Fretta Driver v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

/* =========================
   COMPONENTE: InfoRow
========================= */
function InfoRow({
  label,
  valor,
  sensivel,
  fadeAnim,
  ultimo,
}: {
  label: string;
  valor: string;
  sensivel: boolean;
  fadeAnim: Animated.Value;
  ultimo?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        ultimo && { borderBottomWidth: 0 },
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Animated.Text
        style={[
          styles.infoValor,
          sensivel && styles.infoValorMascarado,
          !sensivel && {
            opacity: fadeAnim,
          },
        ]}
      >
        {valor}
      </Animated.Text>
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...shadows.lg,
  },
  avatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "800",
  },
  nome: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  emailHeader: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 4,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contadorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  contadorPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  contadorTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warning,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  infoValor: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  infoValorMascarado: {
    color: colors.textMuted,
    letterSpacing: 1,
  },

  btnMostrar: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.md,
  },
  btnMostrarTexto: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  btnEsconder: {
    marginTop: 12,
    backgroundColor: colors.warning,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.md,
  },
  btnEsconderTexto: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  opcao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  opcaoDanger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },
  opcaoIconeContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  opcaoIconeContainerDanger: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  opcaoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  opcaoSubtitulo: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  opcaoSeta: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: "700",
  },
  versao: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
    marginTop: "auto",
    paddingVertical: 16,
  },
});