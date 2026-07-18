import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Svg, { Path, Circle } from "react-native-svg";

import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, shadows } from "../theme/colors";
import {
  pedirPermissaoGPS,
  distanciaMetros,
  calcularHeading,
  msParaKmh,
  formatarTempo,
  formatarDistancia,
} from "../lib/gps";

/* =========================
   TIPOS
========================= */
interface Ponto {
  latitude: number;
  longitude: number;
}

interface ParadaGravada {
  ponto: Ponto;
  timestamp: number;
  nome?: string;
}

type EstadoGravacao = "preparando" | "gravando" | "finalizado";

/* =========================
   ÍCONES
========================= */
function IconeVoltar() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </Svg>
  );
}

function IconeGravando() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.white}>
      <Circle cx="12" cy="12" r="8" />
    </Svg>
  );
}

function IconeParada() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </Svg>
  );
}

function IconeDesfazer() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
    </Svg>
  );
}

function IconeSalvar() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </Svg>
  );
}

/* =========================
   COMPONENTE
========================= */
export default function Gravacao() {
  const { pinId, tipo, rotaId } = useLocalSearchParams<{
    pinId: string;
    tipo: string;
    rotaId?: string;
  }>();
  const router = useRouter();
  const { motorista } = useAuth();

  // Estados
  const [estado, setEstado] = useState<EstadoGravacao>("preparando");
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<Ponto | null>(null);
  const [heading, setHeading] = useState(0);
  const [velocidade, setVelocidade] = useState(0);

  // Dados da gravação
  const [paradas, setParadas] = useState<ParadaGravada[]>([]);
  const [trajeto, setTrajeto] = useState<Ponto[]>([]);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [distanciaTotal, setDistanciaTotal] = useState(0);

  // Finalização
  const [nomeRota, setNomeRota] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Refs
  const mapRef = useRef<MapView>(null);
  const localizacaoSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<any>(null);
  const inicioRef = useRef(0);
  const ultimaPosRef = useRef<Ponto | null>(null);

  /* =====================================================
     GPS
  ===================================================== */
  useEffect(() => {
    iniciarGPS();
    return () => {
      pararGPS();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const iniciarGPS = async () => {
    const permitido = await pedirPermissaoGPS();
    if (!permitido) {
      Alert.alert("GPS necessário", "Ative o GPS pra gravar a rota.");
      router.back();
      return;
    }

    // Localização inicial rápida
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const ponto: Ponto = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setMinhaLocalizacao(ponto);
      ultimaPosRef.current = ponto;
    } catch {}

    // Watch contínuo
    localizacaoSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 3,
        timeInterval: 1000,
      },
      (loc) => {
        const nova: Ponto = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        // Heading
        if (ultimaPosRef.current) {
          const dist = distanciaMetros(
            ultimaPosRef.current.latitude,
            ultimaPosRef.current.longitude,
            nova.latitude,
            nova.longitude
          );
          if (dist > 3) {
            setHeading(
              calcularHeading(
                ultimaPosRef.current.latitude,
                ultimaPosRef.current.longitude,
                nova.latitude,
                nova.longitude
              )
            );

            // Adiciona ao trajeto (só durante gravação)
            if (estado === "gravando") {
              setTrajeto((prev) => [...prev, nova]);
              setDistanciaTotal((prev) => prev + dist / 1000);
            }

            ultimaPosRef.current = nova;
          }
        } else {
          ultimaPosRef.current = nova;
        }

        setMinhaLocalizacao(nova);
        setVelocidade(msParaKmh(loc.coords.speed));
      }
    );
  };

  const pararGPS = () => {
    if (localizacaoSub.current) {
      localizacaoSub.current.remove();
      localizacaoSub.current = null;
    }
  };

  /* =====================================================
     GRAVAÇÃO
  ===================================================== */
  const iniciarGravacao = () => {
    if (!minhaLocalizacao) {
      Alert.alert("Aguarde", "Buscando sua localização...");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEstado("gravando");
    setParadas([]);
    setTrajeto([minhaLocalizacao]);
    setDistanciaTotal(0);
    inicioRef.current = Date.now();

    // Timer
    timerRef.current = setInterval(() => {
      setTempoDecorrido(
        Math.floor((Date.now() - inicioRef.current) / 1000)
      );
    }, 1000);

    // Centraliza no motorista
    if (mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: minhaLocalizacao,
          pitch: 45,
          heading: heading,
          zoom: 17,
        },
        { duration: 800 }
      );
    }
  };

  const marcarParada = () => {
    if (!minhaLocalizacao || estado !== "gravando") return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const novaParada: ParadaGravada = {
      ponto: { ...minhaLocalizacao },
      timestamp: Date.now(),
    };

    setParadas((prev) => [...prev, novaParada]);
  };

  const desfazerUltimaParada = () => {
    if (paradas.length === 0) return;

    Alert.alert(
      "Remover última parada?",
      `Parada ${paradas.length} será removida.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setParadas((prev) => prev.slice(0, -1));
          },
        },
      ]
    );
  };

  const finalizarGravacao = () => {
    if (paradas.length < 2) {
      Alert.alert(
        "Mínimo 2 paradas",
        "Marque pelo menos 2 paradas (início e fim) antes de finalizar."
      );
      return;
    }

    Alert.alert(
      "Finalizar gravação?",
      `Você marcou ${paradas.length} paradas em ${formatarDistancia(distanciaTotal * 1000)}.`,
      [
        { text: "Continuar gravando", style: "cancel" },
        {
          text: "Finalizar",
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            setEstado("finalizado");
          },
        },
      ]
    );
  };

  const cancelarGravacao = () => {
    Alert.alert(
      "Cancelar gravação?",
      "Todos os pontos marcados serão perdidos.",
      [
        { text: "Continuar", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            router.back();
          },
        },
      ]
    );
  };

  /* =====================================================
     SALVAR ROTA
  ===================================================== */
  const salvarRota = async () => {
    if (!nomeRota.trim()) {
      Alert.alert("Nome obrigatório", "Dê um nome pra sua rota.");
      return;
    }

    if (!motorista) {
      Alert.alert("Erro", "Motorista não logado");
      return;
    }

    setSalvando(true);

    try {
      // Monta os pontos originais (paradas)
      const pontosOriginais = paradas.map((p) => [
        p.ponto.latitude,
        p.ponto.longitude,
      ]);

      // Monta os pontos snap (trajeto real — o caminho que fez)
      const pontosSnap = trajeto.map((p) => [p.latitude, p.longitude]);

      // Calcula duração em minutos
      const duracaoMin = tempoDecorrido / 60;

      // Gera uma cor aleatória
      const coresDisponiveis = [
        "#3B82F6",
        "#22C55E",
        "#A855F7",
        "#F59E0B",
        "#EF4444",
        "#06B6D4",
      ];
      const cor =
        coresDisponiveis[Math.floor(Math.random() * coresDisponiveis.length)];

      // Salva no Supabase
      const { data, error } = await supabase
        .from("rotas")
        .insert([
          {
            nome: nomeRota.trim(),
            cor,
            pontos_originais: pontosOriginais,
            pontos_snap: pontosSnap,
            distancia_km: distanciaTotal,
            duracao_min: duracaoMin,
            empresa_id: motorista.empresa_id,
            gravada_por_motorista_id: motorista.id,
            metodo_criacao: "motorista_gps",
            status_rota: "ativa",
            paradas_info: paradas.map((p, i) => ({
              nome: p.nome || `Parada ${i + 1}`,
            })),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Marca PIN como usado
      if (pinId) {
        await supabase.rpc("usar_pin", { p_pin_id: pinId });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Rota salva!",
        `A rota "${nomeRota}" foi gravada com sucesso.\n\n${paradas.length} paradas\n${distanciaTotal.toFixed(1)} km\n${formatarTempo(tempoDecorrido)}`,
        [
          {
            text: "Voltar ao início",
            onPress: () => router.replace("/home" as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Erro ao salvar", err.message || "Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */
  if (!minhaLocalizacao) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Buscando localização...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* MAPA */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={{
          ...minhaLocalizacao,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {/* Trajeto gravado */}
        {trajeto.length > 1 && (
          <>
            <Polyline
              coordinates={trajeto}
              strokeColor="rgba(0,0,0,0.2)"
              strokeWidth={10}
            />
            <Polyline
              coordinates={trajeto}
              strokeColor={colors.danger}
              strokeWidth={6}
            />
          </>
        )}

        {/* Paradas marcadas */}
        {paradas.map((p, i) => (
          <Marker
            key={`parada-${i}`}
            coordinate={p.ponto}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerParada}>
              <Text style={styles.markerNumero}>{i + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* Posição atual */}
        <Marker
          coordinate={minhaLocalizacao}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
        >
          <View style={styles.markerMeu}>
            <View
              style={[
                styles.markerSeta,
                { transform: [{ rotate: `${heading}deg` }] },
              ]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M12 2 L20 20 L12 16 L4 20 Z"
                  fill={estado === "gravando" ? colors.danger : colors.primary}
                  stroke="white"
                  strokeWidth={1.5}
                />
              </Svg>
            </View>
          </View>
        </Marker>
      </MapView>

      {/* HEADER */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View
          style={[
            styles.header,
            estado === "gravando" && styles.headerGravando,
          ]}
        >
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={
              estado === "gravando" ? cancelarGravacao : () => router.back()
            }
          >
            <IconeVoltar />
          </TouchableOpacity>

          <View style={styles.headerCentro}>
            {estado === "gravando" && (
              <View style={styles.gravandoBadge}>
                <IconeGravando />
                <Text style={styles.gravandoTexto}>GRAVANDO</Text>
              </View>
            )}
            <Text style={styles.headerTitulo}>
              {estado === "preparando"
                ? "Preparar Gravação"
                : estado === "gravando"
                ? `${paradas.length} parada${paradas.length !== 1 ? "s" : ""}`
                : "Salvar Rota"}
            </Text>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Métricas durante gravação */}
        {estado === "gravando" && (
          <View style={styles.metricasHeader}>
            <View style={styles.metrica}>
              <Text style={styles.metricaValor}>
                {formatarTempo(tempoDecorrido)}
              </Text>
              <Text style={styles.metricaLabel}>TEMPO</Text>
            </View>
            <View style={styles.metricaDivisor} />
            <View style={styles.metrica}>
              <Text style={styles.metricaValor}>
                {distanciaTotal.toFixed(1)}
              </Text>
              <Text style={styles.metricaLabel}>KM</Text>
            </View>
            <View style={styles.metricaDivisor} />
            <View style={styles.metrica}>
              <Text style={styles.metricaValor}>{velocidade}</Text>
              <Text style={styles.metricaLabel}>KM/H</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* CARD INFERIOR */}
      <SafeAreaView edges={["bottom"]} style={styles.cardWrapper}>
        {/* Estado: PREPARANDO */}
        {estado === "preparando" && (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Pronto pra gravar</Text>
            <Text style={styles.cardDescricao}>
              {tipo === "nova_rota"
                ? "Dirija normalmente e marque cada parada do percurso. O GPS vai traçar o caminho automaticamente."
                : "Refaça o percurso da rota e marque as paradas atualizadas."}
            </Text>

            <View style={styles.dicasContainer}>
              <View style={styles.dica}>
                <Text style={styles.dicaNumero}>1</Text>
                <Text style={styles.dicaTexto}>
                  Toque "Iniciar" quando estiver no ponto de partida
                </Text>
              </View>
              <View style={styles.dica}>
                <Text style={styles.dicaNumero}>2</Text>
                <Text style={styles.dicaTexto}>
                  Marque cada parada ao longo do caminho
                </Text>
              </View>
              <View style={styles.dica}>
                <Text style={styles.dicaNumero}>3</Text>
                <Text style={styles.dicaTexto}>
                  Finalize ao chegar no destino final
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.btnIniciar}
              onPress={iniciarGravacao}
              activeOpacity={0.85}
            >
              <IconeGravando />
              <Text style={styles.btnIniciarTexto}>Iniciar Gravação</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estado: GRAVANDO */}
        {estado === "gravando" && (
          <View style={styles.card}>
            <View style={styles.botoesGravacao}>
              {/* Botão desfazer */}
              <TouchableOpacity
                style={[
                  styles.btnDesfazer,
                  paradas.length === 0 && styles.btnDesabilitado,
                ]}
                onPress={desfazerUltimaParada}
                disabled={paradas.length === 0}
                activeOpacity={0.7}
              >
                <IconeDesfazer />
              </TouchableOpacity>

              {/* Botão marcar parada (GRANDE) */}
              <TouchableOpacity
                style={styles.btnMarcar}
                onPress={marcarParada}
                activeOpacity={0.85}
              >
                <IconeParada />
                <Text style={styles.btnMarcarTexto}>MARCAR PARADA</Text>
              </TouchableOpacity>

              {/* Botão finalizar */}
              <TouchableOpacity
                style={[
                  styles.btnFinalizar,
                  paradas.length < 2 && styles.btnDesabilitado,
                ]}
                onPress={finalizarGravacao}
                disabled={paradas.length < 2}
                activeOpacity={0.7}
              >
                <IconeSalvar />
              </TouchableOpacity>
            </View>

            {paradas.length < 2 && (
              <Text style={styles.dicaMinima}>
                Marque pelo menos 2 paradas (início e fim) pra finalizar
              </Text>
            )}
          </View>
        )}

        {/* Estado: FINALIZADO — form de salvar */}
        {estado === "finalizado" && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Salvar rota</Text>

              {/* Resumo */}
              <View style={styles.resumoContainer}>
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoValor}>{paradas.length}</Text>
                  <Text style={styles.resumoLabel}>paradas</Text>
                </View>
                <View style={styles.resumoDivisor} />
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoValor}>
                    {distanciaTotal.toFixed(1)}
                  </Text>
                  <Text style={styles.resumoLabel}>km</Text>
                </View>
                <View style={styles.resumoDivisor} />
                <View style={styles.resumoItem}>
                  <Text style={styles.resumoValor}>
                    {formatarTempo(tempoDecorrido)}
                  </Text>
                  <Text style={styles.resumoLabel}>tempo</Text>
                </View>
              </View>

              {/* Nome da rota */}
              <TextInput
                style={styles.input}
                placeholder="Nome da rota (ex: Linha Ipanema)"
                placeholderTextColor={colors.textMuted}
                value={nomeRota}
                onChangeText={setNomeRota}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={salvarRota}
              />

              <View style={styles.botoesFinais}>
                <TouchableOpacity
                  style={styles.btnVoltarGravar}
                  onPress={() => {
                    setEstado("gravando");
                    inicioRef.current =
                      Date.now() - tempoDecorrido * 1000;
                    timerRef.current = setInterval(() => {
                      setTempoDecorrido(
                        Math.floor(
                          (Date.now() - inicioRef.current) / 1000
                        )
                      );
                    }, 1000);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnVoltarGravarTexto}>
                    Continuar gravando
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btnSalvar,
                    (!nomeRota.trim() || salvando) && styles.btnDesabilitado,
                  ]}
                  onPress={salvarRota}
                  disabled={!nomeRota.trim() || salvando}
                  activeOpacity={0.85}
                >
                  {salvando ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <IconeSalvar />
                  )}
                  <Text style={styles.btnSalvarTexto}>
                    {salvando ? "Salvando..." : "Salvar Rota"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Header
  headerSafe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primaryDark,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerGravando: {
    backgroundColor: colors.danger,
  },
  btnVoltar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCentro: { flex: 1, alignItems: "center" },
  headerTitulo: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  gravandoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  gravandoTexto: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  metricasHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 4,
  },
  metrica: { flex: 1, alignItems: "center" },
  metricaValor: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  metricaLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  metricaDivisor: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
  },

  // Markers
  markerParada: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  markerNumero: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  markerMeu: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  markerSeta: {
    width: 20,
    height: 20,
  },

  // Card inferior
  cardWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    ...shadows.lg,
  },
  cardTitulo: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardDescricao: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },

  // Dicas
  dicasContainer: { gap: 10, marginBottom: 20 },
  dica: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dicaNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 28,
    overflow: "hidden",
  },
  dicaTexto: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  // Botões
  btnIniciar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.danger,
    paddingVertical: 18,
    borderRadius: 16,
    ...shadows.md,
  },
  btnIniciarTexto: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },

  botoesGravacao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  btnDesfazer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnMarcar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    ...shadows.md,
  },
  btnMarcarTexto: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  btnFinalizar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDesabilitado: {
    opacity: 0.4,
  },
  dicaMinima: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 10,
    fontWeight: "600",
  },

  // Resumo
  resumoContainer: {
    flexDirection: "row",
    backgroundColor: colors.borderLight,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  resumoItem: { flex: 1, alignItems: "center" },
  resumoValor: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },
  resumoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  resumoDivisor: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    alignSelf: "center",
  },

  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.borderLight,
    marginBottom: 16,
  },

  botoesFinais: {
    gap: 8,
  },
  btnVoltarGravar: {
    alignItems: "center",
    paddingVertical: 12,
  },
  btnVoltarGravarTexto: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  btnSalvar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 18,
    borderRadius: 16,
    ...shadows.md,
  },
  btnSalvarTexto: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
});