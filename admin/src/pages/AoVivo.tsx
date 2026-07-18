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
`;

/* Componente que segue um motorista quando selecionado */
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

/* Ajusta bounds inicial */
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

/* ✨ Marcador otimizado — só re-renderiza se posição ou heading mudar */
function MarcadorMotoristaOtimizado({
  motorista,
  onSelect,
}: {
  motorista: MotoristaAoVivo;
  onSelect: () => void;
}) {
  // Só recria o ícone se dados visuais mudaram
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
          <p className="font-bold text-sm mb-1 text-slate-800">
            {motorista.motorista_nome}
          </p>
          {motorista.em_viagem && motorista.rota_nome && (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: motorista.rota_cor || "#3B82F6" }}
                />
                <p className="text-slate-700 font-semibold">
                  {motorista.rota_nome}
                </p>
              </div>
              <p className="text-slate-600">
                <strong>{motorista.paradas_concluidas}</strong>/
                {motorista.paradas_totais} paradas
              </p>
              <p className="text-slate-600">
                <strong>{Math.round(motorista.velocidade_kmh)}</strong> km/h
              </p>
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

export default function AoVivo() {
  const { motoristas, loading, stats, recarregar } = useMotoristasAoVivo();
  const [motoristaSelecionadoId, setMotoristaSelecionadoId] = useState<
    string | null
  >(null);
  const [filtro, setFiltro] = useState<
    "todos" | "em_viagem" | "online" | "offline"
  >("todos");
  const [busca, setBusca] = useState("");
  const [rotasVisualizadas, setRotasVisualizadas] = useState<
    Record<string, any[]>
  >({});

  // ✨ Motorista selecionado sempre pega a versão mais recente
  const motoristaSelecionado = useMemo(
    () =>
      motoristaSelecionadoId
        ? motoristas.find((m) => m.motorista_id === motoristaSelecionadoId) ||
          null
        : null,
    [motoristas, motoristaSelecionadoId]
  );

  // Filtra motoristas
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

  // Carrega os pontos das rotas em viagem
  useEffect(() => {
    const rotaIds = motoristas
      .filter((m) => m.em_viagem && m.rota_id)
      .map((m) => m.rota_id!)
      .filter((id, i, arr) => arr.indexOf(id) === i);

    if (rotaIds.length === 0) return;

    // Só busca as rotas que ainda não temos
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

  // Só motoristas online — evita re-render dos marcadores
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

  return (
    <>
      <style>{cssAnimacao}</style>

      <div
        className="flex gap-4 w-full"
        style={{ height: "calc(100vh - 120px)", padding: "16px" }}
      >
        {/* SIDEBAR */}
        <div className="w-[380px] flex-shrink-0 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b bg-gradient-to-br from-slate-50 to-blue-50/50">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-800">Ao Vivo</h2>
              <button
                onClick={recarregar}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                title="Recarregar"
              >
                ↻ atualizar
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[11px] text-slate-500 font-semibold">
                Atualizando em tempo real
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 py-3 border-b grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-2xl font-black text-green-600 leading-none">
                {stats.emViagem}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">
                Em viagem
              </p>
            </div>
            <div className="text-center border-x border-slate-200">
              <p className="text-2xl font-black text-blue-600 leading-none">
                {stats.online}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">
                Online
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-400 leading-none">
                {stats.offline}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">
                Offline
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-5 py-3 border-b space-y-2">
            <input
              type="text"
              placeholder="Buscar motorista..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {[
                { v: "todos" as const, l: "Todos" },
                { v: "em_viagem" as const, l: "Viagem" },
                { v: "online" as const, l: "Online" },
                { v: "offline" as const, l: "Offline" },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFiltro(f.v)}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition ${
                    filtro === f.v
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading && (
              <div className="text-center py-10">
                <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 mt-2">Carregando...</p>
              </div>
            )}

            {!loading && motoristasFiltrados.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="text-4xl mb-2">📡</div>
                <p className="text-sm font-bold text-slate-700">
                  {motoristas.length === 0
                    ? "Ninguém online"
                    : "Nenhum motorista encontrado"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {motoristas.length === 0
                    ? "Quando um motorista fizer login, ele aparece aqui"
                    : "Ajuste os filtros pra ver mais"}
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

        {/* MAPA */}
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

            {/* Marcadores dos motoristas */}
            {motoristasOnline.map((m) => (
              <MarcadorMotoristaOtimizado
                key={m.motorista_id}
                motorista={m}
                onSelect={() => setMotoristaSelecionadoId(m.motorista_id)}
              />
            ))}
          </MapContainer>

          {/* Legenda flutuante */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 p-3 text-xs z-[400]">
            <p className="font-bold text-slate-700 mb-2 text-[10px] uppercase tracking-wider">
              Legenda
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-slate-600">Em viagem</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-slate-600">Online / Parado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-slate-600">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}