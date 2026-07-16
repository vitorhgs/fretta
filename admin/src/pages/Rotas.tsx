import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import { supabase } from "../supabase";

/* =========================
   TIPOS
========================= */

interface RotaSalva {
  id: string;
  nome: string;
  pontos_originais: LatLngExpression[];
  pontos_snap: LatLngExpression[];
  distancia_km: number;
  duracao_min: number;
  cor: string;
}

/* =========================
   CONFIG
========================= */

const coresDisponiveis = ["#3B82F6", "#22C55E", "#A855F7", "#F59E0B"];

/* =========================
   ÍCONES
========================= */

function criarIconeInicio() {
  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        background:#3B82F6;
        width:18px;
        height:18px;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 0 0 2px #3B82F6;
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function criarIconeFim() {
  return new L.DivIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <line x1="4" y1="2" x2="4" y2="26" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
          <rect x="4"  y="2"  width="5" height="5" fill="black"/>
          <rect x="9"  y="2"  width="5" height="5" fill="white" stroke="#ccc" stroke-width="0.3"/>
          <rect x="14" y="2"  width="5" height="5" fill="black"/>
          <rect x="19" y="2"  width="5" height="5" fill="white" stroke="#ccc" stroke-width="0.3"/>
          <rect x="4"  y="7"  width="5" height="5" fill="white" stroke="#ccc" stroke-width="0.3"/>
          <rect x="9"  y="7"  width="5" height="5" fill="black"/>
          <rect x="14" y="7"  width="5" height="5" fill="white" stroke="#ccc" stroke-width="0.3"/>
          <rect x="19" y="7"  width="5" height="5" fill="black"/>
          <rect x="4"  y="12" width="5" height="5" fill="black"/>
          <rect x="9"  y="12" width="5" height="5" fill="white" stroke="#ccc" stroke-width="0.3"/>
          <rect x="14" y="12" width="5" height="5" fill="black"/>
          <rect x="19" y="12" width="5" height="5" fill="white" stroke="#ccc" stroke-width="0.3"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [4, 26],
  });
}

function criarMarcadorNumerado(numero: number) {
  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        background:#3B82F6;
        width:24px;
        height:24px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-weight:600;
        font-size:11px;
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);
      ">
        ${numero}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const inicioIconSingleton = criarIconeInicio();
const fimIconSingleton = criarIconeFim();

/* =========================
   CENTRALIZAR MAPA
========================= */

function FitBounds({ rota }: { rota: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (rota.length > 0) {
      const bounds = L.latLngBounds(rota as any);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [rota]);
  return null;
}

/* =========================
   CLICK HANDLER
========================= */

function MapClickHandler({
  onAddPoint,
}: {
  onAddPoint: (point: LatLngExpression) => void;
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
  const [rotaSelecionada, setRotaSelecionada] = useState<RotaSalva | null>(null);
  const [indiceAnimacao, setIndiceAnimacao] = useState(0);
  const [nomeRota, setNomeRota] = useState("");
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [distancia, setDistancia] = useState<number>(0);
  const [duracao, setDuracao] = useState<number>(0);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");
  const [painelAberto, setPainelAberto] = useState(true);

  const intervalRef = useRef<number | null>(null);
  const rotaCompletaRef = useRef<LatLngExpression[]>([]);
  const indiceAnimacaoRef = useRef(0);

  useEffect(() => {
    carregarRotas();
  }, []);

  useEffect(() => {
    if (pontos.length >= 2) {
      snapAutomatico();
    } else if (pontos.length < 2) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRotaAtual([]);
      setIndiceAnimacao(0);
      indiceAnimacaoRef.current = 0;
      rotaCompletaRef.current = [];
      setDistancia(0);
      setDuracao(0);
    }
  }, [pontos]);

  const carregarRotas = async () => {
    const { data } = await supabase
      .from("rotas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRotas(data as RotaSalva[]);
  };

  const adicionarPonto = (p: LatLngExpression) => {
    setRotaSelecionada(null);
    setPontos((prev) => [...prev, p]);
  };

  const desfazer = () => {
    setPontos((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  };

  const limpar = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPontos([]);
    setRotaAtual([]);
    setIndiceAnimacao(0);
    indiceAnimacaoRef.current = 0;
    rotaCompletaRef.current = [];
    setDistancia(0);
    setDuracao(0);
    setRotaSelecionada(null);
    setNomeRota("");
  };

  const snapAutomatico = async () => {
    const coords = pontos.map((p: any) => [p[1], p[0]]);
    try {
      const response = await fetch("http://localhost:3001/rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: coords }),
      });
      const data = await response.json();
      if (!data.routes) return;

      const geometry = data.routes[0].geometry.coordinates;
      const summary = data.routes[0];
      const novaRota: LatLngExpression[] = geometry.map(
        (c: number[]) => [c[1], c[0]]
      );

      setDistancia(summary.distance / 1000);
      setDuracao(summary.duration / 60);
      animarRotaIncremental(novaRota);
    } catch (err) {
      console.error("Erro ao calcular rota:", err);
    }
  };

  const animarRotaIncremental = (novaRota: LatLngExpression[]) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const rotaAnterior = rotaCompletaRef.current;
    rotaCompletaRef.current = novaRota;

    let pontoInicio = 0;
    if (rotaAnterior.length > 0 && novaRota.length > 0) {
      const proporcaoAnterior =
        indiceAnimacaoRef.current / Math.max(rotaAnterior.length, 1);

      if (novaRota.length < rotaAnterior.length) {
        pontoInicio = Math.floor(proporcaoAnterior * novaRota.length);
        if (pontoInicio >= novaRota.length) {
          pontoInicio = Math.max(0, novaRota.length - 1);
        }
      } else {
        pontoInicio = Math.min(
          indiceAnimacaoRef.current,
          novaRota.length - 1
        );
      }
    }

    setRotaAtual(novaRota);
    setIndiceAnimacao(pontoInicio);
    indiceAnimacaoRef.current = pontoInicio;

    let i = pontoInicio;
    intervalRef.current = window.setInterval(() => {
      if (i >= novaRota.length) {
        clearInterval(intervalRef.current!);
        return;
      }
      indiceAnimacaoRef.current = i;
      setIndiceAnimacao(i);
      i++;
    }, 40);
  };

  const animarRotaCompleta = (rota: LatLngExpression[]) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    rotaCompletaRef.current = rota;
    setRotaAtual(rota);
    setIndiceAnimacao(0);
    indiceAnimacaoRef.current = 0;

    let i = 0;
    intervalRef.current = window.setInterval(() => {
      if (i >= rota.length) {
        clearInterval(intervalRef.current!);
        return;
      }
      indiceAnimacaoRef.current = i;
      setIndiceAnimacao(i);
      i++;
    }, 40);
  };

  const salvar = async () => {
    if (!nomeRota || rotaAtual.length === 0) return;
    const cor = coresDisponiveis[rotas.length % coresDisponiveis.length];
    await supabase.from("rotas").insert([
      {
        nome: nomeRota,
        distancia_km: distancia,
        duracao_min: duracao,
        pontos_originais: pontos,
        pontos_snap: rotaAtual,
        cor,
      },
    ]);

    setNomeRota("");
    setPontos([]);
    setRotaAtual([]);
    setIndiceAnimacao(0);
    indiceAnimacaoRef.current = 0;
    rotaCompletaRef.current = [];
    setDistancia(0);
    setDuracao(0);
    carregarRotas();
  };

  const selecionarRota = (rota: RotaSalva) => {
    setRotaSelecionada(rota);
    setDistancia(rota.distancia_km);
    setDuracao(rota.duracao_min);
    animarRotaCompleta(rota.pontos_snap);
  };

  const excluirRota = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("rotas").delete().eq("id", id);
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
    setNomeRota(rota.nome);
    setMenuAberto(null);
    await supabase.from("rotas").delete().eq("id", rota.id);
    if (rotaSelecionada?.id === rota.id) setRotaSelecionada(null);
    carregarRotas();
  };

  /* Dimensões */
  const PAINEL_WIDTH = 340;
  const GAP = 16; // espaço entre painel e mapa
  const MARGIN = 16; // margem lateral e vertical

  /* =========================
     RENDER
  ========================= */

  return (
    <div
      className="relative w-full flex gap-4"
      style={{ height: "calc(100vh - 120px)", padding: `${MARGIN}px` }}
    >

      {/* ===== PAINEL LATERAL (azul escuro) ===== */}
      <div
        style={{
          width: painelAberto ? `${PAINEL_WIDTH}px` : "56px",
          minWidth: painelAberto ? `${PAINEL_WIDTH}px` : "56px",
          transition:
            "width 0.35s cubic-bezier(0.4,0,0.2,1), min-width 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
        className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden"
      >
        {/* Header do painel */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          {painelAberto ? (
            <>
              <div>
                <h2 className="text-base font-bold text-white">Rotas</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie suas linhas
                </p>
              </div>
              <button
                onClick={() => setPainelAberto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                title="Minimizar painel"
              >
                {/* Ícone recolher */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="9" y1="4" x2="9" y2="20" />
                  <polyline points="15 10 13 12 15 14" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => setPainelAberto(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition mx-auto"
              title="Expandir painel"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="9" y1="4" x2="9" y2="20" />
                <polyline points="13 10 15 12 13 14" />
              </svg>
            </button>
          )}
        </div>

        {/* Conteúdo (só aparece quando aberto) */}
        {painelAberto && (
          <div className="flex-1 overflow-y-auto">
            {/* Nova Rota */}
            <div className="px-4 py-4 border-b border-slate-800 space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Nova Rota
              </p>

              <div className="flex gap-2">
                <button
                  onClick={desfazer}
                  disabled={pontos.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <span>↩</span> Desfazer
                </button>
                <button
                  onClick={limpar}
                  disabled={pontos.length === 0 && !rotaSelecionada}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-red-900/50 bg-red-950/40 text-red-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-900/40 hover:border-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <span>✕</span> Limpar
                </button>
              </div>

              <input
                type="text"
                placeholder="Nome da linha"
                value={nomeRota}
                onChange={(e) => setNomeRota(e.target.value)}
                className="border border-slate-700 bg-slate-800 text-white placeholder-slate-500 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <button
                onClick={salvar}
                disabled={!nomeRota || rotaAtual.length === 0}
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Salvar Rota
              </button>

              {pontos.length > 0 && (
                <p className="text-xs text-slate-400 text-center">
                  {pontos.length} ponto{pontos.length !== 1 ? "s" : ""} marcado
                  {pontos.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Rotas Salvas */}
            <div className="px-4 py-4 space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Rotas Salvas
              </p>

              {rotas.length === 0 && (
                <p className="text-slate-500 text-sm py-4 text-center">
                  Nenhuma rota salva ainda.
                </p>
              )}

              {rotas.map((rota) => (
                <div
                  key={rota.id}
                  onClick={() => selecionarRota(rota)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    rotaSelecionada?.id === rota.id
                      ? "border-blue-500 bg-blue-950/40 shadow-sm"
                      : "bg-slate-800/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                  }`}
                >
                  {editandoId === rota.id ? (
                    <div
                      className="flex gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                      <button
                        onClick={() => salvarEdicao(rota.id)}
                        className="bg-blue-600 text-white px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-blue-500 transition"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="border border-slate-600 text-slate-300 px-2.5 py-1.5 rounded-md text-xs hover:bg-slate-700 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: rota.cor }}
                          />
                          <p className="font-semibold text-sm text-white truncate">
                            {rota.nome}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {rota.pontos_originais.length} parada
                          {rota.pontos_originais.length !== 1 ? "s" : ""}
                          {" · "}
                          {rota.distancia_km.toFixed(1)} km
                          {" · "}
                          {rota.duracao_min.toFixed(0)} min
                        </p>
                      </div>

                      <div
                        className="relative flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setMenuAberto(
                              menuAberto === rota.id ? null : rota.id
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition text-base leading-none"
                        >
                          ⋮
                        </button>

                        {menuAberto === rota.id && (
                          <div className="absolute right-0 top-8 z-[600] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                            <button
                              onClick={() => selecionarRota(rota)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                            >
                              <span>👁</span> Visualizar
                            </button>
                            <button
                              onClick={(e) => editarRota(rota, e)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                            >
                              <span>✏️</span> Editar Rota
                            </button>
                            <button
                              onClick={(e) => iniciarEdicao(rota, e)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                            >
                              <span>🏷️</span> Renomear
                            </button>
                            <div className="border-t border-slate-100" />
                            <button
                              onClick={(e) => excluirRota(rota.id, e)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                              <span>🗑️</span> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== ÁREA DO MAPA ===== */}
      <div className="flex-1 relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
        <MapContainer
          center={[-23.55, -46.63]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapClickHandler onAddPoint={adicionarPonto} />

          {rotaAtual.length > 0 && !rotaSelecionada && (
            <Polyline
              positions={rotaAtual.slice(0, indiceAnimacao)}
              pathOptions={{ color: "#3B82F6", weight: 6 }}
            />
          )}

          {rotas.map((rota) => (
            <Polyline
              key={rota.id}
              positions={
                rotaSelecionada?.id === rota.id
                  ? rotaAtual.slice(0, indiceAnimacao)
                  : rota.pontos_snap
              }
              pathOptions={{
                color: rota.cor,
                weight: rotaSelecionada?.id === rota.id ? 8 : 5,
                opacity: rotaSelecionada?.id === rota.id ? 1 : 0.6,
              }}
            >
              {rotaSelecionada?.id === rota.id && (
                <Tooltip permanent direction="center">
                  <span style={{ fontWeight: 700 }}>{rota.nome}</span>
                </Tooltip>
              )}
              {rotaSelecionada?.id === rota.id && (
                <FitBounds rota={rota.pontos_snap} />
              )}
            </Polyline>
          ))}

          {pontos.map((p, i) => (
            <Marker
              key={i}
              position={p}
              icon={
                i === 0
                  ? inicioIconSingleton
                  : i === pontos.length - 1
                  ? fimIconSingleton
                  : criarMarcadorNumerado(i)
              }
            />
          ))}

          {rotaSelecionada &&
            rotaSelecionada.pontos_originais.map((p, i) => (
              <Marker
                key={`sel-${i}`}
                position={p}
                icon={
                  i === 0
                    ? inicioIconSingleton
                    : i === rotaSelecionada.pontos_originais.length - 1
                    ? fimIconSingleton
                    : criarMarcadorNumerado(i)
                }
              />
            ))}
        </MapContainer>

        {/* INFO DISTÂNCIA E TEMPO (topo do mapa) */}
        {(distancia > 0 || duracao > 0) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] flex gap-3">
            <div className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg rounded-2xl px-5 py-3 flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide leading-tight">
                  Distância
                </p>
                <p className="text-lg font-bold text-blue-700 leading-tight">
                  {distancia.toFixed(2)} km
                </p>
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg rounded-2xl px-5 py-3 flex items-center gap-2">
              <span className="text-2xl">⏱</span>
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide leading-tight">
                  Tempo Estimado
                </p>
                <p className="text-lg font-bold text-blue-700 leading-tight">
                  {duracao.toFixed(0)} min
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay para fechar menu ⋮ */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-[400]"
          onClick={() => setMenuAberto(null)}
        />
      )}
    </div>
  );
}

export default Rotas;