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
import { supabase } from "../supabase";
import { iniciaisNome } from "../lib/formatters";

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

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; icone: string }
> = {
  concluida: {
    label: "Concluída",
    bg: "bg-green-100",
    text: "text-green-700",
    icone: "✓",
  },
  em_andamento: {
    label: "Em andamento",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icone: "●",
  },
  cancelada: {
    label: "Cancelada",
    bg: "bg-red-100",
    text: "text-red-700",
    icone: "✕",
  },
  pausada: {
    label: "Pausada",
    bg: "bg-amber-100",
    text: "text-amber-700",
    icone: "||",
  },
};

function normalizarPontoMapa(p: any): LatLngExpression | null {
  if (!p) return null;
  if (Array.isArray(p)) return [Number(p[0]), Number(p[1])];
  if (p.lat !== undefined && p.lng !== undefined)
    return [Number(p.lat), Number(p.lng)];
  if (p.latitude !== undefined && p.longitude !== undefined)
    return [Number(p.latitude), Number(p.longitude)];
  return null;
}

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
      <div className="bg-slate-50 rounded-xl p-8 text-center border">
        <p className="text-sm text-slate-500 font-semibold">
          Trajeto GPS não disponível para esta viagem
        </p>
        <p className="text-xs text-slate-400 mt-1">
          O motorista pode ter feito uma viagem muito curta ou o GPS
          não registrou pontos suficientes
        </p>
      </div>
    );
  }

  const inicio = trajeto[0];
  const fim = trajeto[trajeto.length - 1];

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: 350 }}>
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

        {/* Sombra do trajeto */}
        <Polyline
          positions={trajeto}
          pathOptions={{
            color: "rgba(0,0,0,0.15)",
            weight: 10,
          }}
        />

        {/* Trajeto real */}
        <Polyline
          positions={trajeto}
          pathOptions={{
            color: viagem.rota_cor || "#3B82F6",
            weight: 5,
            opacity: 1,
          }}
        />

        {/* Marcador início (verde) */}
        <Marker position={inicio as any} icon={marcadorInicio} />

        {/* Marcador fim (vermelho) */}
        <Marker position={fim as any} icon={marcadorFim} />
      </MapContainer>
    </div>
  );
}

export default function Historico() {
  const [viagens, setViagens] = useState<ViagemHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroData, setFiltroData] = useState("todos");
  const [viagemDetalhe, setViagemDetalhe] = useState<ViagemHistorico | null>(
    null
  );

  useEffect(() => {
    carregarViagens();
  }, []);

  const carregarViagens = async () => {
    setLoading(true);
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
  };

  // Filtros
  const viagensFiltradas = useMemo(() => {
    let lista = viagens;

    // Status
    if (filtroStatus !== "todos") {
      lista = lista.filter((v) => v.status === filtroStatus);
    }

    // Data
    if (filtroData !== "todos") {
      const agora = new Date();
      lista = lista.filter((v) => {
        const d = new Date(v.iniciada_em);
        if (filtroData === "hoje") return d.toDateString() === agora.toDateString();
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

    // Busca
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

  // Stats
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Histórico de Viagens
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} viagens registradas
          </p>
        </div>
        <button
          onClick={carregarViagens}
          className="text-sm text-slate-500 hover:text-slate-800 font-semibold border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition active:scale-95"
        >
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Concluídas
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.concluidas}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Canceladas
              </p>
              <p className="text-2xl font-bold text-red-600">
                {stats.canceladas}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                KM Total
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.kmTotal.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Horas totais
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {(stats.tempoTotal / 3600).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por motorista ou rota..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { v: "todos", l: "Todas" },
            { v: "concluida", l: "Concluídas" },
            { v: "cancelada", l: "Canceladas" },
            { v: "em_andamento", l: "Em andamento" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltroStatus(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroStatus === f.v
                  ? "bg-white text-blue-700 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { v: "todos", l: "Tudo" },
            { v: "hoje", l: "Hoje" },
            { v: "semana", l: "7 dias" },
            { v: "mes", l: "Mês" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltroData(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroData === f.v
                  ? "bg-white text-blue-700 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando viagens...</p>
        </div>
      )}

      {/* Lista vazia */}
      {!loading && viagensFiltradas.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <div className="text-6xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {viagens.length === 0
              ? "Nenhuma viagem registrada"
              : "Nenhuma viagem encontrada"}
          </h3>
          <p className="text-slate-500 text-sm">
            {viagens.length === 0
              ? "Quando um motorista fizer uma viagem pelo app, ela aparece aqui"
              : "Ajuste os filtros pra ver mais"}
          </p>
        </div>
      )}

      {/* Lista de viagens */}
      {!loading && viagensFiltradas.length > 0 && (
        <div className="space-y-3">
          {viagensFiltradas.map((v) => {
            const st = statusConfig[v.status] || statusConfig.concluida;
            const progresso =
              v.paradas_totais > 0
                ? Math.round(
                    (v.paradas_concluidas / v.paradas_totais) * 100
                  )
                : 0;

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer active:scale-[0.99]"
                onClick={() => setViagemDetalhe(v)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${
                          v.rota_cor || "#3B82F6"
                        } 0%, ${v.rota_cor || "#3B82F6"}dd 100%)`,
                      }}
                    >
                      {iniciaisNome(v.motorista_nome || "?")}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-slate-800 text-sm">
                          {v.motorista_nome || "Motorista"}
                        </p>
                        <span className="text-slate-400">→</span>
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
                        <span>
                          {formatarDataCompleta(v.iniciada_em)}{" "}
                          {formatarHora(v.iniciada_em)}
                        </span>
                        <span>·</span>
                        <span>{formatarDuracao(v.duracao_segundos)}</span>
                        <span>·</span>
                        <span>
                          {(Number(v.distancia_real_km) || 0).toFixed(1)} km
                        </span>
                        <span>·</span>
                        <span>
                          {v.paradas_concluidas}/{v.paradas_totais} paradas
                        </span>
                      </div>

                      {/* Barra de progresso (se em andamento) */}
                      {v.status === "em_andamento" && v.paradas_totais > 0 && (
                        <div className="mt-2">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Badge de status */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span
                        className={`
                          inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${st.bg} ${st.text}
                        `}
                      >
                        <span>{st.icone}</span>
                        {st.label}
                      </span>

                      {v.velocidade_media_kmh &&
                        v.velocidade_media_kmh > 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
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

      {/* Modal de detalhes (placeholder) */}
     {viagemDetalhe && (
  <div
    className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
    onClick={() => setViagemDetalhe(null)}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Detalhes da Viagem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatarDataCompleta(viagemDetalhe.iniciada_em)}{" "}
            {formatarHora(viagemDetalhe.iniciada_em)}
          </p>
        </div>
        <button
          onClick={() => setViagemDetalhe(null)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Motorista e Rota */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${
                viagemDetalhe.rota_cor || "#3B82F6"
              } 0%, ${viagemDetalhe.rota_cor || "#3B82F6"}dd 100%)`,
            }}
          >
            {iniciaisNome(viagemDetalhe.motorista_nome || "?")}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg text-slate-800">
              {viagemDetalhe.motorista_nome || "Motorista"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: viagemDetalhe.rota_cor || "#3B82F6",
                }}
              />
              <p className="text-sm text-slate-600 font-semibold">
                {viagemDetalhe.rota_nome || "Rota"}
              </p>
            </div>
          </div>
          <div>
            {(() => {
              const st =
                statusConfig[viagemDetalhe.status] || statusConfig.concluida;
              return (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${st.bg} ${st.text}`}
                >
                  <span>{st.icone}</span>
                  {st.label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Duração
            </p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {formatarDuracao(viagemDetalhe.duracao_segundos)}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Distância
            </p>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {(Number(viagemDetalhe.distancia_real_km) || 0).toFixed(1)} km
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Paradas
            </p>
            <p className="text-xl font-bold text-purple-700 mt-1">
              {viagemDetalhe.paradas_concluidas}/{viagemDetalhe.paradas_totais}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Vel. Média
            </p>
            <p className="text-xl font-bold text-amber-700 mt-1">
              {Math.round(Number(viagemDetalhe.velocidade_media_kmh) || 0)} km/h
            </p>
          </div>
        </div>

        {/* MAPA DO TRAJETO */}
        <MapaTrajetoViagem viagem={viagemDetalhe} />

        {/* Horários */}
        <div className="bg-slate-50 rounded-xl p-4 border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 font-semibold">Iniciada em</span>
            <span className="text-slate-800 font-bold">
              {new Date(viagemDetalhe.iniciada_em).toLocaleString("pt-BR")}
            </span>
          </div>
          {viagemDetalhe.finalizada_em && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-semibold">
                Finalizada em
              </span>
              <span className="text-slate-800 font-bold">
                {new Date(viagemDetalhe.finalizada_em).toLocaleString("pt-BR")}
              </span>
            </div>
          )}
          {viagemDetalhe.velocidade_maxima_kmh &&
            viagemDetalhe.velocidade_maxima_kmh > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-semibold">
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