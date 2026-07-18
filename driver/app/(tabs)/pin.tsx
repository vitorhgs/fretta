import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";

import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import { colors, shadows } from "../../theme/colors";

/* =========================
   TIPOS
========================= */
interface PinValidado {
  pin_id: string;
  tipo: "nova_rota" | "editar_rota";
  rota_id: string | null;
  rota_nome?: string;
}

type EstadoTela =
  | "digitando"
  | "validando"
  | "sucesso"
  | "bloqueio_parcial"
  | "bloqueio_total";

const MAX_TENTATIVAS_FASE1 = 3;
const MAX_TENTATIVAS_TOTAL = 5;
const TEMPO_BLOQUEIO_SEG = 300; // 5 minutos

/* =========================
   ÍCONES
========================= */
function IconeChave({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.primary}>
      <Path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </Svg>
  );
}

function IconeSucesso({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.success}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </Svg>
  );
}

function IconeAlerta({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.warning}>
      <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </Svg>
  );
}

function IconeBloqueio({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.danger}>
      <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </Svg>
  );
}

function IconeApagar({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={colors.textSecondary}>
      <Path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
    </Svg>
  );
}

/* =========================
   COMPONENTE
========================= */
export default function PinScreen() {
  const router = useRouter();
  const { motorista } = useAuth();

  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState<EstadoTela>("digitando");
  const [erro, setErro] = useState("");
  const [pinValidado, setPinValidado] = useState<PinValidado | null>(null);
  const [tentativas, setTentativas] = useState(0);
  const [tempoBloqueio, setTempoBloqueio] = useState(0);

  // Animações
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeSuccessAnim = useRef(new Animated.Value(0)).current;

  // Timer de bloqueio
  const timerRef = useRef<any>(null);

  // Valida automaticamente quando completa 4 dígitos
  useEffect(() => {
    if (codigo.length === 4 && estado === "digitando") {
      validarPin();
    }
  }, [codigo]);

  // Limpa erro quando digita
  useEffect(() => {
    if (erro && codigo.length < 4) {
      setErro("");
    }
  }, [codigo]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const adicionarDigito = (digito: string) => {
    if (codigo.length >= 4 || estado !== "digitando") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCodigo((prev) => prev + digito);
  };

  const apagarDigito = () => {
    if (codigo.length === 0 || estado !== "digitando") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCodigo((prev) => prev.slice(0, -1));
  };

  const limpar = () => {
    setCodigo("");
    setErro("");
    setPinValidado(null);
    setEstado("digitando");
    fadeSuccessAnim.setValue(0);
    scaleAnim.setValue(1);
  };

  const voltarDigitar = () => {
    setCodigo("");
    setErro("");
    setEstado("digitando");
  };

  const iniciarBloqueioTimer = () => {
    setTempoBloqueio(TEMPO_BLOQUEIO_SEG);
    timerRef.current = setInterval(() => {
      setTempoBloqueio((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Desbloqueia automaticamente depois do tempo
          setTentativas(0);
          setEstado("digitando");
          setCodigo("");
          setErro("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatarTempoBloqueio = (seg: number): string => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const animarShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animarSucesso = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeSuccessAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    });
  };

  const validarPin = async () => {
    if (!motorista) {
      setErro("Motorista não logado");
      return;
    }

    setEstado("validando");
    setErro("");

    try {
      const { data, error } = await supabase.rpc("validar_pin", {
        p_codigo: codigo,
        p_motorista_id: motorista.id,
      });

      if (error) {
        throw new Error("Erro ao validar PIN");
      }

      const resultado = Array.isArray(data) ? data[0] : data;

      if (!resultado || !resultado.valido) {
        // PIN inválido
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        animarShake();

        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);

        if (novasTentativas >= MAX_TENTATIVAS_TOTAL) {
          // 5 erros → bloqueio total
          setEstado("bloqueio_total");
          iniciarBloqueioTimer();
          return;
        }

        if (novasTentativas >= MAX_TENTATIVAS_FASE1 && novasTentativas < MAX_TENTATIVAS_TOTAL) {
          // 3 erros → bloqueio parcial (dá mais 2 chances)
          setEstado("bloqueio_parcial");
          return;
        }

        // Menos de 3 → erro normal
        setErro(resultado?.mensagem || "PIN inválido ou expirado");
        setTimeout(() => {
          setCodigo("");
          setEstado("digitando");
        }, 1000);
      } else {
        // PIN válido!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTentativas(0);

        let rotaNome: string | undefined;
        if (resultado.rota_id) {
          const { data: rotaData } = await supabase
            .from("rotas")
            .select("nome")
            .eq("id", resultado.rota_id)
            .single();
          rotaNome = rotaData?.nome;
        }

        setPinValidado({
          pin_id: resultado.pin_id,
          tipo: resultado.tipo,
          rota_id: resultado.rota_id,
          rota_nome: rotaNome,
        });

        setEstado("sucesso");
        animarSucesso();
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      animarShake();

      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);

      if (novasTentativas >= MAX_TENTATIVAS_TOTAL) {
        setEstado("bloqueio_total");
        iniciarBloqueioTimer();
        return;
      }

      if (novasTentativas >= MAX_TENTATIVAS_FASE1) {
        setEstado("bloqueio_parcial");
        return;
      }

      setErro(err.message || "Erro ao validar");
      setTimeout(() => {
        setCodigo("");
        setEstado("digitando");
      }, 1000);
    }
  };

  const iniciarGravacao = () => {
  if (!pinValidado) return;

  router.push({
    pathname: "/gravacao",
    params: {
      pinId: pinValidado.pin_id,
      tipo: pinValidado.tipo,
      rotaId: pinValidado.rota_id || "",
    },
  } as any);
};

  const contatar = () => {
    Alert.alert(
      "Contatar administrador",
      "Entre em contato com o administrador da sua empresa para obter um novo PIN ou desbloquear seu acesso.",
      [
        { text: "OK" },
        {
          text: "Ligar",
          onPress: () => Linking.openURL("tel:"),
        },
      ]
    );
  };

  // Tentativas restantes
  const tentativasRestantes =
    tentativas < MAX_TENTATIVAS_FASE1
      ? MAX_TENTATIVAS_FASE1 - tentativas
      : MAX_TENTATIVAS_TOTAL - tentativas;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Autorização</Text>
        <Text style={styles.subtitulo}>
          Insira o PIN de 4 dígitos fornecido pelo administrador
        </Text>
      </View>

      <View style={styles.body}>
        {/* ==========================================
            ESTADO: DIGITANDO
        ========================================== */}
        {(estado === "digitando" || estado === "validando") && (
          <>
            <View style={styles.iconeContainer}>
              <IconeChave size={48} />
            </View>

            {/* Bolinhas */}
            <Animated.View
              style={[
                styles.bolinhasContainer,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.bolinha,
                    codigo.length > i && styles.bolinhaPreenchida,
                    erro && codigo.length === 4 && styles.bolinhaErro,
                    estado === "validando" &&
                      codigo.length === 4 &&
                      styles.bolinhaValidando,
                  ]}
                />
              ))}
            </Animated.View>

            {/* Mensagem */}
            {erro ? (
              <View style={styles.erroContainer}>
                <Text style={styles.erroTexto}>{erro}</Text>
                {tentativas > 0 && tentativas < MAX_TENTATIVAS_FASE1 && (
                  <Text style={styles.tentativasTexto}>
                    {tentativasRestantes} tentativa
                    {tentativasRestantes !== 1 ? "s" : ""} restante
                    {tentativasRestantes !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            ) : estado === "validando" ? (
              <View style={styles.validandoContainer}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.validandoTexto}>Validando...</Text>
              </View>
            ) : (
              <View style={styles.instrucaoContainer}>
                <Text style={styles.instrucao}>
                  {codigo.length === 0
                    ? "Digite o código de 4 dígitos"
                    : `${4 - codigo.length} dígito${
                        4 - codigo.length !== 1 ? "s" : ""
                      } restante${4 - codigo.length !== 1 ? "s" : ""}`}
                </Text>
                {tentativas > 0 && (
                  <Text style={styles.tentativasTextoSutil}>
                    {tentativasRestantes} tentativa
                    {tentativasRestantes !== 1 ? "s" : ""} restante
                    {tentativasRestantes !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            )}

            {/* Teclado */}
            <View style={styles.teclado}>
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"],
                ["", "0", "apagar"],
              ].map((linha, li) => (
                <View key={li} style={styles.tecladoLinha}>
                  {linha.map((tecla, ti) => {
                    if (tecla === "") {
                      return <View key={ti} style={styles.teclaVazia} />;
                    }
                    if (tecla === "apagar") {
                      return (
                        <TouchableOpacity
                          key={ti}
                          style={styles.tecla}
                          onPress={apagarDigito}
                          onLongPress={limpar}
                          activeOpacity={0.6}
                          disabled={estado === "validando"}
                        >
                          <IconeApagar size={28} />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={ti}
                        style={[
                          styles.tecla,
                          estado === "validando" && styles.teclaDesabilitada,
                        ]}
                        onPress={() => adicionarDigito(tecla)}
                        activeOpacity={0.6}
                        disabled={estado === "validando"}
                      >
                        <Text style={styles.teclaTexto}>{tecla}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ==========================================
            ESTADO: SUCESSO
        ========================================== */}
        {estado === "sucesso" && pinValidado && (
          <Animated.View
            style={[
              styles.estadoContainer,
              {
                opacity: fadeSuccessAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <IconeSucesso size={64} />

            <Text style={styles.estadoTitulo}>Autorizado!</Text>
            <Text style={styles.estadoSubtitulo}>
              {pinValidado.tipo === "nova_rota"
                ? "Você está autorizado a gravar uma nova rota"
                : `Você está autorizado a editar a rota "${
                    pinValidado.rota_nome || "selecionada"
                  }"`}
            </Text>

            <View
              style={[
                styles.tipoBadge,
                pinValidado.tipo === "nova_rota"
                  ? styles.tipoBadgeNova
                  : styles.tipoBadgeEditar,
              ]}
            >
              <Text
                style={[
                  styles.tipoBadgeTexto,
                  pinValidado.tipo === "nova_rota"
                    ? styles.tipoBadgeTextoNova
                    : styles.tipoBadgeTextoEditar,
                ]}
              >
                {pinValidado.tipo === "nova_rota"
                  ? "NOVA ROTA"
                  : "EDITAR ROTA"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnPrimario}
              onPress={iniciarGravacao}
              activeOpacity={0.85}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.white}>
                <Path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </Svg>
              <Text style={styles.btnPrimarioTexto}>Iniciar Gravação</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecundario}
              onPress={limpar}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ==========================================
            ESTADO: BLOQUEIO PARCIAL (3 erros)
        ========================================== */}
        {estado === "bloqueio_parcial" && (
          <View style={styles.estadoContainer}>
            <IconeAlerta size={64} />

            <Text style={styles.estadoTitulo}>Muitas tentativas</Text>
            <Text style={styles.estadoSubtitulo}>
              Você errou {tentativas} vezes. Tem mais{" "}
              {MAX_TENTATIVAS_TOTAL - tentativas} tentativa
              {MAX_TENTATIVAS_TOTAL - tentativas !== 1 ? "s" : ""} antes do
              bloqueio.
            </Text>

            <View style={styles.alertaBox}>
              <Text style={styles.alertaTexto}>
                Se errar mais {MAX_TENTATIVAS_TOTAL - tentativas} vez
                {MAX_TENTATIVAS_TOTAL - tentativas !== 1 ? "es" : ""}, o
                acesso será bloqueado por 5 minutos.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnPrimario}
              onPress={voltarDigitar}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecundario}
              onPress={contatar}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecundarioTexto}>
                Contatar administrador
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==========================================
            ESTADO: BLOQUEIO TOTAL (5 erros)
        ========================================== */}
        {estado === "bloqueio_total" && (
          <View style={styles.estadoContainer}>
            <IconeBloqueio size={64} />

            <Text style={[styles.estadoTitulo, { color: colors.danger }]}>
              Acesso bloqueado
            </Text>
            <Text style={styles.estadoSubtitulo}>
              Você excedeu o número máximo de tentativas. O acesso está
              temporariamente bloqueado.
            </Text>

            {tempoBloqueio > 0 && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>Tente novamente em</Text>
                <Text style={styles.timerValor}>
                  {formatarTempoBloqueio(tempoBloqueio)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.btnDanger}
              onPress={contatar}
              activeOpacity={0.85}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill={colors.white}>
                <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </Svg>
              <Text style={styles.btnDangerTexto}>
                Contatar administrador
              </Text>
            </TouchableOpacity>

            {tempoBloqueio === 0 && (
              <TouchableOpacity
                style={styles.btnSecundario}
                onPress={() => {
                  setTentativas(0);
                  setEstado("digitando");
                  setCodigo("");
                  setErro("");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.btnSecundarioTexto}>
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
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
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  titulo: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitulo: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

    body: {
    flex: 1,
    padding: 24,
    paddingBottom: 100,
    justifyContent: "center",
  },
  
  iconeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  bolinhasContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  bolinha: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  bolinhaPreenchida: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bolinhaErro: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  bolinhaValidando: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    opacity: 0.5,
  },

  instrucaoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  instrucao: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  tentativasTextoSutil: {
    textAlign: "center",
    fontSize: 11,
    color: colors.warning,
    fontWeight: "700",
    marginTop: 6,
  },

  erroContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  erroTexto: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  tentativasTexto: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  validandoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  validandoTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },

  teclado: {
    gap: 12,
    paddingHorizontal: 24,
  },
  tecladoLinha: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  tecla: {
    width: 76,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  teclaDesabilitada: {
    opacity: 0.5,
  },
  teclaVazia: {
    width: 76,
    height: 56,
  },
  teclaTexto: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  // Estados (sucesso, bloqueios)
  estadoContainer: {
    alignItems: "center",
    padding: 20,
  },
  estadoTitulo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: "center",
  },
  estadoSubtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  tipoBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tipoBadgeNova: {
    backgroundColor: colors.successLight,
  },
  tipoBadgeEditar: {
    backgroundColor: colors.infoLight,
  },
  tipoBadgeTexto: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tipoBadgeTextoNova: {
    color: colors.success,
  },
  tipoBadgeTextoEditar: {
    color: colors.info,
  },

  alertaBox: {
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    width: "100%",
  },
  alertaTexto: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  timerContainer: {
    marginTop: 24,
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
  },
  timerLabel: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timerValor: {
    color: colors.danger,
    fontSize: 36,
    fontWeight: "900",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },

  btnPrimario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 32,
    width: "100%",
    ...shadows.md,
  },
  btnPrimarioTexto: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },

  btnSecundario: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnSecundarioTexto: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  btnDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.danger,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 32,
    width: "100%",
    ...shadows.md,
  },
  btnDangerTexto: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
});