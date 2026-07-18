import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Camera,
} from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useKeepAwake } from "expo-keep-awake";

import { supabase } from "../supabase";
import { colors, shadows } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";
import { useEnviarPosicao } from "../hooks/useEnviarPosicao";
import { useDetectorDesvio } from "../hooks/useDetectorDesvio";
import {
  criarViagem,
  atualizarViagem,
  finalizarViagem,
} from "../lib/viagem";
import MarcadorVeiculo from "../components/MarcadorVeiculo";
import HUDVelocidade from "../components/HUDVelocidade";
import ProgressoParadas from "../components/ProgressoParadas";
import AlertaDesvio from "../components/AlertaDesvio";
import {
  calcularHeading,
  msParaKmh,
  pedirPermissaoGPS,
  distanciaMetros,
  formatarTempo,
  formatarDistancia,
} from "../lib/gps";
import { estiloAutomatico } from "../lib/mapStyles";
import CardArrastavel from "../components/CardArrastavel";
import BotaoSOS from "../components/BotaoSOS";


/* =========================
   TIPOS
========================= */
interface Ponto {
  latitude: number;
  longitude: number;
}

interface Rota {
  id: string;
  nome: string;
  cor: string;
  pontos_snap: any[];
  pontos_originais: any[];
  paradas_info?: any[];
  distancia_km: number;
  duracao_min: number;
  categoria?: string;
}

const RAIO_CHEGADA = 40;
const RAIO_APROXIMACAO = 200;

/* =========================
   ÍCONES SVG
========================= */
function IconeVoltar() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </Svg>
  );
}

function IconeRecentralizar() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={colors.primary}>
      <Path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </Svg>
  );
}

function IconePlay() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function IconeBandeira() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </Svg>
  );
}

function IconeSucesso() {
  return (
    <Svg width={60} height={60} viewBox="0 0 24 24" fill={colors.success}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </Svg>
  );
}

// 🆕 SVG check pequeno pros marcadores
function IconeCheckMarker() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </Svg>
  );
}

// 🆕 SVG bandeira pequena pros marcadores
function IconeBandeiraMarker() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </Svg>
  );
}

/* =========================
   HELPERS
========================= */
function normalizarPonto(p: any): Ponto | null {
  if (!p) return null;
  if (Array.isArray(p)) {
    return { latitude: Number(p[0]), longitude: Number(p[1]) };
  }
  if (p.latitude !== undefined && p.longitude !== undefined) {
    return { latitude: Number(p.latitude), longitude: Number(p.longitude) };
  }
  if (p.lat !== undefined && p.lng !== undefined) {
    return { latitude: Number(p.lat), longitude: Number(p.lng) };
  }
  return null;
}

function normalizarLista(lista: any[]): Ponto[] {
  if (!Array.isArray(lista)) return [];
  return lista
    .map(normalizarPonto)
    .filter(
      (p): p is Ponto =>
        p !== null && (p.latitude !== 0 || p.longitude !== 0)
    );
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function Navegacao() {
  const { rotaId } = useLocalSearchParams();
  const router = useRouter();

  // 🔋 Mantém a tela acordada durante toda a navegação
  useKeepAwake();

  // Auth (tempo real)
  const { motorista } = useAuth();

  // Estados principais
  const [rota, setRota] = useState<Rota | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [emViagem, setEmViagem] = useState(false);
  const [viagemConcluida, setViagemConcluida] = useState(false);

  // GPS
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<Ponto | null>(null);
  const [heading, setHeading] = useState(0);
  const [velocidade, setVelocidade] = useState(0);

  // 🆕 Tempo real
  const [viagemId, setViagemId] = useState<string | null>(null);
  const [velocidadeMaxima, setVelocidadeMaxima] = useState(0);
  const [distanciaReal, setDistanciaReal] = useState(0);

  // Progresso
  const [paradaAtualIdx, setParadaAtualIdx] = useState(0);
  const [paradasConcluidas, setParadasConcluidas] = useState<Set<number>>(new Set());
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  // UI
  const [seguirVeiculo, setSeguirVeiculo] = useState(true);
  const [enderecoAtual, setEnderecoAtual] = useState("");
  const [distAteProxima, setDistAteProxima] = useState(0);
  const [toastVisivel, setToastVisivel] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");
  const [alertouAproximacao, setAlertouAproximacao] = useState<Set<number>>(new Set());
  const [buscandoGPS, setBuscandoGPS] = useState(false);
  const [emPausa, setEmPausa] = useState(false);

  // Animações
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Refs
  const mapRef = useRef<MapView>(null);
  const localizacaoSub = useRef<Location.LocationSubscription | null>(null);
  const timerViagem = useRef<any>(null);
  const inicioViagem = useRef<number>(0);
  const ultimaPos = useRef<Ponto | null>(null);
  const paradaAtualIdxRef = useRef(0);
  const paradasConcluidasRef = useRef<Set<number>>(new Set());
  const [cardAberto, setCardAberto] = useState(false); // 🆕 controla visibilidade do HUD

  // 🆕 Hook de envio de posição pro Supabase
  useEnviarPosicao({
    latitude: minhaLocalizacao?.latitude ?? null,
    longitude: minhaLocalizacao?.longitude ?? null,
    heading: heading,
    velocidade: velocidade,
    emViagem: emViagem,
    viagemId: viagemId,
    intervalo: 10000,
  });

  // 🆕 Detector de desvio de rota (com tempo dinâmico por velocidade)
  const { emDesvio, distanciaAtual } = useDetectorDesvio({
    localizacao: minhaLocalizacao,
    rota: normalizarLista(rota?.pontos_snap || []),
    emViagem: emViagem,
    viagemId: viagemId,
    velocidade: velocidade,
    tolerancia: 50,
  });

  useEffect(() => {
    paradaAtualIdxRef.current = paradaAtualIdx;
  }, [paradaAtualIdx]);

  useEffect(() => {
    paradasConcluidasRef.current = paradasConcluidas;
  }, [paradasConcluidas]);

  // 🆕 Atualiza velocidade máxima
  useEffect(() => {
    if (emViagem && velocidade > velocidadeMaxima) {
      setVelocidadeMaxima(velocidade);
    }
  }, [velocidade, emViagem, velocidadeMaxima]);

  // 🆕 Rastreia distância real percorrida
  useEffect(() => {
    if (!emViagem || !minhaLocalizacao || !ultimaPos.current) return;

    const dist = distanciaMetros(
      ultimaPos.current.latitude,
      ultimaPos.current.longitude,
      minhaLocalizacao.latitude,
      minhaLocalizacao.longitude
    );

    if (dist > 3 && dist < 200) {
      setDistanciaReal((prev) => prev + dist / 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhaLocalizacao, emViagem]);

  /* =====================================================
     CARREGAR ROTA + INICIAR GPS
  ===================================================== */
  useEffect(() => {
    carregarRota();
    iniciarGPS();

    return () => {
      pararGPS();
      pararTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarRota = async () => {
    if (!rotaId) return;
    const { data, error } = await supabase
      .from("rotas")
      .select("*")
      .eq("id", rotaId as string)
      .single();

    if (error || !data) {
      Alert.alert("Erro", "Não foi possível carregar a rota");
      router.back();
      return;
    }

    setRota(data as Rota);
    setCarregando(false);
  };

  /* =====================================================
     TOAST
  ===================================================== */
  const mostrarToast = (msg: string) => {
    setToastMensagem(msg);
    setToastVisivel(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisivel(false));
  };

  /* =====================================================
     GPS
  ===================================================== */
  const iniciarGPS = async () => {
    const autorizado = await pedirPermissaoGPS();
    if (!autorizado) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos da sua localização para navegar. Vá em Configurações e habilite o GPS."
      );
      return;
    }

    try {
      const ultimaConhecida = await Location.getLastKnownPositionAsync({
        maxAge: 60000,
        requiredAccuracy: 100,
      });
      if (ultimaConhecida) {
        const inicial: Ponto = {
          latitude: ultimaConhecida.coords.latitude,
          longitude: ultimaConhecida.coords.longitude,
        };
        setMinhaLocalizacao(inicial);
        ultimaPos.current = inicial;
        buscarEndereco(inicial.latitude, inicial.longitude);
      }
    } catch {}

    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
      .then((pos) => {
        const balanced: Ponto = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setMinhaLocalizacao(balanced);
        ultimaPos.current = balanced;
        buscarEndereco(balanced.latitude, balanced.longitude);
      })
      .catch(() => {});

    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })
      .then((pos) => {
        const preciso: Ponto = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setMinhaLocalizacao(preciso);
        ultimaPos.current = preciso;
        buscarEndereco(preciso.latitude, preciso.longitude);
      })
      .catch(() => {});

    localizacaoSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 1000,
      },
      (loc) => {
        const nova: Ponto = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        if (ultimaPos.current) {
          const dist = distanciaMetros(
            ultimaPos.current.latitude,
            ultimaPos.current.longitude,
            nova.latitude,
            nova.longitude
          );
          if (dist > 3) {
            const h = calcularHeading(
              ultimaPos.current.latitude,
              ultimaPos.current.longitude,
              nova.latitude,
              nova.longitude
            );
            setHeading(h);
            ultimaPos.current = nova;
          }
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

  const buscarEndereco = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      const a = data.address || {};
      const rua = a.road || a.pedestrian || "Rua sem nome";
      const numero = a.house_number ? `, ${a.house_number}` : "";
      setEnderecoAtual(`${rua}${numero}`);
    } catch {
      setEnderecoAtual("");
    }
  };

  /* =====================================================
     PARADAS - detecção automática
  ===================================================== */
  const paradasNormalizadas = rota
    ? (rota.pontos_originais.map(normalizarPonto).filter(Boolean) as Ponto[])
    : [];
  const paradasTotais = paradasNormalizadas.length;

  useEffect(() => {
    if (!emViagem || !minhaLocalizacao || paradasTotais === 0) return;

    const idxAtual = paradaAtualIdxRef.current;
    if (idxAtual >= paradasTotais) return;

    const proxima = paradasNormalizadas[idxAtual];
    if (!proxima) return;

    const dist = distanciaMetros(
      minhaLocalizacao.latitude,
      minhaLocalizacao.longitude,
      proxima.latitude,
      proxima.longitude
    );

    setDistAteProxima(dist);

    if (
      dist <= RAIO_APROXIMACAO &&
      dist > RAIO_CHEGADA &&
      !alertouAproximacao.has(idxAtual)
    ) {
      setAlertouAproximacao((prev) => new Set(prev).add(idxAtual));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nomeParada =
        rota?.paradas_info?.[idxAtual]?.nome || `Parada ${idxAtual + 1}`;
      mostrarToast(`Aproximando de ${nomeParada}`);
    }

    if (dist <= RAIO_CHEGADA && !paradasConcluidasRef.current.has(idxAtual)) {
      marcarParadaConcluida(idxAtual);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhaLocalizacao, emViagem]);

  const marcarParadaConcluida = (idx: number) => {
    if (paradasConcluidasRef.current.has(idx)) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const novasConcluidas = new Set(paradasConcluidasRef.current);
    novasConcluidas.add(idx);
    paradasConcluidasRef.current = novasConcluidas;
    setParadasConcluidas(novasConcluidas);

    if (viagemId) {
      atualizarViagem({
        viagem_id: viagemId,
        paradas_concluidas: novasConcluidas.size,
        paradas_ids_concluidas: Array.from(novasConcluidas),
      });
    }

    const nomeParada =
      rota?.paradas_info?.[idx]?.nome || `Parada ${idx + 1}`;

    if (idx === paradasTotais - 1) {
      mostrarToast(`Chegou em ${nomeParada}`);
      setTimeout(() => concluirViagem(), 1500);
      return;
    }

    mostrarToast(`Passou por ${nomeParada}`);
    setParadaAtualIdx(idx + 1);
    paradaAtualIdxRef.current = idx + 1;
  };

  /* =====================================================
     VIAGEM
  ===================================================== */
  const iniciarViagem = async () => {
    if (!minhaLocalizacao) {
      setBuscandoGPS(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mostrarToast("Buscando sua localização...");

      try {
        const pos = (await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 3000)
          ),
        ])) as Location.LocationObject;

        const inicial: Ponto = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setMinhaLocalizacao(inicial);
        ultimaPos.current = inicial;
      } catch {
        setBuscandoGPS(false);
        Alert.alert(
          "Sem localização",
          "Não conseguimos pegar sua localização. Verifique se o GPS está ativado e tente novamente."
        );
        return;
      }
      setBuscandoGPS(false);
    }

    if (!motorista || !rota) {
      Alert.alert("Erro", "Dados de motorista ou rota não carregados");
      return;
    }

    const novaViagemId = await criarViagem({
      motorista_id: motorista.id,
      empresa_id: motorista.empresa_id,
      rota_id: rota.id,
      motorista_nome: motorista.nome,
      rota_nome: rota.nome,
      rota_cor: rota.cor,
      paradas_totais: paradasTotais,
      distancia_planejada_km: Number(rota.distancia_km) || 0,
    });

    if (!novaViagemId) {
      Alert.alert(
        "Erro ao criar viagem",
        "Não foi possível registrar sua viagem. Tente novamente."
      );
      return;
    }

    setViagemId(novaViagemId);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEmViagem(true);
    setViagemConcluida(false);
    setParadaAtualIdx(0);
    setParadasConcluidas(new Set());
    setAlertouAproximacao(new Set());
    setVelocidadeMaxima(0);
    setDistanciaReal(0);
    paradaAtualIdxRef.current = 0;
    paradasConcluidasRef.current = new Set();
    inicioViagem.current = Date.now();

    timerViagem.current = setInterval(() => {
      setTempoDecorrido(
        Math.floor((Date.now() - inicioViagem.current) / 1000)
      );
    }, 1000);

    setSeguirVeiculo(true);

    setTimeout(() => {
      aplicarCameraViagem();
    }, 200);

    mostrarToast("Viagem iniciada. Boa rota!");
  };

  const concluirViagem = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    pararTimer();

    if (viagemId) {
      const duracaoSeg = Math.floor(
        (Date.now() - inicioViagem.current) / 1000
      );
      const velMedia =
        duracaoSeg > 0 ? distanciaReal / (duracaoSeg / 3600) : 0;

      await finalizarViagem(viagemId, {
        paradas_concluidas: paradasConcluidas.size,
        distancia_real_km: distanciaReal,
        duracao_segundos: duracaoSeg,
        velocidade_media_kmh: velMedia,
        velocidade_maxima_kmh: velocidadeMaxima,
        status: "concluida",
      });
    }

    setEmViagem(false);
    setViagemConcluida(true);
  };

  const confirmarEncerrar = () => {
    if (paradasConcluidas.size < paradasTotais) {
      Alert.alert(
        "Encerrar viagem?",
        `Você concluiu ${paradasConcluidas.size} de ${paradasTotais} paradas. Deseja finalizar mesmo assim?`,
        [
          { text: "Continuar viagem", style: "cancel" },
          {
            text: "Encerrar",
            style: "destructive",
            onPress: async () => {
              if (viagemId) {
                const duracaoSeg = Math.floor(
                  (Date.now() - inicioViagem.current) / 1000
                );
                const velMedia =
                  duracaoSeg > 0 ? distanciaReal / (duracaoSeg / 3600) : 0;

                await finalizarViagem(viagemId, {
                  paradas_concluidas: paradasConcluidas.size,
                  distancia_real_km: distanciaReal,
                  duracao_segundos: duracaoSeg,
                  velocidade_media_kmh: velMedia,
                  velocidade_maxima_kmh: velocidadeMaxima,
                  status: "cancelada",
                });
              }
              concluirViagem();
            },
          },
        ]
      );
    } else {
      concluirViagem();
    }
  };

  const togglePausa = () => {
    if (emPausa) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEmPausa(false);
      inicioViagem.current = Date.now() - tempoDecorrido * 1000;
      timerViagem.current = setInterval(() => {
        setTempoDecorrido(
          Math.floor((Date.now() - inicioViagem.current) / 1000)
        );
      }, 1000);
      setSeguirVeiculo(true);
      aplicarCameraViagem();
      mostrarToast("Viagem retomada");
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setEmPausa(true);
      if (timerViagem.current) {
        clearInterval(timerViagem.current);
        timerViagem.current = null;
      }
      mostrarToast("Viagem pausada");
    }
  };

  const finalizarERetornar = () => {
    router.back();
  };

  const pararTimer = () => {
    if (timerViagem.current) {
      clearInterval(timerViagem.current);
      timerViagem.current = null;
    }
  };

  /* =====================================================
     CÂMERA
  ===================================================== */
  const aplicarCameraViagem = () => {
    if (!mapRef.current || !minhaLocalizacao) return;
    const cam: Camera = {
      center: minhaLocalizacao,
      pitch: 60,
      heading: heading,
      altitude: 400,
      zoom: 18,
    };
    mapRef.current.animateCamera(cam, { duration: 1000 });
  };

  useEffect(() => {
    if (!emViagem || !seguirVeiculo || !minhaLocalizacao || !mapRef.current)
      return;

    mapRef.current.animateCamera(
      {
        center: minhaLocalizacao,
        heading: heading,
        pitch: 60,
        zoom: 18,
      },
      { duration: 500 }
    );
  }, [minhaLocalizacao, heading, emViagem, seguirVeiculo]);

  const recentralizarNoVeiculo = () => {
    setSeguirVeiculo(true);
    if (emViagem) {
      aplicarCameraViagem();
    } else if (minhaLocalizacao && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...minhaLocalizacao,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800
      );
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */
  if (carregando || !rota) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando rota...</Text>
      </View>
    );
  }

  const coordenadasRota = normalizarLista(rota.pontos_snap);
  const infoProximaParada = rota.paradas_info?.[paradaAtualIdx];
  const nomeProxima =
    infoProximaParada?.nome ||
    (paradaAtualIdx === paradasTotais - 1
      ? "Destino final"
      : `Parada ${paradaAtualIdx + 1}`);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* MAPA */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        customMapStyle={estiloAutomatico()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onPanDrag={() => setSeguirVeiculo(false)}
        initialRegion={
          minhaLocalizacao
            ? {
                ...minhaLocalizacao,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : {
                latitude: -23.55,
                longitude: -46.63,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
      >
        {coordenadasRota.length > 0 && (
          <>
            <Polyline
              coordinates={coordenadasRota}
              strokeColor="rgba(0,0,0,0.3)"
              strokeWidth={12}
            />
            <Polyline
              coordinates={coordenadasRota}
              strokeColor={rota.cor || colors.primary}
              strokeWidth={8}
            />
            <Polyline
              coordinates={coordenadasRota}
              strokeColor="rgba(255,255,255,0.4)"
              strokeWidth={2}
            />
          </>
        )}

        {paradasNormalizadas.map((p, i) => {
          const concluida = paradasConcluidas.has(i);
          const ehAtual = i === paradaAtualIdx && emViagem && !concluida;
          const ehUltima = i === paradasTotais - 1;

          return (
            <Marker
              key={`parada-${i}`}
              coordinate={p}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={ehAtual ? 999 : 1}
            >
              <View
                style={[
                  styles.markerParada,
                  concluida && styles.markerConcluida,
                  ehAtual && styles.markerAtual,
                  ehUltima && !concluida && styles.markerUltima,
                ]}
              >
                {concluida ? (
                  <IconeCheckMarker />
                ) : ehUltima ? (
                  <IconeBandeiraMarker />
                ) : (
                  <Text
                    style={[
                      styles.markerNumero,
                      ehAtual && styles.markerNumeroAtual,
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
            </Marker>
          );
        })}

        {minhaLocalizacao && (
          <Marker
            coordinate={minhaLocalizacao}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            zIndex={1000}
          >
            <MarcadorVeiculo heading={heading} emViagem={emViagem} />
          </Marker>
        )}
      </MapView>

      {/* HEADER */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={() => (emViagem ? confirmarEncerrar() : router.back())}
          >
            <IconeVoltar />
          </TouchableOpacity>

          <View style={styles.headerCentro}>
            <Text style={styles.headerNome} numberOfLines={1}>
              {rota.nome}
            </Text>
            {rota.categoria && (
              <Text style={styles.headerCategoria}>{rota.categoria}</Text>
            )}
          </View>

          <View style={{ width: 44 }} />
        </View>

         {emViagem && paradasTotais > 0 && (
        <       View style={styles.progressoContainer}>
                  <ProgressoParadas
          total={paradasTotais}
          atual={paradaAtualIdx}
          concluidas={paradasConcluidas.size}
    />
  </View>
)}
      </SafeAreaView>

      {/* TOAST */}
      {toastVisivel && (
        <Animated.View
          style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}
          pointerEvents="none"
        >
          <View style={styles.toastConteudo}>
            <Text style={styles.toastIcone}>✓</Text>
            <Text style={styles.toastTexto}>{toastMensagem}</Text>
          </View>
        </Animated.View>
      )}

      {/* ALERTA DE DESVIO */}
      <AlertaDesvio visivel={emDesvio} distancia={distanciaAtual} />

      {/* HUD VELOCIDADE (some quando card está aberto) */}
<       View style={styles.hudContainer}>
          <HUDVelocidade
            velocidade={velocidade}
            limite={40}
            visivel={emViagem && !cardAberto}
            />
            </View>

      {/* BOTÃO RECENTRALIZAR */}
      {!seguirVeiculo && !cardAberto && (
  <TouchableOpacity
    style={styles.btnRecentralizar}
    onPress={recentralizarNoVeiculo}
  >
    <IconeRecentralizar />
  </TouchableOpacity>
)}

      

      {/* CARD INFERIOR ARRASTÁVEL */}
        <CardArrastavel
          emViagem={emViagem}
          paradaAtualIdx={paradaAtualIdx}
          onEstadoChange={setCardAberto}
          paradas={paradasNormalizadas.map((_, i) => ({
      nome:
      rota.paradas_info?.[i]?.nome ||
      (i === paradasTotais - 1 ? "Destino final" : `Parada ${i + 1}`),
    endereco: rota.paradas_info?.[i]?.endereco,
    concluida: paradasConcluidas.has(i),
    ehAtual: i === paradaAtualIdx && emViagem && !paradasConcluidas.has(i),
    ehUltima: i === paradasTotais - 1,
    distancia: i === paradaAtualIdx ? distAteProxima : undefined,
  }))}
>
  <View style={styles.cardHeader}>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardLabel}>
        {emViagem ? "PRÓXIMA PARADA" : "PRONTO PARA COMEÇAR"}
      </Text>
      <Text style={styles.cardTitulo}>{nomeProxima}</Text>
      {emViagem && infoProximaParada?.endereco && (
        <Text style={styles.cardEndereco} numberOfLines={1}>
          {infoProximaParada.endereco}
        </Text>
      )}
      {!emViagem && enderecoAtual && (
        <Text style={styles.cardEndereco} numberOfLines={1}>
          Você está em: {enderecoAtual}
        </Text>
      )}
    </View>

    {emViagem && distAteProxima > 0 && (
      <View
        style={[
          styles.badgeDistancia,
          distAteProxima <= RAIO_APROXIMACAO && styles.badgeAproximando,
        ]}
      >
        <Text style={styles.badgeDistanciaValor}>
          {formatarDistancia(distAteProxima)}
        </Text>
        <Text style={styles.badgeDistanciaLabel}>até chegar</Text>
      </View>
    )}
  </View>

  {emViagem && (
    <View style={styles.metricas}>
      <View style={styles.metrica}>
        <Text style={styles.metricaValor}>
          {formatarTempo(tempoDecorrido)}
        </Text>
        <Text style={styles.metricaLabel}>tempo</Text>
      </View>
      <View style={styles.divisor} />
      <View style={styles.metrica}>
        <Text style={styles.metricaValor}>
          {paradasConcluidas.size}/{paradasTotais}
        </Text>
        <Text style={styles.metricaLabel}>paradas</Text>
      </View>
      <View style={styles.divisor} />
      <View style={styles.metrica}>
        <Text style={styles.metricaValor}>{velocidade}</Text>
        <Text style={styles.metricaLabel}>km/h</Text>
      </View>
    </View>
  )}

  {!emViagem ? (
    <TouchableOpacity
      style={[styles.btnPrimario, buscandoGPS && styles.btnDisabled]}
      onPress={iniciarViagem}
      activeOpacity={0.85}
      disabled={buscandoGPS}
    >
      {buscandoGPS ? (
        <>
          <ActivityIndicator color={colors.white} size="small" />
          <Text style={styles.btnPrimarioTexto}>
            Buscando localização...
          </Text>
        </>
      ) : (
        <>
          <IconePlay />
          <Text style={styles.btnPrimarioTexto}>Iniciar Viagem</Text>
        </>
      )}
    </TouchableOpacity>
  ) : (
    <View style={styles.botoesViagem}>
      <TouchableOpacity
        style={[styles.btnPausa, emPausa && styles.btnRetomar]}
        onPress={togglePausa}
        activeOpacity={0.85}
      >
        {emPausa ? (
          <>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill={colors.white}>
              <Path d="M8 5v14l11-7z" />
            </Svg>
            <Text style={styles.btnPausaTexto}>Retomar</Text>
          </>
        ) : (
          <>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill={colors.white}>
              <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </Svg>
            <Text style={styles.btnPausaTexto}>Pausar</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnConcluir}
        onPress={confirmarEncerrar}
        activeOpacity={0.85}
      >
        <IconeBandeira />
        <Text style={styles.btnConcluirTexto}>Concluir</Text>
      </TouchableOpacity>
    </View>
  )}
</CardArrastavel>

      {/* MODAL DE VIAGEM CONCLUÍDA */}
      {viagemConcluida && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalConcluido}>
            <IconeSucesso />
            <Text style={styles.modalTitulo}>Viagem concluída!</Text>
            <Text style={styles.modalSubtitulo}>
              Parabéns pela viagem, motorista
            </Text>

            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValor}>
                  {formatarTempo(tempoDecorrido)}
                </Text>
                <Text style={styles.modalStatLabel}>Tempo total</Text>
              </View>
              <View style={styles.modalStatDivisor} />
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValor}>
                  {paradasConcluidas.size}
                </Text>
                <Text style={styles.modalStatLabel}>Paradas</Text>
              </View>
              <View style={styles.modalStatDivisor} />
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValor}>
                  {rota.distancia_km?.toFixed(1) || "0"}
                </Text>
                <Text style={styles.modalStatLabel}>km</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={finalizarERetornar}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnTexto}>Voltar ao início</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  btnVoltar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCentro: { flex: 1, alignItems: "center" },
  headerNome: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },
  headerCategoria: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  toast: {
    position: "absolute",
    top: 130,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  toastConteudo: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadows.lg,
  },
  toastIcone: {
    color: colors.success,
    fontSize: 20,
    fontWeight: "900",
  },
  toastTexto: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  hudContainer: {
  position: "absolute",
  bottom: 300,
  left: 16,
  zIndex: 10,
},

btnRecentralizar: {
  position: "absolute",
  right: 16,
  bottom: 300,
  zIndex: 10,
  width: 52,
  height: 52,
  borderRadius: 26,
  backgroundColor: colors.white,
  alignItems: "center",
  justifyContent: "center",
  ...shadows.lg,
},

  // 🆕 Marcadores mais visíveis
  markerParada: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
    ...shadows.md,
  },
  markerAtual: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderWidth: 3,
    width: 42,
    height: 42,
    borderRadius: 21,
    opacity: 1,
  },
  markerConcluida: {
    backgroundColor: colors.success,
    borderColor: colors.white,
    borderWidth: 2.5,
    opacity: 0.85,
  },
  markerUltima: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.white,
    borderWidth: 2.5,
    opacity: 0.9,
  },
  markerNumero: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  markerNumeroAtual: {
    color: colors.white,
    fontSize: 15,
  },

  cardWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    ...shadows.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  cardEndereco: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  badgeDistancia: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    minWidth: 85,
  },
  badgeAproximando: {
    backgroundColor: colors.warning,
  },
  badgeDistanciaValor: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  badgeDistanciaLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  metricas: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  metrica: { flex: 1, alignItems: "center" },
  metricaValor: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  metricaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  divisor: { width: 1, height: 24, backgroundColor: colors.border },

  btnPrimario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    ...shadows.md,
  },
  btnPrimarioTexto: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnConcluir: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 16,
    ...shadows.md,
  },
  btnConcluirTexto: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 9999,
  },
  modalConcluido: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
    ...shadows.lg,
  },
  modalTitulo: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textPrimary,
    marginTop: 16,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  modalStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 24,
    marginBottom: 24,
    width: "100%",
  },
  modalStat: { flex: 1, alignItems: "center" },
  modalStatValor: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },
  modalStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  modalStatDivisor: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  modalBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    ...shadows.md,
  },
  modalBtnTexto: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },

  botoesViagem: {
    flexDirection: "row",
    gap: 10,
  },
  btnPausa: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.warning,
    paddingVertical: 14,
    borderRadius: 16,
    ...shadows.md,
  },
  btnRetomar: {
    backgroundColor: colors.primary,
  },
  btnPausaTexto: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
});