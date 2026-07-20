import { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CheckCircle2,
  XCircle,
  Route as RouteIcon,
  Clock,
  RefreshCw,
  ArrowRight,
  CalendarClock,
  MapPin,
  Gauge,
  Timer,
  X,
  Play,
  Pause,
  Activity,
  Inbox,
  Flag,
  MapPinned,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../supabase";

import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterTabs } from "../components/ui/FilterTabs";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";

/* =========================
   TYPES
========================= */
interface ViagemHistorico {
  id: string;
  empresa_id: string;
  motorista_id: string | null;
  rota_id: string | null;
  motorista_nome: string | null;
  rota_nome: string | null;
  rota_cor: string | null;
  iniciada_em: string;
  finalizada_em: string | null;
  duracao_segundos: number | null;
  status: string;
  paradas_totais: number;
  paradas_concluidas: number;
  distancia_planejada_km: number | null;
  distancia_real_km: number;
  velocidade_media_kmh: number | null;
  velocidade_maxima_kmh: number | null;
  trajeto_real: any[];
  created_at: string;
}

type StatusConfig = {
  label: string;
  badge: "green" | "blue" | "red" | "amber";
  icon: LucideIcon;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  concluida: { label: "Concluída", badge: "green", icon: CheckCircle2 },
  em_andamento: { label: "Em andamento", badge: "blue", icon: Play },
  cancelada: { label: "Cancelada", badge: "red", icon: XCircle },
  pausada: { label: "Pausada", badge: "amber", icon: Pause },
};

type FiltroStatus = "todos" | "concluida" | "cancelada" | "em_andamento";
type FiltroData = "todos" | "hoje" | "semana" | "mes";

/* =========================
   HELPERS
========================= */
function formatarDuracao(seg: number | null): string {
  if (!seg) return "-";
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function formatarHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDataCompleta(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function normalizarPontoMapa(p: any): LatLngExpression | null {
  if (!p) return null;
  if (Array.isArray(p)) return [Number(p[0]), Number(p[1])];
  if (p.lat !== undefined && p.lng !== undefined)
    return [Number(p.lat), Number(p.lng)];
  if (p.latitude !== undefined && p.longitude !== undefined)
    return [Number(p.latitude), Number(p.longitude)];
  return null;
}

/* =========================
   MAPA
========================= */
function FitBoundsTrajeto({ pontos }: { pontos: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (pontos.length > 0) {
      try {
        const bounds = L.latLngBounds(pontos as any);
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch {}
    }
  }, [pontos, map]);
  return null;
}

const marcadorInicio = new L.DivIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:white;border:4px solid #22C55E;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const marcadorFim = new L.DivIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:white;border:4px solid #EF4444;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapaTrajetoViagem({ viagem }: { viagem: ViagemHistorico }) {
  const trajeto = (viagem.trajeto_real || [])
    .map(normalizarPontoMapa)
    .filter((p): p is LatLngExpression => p !== null);

  if (trajeto.length < 2) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <MapPinned className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-slate-600 font-semibold">
          Trajeto GPS não disponível
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          O motorista pode ter feito uma viagem muito curta ou o GPS não
          registrou pontos suficientes.
        </p>
      </div>
    );
  }

  const inicio = trajeto[0];
  const fim = trajeto[trajeto.length - 1];

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative"
      style={{ height: 350 }}
    >
      <MapContainer
        center={inicio as any}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <FitBoundsTrajeto pontos={trajeto} />

        <Polyline
          positions={trajeto}
          pathOptions={{ color: "rgba(0,0,0,0.15)", weight: 10 }}
        />
        <Polyline
          positions={trajeto}
          pathOptions={{
            color: viagem.rota_cor || "#3B82F6",
            weight: 5,
            opacity: 1,
          }}
        />

        <Marker position={inicio as any} icon={marcadorInicio} />
        <Marker position={fim as any} icon={marcadorFim} />
      </MapContainer>

      {/* Legenda flutuante */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-3 text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white border-[3px] border-green-500" />
          <span className="font-semibold text-slate-700">Início</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white border-[3px] border-red-500" />
          <span className="font-semibold text-slate-700">Fim</span>
        </div>
      </div>
    </div>
  );
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function Historico() {
  const [viagens, setViagens] = useState<ViagemHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroData, setFiltroData] = useState<FiltroData>("todos");
  const [viagemDetalhe, setViagemDetalhe] = useState<ViagemHistorico | null>(
    null
  );

  useEffect(() => {
    carregarViagens();
  }, []);

  const carregarViagens = async () => {
    if (viagens.length > 0) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from("viagens")
      .select("*")
      .order("iniciada_em", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Erro ao carregar viagens:", error);
    } else if (data) {
      setViagens(data as ViagemHistorico[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const viagensFiltradas = useMemo(() => {
    let lista = viagens;

    if (filtroStatus !== "todos") {
      lista = lista.filter((v) => v.status === filtroStatus);
    }

    if (filtroData !== "todos") {
      const agora = new Date();
      lista = lista.filter((v) => {
        const d = new Date(v.iniciada_em);
        if (filtroData === "hoje")
          return d.toDateString() === agora.toDateString();
        if (filtroData === "semana") {
          const diff = (agora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        }
        if (filtroData === "mes") {
          return (
            d.getMonth() === agora.getMonth() &&
            d.getFullYear() === agora.getFullYear()
          );
        }
        return true;
      });
    }

    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (v) =>
          v.motorista_nome?.toLowerCase().includes(t) ||
          v.rota_nome?.toLowerCase().includes(t)
      );
    }

    return lista;
  }, [viagens, busca, filtroStatus, filtroData]);

  const stats = useMemo(() => {
    const concluidas = viagens.filter((v) => v.status === "concluida");
    const totalKm = concluidas.reduce(
      (acc, v) => acc + (Number(v.distancia_real_km) || 0),
      0
    );
    const totalTempo = concluidas.reduce(
      (acc, v) => acc + (Number(v.duracao_segundos) || 0),
      0
    );

    return {
      total: viagens.length,
      concluidas: concluidas.length,
      canceladas: viagens.filter((v) => v.status === "cancelada").length,
      emAndamento: viagens.filter((v) => v.status === "em_andamento").length,
      kmTotal: totalKm,
      tempoTotal: totalTempo,
    };
  }, [viagens]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Histórico de Viagens"
        subtitle={`${stats.total} viagens registradas`}
      >
        <div className="mt-3">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={carregarViagens}
            loading={refreshing}
          >
            Atualizar
          </Button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Concluídas"
          value={stats.concluidas}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Canceladas"
          value={stats.canceladas}
          icon={XCircle}
          color="red"
        />
        <StatCard
          label="KM Total"
          value={stats.kmTotal.toFixed(0)}
          icon={RouteIcon}
          color="blue"
        />
        <StatCard
          label="Horas Totais"
          value={`${(stats.tempoTotal / 3600).toFixed(1)}h`}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <SearchInput
              value={busca}
              onChange={setBusca}
              placeholder="Buscar por motorista ou rota..."
            />
          </div>

          <FilterTabs
            options={[
              { value: "todos", label: "Todas" },
              { value: "concluida", label: "Concluídas" },
              { value: "cancelada", label: "Canceladas" },
              { value: "em_andamento", label: "Em andamento" },
            ]}
            value={filtroStatus}
            onChange={setFiltroStatus}
          />

          <FilterTabs
            options={[
              { value: "todos", label: "Tudo" },
              { value: "hoje", label: "Hoje" },
              { value: "semana", label: "7 dias" },
              { value: "mes", label: "Mês" },
            ]}
            value={filtroData}
            onChange={setFiltroData}
          />
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando viagens...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && viagensFiltradas.length === 0 && (
        <Card>
          <EmptyState
            icon={Inbox}
            title={
              viagens.length === 0
                ? "Nenhuma viagem registrada"
                : "Nenhuma viagem encontrada"
            }
            description={
              viagens.length === 0
                ? "Quando um motorista fizer uma viagem pelo app, ela aparece aqui."
                : "Ajuste os filtros para ver mais resultados."
            }
          />
        </Card>
      )}

      {/* Lista de viagens */}
      {!loading && viagensFiltradas.length > 0 && (
        <div className="space-y-3">
          {viagensFiltradas.map((v) => {
            const st = STATUS_CONFIG[v.status] || STATUS_CONFIG.concluida;
            const StIcon = st.icon;
            const progresso =
              v.paradas_totais > 0
                ? Math.round((v.paradas_concluidas / v.paradas_totais) * 100)
                : 0;

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition cursor-pointer active:scale-[0.99]"
                onClick={() => setViagemDetalhe(v)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={v.motorista_nome || "?"} size="md" />

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <p className="font-bold text-slate-800 text-sm">
                          {v.motorista_nome || "Motorista"}
                        </p>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-slate-400"
                          strokeWidth={2.2}
                        />
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: v.rota_cor || "#3B82F6",
                            }}
                          />
                          <p className="font-semibold text-sm text-slate-700 truncate">
                            {v.rota_nome || "Rota"}
                          </p>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarClock
                            className="w-3.5 h-3.5"
                            strokeWidth={2}
                          />
                          {formatarDataCompleta(v.iniciada_em)}{" "}
                          {formatarHora(v.iniciada_em)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" strokeWidth={2} />
                          {formatarDuracao(v.duracao_segundos)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                          <RouteIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          {(Number(v.distancia_real_km) || 0).toFixed(1)} km
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                          {v.paradas_concluidas}/{v.paradas_totais} paradas
                        </span>
                      </div>

                      {/* Barra de progresso */}
                      {v.status === "em_andamento" && v.paradas_totais > 0 && (
                        <div className="mt-2.5">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Badge de status + vel média */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge color={st.badge} icon={StIcon}>
                        {st.label}
                      </Badge>

                      {v.velocidade_media_kmh &&
                        v.velocidade_media_kmh > 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <Gauge className="w-3 h-3" strokeWidth={2.2} />
                            Méd. {Math.round(v.velocidade_media_kmh)} km/h
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalhes */}
      {viagemDetalhe && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setViagemDetalhe(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Detalhes da Viagem
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" strokeWidth={2} />
                  {formatarDataCompleta(viagemDetalhe.iniciada_em)}{" "}
                  {formatarHora(viagemDetalhe.iniciada_em)}
                </p>
              </div>
              <button
                onClick={() => setViagemDetalhe(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" strokeWidth={2.2} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Motorista e Rota */}
              <div className="flex items-center gap-4">
                <Avatar
                  name={viagemDetalhe.motorista_nome || "?"}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-slate-800 truncate">
                    {viagemDetalhe.motorista_nome || "Motorista"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: viagemDetalhe.rota_cor || "#3B82F6",
                      }}
                    />
                    <p className="text-sm text-slate-600 font-semibold truncate">
                      {viagemDetalhe.rota_nome || "Rota"}
                    </p>
                  </div>
                </div>
                <div>
                  {(() => {
                    const st =
                      STATUS_CONFIG[viagemDetalhe.status] ||
                      STATUS_CONFIG.concluida;
                    return (
                      <Badge color={st.badge} icon={st.icon} size="md">
                        {st.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricaBox
                  icon={Timer}
                  label="Duração"
                  value={formatarDuracao(viagemDetalhe.duracao_segundos)}
                  color="blue"
                />
                <MetricaBox
                  icon={RouteIcon}
                  label="Distância"
                  value={`${(
                    Number(viagemDetalhe.distancia_real_km) || 0
                  ).toFixed(1)} km`}
                  color="emerald"
                />
                <MetricaBox
                  icon={MapPin}
                  label="Paradas"
                  value={`${viagemDetalhe.paradas_concluidas}/${viagemDetalhe.paradas_totais}`}
                  color="purple"
                />
                <MetricaBox
                  icon={Gauge}
                  label="Vel. Média"
                  value={`${Math.round(
                    Number(viagemDetalhe.velocidade_media_kmh) || 0
                  )} km/h`}
                  color="amber"
                />
              </div>

              {/* Mapa */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPinned className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Trajeto Real
                </h3>
                <MapaTrajetoViagem viagem={viagemDetalhe} />
              </div>

              {/* Horários */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-semibold flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-green-600" strokeWidth={2.2} />
                    Iniciada em
                  </span>
                  <span className="text-slate-800 font-bold">
                    {new Date(viagemDetalhe.iniciada_em).toLocaleString(
                      "pt-BR"
                    )}
                  </span>
                </div>
                {viagemDetalhe.finalizada_em && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-semibold flex items-center gap-2">
                      <Flag className="w-3.5 h-3.5 text-red-600" strokeWidth={2.2} />
                      Finalizada em
                    </span>
                    <span className="text-slate-800 font-bold">
                      {new Date(viagemDetalhe.finalizada_em).toLocaleString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                )}
                {viagemDetalhe.velocidade_maxima_kmh &&
                  viagemDetalhe.velocidade_maxima_kmh > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-semibold flex items-center gap-2">
                        <Activity
                          className="w-3.5 h-3.5 text-amber-600"
                          strokeWidth={2.2}
                        />
                        Vel. Máxima
                      </span>
                      <span className="text-slate-800 font-bold">
                        {Math.round(viagemDetalhe.velocidade_maxima_kmh)} km/h
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   METRICA BOX
========================= */
type MetricaColor = "blue" | "emerald" | "purple" | "amber";

const METRICA_COLORS: Record<
  MetricaColor,
  { bg: string; border: string; text: string; iconBg: string; iconText: string }
> = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-700",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-100",
    text: "text-purple-700",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
  },
};

function MetricaBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: MetricaColor;
}) {
  const c = METRICA_COLORS[color];
  return (
    <div className={`${c.bg} rounded-xl p-4 border ${c.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${c.iconText}`} strokeWidth={2.2} />
        </div>
        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
          {label}
        </p>
      </div>
      <p className={`text-xl font-bold ${c.text}`}>{value}</p>
    </div>
  );
}