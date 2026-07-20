import { useState, useMemo, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Radio,
  RefreshCw,
  WifiOff,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MapPin,
  Gauge,
} from "lucide-react";
import { supabase } from "../supabase";
import {
  useMotoristasAoVivo,
  type MotoristaAoVivo,
} from "../hooks/useMotoristasAoVivo";
import { criarMarcadorMotorista } from "../components/ao-vivo/MarcadorMotorista";
import CardMotoristaAoVivo from "../components/ao-vivo/CardMotoristaAoVivo";

const cssAnimacao = `
  @keyframes pulsoAoVivo {
    0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
  }
  .marcador-motorista-container {
    background: transparent !important;
    border: none !important;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    padding: 4px !important;
  }
  .leaflet-popup-content {
    margin: 8px 12px !important;
  }
  @keyframes fadeInAoVivo {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .fade-in { animation: fadeInAoVivo 0.2s ease-out; }
  @keyframes pulseAoVivo {
    0%,100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .skeleton { animation: pulseAoVivo 1.5s ease-in-out infinite; }
  .btn-press:active { transform: scale(0.96); }
`;

/* =========================
   HELPERS DE MAPA
========================= */
function SeguirMotorista({
  motorista,
}: {
  motorista: MotoristaAoVivo | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (motorista) {
      map.flyTo([motorista.latitude, motorista.longitude], 16, {
        duration: 1,
      });
    }
  }, [motorista?.motorista_id]);
  return null;
}

function AjustarBounds({ motoristas }: { motoristas: MotoristaAoVivo[] }) {
  const map = useMap();
  const [aplicado, setAplicado] = useState(false);

  useEffect(() => {
    if (!aplicado && motoristas.length > 0) {
      const pontos = motoristas
        .filter((m) => m.realmente_online)
        .map((m) => [m.latitude, m.longitude] as [number, number]);

      if (pontos.length > 0) {
        const bounds = L.latLngBounds(pontos);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
        setAplicado(true);
      }
    }
  }, [motoristas, aplicado, map]);

  return null;
}

/* =========================
   MARCADOR OTIMIZADO
========================= */
function MarcadorMotoristaOtimizado({
  motorista,
  onSelect,
}: {
  motorista: MotoristaAoVivo;
  onSelect: () => void;
}) {
  const icone = useMemo(
    () =>
      criarMarcadorMotorista({
        cor: motorista.rota_cor || "#3B82F6",
        heading: motorista.heading || 0,
        emViagem: motorista.em_viagem,
        nome: motorista.motorista_nome,
      }),
    [
      motorista.rota_cor,
      motorista.heading,
      motorista.em_viagem,
      motorista.motorista_nome,
    ]
  );

  return (
    <Marker
      position={[motorista.latitude, motorista.longitude]}
      icon={icone}
      eventHandlers={{
        click: onSelect,
      }}
    >
      <Popup autoClose={false} closeOnClick={false}>
        <div className="text-xs min-w-[180px]">
          <p className="font-bold text-sm mb-1.5 text-slate-800">
            {motorista.motorista_nome}
          </p>
          {motorista.em_viagem && motorista.rota_nome && (
            <>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: motorista.rota_cor || "#3B82F6",
                  }}
                />
                <p className="text-slate-700 font-semibold">
                  {motorista.rota_nome}
                </p>
              </div>
              <div className="flex items-center gap-1 text-slate-600 mb-0.5">
                <MapPin className="w-3 h-3" strokeWidth={2.2} />
                <strong>{motorista.paradas_concluidas}</strong>/
                {motorista.paradas_totais} paradas
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Gauge className="w-3 h-3" strokeWidth={2.2} />
                <strong>{Math.round(motorista.velocidade_kmh)}</strong> km/h
              </div>
            </>
          )}
          {!motorista.em_viagem && (
            <p className="text-slate-500 italic">Disponível</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
type Filtro = "todos" | "em_viagem" | "online" | "offline";

export default function AoVivo() {
  const { motoristas, loading, stats, recarregar } = useMotoristasAoVivo();
  const [motoristaSelecionadoId, setMotoristaSelecionadoId] = useState<
    string | null
  >(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [painelAberto, setPainelAberto] = useState(true);
  const [rotasVisualizadas, setRotasVisualizadas] = useState<
    Record<string, any[]>
  >({});

  const motoristaSelecionado = useMemo(
    () =>
      motoristaSelecionadoId
        ? motoristas.find(
            (m) => m.motorista_id === motoristaSelecionadoId
          ) || null
        : null,
    [motoristas, motoristaSelecionadoId]
  );

  const motoristasFiltrados = useMemo(() => {
    let lista = motoristas;

    if (filtro === "em_viagem") {
      lista = lista.filter((m) => m.em_viagem && m.realmente_online);
    } else if (filtro === "online") {
      lista = lista.filter((m) => m.realmente_online && !m.em_viagem);
    } else if (filtro === "offline") {
      lista = lista.filter((m) => !m.realmente_online);
    }

    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter((m) =>
        m.motorista_nome?.toLowerCase().includes(t)
      );
    }

    return lista;
  }, [motoristas, filtro, busca]);

  useEffect(() => {
    const rotaIds = motoristas
      .filter((m) => m.em_viagem && m.rota_id)
      .map((m) => m.rota_id!)
      .filter((id, i, arr) => arr.indexOf(id) === i);

    if (rotaIds.length === 0) return;

    const faltantes = rotaIds.filter((id) => !rotasVisualizadas[id]);
    if (faltantes.length === 0) return;

    const carregarRotas = async () => {
      const { data } = await supabase
        .from("rotas")
        .select("id, pontos_snap")
        .in("id", faltantes);

      if (data) {
        setRotasVisualizadas((prev) => {
          const novo = { ...prev };
          data.forEach((r: any) => {
            novo[r.id] = r.pontos_snap || [];
          });
          return novo;
        });
      }
    };

    carregarRotas();
  }, [motoristas, rotasVisualizadas]);

  const normalizarPontos = useCallback((lista: any[]): [number, number][] => {
    if (!Array.isArray(lista)) return [];
    return lista
      .map((p) => {
        if (Array.isArray(p))
          return [Number(p[0]), Number(p[1])] as [number, number];
        if (p?.latitude !== undefined)
          return [Number(p.latitude), Number(p.longitude)] as [number, number];
        if (p?.lat !== undefined)
          return [Number(p.lat), Number(p.lng)] as [number, number];
        return null;
      })
      .filter((p): p is [number, number] => p !== null);
  }, []);

  const motoristasOnline = useMemo(
    () => motoristas.filter((m) => m.realmente_online),
    [motoristas]
  );

  const rotasEmViagem = useMemo(
    () =>
      motoristas.filter(
        (m) => m.em_viagem && m.rota_id && rotasVisualizadas[m.rota_id]
      ),
    [motoristas, rotasVisualizadas]
  );

  const PAINEL_WIDTH = 380;
  const MARGIN = 16;

  return (
    <>
      <style>{cssAnimacao}</style>

      <div
        className="relative w-full flex gap-4"
        style={{ height: "calc(100vh - 120px)", padding: `${MARGIN}px` }}
      >
        {/* ===== SIDEBAR DARK ===== */}
        <div
          style={{
            width: painelAberto ? `${PAINEL_WIDTH}px` : "56px",
            minWidth: painelAberto ? `${PAINEL_WIDTH}px` : "56px",
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
          className="relative bg-[#09152E] rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 flex-shrink-0">
            {painelAberto ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Radio
                      className="w-5 h-5 text-blue-400"
                      strokeWidth={2.2}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white leading-tight">
                      Ao Vivo
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[11px] text-slate-400 font-semibold">
                        Tempo real
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={recarregar}
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    title="Atualizar"
                  >
                    <RefreshCw className="w-4 h-4" strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => setPainelAberto(false)}
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    title="Fechar painel"
                  >
                    <PanelLeftClose className="w-4 h-4" strokeWidth={2.2} />
                  </button>
                </div>
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
              {/* STATS */}
              <div className="px-4 py-4 border-b border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Resumo
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <StatMini
                    value={stats.emViagem}
                    label="Em viagem"
                    color="text-green-400"
                  />
                  <div className="border-x border-slate-800">
                    <StatMini
                      value={stats.online}
                      label="Online"
                      color="text-blue-400"
                    />
                  </div>
                  <StatMini
                    value={stats.offline}
                    label="Offline"
                    color="text-slate-500"
                  />
                </div>
              </div>

              {/* FILTROS */}
              <div className="px-4 py-4 border-b border-slate-800 space-y-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Filtrar
                </p>

                {/* Busca dark */}
                <div className="relative">
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar motorista..."
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

                {/* Tabs dark */}
                <div className="flex gap-1">
                  {[
                    { v: "todos" as Filtro, l: "Todos" },
                    { v: "em_viagem" as Filtro, l: "Viagem" },
                    { v: "online" as Filtro, l: "Online" },
                    { v: "offline" as Filtro, l: "Offline" },
                  ].map((f) => (
                    <button
                      key={f.v}
                      onClick={() => setFiltro(f.v)}
                      className={`btn-press flex-1 py-1.5 rounded-md text-[10px] font-bold transition ${
                        filtro === f.v
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* LISTA */}
              <div className="px-4 py-4 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Motoristas ({motoristasFiltrados.length})
                </p>

                {loading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="skeleton h-20 bg-slate-800/60 rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {!loading && motoristasFiltrados.length === 0 && (
                  <div className="fade-in text-center py-10 px-4">
                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <WifiOff
                        className="w-7 h-7 text-slate-500"
                        strokeWidth={1.8}
                      />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">
                      {motoristas.length === 0
                        ? "Ninguém online"
                        : "Nenhum motorista encontrado"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {motoristas.length === 0
                        ? "Quando um motorista fizer login, aparecerá aqui."
                        : "Ajuste os filtros para ver mais."}
                    </p>
                  </div>
                )}

                {motoristasFiltrados.map((m) => (
                  <CardMotoristaAoVivo
                    key={m.motorista_id}
                    motorista={m}
                    selecionado={motoristaSelecionadoId === m.motorista_id}
                    onClick={() =>
                      setMotoristaSelecionadoId(
                        motoristaSelecionadoId === m.motorista_id
                          ? null
                          : m.motorista_id
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== MAPA ===== */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          <MapContainer
            center={[-23.55, -46.63]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <AjustarBounds motoristas={motoristasOnline} />
            <SeguirMotorista motorista={motoristaSelecionado} />

            {/* Rotas dos motoristas em viagem */}
            {rotasEmViagem.map((m) => {
              const pontos = normalizarPontos(rotasVisualizadas[m.rota_id!]);
              if (pontos.length === 0) return null;
              return (
                <Polyline
                  key={`rota-${m.motorista_id}`}
                  positions={pontos}
                  pathOptions={{
                    color: m.rota_cor || "#3B82F6",
                    weight:
                      motoristaSelecionadoId === m.motorista_id ? 6 : 4,
                    opacity:
                      motoristaSelecionadoId === m.motorista_id ? 1 : 0.5,
                  }}
                />
              );
            })}

            {/* Marcadores */}
            {motoristasOnline.map((m) => (
              <MarcadorMotoristaOtimizado
                key={m.motorista_id}
                motorista={m}
                onSelect={() => setMotoristaSelecionadoId(m.motorista_id)}
              />
            ))}
          </MapContainer>

          {/* Legenda flutuante */}
          <div className="fade-in absolute bottom-4 left-4 bg-[#09152E]/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800 p-3 text-xs z-[400]">
            <p className="font-bold text-slate-300 mb-2 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-blue-400" strokeWidth={2.2} />
              Legenda
            </p>
            <div className="space-y-1.5">
              <LegendaItem
                dot="bg-green-500"
                label="Em viagem"
                pulse
              />
              <LegendaItem dot="bg-slate-400" label="Online / Parado" />
              <LegendaItem dot="bg-slate-600" label="Offline" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================
   SUB-COMPONENTES
========================= */
function StatMini({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500 uppercase font-bold mt-1.5">
        {label}
      </p>
    </div>
  );
}

function LegendaItem({
  dot,
  label,
  pulse,
}: {
  dot: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`}
      />
      <span className="text-slate-300">{label}</span>
    </div>
  );
}