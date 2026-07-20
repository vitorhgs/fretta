import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Copy,
  Crosshair,
  Download,
  Eye,
  Info,
  KeyRound,
  Map as MapIcon,
  Moon as MoonIcon,
  MoreVertical,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Pencil,
  Satellite,
  Trash2,
  Type,
  Undo2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonRotasList } from "../components/ui/Skeleton";
import FormGerarPin from "../components/pins/FormGerarPin";
import PinGerado from "../components/pins/PinGerado";
import BadgeStatus from "../components/rotas/BadgeStatus";
import BadgeTurnos from "../components/rotas/BadgeTurnos";
import BadgeLinha from "../components/rotas/BadgeLinha";   
import ModalVincularLinha from "../components/rotas/ModalVincularLinha";
import SeletorStatus from "../components/rotas/SeletorStatus";
import SeletorTurnos from "../components/rotas/SeletorTurnos";
import { getStatusRota, getTurnosRota } from "../lib/rotas";
import { supabase } from "../supabase";


/* =========================
   TIPOS
========================= */
interface ParadaInfo {
  nome?: string;
  endereco?: string;
  horario?: string;
}

type StatusRota = "ativa" | "pausada" | "arquivada";

interface RotaSalva {
  id: string;
  nome: string;
  pontos_originais: LatLngExpression[];
  pontos_snap: LatLngExpression[];
  distancia_km: number;
  duracao_min: number;
  cor: string;
  paradas_info?: ParadaInfo[];
  categoria?: string;
  turno?: string;
  turnos_atendidos?: string[];
  status_rota?: StatusRota;
  dias_semana?: number[];
  horario_saida?: string;
  linha_id?: string | null;
}

interface LinhaResumo {
  id: string;
  nome: string;
  cor: string;
  cliente_nome_fantasia?: string | null;
  status: string;
}

/* =========================
   CONFIG
========================= */
const coresDisponiveis = [
  "#3B82F6",
  "#22C55E",
  "#A855F7",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#F97316",
];

const categorias = ["Ida", "Volta", "Circular", "Especial"];
const TURNOS_FILTRO = ["Manhã", "Tarde", "Noite", "Madrugada"];

/* =========================
   ÍCONES DO MAPA
========================= */
const bandeiraIcon = new L.DivIcon({
  className: "marker-pop-in",
  html: `
    <svg width="42" height="52" viewBox="0 0 42 52" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="21" cy="49" rx="8" ry="2.5" fill="rgba(0,0,0,0.25)"/>
      <path d="M21 2 C10.5 2, 2 10.5, 2 21 C2 32, 12 40, 20 49
               C20.4 49.5, 21.6 49.5, 22 49 C30 40, 40 32, 40 21 
               C40 10.5, 31.5 2, 21 2 Z"
        fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
      <circle cx="21" cy="20" r="6.5" fill="#1E3A8A"/>
    </svg>
  `,
  iconSize: [42, 52],
  iconAnchor: [21, 49],
});

const pontoPartidaIcon = new L.DivIcon({
  className: "marker-pop-in",
  html: `
    <div style="width:26px;height:26px;border-radius:50%;background:white;border:4px solid #3B82F6;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function criarMarcadorNumerado(numero: number) {
  return new L.DivIcon({
    className: "marker-pop-in",
    html: `
      <div style="width:30px;height:30px;border-radius:50%;background:white;border:3px solid #3B82F6;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);">
        <div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:11px;font-family:system-ui,sans-serif;line-height:1;">${numero}</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function criarSetaDirecao(angulo: number, cor: string) {
  return new L.DivIcon({
    className: "",
    html: `
      <div style="transform:rotate(${angulo}deg);width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${cor}" stroke="white" stroke-width="1.5">
          <path d="M12 2 L22 20 L12 15 L2 20 Z"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/* =========================
   HELPERS
========================= */
function normalizarPonto(p: any): LatLngExpression {
  if (Array.isArray(p)) return [Number(p[0]), Number(p[1])];
  if (p && p.lat !== undefined && p.lng !== undefined)
    return [Number(p.lat), Number(p.lng)];
  if (p && p.latitude !== undefined && p.longitude !== undefined)
    return [Number(p.latitude), Number(p.longitude)];
  return [0, 0];
}

function normalizarLista(lista: any[]): LatLngExpression[] {
  if (!Array.isArray(lista)) return [];
  return lista
    .map(normalizarPonto)
    .filter((p: any) => p[0] !== 0 || p[1] !== 0);
}

function distanciaEntre(p1: LatLngExpression, p2: LatLngExpression): number {
  const [lat1, lng1] = p1 as [number, number];
  const [lat2, lng2] = p2 as [number, number];
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function anguloEntre(p1: LatLngExpression, p2: LatLngExpression): number {
  const [lat1, lng1] = p1 as [number, number];
  const [lat2, lng2] = p2 as [number, number];
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

async function buscarEndereco(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "pt-BR" } }
    );
    const data = await res.json();
    const a = data.address || {};
    const rua = a.road || a.pedestrian || "Rua sem nome";
    const numero = a.house_number || "s/n";
    const bairro = a.suburb || a.neighbourhood || "";
    return `${rua}, ${numero}${bairro ? ` - ${bairro}` : ""}`;
  } catch {
    return "Endereço indisponível";
  }
}

/* =========================
   COMPONENTES DO MAPA
========================= */
function FlyToRoute({
  rota,
  trigger,
}: {
  rota: LatLngExpression[];
  trigger: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (rota.length > 0) {
      try {
        const bounds = L.latLngBounds(rota as any);
        map.flyToBounds(bounds, {
          padding: [80, 80],
          duration: 1.2,
          easeLinearity: 0.25,
        });
      } catch (e) {
        console.error("Erro flyToBounds:", e);
      }
    }
  }, [trigger]);
  return null;
}

function CentralizarBotao({ tiles }: { tiles: any }) {
  const map = useMap();
  useEffect(() => {
    (window as any).__mapRef = map;
  }, [map, tiles]);
  return null;
}

function MapClickHandler({
  onAddPoint,
}: {
  onAddPoint: (p: LatLngExpression) => void;
}) {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
function Rotas() {
  const [pontos, setPontos] = useState<LatLngExpression[]>([]);
  const [rotaAtual, setRotaAtual] = useState<LatLngExpression[]>([]);
  const [rotas, setRotas] = useState<RotaSalva[]>([]);
  const [carregandoRotas, setCarregandoRotas] = useState(true);
  const [rotaSelecionada, setRotaSelecionada] = useState<RotaSalva | null>(
    null
  );
  const [indiceAnimacao, setIndiceAnimacao] = useState(0);
  const [nomeRota, setNomeRota] = useState("");
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [distancia, setDistancia] = useState<number>(0);
  const [duracao, setDuracao] = useState<number>(0);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");
  const [painelAberto, setPainelAberto] = useState(true);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro" | "info";
    texto: string;
  } | null>(null);

  const [modoEdicao, setModoEdicao] = useState<{
    ativo: boolean;
    rotaOriginalId: string | null;
    dadosBackup: RotaSalva | null;
  }>({ ativo: false, rotaOriginalId: null, dadosBackup: null });

  const [busca, setBusca] = useState("");
  const [confirmarExclusao, setConfirmarExclusao] = useState<RotaSalva | null>(
    null
  );
  const [excluindo, setExcluindo] = useState(false);
  const [rotaPreview, setRotaPreview] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [tipoMapa, setTipoMapa] = useState<"claro" | "satelite" | "escuro">(
    "claro"
  );
  const [mostrarSetas, setMostrarSetas] = useState(true);
  const [rotasComparacao, setRotasComparacao] = useState<Set<string>>(new Set());
  const [modoComparacao, setModoComparacao] = useState(false);
  const [paradaEditando, setParadaEditando] = useState<{
    indice: number;
    nome: string;
    horario: string;
    endereco: string;
  } | null>(null);
  const [paradasInfo, setParadasInfo] = useState<ParadaInfo[]>([]);
  const [categoria, setCategoria] = useState("");
  const [horarioSaida, setHorarioSaida] = useState("");
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);
  const [modalRota, setModalRota] = useState<RotaSalva | null>(null);
  const [sentidoInvertido, setSentidoInvertido] = useState(false);

  const [turnosAtendidos, setTurnosAtendidos] = useState<string[]>([]);
  const [statusRota, setStatusRota] = useState<StatusRota>("ativa");
  const [linhas, setLinhas] = useState<LinhaResumo[]>([]);
  const [linhaId, setLinhaId] = useState<string>("");

  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusRota>("todos");
  const [filtroTurno, setFiltroTurno] = useState<string>("todos");

  const [rotaLiberarPin, setRotaLiberarPin] = useState<RotaSalva | null>(null);
  const [pinRecemGerado, setPinRecemGerado] = useState<string | null>(null);
  const [rotaVincularLinha, setRotaVincularLinha] = useState<RotaSalva | null>(null);

  const intervalRef = useRef<number | null>(null);
  const rotaCompletaRef = useRef<LatLngExpression[]>([]);
  const indiceAnimacaoRef = useRef(0);

  useEffect(() => {
    carregarRotas();
    carregarLinhas();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (pontos.length >= 2) {
      snapAutomatico();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRotaAtual([]);
      setIndiceAnimacao(0);
      indiceAnimacaoRef.current = 0;
      rotaCompletaRef.current = [];
      setDistancia(0);
      setDuracao(0);
    }
  }, [pontos]);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3500);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.tagName === "INPUT" ||
        (e.target as HTMLElement)?.tagName === "TEXTAREA"
      )
        return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        desfazer();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        salvar();
      }
      if (e.key === "Escape") {
        if (modoEdicao.ativo) cancelarEdicao();
        else if (menuAberto) setMenuAberto(null);
        else if (paradaEditando) setParadaEditando(null);
        else if (confirmarExclusao) setConfirmarExclusao(null);
        else if (modalRota) setModalRota(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pontos, nomeRota, rotaAtual, modoEdicao, menuAberto, paradaEditando, confirmarExclusao, modalRota]);

  const carregarRotas = async () => {
  setCarregandoRotas(true);

  try {
    const { data, error } = await supabase
      .from("rotas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao carregar rotas" });
      return;
    }

    if (data) {
      const rotasNormalizadas: RotaSalva[] = data.map((r: any) => ({
        ...r,
        distancia_km: Number(r.distancia_km) || 0,
        duracao_min: Number(r.duracao_min) || 0,
        pontos_originais: normalizarLista(r.pontos_originais),
        pontos_snap: normalizarLista(r.pontos_snap),
        paradas_info: r.paradas_info || [],
        turnos_atendidos: r.turnos_atendidos || (r.turno ? [r.turno] : []),
        status_rota: r.status_rota || "ativa",
      }));
      setRotas(rotasNormalizadas);
    }
  } finally {
    setCarregandoRotas(false);
  }
};


      const carregarLinhas = async () => {
    const { data, error } = await supabase
    .from("linhas")
    .select("id, nome, cor, cliente_nome_fantasia, status")
    .eq("status", "ativa")
    .order("nome", { ascending: true });

  if (!error && data) {
    setLinhas(data);
  }
};

  const adicionarPonto = (p: LatLngExpression) => {
    setRotaSelecionada(null);
    setPontos((prev) => [...prev, p]);
    setParadasInfo((prev) => [...prev, {}]);
  };

  const desfazer = () => {
    setPontos((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
    setParadasInfo((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  };

  const limpar = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPontos([]);
    setParadasInfo([]);
    setRotaAtual([]);
    setIndiceAnimacao(0);
    indiceAnimacaoRef.current = 0;
    rotaCompletaRef.current = [];
    setDistancia(0);
    setDuracao(0);
    setRotaSelecionada(null);
    setSentidoInvertido(false);
    setNomeRota("");
    setCategoria("");
    setTurnosAtendidos([]);
    setStatusRota("ativa");
    setHorarioSaida("");
    setLinhaId("");
  };

  const cancelarEdicao = async () => {
    if (!modoEdicao.dadosBackup) return;
    const backup = modoEdicao.dadosBackup;
    const { error } = await supabase.from("rotas").insert([
      {
        nome: backup.nome,
        distancia_km: backup.distancia_km,
        duracao_min: backup.duracao_min,
        pontos_originais: backup.pontos_originais,
        pontos_snap: backup.pontos_snap,
        cor: backup.cor,
        paradas_info: backup.paradas_info || [],
        categoria: backup.categoria,
        turno: backup.turno,
        turnos_atendidos: backup.turnos_atendidos || [],
        status_rota: backup.status_rota || "ativa",
        dias_semana: backup.dias_semana,
        horario_saida: backup.horario_saida,
        linha_id: linhaId || null,
      },
    ]);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao restaurar rota" });
      return;
    }
    limpar();
    setModoEdicao({ ativo: false, rotaOriginalId: null, dadosBackup: null });
    setMensagem({ tipo: "sucesso", texto: "Edição cancelada" });
    carregarRotas();
  };

  const snapAutomatico = async () => {
    setCalculando(true);
    const coords = pontos.map((p: any) => {
      const arr = Array.isArray(p) ? p : [p.lat, p.lng];
      return [arr[1], arr[0]];
    });

    try {
      const response = await fetch("http://localhost:3001/rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: coords }),
      });
      if (!response.ok) throw new Error("Backend indisponível");
      const data = await response.json();
      if (!data.routes || !data.routes[0]) throw new Error("Resposta inválida");

      const geometry = data.routes[0].geometry.coordinates;
      const summary = data.routes[0];
      const novaRota: LatLngExpression[] = geometry.map((c: number[]) => [
        c[1],
        c[0],
      ]);

      setDistancia(summary.distance / 1000);
      setDuracao(summary.duration / 60);
      animarRotaIncremental(novaRota);
    } catch {
      const novaRota: LatLngExpression[] = pontos.map((p: any) => {
        const arr = Array.isArray(p) ? p : [p.lat, p.lng];
        return [arr[0], arr[1]];
      });
      let distTotal = 0;
      for (let i = 1; i < novaRota.length; i++) {
        distTotal += distanciaEntre(novaRota[i - 1], novaRota[i]);
      }
      setDistancia(distTotal);
      setDuracao((distTotal / 40) * 60);
      animarRotaIncremental(novaRota);
    } finally {
      setCalculando(false);
    }
  };

  const recalcularInvertido = async (rota: RotaSalva) => {
    setCalculando(true);
    const pontosInvertidos = [...rota.pontos_originais].reverse();
    const coords = pontosInvertidos.map((p: any) => {
      const arr = Array.isArray(p) ? p : [p.lat, p.lng];
      return [arr[1], arr[0]];
    });

    try {
      const response = await fetch("http://localhost:3001/rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: coords }),
      });
      if (!response.ok) throw new Error("Backend offline");
      const data = await response.json();
      if (!data.routes || !data.routes[0]) throw new Error("Resposta inválida");

      const geometry = data.routes[0].geometry.coordinates;
      const summary = data.routes[0];
      const novaRota: LatLngExpression[] = geometry.map((c: number[]) => [
        c[1],
        c[0],
      ]);

      setDistancia(summary.distance / 1000);
      setDuracao(summary.duration / 60);
      animarRotaCompleta(novaRota);
    } catch {
      const invertida = [...normalizarLista(rota.pontos_snap)].reverse();
      let distTotal = 0;
      for (let i = 1; i < invertida.length; i++) {
        distTotal += distanciaEntre(invertida[i - 1], invertida[i]);
      }
      setDistancia(distTotal);
      setDuracao((distTotal / 40) * 60);
      animarRotaCompleta(invertida);
    } finally {
      setCalculando(false);
    }
  };

  const alternarSentido = () => {
    if (!rotaSelecionada) return;
    const novoSentido = !sentidoInvertido;
    setSentidoInvertido(novoSentido);
    if (novoSentido) {
      recalcularInvertido(rotaSelecionada);
    } else {
      setDistancia(Number(rotaSelecionada.distancia_km) || 0);
      setDuracao(Number(rotaSelecionada.duracao_min) || 0);
      animarRotaCompleta(normalizarLista(rotaSelecionada.pontos_snap));
    }
  };

  const animarRotaIncremental = (novaRota: LatLngExpression[]) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const rotaAnterior = rotaCompletaRef.current;
    rotaCompletaRef.current = novaRota;

    let pontoInicio = 0;
    if (rotaAnterior.length > 0 && novaRota.length > 0) {
      const proporcao =
        indiceAnimacaoRef.current / Math.max(rotaAnterior.length, 1);
      if (novaRota.length < rotaAnterior.length) {
        pontoInicio = Math.floor(proporcao * novaRota.length);
        if (pontoInicio >= novaRota.length)
          pontoInicio = Math.max(0, novaRota.length - 1);
      } else {
        pontoInicio = Math.min(indiceAnimacaoRef.current, novaRota.length - 1);
      }
    }

    setRotaAtual(novaRota);
    setIndiceAnimacao(pontoInicio);
    indiceAnimacaoRef.current = pontoInicio;

    let i = pontoInicio;
    intervalRef.current = window.setInterval(() => {
      if (i >= novaRota.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return;
      }
      indiceAnimacaoRef.current = i;
      setIndiceAnimacao(i);
      i++;
    }, 40);
  };

  const animarRotaCompleta = (rota: LatLngExpression[]) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!rota || rota.length === 0) return;
    rotaCompletaRef.current = rota;
    setRotaAtual(rota);
    setIndiceAnimacao(1);
    indiceAnimacaoRef.current = 1;

    setTimeout(() => {
      let i = 1;
      intervalRef.current = window.setInterval(() => {
        i++;
        if (i >= rota.length) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          indiceAnimacaoRef.current = rota.length;
          setIndiceAnimacao(rota.length);
          return;
        }
        indiceAnimacaoRef.current = i;
        setIndiceAnimacao(i);
      }, 25);
    }, 800);
  };

  const salvar = async () => {
    if (!nomeRota.trim()) {
      setMensagem({ tipo: "erro", texto: "Digite um nome para a rota" });
      return;
    }
    if (rotaAtual.length === 0) {
      setMensagem({ tipo: "erro", texto: "Marque ao menos 2 pontos no mapa" });
      return;
    }

    const cor =
      modoEdicao.dadosBackup?.cor ||
      coresDisponiveis[rotas.length % coresDisponiveis.length];

    try {
      const { error } = await supabase
        .from("rotas")
        .insert([
          {
            nome: nomeRota.trim(),
            distancia_km: distancia,
            duracao_min: duracao,
            pontos_originais: pontos,
            pontos_snap: rotaAtual,
            cor,
            paradas_info: paradasInfo,
            categoria: categoria || null,
            turno: turnosAtendidos[0] || null,
            turnos_atendidos: turnosAtendidos,
            status_rota: statusRota,
            horario_saida: horarioSaida || null,
            dias_semana: diasSemana,
          },
        ])
        .select();

      if (error) {
        setMensagem({ tipo: "erro", texto: `Erro: ${error.message}` });
        return;
      }

      setMensagem({
        tipo: "sucesso",
        texto: modoEdicao.ativo
          ? `Rota "${nomeRota}" atualizada!`
          : `Rota "${nomeRota}" salva!`,
      });
      limpar();
      setModoEdicao({ ativo: false, rotaOriginalId: null, dadosBackup: null });
      carregarRotas();
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: `Erro: ${err.message}` });
    }
  };

  const selecionarRota = (rota: RotaSalva) => {
    if (modoComparacao) {
      toggleRotaComparacao(rota.id);
      return;
    }
    setPontos([]);
    setParadasInfo([]);
    setRotaSelecionada(rota);
    setSentidoInvertido(false);
    setDistancia(Number(rota.distancia_km) || 0);
    setDuracao(Number(rota.duracao_min) || 0);

    const pontosNormalizados = normalizarLista(rota.pontos_snap);
    if (pontosNormalizados.length === 0) {
      setMensagem({ tipo: "erro", texto: "Rota sem pontos válidos" });
      return;
    }
    animarRotaCompleta(pontosNormalizados);
  };

  const toggleRotaComparacao = (id: string) => {
    setRotasComparacao((prev) => {
      const nova = new Set(prev);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  };

const excluirRotaConfirmado = async () => {
  if (!confirmarExclusao) return;
  setExcluindo(true);
  const id = confirmarExclusao.id;
  const { error } = await supabase.from("rotas").delete().eq("id", id);
  setExcluindo(false);

  if (error) {
    setMensagem({ tipo: "erro", texto: "Erro ao excluir" });
    return;
  }
  if (rotaSelecionada?.id === id) {
    setRotaSelecionada(null);
    setRotaAtual([]);
    setIndiceAnimacao(0);
    indiceAnimacaoRef.current = 0;
    rotaCompletaRef.current = [];
    setDistancia(0);
    setDuracao(0);
  }
  setMenuAberto(null);
  setConfirmarExclusao(null);
  setMensagem({ tipo: "sucesso", texto: "Rota excluída" });
  carregarRotas();
};

  const duplicarRota = async (rota: RotaSalva, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuAberto(null);
    const cor = coresDisponiveis[rotas.length % coresDisponiveis.length];
    const { error } = await supabase.from("rotas").insert([
      {
        nome: `${rota.nome} (cópia)`,
        distancia_km: rota.distancia_km,
        duracao_min: rota.duracao_min,
        pontos_originais: rota.pontos_originais,
        pontos_snap: rota.pontos_snap,
        cor,
        paradas_info: rota.paradas_info,
        categoria: rota.categoria,
        turno: rota.turno,
        turnos_atendidos: rota.turnos_atendidos || [],
        status_rota: "ativa",
        dias_semana: rota.dias_semana,
        horario_saida: rota.horario_saida,
      },
    ]);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao duplicar" });
      return;
    }
    setMensagem({ tipo: "sucesso", texto: `Rota "${rota.nome}" duplicada` });
    carregarRotas();
  };

  const alterarStatusRota = async (
    rota: RotaSalva,
    novoStatus: StatusRota,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setMenuAberto(null);

    const { error } = await supabase
      .from("rotas")
      .update({ status_rota: novoStatus })
      .eq("id", rota.id);

    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao atualizar status" });
      return;
    }

    const labels = {
      ativa: "ativada",
      pausada: "pausada",
      arquivada: "arquivada",
    };

    setMensagem({
      tipo: "sucesso",
      texto: `Rota "${rota.nome}" ${labels[novoStatus]}`,
    });
    carregarRotas();
  };

  const iniciarEdicao = (rota: RotaSalva, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditandoId(rota.id);
    setNomeEditando(rota.nome);
    setMenuAberto(null);
  };

  const salvarEdicao = async (id: string) => {
    if (!nomeEditando.trim()) return;
    await supabase.from("rotas").update({ nome: nomeEditando }).eq("id", id);
    setEditandoId(null);
    setNomeEditando("");
    carregarRotas();
  };

  const editarRota = async (rota: RotaSalva, e: React.MouseEvent) => {
    e.stopPropagation();
    setPontos(rota.pontos_originais);
    setParadasInfo(rota.paradas_info || rota.pontos_originais.map(() => ({})));
    setNomeRota(rota.nome);
    setCategoria(rota.categoria || "");
    setTurnosAtendidos(getTurnosRota(rota));
    setStatusRota(getStatusRota(rota));
    setHorarioSaida(rota.horario_saida || "");
    setDiasSemana(rota.dias_semana || [1, 2, 3, 4, 5]);
    setLinhaId(rota.linha_id || "");
    setMenuAberto(null);
    setRotaSelecionada(null);
    setModoEdicao({
      ativo: true,
      rotaOriginalId: rota.id,
      dadosBackup: { ...rota },
    });
    await supabase.from("rotas").delete().eq("id", rota.id);
    carregarRotas();
    setMensagem({ tipo: "info", texto: "Modo edição — cancele para restaurar" });
  };

  const abrirEditorParada = async (indice: number) => {
    const p = pontos[indice] as [number, number];
    const info = paradasInfo[indice] || {};
    let endereco = info.endereco || "";
    if (!endereco) {
      endereco = await buscarEndereco(p[0], p[1]);
    }
    setParadaEditando({
      indice,
      nome: info.nome || "",
      horario: info.horario || "",
      endereco,
    });
  };

  const salvarParada = () => {
    if (!paradaEditando) return;
    setParadasInfo((prev) => {
      const nova = [...prev];
      nova[paradaEditando.indice] = {
        nome: paradaEditando.nome,
        horario: paradaEditando.horario,
        endereco: paradaEditando.endereco,
      };
      return nova;
    });
    setParadaEditando(null);
    setMensagem({ tipo: "sucesso", texto: "Parada atualizada" });
  };

  const moverParada = (indice: number, direcao: -1 | 1) => {
    const novoIndice = indice + direcao;
    if (novoIndice < 0 || novoIndice >= pontos.length) return;
    setPontos((prev) => {
      const nova = [...prev];
      [nova[indice], nova[novoIndice]] = [nova[novoIndice], nova[indice]];
      return nova;
    });
    setParadasInfo((prev) => {
      const nova = [...prev];
      [nova[indice], nova[novoIndice]] = [nova[novoIndice], nova[indice]];
      return nova;
    });
  };

  const exportarRota = (rota: RotaSalva, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(rota, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rota.nome.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuAberto(null);
    setMensagem({ tipo: "sucesso", texto: "Rota exportada" });
  };

  const importarRota = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const dados = JSON.parse(texto);
      const cor = coresDisponiveis[rotas.length % coresDisponiveis.length];
      const { error } = await supabase.from("rotas").insert([
        {
          nome: `${dados.nome} (importada)`,
          distancia_km: dados.distancia_km || 0,
          duracao_min: dados.duracao_min || 0,
          pontos_originais: dados.pontos_originais,
          pontos_snap: dados.pontos_snap,
          cor,
          paradas_info: dados.paradas_info,
          categoria: dados.categoria,
          turno: dados.turno,
          turnos_atendidos: dados.turnos_atendidos || (dados.turno ? [dados.turno] : []),
          status_rota: "ativa",
        },
      ]);
      if (error) throw error;
      setMensagem({ tipo: "sucesso", texto: "Rota importada com sucesso" });
      carregarRotas();
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: `Erro ao importar: ${err.message}` });
    }
    e.target.value = "";
  };

  const centralizarMapa = () => {
    const map = (window as any).__mapRef;
    if (!map) return;
    if (rotaSelecionada) {
      const bounds = L.latLngBounds(rotaSelecionada.pontos_snap as any);
      map.flyToBounds(bounds, { padding: [80, 80] });
    } else {
      map.flyTo([-23.55, -46.63], 13);
    }
  };

  const rotasFiltradas = useMemo(() => {
    let lista = rotas;

    if (filtroStatus !== "todos") {
      lista = lista.filter((r) => getStatusRota(r) === filtroStatus);
    }

    if (filtroTurno !== "todos") {
      lista = lista.filter((r) => {
        const turnos = getTurnosRota(r);
        return turnos.includes(filtroTurno);
      });
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (r) =>
          r.nome.toLowerCase().includes(termo) ||
          r.categoria?.toLowerCase().includes(termo) ||
          getTurnosRota(r).some((t) => t.toLowerCase().includes(termo))
      );
    }

    return lista;
  }, [rotas, busca, filtroStatus, filtroTurno]);

  const contadores = useMemo(() => {
    return {
      total: rotas.length,
      ativas: rotas.filter((r) => getStatusRota(r) === "ativa").length,
      pausadas: rotas.filter((r) => getStatusRota(r) === "pausada").length,
      arquivadas: rotas.filter((r) => getStatusRota(r) === "arquivada").length,
    };
  }, [rotas]);

  const PAINEL_WIDTH = 380;
  const MARGIN = 16;

  const rotaSelecionadaValida = rotaSelecionada
    ? normalizarLista(rotaSelecionada.pontos_snap)
    : [];

  const tilesUrl = {
    claro: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    satelite:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    escuro: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  };

  const setasDirecao = useMemo(() => {
    if (!mostrarSetas || rotaAtual.length < 20) return [];
    const setas: { pos: LatLngExpression; angulo: number }[] = [];
    const step = Math.floor(rotaAtual.length / 8);
    for (let i = step; i < rotaAtual.length - 1; i += step) {
      setas.push({
        pos: rotaAtual[i],
        angulo: anguloEntre(rotaAtual[i], rotaAtual[i + 1]),
      });
    }
    return setas;
  }, [rotaAtual, mostrarSetas]);

  const paradasExibicao = useMemo(() => {
    if (!rotaSelecionada) return [];
    if (sentidoInvertido) {
      return [...rotaSelecionada.pontos_originais].reverse();
    }
    return rotaSelecionada.pontos_originais;
  }, [rotaSelecionada, sentidoInvertido]);

  const paradasInfoExibicao = useMemo(() => {
    if (!rotaSelecionada) return [];
    const info = rotaSelecionada.paradas_info || [];
    if (sentidoInvertido) return [...info].reverse();
    return info;
  }, [rotaSelecionada, sentidoInvertido]);

  const distanciaExibicao = rotaSelecionada
    ? sentidoInvertido
      ? distancia
      : Number(rotaSelecionada.distancia_km) || 0
    : distancia;

  const duracaoExibicao = rotaSelecionada
    ? sentidoInvertido
      ? duracao
      : Number(rotaSelecionada.duracao_min) || 0
    : duracao;

  return (
    <>
      <style>{`
        .rota-tooltip-nome {
          background: rgba(30, 41, 59, 0.95) !important;
          color: white !important;
          border: 2px solid #3B82F6 !important;
          border-radius: 12px !important;
          padding: 8px 18px !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
          white-space: nowrap;
        }
        @keyframes markerPopIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .marker-pop-in > * {
          animation: markerPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center bottom;
        }
        @keyframes slideUpCard {
          0% { transform: translate(-50%, 120%); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .card-info-rota {
          animation: slideUpCard 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .skeleton { animation: pulse 1.5s ease-in-out infinite; }
        .btn-press:active { transform: scale(0.96); }
      `}</style>

      <div
        className="relative w-full flex gap-4"
        style={{ height: "calc(100vh - 120px)", padding: `${MARGIN}px` }}
      >
        {/* ===== PAINEL ===== */}
        <div
          style={{
            width: painelAberto ? `${PAINEL_WIDTH}px` : "56px",
            minWidth: painelAberto ? `${PAINEL_WIDTH}px` : "56px",
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
          className="relative bg-[#09152E] rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 flex-shrink-0">
            {painelAberto ? (
              <>
                <div>
                  <h2 className="text-base font-bold text-white">Rotas</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {contadores.ativas} ativas · {contadores.pausadas} pausadas · {contadores.arquivadas} arquivadas
                  </p>
                </div>
                <button
                  onClick={() => setPainelAberto(false)}
                  className="btn-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  title="Fechar painel"
                >
                  <PanelLeftClose className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setPainelAberto(true)}
                className="btn-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white mx-auto"
                title="Abrir painel"
              >
                <PanelLeftOpen className="w-4 h-4" strokeWidth={2.2} />
              </button>
            )}
          </div>

          {painelAberto && (
            <div className="flex-1 overflow-y-auto">
              {/* FORMULÁRIO NOVA ROTA */}
              <div className="px-4 py-4 border-b border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {modoEdicao.ativo ? "Editando Rota" : "Nova Rota"}
                  </p>
                  {modoEdicao.ativo && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold uppercase">
                      Edição
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={desfazer}
                    disabled={pontos.length === 0}
                    title="Ctrl+Z"
                    className="btn-press flex-1 flex items-center justify-center gap-1.5 border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Undo2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Desfazer
                  </button>
                  <button
                    onClick={limpar}
                    disabled={pontos.length === 0 && !rotaSelecionada}
                    className="btn-press flex-1 flex items-center justify-center gap-1.5 border border-red-900/50 bg-red-950/40 text-red-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Limpar
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Nome da linha"
                  value={nomeRota}
                  onChange={(e) => setNomeRota(e.target.value)}
                  className="border border-slate-700 bg-slate-800 text-white placeholder-slate-500 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="relative">
  <div className="flex items-center gap-1.5 mb-1.5">
    <Building2 className="w-3 h-3 text-slate-400" strokeWidth={2.2} />
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      Linha / Cliente {linhas.length === 0 && "(nenhuma cadastrada)"}
    </label>
  </div>
  <select
    value={linhaId}
    onChange={(e) => setLinhaId(e.target.value)}
    disabled={linhas.length === 0}
    className="border border-slate-700 bg-slate-800 text-white px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <option value="">Sem vínculo</option>
    {linhas.map((l) => (
      <option key={l.id} value={l.id}>
        {l.nome}
        {l.cliente_nome_fantasia ? ` — ${l.cliente_nome_fantasia}` : ""}
      </option>
    ))}
  </select>
  {linhas.length === 0 && (
    <p className="text-[10px] text-slate-500 mt-1 italic">
      Cadastre linhas em "Linhas & Rotas → Linhas" pra vincular
    </p>
  )}
</div>
                {pontos.length >= 2 && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    {/* Categoria */}
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="border border-slate-700 bg-slate-800 text-white px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Categoria</option>
                      {categorias.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Turnos múltiplos */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        Turnos atendidos
                      </label>
                      <div className="bg-white rounded-lg p-2">
                        <SeletorTurnos
                          turnosSelecionados={turnosAtendidos}
                          onChange={setTurnosAtendidos}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        Status da rota
                      </label>
                      <div className="bg-white rounded-lg p-2">
                        <SeletorStatus
                          status={statusRota}
                          onChange={setStatusRota}
                        />
                      </div>
                    </div>

                    <input
                      type="time"
                      value={horarioSaida}
                      onChange={(e) => setHorarioSaida(e.target.value)}
                      className="border border-slate-700 bg-slate-800 text-white px-3 py-2 rounded-lg w-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-1">
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setDiasSemana((prev) =>
                              prev.includes(i)
                                ? prev.filter((d) => d !== i)
                                : [...prev, i]
                            )
                          }
                          className={`btn-press flex-1 py-1.5 rounded-md text-[10px] font-bold transition ${
                            diasSemana.includes(i)
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                          }`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={salvar}
                  disabled={!nomeRota || rotaAtual.length === 0}
                  title="Ctrl+Enter"
                  className="btn-press w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {modoEdicao.ativo ? "Salvar Alterações" : "Salvar Rota"}
                </button>

                {modoEdicao.ativo && (
                  <button
                    onClick={cancelarEdicao}
                    className="btn-press w-full flex items-center justify-center gap-1.5 border border-slate-600 bg-slate-800 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Cancelar Edição
                  </button>
                )}

                {pontos.length > 0 && (
                  <div className={`text-xs text-center p-2 rounded-lg ${
                    pontos.length === 1
                      ? "bg-amber-950/40 text-amber-300 border border-amber-900/50"
                      : pontos.length > 10
                      ? "bg-orange-950/40 text-orange-300 border border-orange-900/50"
                      : "bg-green-950/40 text-green-300 border border-green-900/50"
                  }`}>
                    {pontos.length === 1 && `1 ponto — adicione mais paradas`}
                    {pontos.length >= 2 && pontos.length <= 10 && `${pontos.length} pontos — pronto para salvar`}
                    {pontos.length > 10 && `${pontos.length} pontos — rota longa`}
                  </div>
                )}

                {pontos.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Paradas
                    </p>
                    {pontos.map((_, i) => {
                      const info = paradasInfo[i] || {};
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-2 group"
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate font-medium">
                              {info.nome || `Parada ${i + 1}`}
                            </p>
                            {info.horario && (
                              <p className="text-[10px] text-slate-400">
                                {info.horario}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => moverParada(i, -1)}
                              disabled={i === 0}
                              className="btn-press w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center disabled:opacity-30"
                              title="Mover para cima"
                            >
                              <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => moverParada(i, 1)}
                              disabled={i === pontos.length - 1}
                              className="btn-press w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center disabled:opacity-30"
                              title="Mover para baixo"
                            >
                              <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => abrirEditorParada(i)}
                              className="btn-press w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center"
                              title="Editar parada"
                            >
                              <Pencil className="w-3 h-3" strokeWidth={2.2} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LISTA DE ROTAS */}
              <div className="px-4 py-4 space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Rotas Salvas
                  </p>
                  <div className="flex gap-1">
                    <label
                      className="btn-press cursor-pointer text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded font-medium"
                      title="Importar rota"
                    >
                      Importar
                      <input
                        type="file"
                        accept=".json"
                        onChange={importarRota}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setModoComparacao((v) => !v);
                        setRotasComparacao(new Set());
                      }}
                      className={`btn-press text-[10px] px-2 py-1 rounded font-medium transition ${
                        modoComparacao
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                      title="Comparar rotas"
                    >
                      Comparar
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar rota..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="border border-slate-700 bg-slate-800 text-white placeholder-slate-500 px-3 py-2 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {busca && (
                    <button
                      onClick={() => setBusca("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </button>
                  )}
                </div>

                {/* Filtros de Status */}
                <div className="flex gap-1">
                  {[
                    { v: "todos" as const, l: "Todas", c: contadores.total },
                    { v: "ativa" as const, l: "Ativas", c: contadores.ativas },
                    { v: "pausada" as const, l: "Pausadas", c: contadores.pausadas },
                    { v: "arquivada" as const, l: "Arquiv.", c: contadores.arquivadas },
                  ].map((f) => (
                    <button
                      key={f.v}
                      onClick={() => setFiltroStatus(f.v)}
                      className={`btn-press flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md text-[10px] font-bold transition ${
                        filtroStatus === f.v
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <span>{f.l}</span>
                      <span className="text-[9px] opacity-75">({f.c})</span>
                    </button>
                  ))}
                </div>

                {/* Filtros de Turno */}
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setFiltroTurno("todos")}
                    className={`btn-press px-2 py-1 rounded text-[10px] font-bold transition ${
                      filtroTurno === "todos"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    Todos turnos
                  </button>
                  {TURNOS_FILTRO.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFiltroTurno(t)}
                      className={`btn-press px-2 py-1 rounded text-[10px] font-bold transition ${
                        filtroTurno === t
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {modoComparacao && (
                  <div className="text-[11px] bg-blue-950/40 text-blue-300 border border-blue-900/50 rounded-lg p-2 text-center">
                    Modo comparação: {rotasComparacao.size} rota
                    {rotasComparacao.size !== 1 ? "s" : ""} selecionada
                    {rotasComparacao.size !== 1 ? "s" : ""}
                  </div>
                )}

{carregandoRotas && <SkeletonRotasList count={4} />}

                {!carregandoRotas && rotas.length === 0 && (
  <p className="text-slate-500 text-sm py-4 text-center">
    Nenhuma rota cadastrada ainda
  </p>
)}
{!carregandoRotas && rotas.length > 0 && rotasFiltradas.length === 0 && (
  <p className="text-slate-500 text-sm py-4 text-center">
    Nenhuma rota encontrada com os filtros atuais
  </p>
)}

                {rotasFiltradas.map((rota) => {
                  const emComparacao = rotasComparacao.has(rota.id);
                  const ehSelecionada = rotaSelecionada?.id === rota.id;
                  const status = getStatusRota(rota);
                  const turnos = getTurnosRota(rota);
                  const arquivada = status === "arquivada";

                  return (
                    <div
                      key={rota.id}
                      onClick={() => selecionarRota(rota)}
                      onMouseEnter={() => setRotaPreview(rota.id)}
                      onMouseLeave={() => setRotaPreview(null)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        ehSelecionada || emComparacao
                          ? "border-blue-500 bg-blue-950/40"
                          : arquivada
                          ? "bg-slate-800/30 border-slate-700/50 opacity-60 hover:opacity-80"
                          : "bg-slate-800/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                      }`}
                    >
                      {editandoId === rota.id ? (
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={nomeEditando}
                            onChange={(e) => setNomeEditando(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") salvarEdicao(rota.id);
                              if (e.key === "Escape") setEditandoId(null);
                            }}
                            className="border border-slate-600 bg-slate-900 text-white px-2 py-1.5 rounded-md flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button onClick={() => salvarEdicao(rota.id)} className="btn-press bg-blue-600 text-white px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-blue-500">OK</button>
                          <button onClick={() => setEditandoId(null)} className="btn-press border border-slate-600 text-slate-300 px-2.5 py-1.5 rounded-md text-xs hover:bg-slate-700 flex items-center">
                            <X className="w-3 h-3" strokeWidth={2.2} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Nome + comparação */}
                            <div className="flex items-center gap-2 mb-1">
                              {modoComparacao && (
                                <input
                                  type="checkbox"
                                  checked={emComparacao}
                                  readOnly
                                  className="accent-blue-500"
                                />
                              )}
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: rota.cor }}
                              />
                              <p className="font-semibold text-sm text-white truncate">
                                {rota.nome}
                              </p>
                            </div>

                            {/* Badges de status e turnos */}
<div className="flex items-center gap-1.5 flex-wrap mb-1.5">
  <BadgeStatus status={status} size="sm" />
  {turnos.length > 0 && (
    <BadgeTurnos turnos={turnos} size="sm" compact />
  )}
  {rota.categoria && (
    <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wide">
      {rota.categoria}
    </span>
  )}

  {/* 🆕 Badge da linha (ou botão pra vincular) */}
  <BadgeLinha
    nomeLinha={linhas.find((l) => l.id === rota.linha_id)?.nome}
    corLinha={linhas.find((l) => l.id === rota.linha_id)?.cor}
    clienteFantasia={
      linhas.find((l) => l.id === rota.linha_id)?.cliente_nome_fantasia
    }
    onClick={() => setRotaVincularLinha(rota)}
  />
</div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                              {rota.pontos_originais.length} parada
                              {rota.pontos_originais.length !== 1 ? "s" : ""}
                              {" · "}
                              {(Number(rota.distancia_km) || 0).toFixed(1)} km
                              {" · "}
                              {(Number(rota.duracao_min) || 0).toFixed(0)} min
                              {rota.horario_saida && (
                                <> · {rota.horario_saida.slice(0, 5)}</>
                              )}
                            </p>
                          </div>

                          {/* Menu */}
                          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setMenuAberto(menuAberto === rota.id ? null : rota.id)
                              }
                              className="btn-press w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition"
                              title="Opções"
                            >
                              <MoreVertical className="w-4 h-4" strokeWidth={2.2} />
                            </button>

                            {menuAberto === rota.id && (
                              <div className="fade-in absolute right-0 top-8 z-[600] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden min-w-[220px]">
                                <button onClick={() => { selecionarRota(rota); setMenuAberto(null); }} className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Eye className="w-4 h-4" strokeWidth={2} />
                                  Visualizar
                                </button>
                                <button onClick={() => { setModalRota(rota); setMenuAberto(null); }} className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Info className="w-4 h-4" strokeWidth={2} />
                                  Detalhes
                                </button>
                                <button onClick={(e) => duplicarRota(rota, e)} className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Copy className="w-4 h-4" strokeWidth={2} />
                                  Duplicar
                                </button>
                                <button onClick={(e) => editarRota(rota, e)} className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Pencil className="w-4 h-4" strokeWidth={2} />
                                  Editar no mapa
                                </button>
                                <button onClick={(e) => iniciarEdicao(rota, e)} className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Type className="w-4 h-4" strokeWidth={2} />
                                  Renomear
                                </button>

                                <div className="border-t border-slate-100" />

                                {/* Ações de status */}
                                {status !== "ativa" && (
                                  <button
                                    onClick={(e) => alterarStatusRota(rota, "ativa", e)}
                                    className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50 font-semibold"
                                  >
                                    <CircleDot className="w-4 h-4" strokeWidth={2} />
                                    Ativar rota
                                  </button>
                                )}
                                {status === "ativa" && (
                                  <button
                                    onClick={(e) => alterarStatusRota(rota, "pausada", e)}
                                    className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 font-semibold"
                                  >
                                    <Pause className="w-4 h-4" strokeWidth={2} />
                                    Pausar rota
                                  </button>
                                )}
                                {status !== "arquivada" && (
                                  <button
                                    onClick={(e) => alterarStatusRota(rota, "arquivada", e)}
                                    className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Archive className="w-4 h-4" strokeWidth={2} />
                                    Arquivar
                                  </button>
                                )}

                                <div className="border-t border-slate-100" />
{/* 🆕 Vincular à linha */}
<button
  onClick={(e) => {
    e.stopPropagation();
    setRotaVincularLinha(rota);
    setMenuAberto(null);
  }}
  className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 font-semibold"
>
  <Building2 className="w-4 h-4" strokeWidth={2} />
  Vincular à linha
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    setRotaLiberarPin(rota);
    setMenuAberto(null);
  }}
  className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 font-semibold"
>
  <KeyRound className="w-4 h-4" strokeWidth={2} />
  Liberar Edição via App
</button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRotaLiberarPin(rota);
                                    setMenuAberto(null);
                                  }}
                                  className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 font-semibold"
                                >
                                  <KeyRound className="w-4 h-4" strokeWidth={2} />
                                  Liberar Edição via App
                                </button>
                                <button onClick={(e) => exportarRota(rota, e)} className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Download className="w-4 h-4" strokeWidth={2} />
                                  Exportar
                                </button>

                                <div className="border-t border-slate-100" />

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmarExclusao(rota);
                                    setMenuAberto(null);
                                  }}
                                  className="btn-press flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                                  Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ===== MAPA ===== */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          <MapContainer
            center={[-23.55, -46.63]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              key={tipoMapa}
              attribution="&copy; OpenStreetMap"
              url={tilesUrl[tipoMapa]}
            />
            <CentralizarBotao tiles={tipoMapa} />
            <MapClickHandler onAddPoint={adicionarPonto} />

            {!rotaSelecionada && rotaAtual.length > 0 && indiceAnimacao > 0 && (
              <Polyline
                positions={rotaAtual.slice(0, indiceAnimacao)}
                pathOptions={{ color: "#3B82F6", weight: 6 }}
              />
            )}

            {rotaPreview &&
              !rotaSelecionada &&
              !modoComparacao &&
              rotas.map((r) => {
                if (r.id !== rotaPreview) return null;
                return (
                  <Polyline
                    key={`preview-${r.id}`}
                    positions={r.pontos_snap}
                    pathOptions={{
                      color: r.cor,
                      weight: 6,
                      opacity: 0.4,
                      dashArray: "10, 10",
                    }}
                  />
                );
              })}

            {rotas.map((rota) => {
              const status = getStatusRota(rota);
              const ehSelecionada = rotaSelecionada?.id === rota.id;
              if (status === "arquivada" && !ehSelecionada) return null;

              const emComparacao = rotasComparacao.has(rota.id);
              const pontosNormalizados = normalizarLista(rota.pontos_snap);
              if (!pontosNormalizados || pontosNormalizados.length === 0) return null;

              if (ehSelecionada) {
                const trechoAnimado = rotaAtual.slice(0, indiceAnimacao);
                return (
                  <Polyline
                    key={rota.id}
                    positions={trechoAnimado.length > 0 ? trechoAnimado : pontosNormalizados}
                    pathOptions={{ color: rota.cor, weight: 8, opacity: 1 }}
                  />
                );
              }

              if (modoComparacao && emComparacao) {
                return (
                  <Polyline
                    key={rota.id}
                    positions={pontosNormalizados}
                    pathOptions={{ color: rota.cor, weight: 7, opacity: 0.9 }}
                  />
                );
              }

              const opacityFinal =
                status === "pausada" ? 0.3 : modoComparacao ? 0.2 : 0.6;

              return (
                <Polyline
                  key={rota.id}
                  positions={pontosNormalizados}
                  pathOptions={{
                    color: rota.cor,
                    weight: 5,
                    opacity: opacityFinal,
                    dashArray: status === "pausada" ? "8, 8" : undefined,
                  }}
                />
              );
            })}

            {rotaSelecionada && rotaSelecionadaValida.length > 0 && (
              <FlyToRoute rota={rotaSelecionadaValida} trigger={`${rotaSelecionada.id}-${sentidoInvertido}`} />
            )}

            {mostrarSetas &&
              rotaSelecionada &&
              setasDirecao.map((s, i) => (
                <Marker
                  key={`seta-${i}`}
                  position={s.pos}
                  icon={criarSetaDirecao(s.angulo, rotaSelecionada.cor)}
                  interactive={false}
                />
              ))}

            {pontos.map((p, i) => {
              const ehPrimeiro = i === 0;
              const ehUltimo = i === pontos.length - 1 && pontos.length > 1;
              let icone;
              if (ehUltimo) icone = bandeiraIcon;
              else if (ehPrimeiro) icone = pontoPartidaIcon;
              else icone = criarMarcadorNumerado(i);

              const info = paradasInfo[i];
              return (
                <Marker key={`novo-${i}`} position={p} icon={icone}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold mb-1">
                        {ehUltimo
                          ? "Chegada"
                          : ehPrimeiro
                          ? "Partida"
                          : `Parada ${i}`}
                      </p>
                      {info?.nome && <p>{info.nome}</p>}
                      {info?.endereco && (
                        <p className="text-slate-600">{info.endereco}</p>
                      )}
                      {info?.horario && <p>{info.horario}</p>}
                      <button
                        onClick={() => abrirEditorParada(i)}
                        className="mt-2 text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {rotaSelecionada &&
              paradasExibicao.map((p, i) => {
                const total = paradasExibicao.length;
                const ehPrimeiro = i === 0;
                const ehUltimo = i === total - 1 && total > 1;
                let icone;
                if (ehUltimo) icone = bandeiraIcon;
                else if (ehPrimeiro) icone = pontoPartidaIcon;
                else icone = criarMarcadorNumerado(i);

                const info = paradasInfoExibicao[i];

                let distProximaParada = "";
                if (i < total - 1) {
                  const d = distanciaEntre(p, paradasExibicao[i + 1]);
                  distProximaParada = `${d.toFixed(2)} km até próxima`;
                }

                return (
                  <Marker key={`sel-${i}-${sentidoInvertido}`} position={p} icon={icone}>
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold mb-1">
                          {ehUltimo
                            ? "Chegada"
                            : ehPrimeiro
                            ? "Partida"
                            : `Parada ${i}`}
                        </p>
                        {info?.nome && <p className="font-semibold">{info.nome}</p>}
                        {info?.endereco && (
                          <p className="text-slate-600">{info.endereco}</p>
                        )}
                        {info?.horario && <p>{info.horario}</p>}
                        {distProximaParada && (
                          <p className="text-blue-600 mt-1">→ {distProximaParada}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>

          <div className="absolute top-4 right-4 z-[999] flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 p-1 flex flex-col gap-1">
              <button
                onClick={() => setTipoMapa("claro")}
                className={`btn-press w-9 h-9 rounded-lg flex items-center justify-center transition ${
                  tipoMapa === "claro" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Mapa claro"
              >
                <MapIcon className="w-4 h-4" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => setTipoMapa("satelite")}
                className={`btn-press w-9 h-9 rounded-lg flex items-center justify-center transition ${
                  tipoMapa === "satelite" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Satélite"
              >
                <Satellite className="w-4 h-4" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => setTipoMapa("escuro")}
                className={`btn-press w-9 h-9 rounded-lg flex items-center justify-center transition ${
                  tipoMapa === "escuro" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Modo escuro"
              >
                <MoonIcon className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>

            <button
              onClick={centralizarMapa}
              className="btn-press bg-white/95 backdrop-blur-md w-11 h-11 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
              title="Centralizar mapa"
            >
              <Crosshair className="w-5 h-5" strokeWidth={2.2} />
            </button>

            {rotaSelecionada && (
              <button
                onClick={() => setMostrarSetas((v) => !v)}
                className={`btn-press w-11 h-11 rounded-xl shadow-lg border transition flex items-center justify-center ${
                  mostrarSetas
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-white/95 backdrop-blur-md text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                title="Setas de direção"
              >
                <Navigation className="w-5 h-5" strokeWidth={2.2} />
              </button>
            )}
          </div>

          {(distancia > 0 || duracao > 0) && !rotaSelecionada && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] flex gap-3">
              {calculando && (
                <div className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg rounded-2xl px-4 py-3 flex items-center gap-2 skeleton">
                  <p className="text-sm text-slate-600 font-medium">Calculando...</p>
                </div>
              )}
              {!calculando && (
                <>
                  <div className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg rounded-2xl px-5 py-3 flex items-center gap-2">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide leading-tight">Distância</p>
                      <p className="text-lg font-bold text-blue-700 leading-tight">{distancia.toFixed(2)} km</p>
                    </div>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg rounded-2xl px-5 py-3 flex items-center gap-2">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide leading-tight">Tempo Estimado</p>
                      <p className="text-lg font-bold text-blue-700 leading-tight">{duracao.toFixed(0)} min</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {modoComparacao && rotasComparacao.size > 0 && (
            <div className="card-info-rota absolute bottom-6 left-1/2 z-[999]" style={{ transform: "translateX(-50%)" }}>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-blue-600 text-white px-5 py-2">
                  <p className="text-sm font-bold">Comparação de Rotas</p>
                </div>
                <div className="p-4">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="text-left py-2 pr-3">Rota</th>
                        <th className="text-right py-2 px-2">Paradas</th>
                        <th className="text-right py-2 px-2">Distância</th>
                        <th className="text-right py-2 pl-2">Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(rotasComparacao).map((id) => {
                        const r = rotas.find((rr) => rr.id === id);
                        if (!r) return null;
                        return (
                          <tr key={id} className="border-b border-slate-100">
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.cor }} />
                                <span className="font-semibold">{r.nome}</span>
                              </div>
                            </td>
                            <td className="text-right py-2 px-2">{r.pontos_originais.length}</td>
                            <td className="text-right py-2 px-2">{(Number(r.distancia_km) || 0).toFixed(1)} km</td>
                            <td className="text-right py-2 pl-2">{(Number(r.duracao_min) || 0).toFixed(0)} min</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {rotaSelecionada && !modoComparacao && (
            <div
              key={rotaSelecionada.id}
              className="card-info-rota absolute bottom-6 left-1/2 z-[999]"
              style={{ transform: "translateX(-50%)" }}
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden min-w-[440px]">
                <div className="h-1.5 w-full" style={{ backgroundColor: rotaSelecionada.cor }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-md" style={{ backgroundColor: rotaSelecionada.cor }} />
                      <h3 className="font-black text-xl text-slate-800 tracking-tight truncate">
                        {rotaSelecionada.nome}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setRotaSelecionada(null);
                        setRotaAtual([]);
                        setDistancia(0);
                        setDuracao(0);
                        setSentidoInvertido(false);
                      }}
                      className="btn-press w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition flex items-center justify-center"
                    >
                      <X className="w-4 h-4" strokeWidth={2.2} />
                    </button>
                  </div>

                  {/* Badges no card */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <BadgeStatus status={getStatusRota(rotaSelecionada)} size="md" />
                    {getTurnosRota(rotaSelecionada).length > 0 && (
                      <BadgeTurnos
                        turnos={getTurnosRota(rotaSelecionada)}
                        size="sm"
                      />
                    )}
                  </div>

                  <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
                    <button
                      onClick={() => {
                        if (sentidoInvertido) alternarSentido();
                      }}
                      disabled={calculando}
                      className={`btn-press flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition ${
                        !sentidoInvertido
                          ? "bg-white text-blue-700 shadow"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Ida
                    </button>
                    <button
                      onClick={() => {
                        if (!sentidoInvertido) alternarSentido();
                      }}
                      disabled={calculando}
                      className={`btn-press flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition ${
                        sentidoInvertido
                          ? "bg-white text-blue-700 shadow"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Volta
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Tempo</p>
                      <p className="text-lg font-bold text-blue-700 leading-none">
                        {calculando ? "..." : duracaoExibicao.toFixed(0)}
                        <span className="text-xs font-semibold text-blue-500 ml-1">min</span>
                      </p>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Distância</p>
                      <p className="text-lg font-bold text-emerald-700 leading-none">
                        {calculando ? "..." : distanciaExibicao.toFixed(1)}
                        <span className="text-xs font-semibold text-emerald-500 ml-1">km</span>
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Paradas</p>
                      <p className="text-lg font-bold text-purple-700 leading-none">
                        {rotaSelecionada.pontos_originais.length}
                      </p>
                    </div>
                  </div>

                  {sentidoInvertido && (
                    <p className="text-xs text-center text-blue-600 mt-3 font-semibold">
                      Rota invertida — sentido volta
                    </p>
                  )}

                  <button
                    onClick={() => setRotaLiberarPin(rotaSelecionada)}
                    className="btn-press w-full mt-4 bg-blue-50 text-blue-700 border border-blue-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" strokeWidth={2.2} />
                    Liberar Edição via App
                  </button>
                </div>
              </div>
            </div>
          )}

          {mensagem && (
            <div
              className={`fade-in absolute top-6 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm ${
                mensagem.tipo === "sucesso"
                  ? "bg-green-600 text-white"
                  : mensagem.tipo === "erro"
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {mensagem.texto}
            </div>
          )}
        </div>

        {menuAberto && (
          <div className="fixed inset-0 z-[400]" onClick={() => setMenuAberto(null)} />
        )}

        {paradaEditando && (
          <div
            className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
            onClick={() => setParadaEditando(null)}
          >
            <div
              className="fade-in bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Editar Parada {paradaEditando.indice + 1}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Nome</label>
                  <input
                    autoFocus
                    type="text"
                    value={paradaEditando.nome}
                    onChange={(e) =>
                      setParadaEditando({ ...paradaEditando, nome: e.target.value })
                    }
                    placeholder="Ex: Terminal Central"
                    className="mt-1 border border-slate-300 px-3 py-2 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Endereço</label>
                  <input
                    type="text"
                    value={paradaEditando.endereco}
                    onChange={(e) =>
                      setParadaEditando({ ...paradaEditando, endereco: e.target.value })
                    }
                    className="mt-1 border border-slate-300 px-3 py-2 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Horário previsto</label>
                  <input
                    type="time"
                    value={paradaEditando.horario}
                    onChange={(e) =>
                      setParadaEditando({ ...paradaEditando, horario: e.target.value })
                    }
                    className="mt-1 border border-slate-300 px-3 py-2 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setParadaEditando(null)}
                  className="btn-press flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarParada}
                  className="btn-press flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-500"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
  aberto={!!confirmarExclusao}
  onFechar={() => setConfirmarExclusao(null)}
  onConfirmar={excluirRotaConfirmado}
  titulo="Excluir rota?"
  descricao={
    confirmarExclusao
      ? `A rota "${confirmarExclusao.nome}" será excluída permanentemente. Todo o histórico de viagens dela será mantido, mas a rota não estará mais disponível. Esta ação não pode ser desfeita.`
      : ""
  }
  textoConfirmar="Sim, excluir"
  textoCancelar="Cancelar"
  variant="danger"
  loading={excluindo}
/>
        {modalRota && (
          <div
            className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
            onClick={() => setModalRota(null)}
          >
            <div
              className="fade-in bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: modalRota.cor }} />
                  <h3 className="text-xl font-bold text-slate-800">{modalRota.nome}</h3>
                </div>
                <button
                  onClick={() => setModalRota(null)}
                  className="btn-press w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>

              {/* Badges no modal */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <BadgeStatus status={getStatusRota(modalRota)} size="md" />
                {getTurnosRota(modalRota).length > 0 && (
                  <BadgeTurnos turnos={getTurnosRota(modalRota)} size="sm" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Tempo</p>
                  <p className="text-lg font-bold text-blue-700">{(Number(modalRota.duracao_min) || 0).toFixed(0)} min</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Distância</p>
                  <p className="text-lg font-bold text-emerald-700">{(Number(modalRota.distancia_km) || 0).toFixed(1)} km</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Paradas</p>
                  <p className="text-lg font-bold text-purple-700">{modalRota.pontos_originais.length}</p>
                </div>
              </div>

              {(modalRota.categoria || modalRota.horario_saida) && (
                <div className="border-t pt-3 mb-3 space-y-2">
                  {modalRota.categoria && (
                    <p className="text-sm"><span className="font-semibold">Categoria:</span> {modalRota.categoria}</p>
                  )}
                  {modalRota.horario_saida && (
                    <p className="text-sm"><span className="font-semibold">Horário saída:</span> {modalRota.horario_saida}</p>
                  )}
                </div>
              )}

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Paradas</p>
                <div className="space-y-1.5">
                  {modalRota.pontos_originais.map((_, i) => {
                    const info = modalRota.paradas_info?.[i];
                    return (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold">{info?.nome || `Parada ${i + 1}`}</p>
                          {info?.endereco && <p className="text-xs text-slate-600">{info.endereco}</p>}
                          {info?.horario && <p className="text-xs text-blue-600">{info.horario}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <Modal
          aberto={!!rotaLiberarPin}
          onFechar={() => setRotaLiberarPin(null)}
          titulo="Liberar edição via app"
          tamanho="md"
        >
          {rotaLiberarPin && (
            <FormGerarPin
              rotaId={rotaLiberarPin.id}
              rotaNome={rotaLiberarPin.nome}
              onSucesso={(codigo) => {
                setRotaLiberarPin(null);
                setPinRecemGerado(codigo);
                setMensagem({
                  tipo: "sucesso",
                  texto: "PIN gerado com sucesso!",
                });
              }}
              onCancelar={() => setRotaLiberarPin(null)}
            />
          )}
        </Modal>

        <Modal
          aberto={!!pinRecemGerado}
          onFechar={() => setPinRecemGerado(null)}
          titulo=""
          tamanho="sm"
        >
          {pinRecemGerado && (
            <PinGerado
              codigo={pinRecemGerado}
              onFechar={() => setPinRecemGerado(null)}
            />
          )}
        </Modal>

        <Modal
  aberto={!!pinRecemGerado}
  onFechar={() => setPinRecemGerado(null)}
  titulo=""
  tamanho="sm"
>
  {pinRecemGerado && (
    <PinGerado
      codigo={pinRecemGerado}
      onFechar={() => setPinRecemGerado(null)}
    />
  )}
</Modal>

{/* 🆕 Modal de Vincular Linha */}
<Modal
  aberto={!!rotaVincularLinha}
  onFechar={() => setRotaVincularLinha(null)}
  titulo="Vincular à linha"
  tamanho="md"
>
  {rotaVincularLinha && (
    <ModalVincularLinha
      rotaId={rotaVincularLinha.id}
      rotaNome={rotaVincularLinha.nome}
      linhaAtualId={rotaVincularLinha.linha_id}
      onSucesso={() => {
        setRotaVincularLinha(null);
        setMensagem({
          tipo: "sucesso",
          texto: "Linha vinculada com sucesso!",
        });
        carregarRotas();
      }}
      onCancelar={() => setRotaVincularLinha(null)}
    />
  )}
</Modal>

      </div>
    </>
  );
}

export default Rotas;