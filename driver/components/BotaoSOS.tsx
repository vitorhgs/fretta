import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { colors, shadows } from "../theme/colors";
import { dispararAlertaSOS, buscarTelefoneEmergencia } from "../lib/sos";

interface BotaoSOSProps {
  visivel: boolean;
  motoristaId: string;
  empresaId: string;
  motoristaNome: string;
  viagemId: string | null;
  rotaNome?: string;
  latitude: number | null;
  longitude: number | null;
  velocidade: number;
}

/* =========================
   ÍCONES
========================= */
function IconeSOS() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </Svg>
  );
}

function IconeAlerta() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </Svg>
  );
}

function IconeTelefone() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
    </Svg>
  );
}

function IconeFechar() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.textPrimary}>
      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </Svg>
  );
}

export default function BotaoSOS({
  visivel,
  motoristaId,
  empresaId,
  motoristaNome,
  viagemId,
  rotaNome,
  latitude,
  longitude,
  velocidade,
}: BotaoSOSProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Animações
  const entradaAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animação de entrada
  useEffect(() => {
    if (visivel) {
      Animated.spring(entradaAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Pulsação suave contínua
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(entradaAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visivel, entradaAnim, pulseAnim]);

  const abrirMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuAberto(true);
  };

  const fecharMenu = () => {
    setMenuAberto(false);
  };

  // === AÇÃO 1: Alertar Central ===
  const alertarCentral = () => {
    Alert.alert(
      "Alertar central?",
      "Sua localização atual será enviada imediatamente para a administração da empresa.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar alerta",
          style: "destructive",
          onPress: async () => {
            if (latitude === null || longitude === null) {
              Alert.alert(
                "Sem localização",
                "Não conseguimos obter sua localização. Tente novamente."
              );
              return;
            }

            setEnviando(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            const resultado = await dispararAlertaSOS({
              motorista_id: motoristaId,
              empresa_id: empresaId,
              viagem_id: viagemId,
              motorista_nome: motoristaNome,
              rota_nome: rotaNome,
              latitude,
              longitude,
              velocidade_kmh: velocidade,
              tipo: "emergencia",
            });

            setEnviando(false);

            if (resultado.sucesso) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              fecharMenu();
              Alert.alert(
                "✓ Alerta enviado",
                "A central foi notificada e sua localização foi compartilhada. Aguarde contato."
              );
            } else {
              Alert.alert(
                "Erro ao enviar",
                resultado.erro ||
                  "Não foi possível enviar o alerta. Tente ligar diretamente."
              );
            }
          },
        },
      ]
    );
  };

  // === AÇÃO 2: Ligar Emergência ===
  const ligarEmergencia = async () => {
    setEnviando(true);
    const telefone = await buscarTelefoneEmergencia(empresaId);
    setEnviando(false);

    if (!telefone) {
      Alert.alert(
        "Telefone não configurado",
        "A empresa ainda não configurou um telefone de emergência. Envie um alerta ou entre em contato pelos canais oficiais."
      );
      return;
    }

    Alert.alert(
      "Ligar para emergência?",
      `Você será conectado ao telefone da empresa.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ligar agora",
          onPress: () => {
            // Também registra o alerta antes de ligar
            if (latitude !== null && longitude !== null) {
              dispararAlertaSOS({
                motorista_id: motoristaId,
                empresa_id: empresaId,
                viagem_id: viagemId,
                motorista_nome: motoristaNome,
                rota_nome: rotaNome,
                latitude,
                longitude,
                velocidade_kmh: velocidade,
                tipo: "emergencia",
                observacao: "Motorista ligou para emergência",
              });
            }

            const telLimpo = telefone.replace(/\D/g, "");
            Linking.openURL(`tel:${telLimpo}`);
            fecharMenu();
          },
        },
      ]
    );
  };

  if (!visivel) return null;

  return (
    <>
      {/* Botão flutuante */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: entradaAnim,
            transform: [
              { scale: entradaAnim },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.botao}
          onPress={abrirMenu}
          activeOpacity={0.8}
        >
          <IconeSOS />
          <Text style={styles.botaoTexto}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Menu modal */}
      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharMenu}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={fecharMenu}
        >
          <TouchableOpacity
            style={styles.menu}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuIconWrapper}>
                <IconeSOS />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitulo}>Emergência</Text>
                <Text style={styles.menuSubtitulo}>
                  Escolha o tipo de contato
                </Text>
              </View>
              <TouchableOpacity
                onPress={fecharMenu}
                style={styles.btnFechar}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconeFechar />
              </TouchableOpacity>
            </View>

            {/* Opção 1: Alertar Central */}
            <TouchableOpacity
              style={[styles.opcao, styles.opcaoAlerta]}
              onPress={alertarCentral}
              activeOpacity={0.85}
              disabled={enviando}
            >
              <View style={styles.opcaoIcone}>
                <IconeAlerta />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opcaoTitulo}>Alertar Central</Text>
                <Text style={styles.opcaoDescricao}>
                  Envia sua localização para a administração
                </Text>
              </View>
            </TouchableOpacity>

            {/* Opção 2: Ligar Emergência */}
            <TouchableOpacity
              style={[styles.opcao, styles.opcaoLigar]}
              onPress={ligarEmergencia}
              activeOpacity={0.85}
              disabled={enviando}
            >
              <View style={styles.opcaoIcone}>
                <IconeTelefone />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opcaoTitulo}>Ligar Emergência</Text>
                <Text style={styles.opcaoDescricao}>
                  Contato telefônico com a empresa
                </Text>
              </View>
            </TouchableOpacity>

            {/* Loading */}
            {enviando && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingTexto}>Processando...</Text>
              </View>
            )}

            {/* Cancelar */}
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={fecharMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
    
container: {
  position: "absolute",
  right: 14,
  top: 180, // logo abaixo do header
  zIndex: 20,
},
botao: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: "#DC2626",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 2.5,
  borderColor: "rgba(255,255,255,0.95)",
  ...shadows.lg,
},
botaoTexto: {
  color: colors.white,
  fontSize: 8,
  fontWeight: "900",
  letterSpacing: 0.5,
  marginTop: -1,
},

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
    ...shadows.lg,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  menuIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitulo: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  menuSubtitulo: {
    fontSize: 13,
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

  // Opções
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  opcaoAlerta: {
    backgroundColor: "#DC2626",
  },
  opcaoLigar: {
    backgroundColor: "#059669",
  },
  opcaoIcone: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  opcaoTitulo: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.white,
  },
  opcaoDescricao: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    fontWeight: "600",
  },

  // Loading
  loadingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
  },
  loadingTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // Cancelar
  btnCancelar: {
    marginTop: 6,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnCancelarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMuted,
  },
});