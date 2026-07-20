import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { supabase } from "../../supabase";
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

const TEMPO_REVELACAO = 30;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

function IconeFechar({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.textPrimary}>
      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </Svg>
  );
}

function IconeOlho({ visivel, size = 20 }: { visivel: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.textSecondary}>
      {visivel ? (
        <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      ) : (
        <Path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
      )}
    </Svg>
  );
}

function IconeCheckSucesso({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.success}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
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
   COMPONENTE PRINCIPAL
========================= */
export default function Perfil() {
  const router = useRouter();
  const { motorista, signOut } = useAuth();

  const [revelado, setRevelado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(TEMPO_REVELACAO);
  const [autenticando, setAutenticando] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);
  const contadorRef = useRef<any>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: revelado ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [revelado]);

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
      const compativel = await LocalAuthentication.hasHardwareAsync();
      const cadastrado = await LocalAuthentication.isEnrolledAsync();

      if (compativel && cadastrado) {
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
        Alert.alert(
          "Mostrar dados sensíveis?",
          "Seu dispositivo não tem biometria configurada. Deseja mostrar os dados mesmo assim?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Mostrar", onPress: () => setRevelado(true) },
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
                revelado ? formatarCPF(motorista?.cpf) : mascararCPF(motorista?.cpf)
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
                revelado ? motorista?.cnh || "-" : mascararCNH(motorista?.cnh)
              }
              sensivel={!revelado}
              fadeAnim={fadeAnim}
              ultimo
            />
          </View>

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
            onPress={() => setModalSenha(true)}
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

      {/* Modal trocar senha */}
      <ModalTrocarSenha
        visivel={modalSenha}
        onFechar={() => setModalSenha(false)}
      />
    </SafeAreaView>
  );
}

/* =========================
   MODAL TROCAR SENHA — VERSÃO CENTRALIZADA
========================= */
function ModalTrocarSenha({
  visivel,
  onFechar,
}: {
  visivel: boolean;
  onFechar: () => void;
}) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setNovaSenha("");
      setConfirmarSenha("");
      setErro("");
      setSucesso(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmar(false);
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visivel]);

  const fechar = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onFechar());
  };

  const validar = (): string | null => {
    if (!novaSenha) return "Digite a nova senha";
    if (novaSenha.length < 6) return "A senha deve ter no mínimo 6 caracteres";
    if (novaSenha !== confirmarSenha) return "As senhas não coincidem";
    return null;
  };

  const trocarSenha = async () => {
    setErro("");
    const erroValidacao = validar();
    if (erroValidacao) {
      setErro(erroValidacao);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        setErro(error.message || "Erro ao alterar senha");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setSalvando(false);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSucesso(true);
      setSalvando(false);

      setTimeout(() => {
        fechar();
      }, 2000);
    } catch (err: any) {
      setErro(err.message || "Erro ao alterar senha");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSalvando(false);
    }
  };

  const forcaSenha = (): { texto: string; cor: string; largura: string } => {
    if (!novaSenha) return { texto: "", cor: colors.border, largura: "0%" };
    if (novaSenha.length < 6)
      return { texto: "Muito fraca", cor: colors.danger, largura: "25%" };
    if (novaSenha.length < 8)
      return { texto: "Fraca", cor: colors.warning, largura: "50%" };
    if (novaSenha.length < 12)
      return { texto: "Boa", cor: "#3B82F6", largura: "75%" };
    return { texto: "Forte", cor: colors.success, largura: "100%" };
  };

  const forca = forcaSenha();

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="none"
      onRequestClose={fechar}
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.modalOverlay, { opacity: opacityAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={salvando || sucesso ? undefined : fechar}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {sucesso ? (
              // ESTADO: SUCESSO
              <View style={styles.sucessoContainer}>
                <View style={styles.sucessoIcone}>
                  <IconeCheckSucesso />
                </View>
                <Text style={styles.sucessoTitulo}>Senha alterada!</Text>
                <Text style={styles.sucessoSubtitulo}>
                  Sua nova senha já está ativa. Use ela no próximo login.
                </Text>
              </View>
            ) : (
              // ESTADO: FORMULÁRIO
              <ScrollView
                contentContainerStyle={{ padding: 20 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderIcone}>
                    <IconeChave size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitulo}>Trocar senha</Text>
                    <Text style={styles.modalSubtitulo}>
                      Escolha uma senha forte e segura
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={fechar}
                    style={styles.btnFechar}
                    disabled={salvando}
                  >
                    <IconeFechar />
                  </TouchableOpacity>
                </View>

                {/* Nova senha */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nova senha</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={novaSenha}
                      onChangeText={(v) => {
                        setNovaSenha(v);
                        setErro("");
                      }}
                      secureTextEntry={!mostrarNovaSenha}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={colors.textMuted}
                      editable={!salvando}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                      style={styles.btnOlho}
                    >
                      <IconeOlho visivel={mostrarNovaSenha} />
                    </TouchableOpacity>
                  </View>

                  {novaSenha.length > 0 && (
                    <View style={styles.forcaContainer}>
                      <View style={styles.forcaBarraFundo}>
                        <View
                          style={[
                            styles.forcaBarraPreenchida,
                            {
                              backgroundColor: forca.cor,
                              width: forca.largura as any,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.forcaTexto, { color: forca.cor }]}>
                        {forca.texto}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirmar senha */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmar nova senha</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={confirmarSenha}
                      onChangeText={(v) => {
                        setConfirmarSenha(v);
                        setErro("");
                      }}
                      secureTextEntry={!mostrarConfirmar}
                      placeholder="Digite novamente"
                      placeholderTextColor={colors.textMuted}
                      editable={!salvando}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setMostrarConfirmar(!mostrarConfirmar)}
                      style={styles.btnOlho}
                    >
                      <IconeOlho visivel={mostrarConfirmar} />
                    </TouchableOpacity>
                  </View>

                  {confirmarSenha.length > 0 && (
                    <View style={styles.matchContainer}>
                      <View
                        style={[
                          styles.matchPonto,
                          {
                            backgroundColor:
                              novaSenha === confirmarSenha
                                ? colors.success
                                : colors.danger,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.matchTexto,
                          {
                            color:
                              novaSenha === confirmarSenha
                                ? colors.success
                                : colors.danger,
                          },
                        ]}
                      >
                        {novaSenha === confirmarSenha
                          ? "As senhas coincidem"
                          : "As senhas não coincidem"}
                      </Text>
                    </View>
                  )}
                </View>

                {erro && (
                  <View style={styles.erroBox}>
                    <Text style={styles.erroTexto}>{erro}</Text>
                  </View>
                )}

                <View style={styles.modalBotoes}>
                  <TouchableOpacity
                    style={styles.btnCancelar}
                    onPress={fechar}
                    disabled={salvando}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.btnCancelarTexto}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.btnConfirmar,
                      salvando && styles.btnConfirmarDisabled,
                    ]}
                    onPress={trocarSenha}
                    disabled={salvando}
                    activeOpacity={0.8}
                  >
                    {salvando ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.btnConfirmarTexto}>
                        Alterar senha
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
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
    <View style={[styles.infoRow, ultimo && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Animated.Text
        style={[
          styles.infoValor,
          sensivel && styles.infoValorMascarado,
          !sensivel && { opacity: fadeAnim },
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
    paddingBottom: 100,
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

  /* 🆕 MODAL CENTRALIZADO */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 24,
    width: "100%",
    maxWidth: 420,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  modalHeaderIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  modalSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  btnFechar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  btnOlho: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  forcaContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  forcaBarraFundo: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  forcaBarraPreenchida: {
    height: "100%",
    borderRadius: 2,
  },
  forcaTexto: {
    fontSize: 11,
    fontWeight: "800",
    minWidth: 70,
    textAlign: "right",
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  matchPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  matchTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
  erroBox: {
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  erroTexto: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  modalBotoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelarTexto: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "700",
  },
  btnConfirmar: {
    flex: 1.5,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  btnConfirmarDisabled: {
    opacity: 0.6,
  },
  btnConfirmarTexto: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  sucessoContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  sucessoIcone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight || "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  sucessoTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sucessoSubtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
});