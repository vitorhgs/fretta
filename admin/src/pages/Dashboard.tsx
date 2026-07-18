import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Motorista, Veiculo } from "../types/database";
import { formatarData } from "../lib/formatters";

interface RotaResumo {
  id: string;
  nome: string;
  cor: string;
  pontos_snap: LatLngExpression[];
  distancia_km: number;
  duracao_min: number;
  categoria?: string;
  turno?: string;
  horario_saida?: string;
  created_at: string;
}

interface Alerta {
  id: string;
  tipo: "cnh" | "licenciamento" | "seguro";
  titulo: string;
  descricao: string;
  urgencia: "vencido" | "proximo";
  link: string;
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

function saudacao(): { texto: string; emoji: string } {
  const hora = new Date().getHours();
  if (hora < 12) return { texto: "Bom dia", emoji: "☀️" };
  if (hora < 18) return { texto: "Boa tarde", emoji: "🌤️" };
  return { texto: "Boa noite", emoji: "🌙" };
}

function dataFormatada(): string {
  const dias = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado",
  ];
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const d = new Date();
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function diasAte(data?: string): number {
  if (!data) return Infinity;
  return Math.floor(
    (new Date(data).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

/* =========================
   COMPONENTE FITBOUNDS + REF DO MAPA
========================= */
function FitBounds({
  bounds,
  trigger,
}: {
  bounds: L.LatLngBounds | null;
  trigger: number;
}) {
  const map = useMap();
  useEffect(() => {
    (window as any).__dashboardMap = map;
    if (bounds) {
      try {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      } catch (e) {
        console.error(e);
      }
    }
  }, [trigger]);
  return null;
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [rotas, setRotas] = useState<RotaResumo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [pinsAtivos, setPinsAtivos] = useState(0);
  const [loading, setLoading] = useState(true);

  const primeiroNome = usuario?.nome?.split(" ")[0] || "Usuário";
  const sauda = saudacao();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [rotasRes, motoristasRes, veiculosRes, pinsRes] = await Promise.all([
        supabase
          .from("rotas")
          .select(
            "id, nome, cor, pontos_snap, distancia_km, duracao_min, categoria, turno, horario_saida, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase.from("motoristas").select("*"),
        supabase.from("veiculos").select("*"),
        supabase
          .from("pins_autorizacao")
          .select("id", { count: "exact" })
          .eq("status", "ativo"),
      ]);

      if (rotasRes.data) {
        const rotasNormalizadas = rotasRes.data.map((r: any) => ({
          ...r,
          pontos_snap: normalizarLista(r.pontos_snap),
          distancia_km: Number(r.distancia_km) || 0,
          duracao_min: Number(r.duracao_min) || 0,
        }));
        setRotas(rotasNormalizadas);
      }
      if (motoristasRes.data) setMotoristas(motoristasRes.data);
      if (veiculosRes.data) setVeiculos(veiculosRes.data);
      setPinsAtivos(pinsRes.count || 0);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      rotas: rotas.length,
      motoristasAtivos: motoristas.filter((m) => m.ativo).length,
      motoristasTotal: motoristas.length,
      veiculosAtivos: veiculos.filter((v) => v.status === "ativo").length,
      veiculosTotal: veiculos.length,
      pinsAtivos,
    }),
    [rotas, motoristas, veiculos, pinsAtivos]
  );

  const alertas = useMemo(() => {
    const lista: Alerta[] = [];

    motoristas.forEach((m) => {
      if (!m.ativo || !m.validade_cnh) return;
      const dias = diasAte(m.validade_cnh);
      if (dias < 0) {
        lista.push({
          id: `cnh-${m.id}`,
          tipo: "cnh",
          titulo: `CNH de ${m.nome} vencida`,
          descricao: `Venceu em ${formatarData(m.validade_cnh)}`,
          urgencia: "vencido",
          link: "/motoristas",
        });
      } else if (dias <= 30) {
        lista.push({
          id: `cnh-${m.id}`,
          tipo: "cnh",
          titulo: `CNH de ${m.nome} vence em ${dias} dias`,
          descricao: `Vencimento: ${formatarData(m.validade_cnh)}`,
          urgencia: "proximo",
          link: "/motoristas",
        });
      }
    });

    veiculos.forEach((v) => {
      if (v.status === "inativo") return;
      if (v.vencimento_licenciamento) {
        const dias = diasAte(v.vencimento_licenciamento);
        if (dias < 0) {
          lista.push({
            id: `lic-${v.id}`,
            tipo: "licenciamento",
            titulo: `Licenciamento de ${v.placa} vencido`,
            descricao: `Venceu em ${formatarData(v.vencimento_licenciamento)}`,
            urgencia: "vencido",
            link: "/veiculos",
          });
        } else if (dias <= 30) {
          lista.push({
            id: `lic-${v.id}`,
            tipo: "licenciamento",
            titulo: `Licenciamento de ${v.placa} vence em ${dias} dias`,
            descricao: `Vencimento: ${formatarData(v.vencimento_licenciamento)}`,
            urgencia: "proximo",
            link: "/veiculos",
          });
        }
      }
      if (v.vencimento_seguro) {
        const dias = diasAte(v.vencimento_seguro);
        if (dias < 0) {
          lista.push({
            id: `seg-${v.id}`,
            tipo: "seguro",
            titulo: `Seguro de ${v.placa} vencido`,
            descricao: `Venceu em ${formatarData(v.vencimento_seguro)}`,
            urgencia: "vencido",
            link: "/veiculos",
          });
        } else if (dias <= 30) {
          lista.push({
            id: `seg-${v.id}`,
            tipo: "seguro",
            titulo: `Seguro de ${v.placa} vence em ${dias} dias`,
            descricao: `Vencimento: ${formatarData(v.vencimento_seguro)}`,
            urgencia: "proximo",
            link: "/veiculos",
          });
        }
      }
    });

    return lista.sort((a, b) => {
      if (a.urgencia === "vencido" && b.urgencia !== "vencido") return -1;
      if (a.urgencia !== "vencido" && b.urgencia === "vencido") return 1;
      return 0;
    });
  }, [motoristas, veiculos]);

  const ultimasRotas = useMemo(() => rotas.slice(0, 5), [rotas]);

  const boundsMapa = useMemo(() => {
    if (rotas.length === 0) return null;
    const todosPontos: LatLngExpression[] = [];
    rotas.forEach((r) => {
      r.pontos_snap.forEach((p) => todosPontos.push(p));
    });
    if (todosPontos.length === 0) return null;
    return L.latLngBounds(todosPontos as any);
  }, [rotas]);

  // 🆕 Função de centralizar (botão)
  const centralizarMapa = () => {
    const map = (window as any).__dashboardMap;
    if (!map) return;
    if (boundsMapa) {
      map.flyToBounds(boundsMapa, { padding: [30, 30], maxZoom: 14, duration: 1 });
    } else {
      map.flyTo([-23.55, -46.63], 12, { duration: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* SAUDAÇÃO */}
      <div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-slate-800">
            {sauda.texto}, {primeiroNome} {sauda.emoji}
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 capitalize">
          {dataFormatada()}
        </p>
      </div>

      {/* CARDS DE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LINHAS */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition cursor-pointer group"
          onClick={() => navigate("/rotas")}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                LINHAS
              </p>
              <p className="text-4xl font-black text-slate-800 mt-2">0</p>
              <p className="text-xs text-slate-500 mt-1">Em breve</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* ROTAS */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition cursor-pointer group"
          onClick={() => navigate("/rotas")}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ROTAS
              </p>
              <p className="text-4xl font-black text-slate-800 mt-2">
                {loading ? "..." : stats.rotas}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.rotas === 1 ? "cadastrada" : "cadastradas"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* MOTORISTAS */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition cursor-pointer group"
          onClick={() => navigate("/motoristas")}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MOTORISTAS
              </p>
              <p className="text-4xl font-black text-slate-800 mt-2">
                {loading ? "..." : stats.motoristasAtivos}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.motoristasTotal > stats.motoristasAtivos
                  ? `${stats.motoristasAtivos} ativos de ${stats.motoristasTotal}`
                  : "ativos"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* VEÍCULOS */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition cursor-pointer group"
          onClick={() => navigate("/veiculos")}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                VEÍCULOS
              </p>
              <p className="text-4xl font-black text-slate-800 mt-2">
                {loading ? "..." : stats.veiculosAtivos}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.veiculosTotal > stats.veiculosAtivos
                  ? `${stats.veiculosAtivos} ativos de ${stats.veiculosTotal}`
                  : "ativos"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-red-50">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <h2 className="font-bold text-slate-800">
                  {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"} de documentos
                </h2>
                <p className="text-xs text-slate-500">
                  Documentos vencidos ou próximos do vencimento
                </p>
              </div>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {alertas.slice(0, 5).map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(a.link)}
                className="px-6 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3 group"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    a.urgencia === "vencido" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${a.urgencia === "vencido" ? "text-red-700" : "text-amber-700"}`}>
                    {a.tipo === "cnh" ? "🪪" : a.tipo === "licenciamento" ? "📋" : "🛡️"} {a.titulo}
                  </p>
                  <p className="text-xs text-slate-500">{a.descricao}</p>
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 transition">→</span>
              </div>
            ))}
            {alertas.length > 5 && (
              <div className="px-6 py-3 text-center text-xs text-slate-500 bg-slate-50">
                +{alertas.length - 5} {alertas.length - 5 === 1 ? "outro alerta" : "outros alertas"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAPA + LATERAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAPA */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Mapa da operação</h2>
              <p className="text-xs text-slate-500">
                {rotas.length > 0
                  ? `${rotas.length} ${rotas.length === 1 ? "rota" : "rotas"} cadastrada${rotas.length === 1 ? "" : "s"}`
                  : "Nenhuma rota cadastrada ainda"}
              </p>
            </div>

            {/* 🆕 Botão centralizar */}
            <button
              onClick={centralizarMapa}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-semibold transition active:scale-95 flex items-center gap-1.5"
              title="Centralizar mapa"
            >
              🎯 Centralizar
            </button>
          </div>
          <div className="h-[400px] relative">
            <MapContainer
              center={[-23.55, -46.63]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              key={rotas.length}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {rotas.map((r) => {
                if (r.pontos_snap.length === 0) return null;
                return (
                  <Polyline
                    key={r.id}
                    positions={r.pontos_snap}
                    pathOptions={{ color: r.cor, weight: 5, opacity: 0.8 }}
                  />
                );
              })}
              <FitBounds bounds={boundsMapa} trigger={rotas.length} />
            </MapContainer>
          </div>
          <div className="px-6 py-3 border-t">
            <button
              onClick={() => navigate("/rotas")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Ver no mapa completo →
            </button>
          </div>
        </div>

        {/* LATERAL - Últimas rotas */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b">
            <h2 className="font-bold text-slate-800">Rotas recentes</h2>
            <p className="text-xs text-slate-500">Últimas cadastradas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {ultimasRotas.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-sm text-slate-500">Nenhuma rota cadastrada</p>
                <button
                  onClick={() => navigate("/rotas")}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Cadastrar primeira rota →
                </button>
              </div>
            )}
            {ultimasRotas.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate("/rotas")}
                className="px-6 py-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: r.cor }}
                      />
                      <p className="font-bold text-slate-800 truncate">{r.nome}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {r.categoria && `${r.categoria} · `}
                      {r.horario_saida && `${r.horario_saida} · `}
                      {r.distancia_km.toFixed(1)} km
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    Cadastrada
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t">
            <button
              onClick={() => navigate("/rotas")}
              className="w-full bg-[#1E56D4] hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition active:scale-95"
            >
              Ver todas as rotas
            </button>
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="mb-4">
          <h2 className="font-bold text-slate-800">Ações rápidas</h2>
          <p className="text-xs text-slate-500">Atalhos para o que você mais faz</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/rotas")}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition group active:scale-95"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl group-hover:scale-110 transition">
              📍
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Nova Rota</p>
              <p className="text-[10px] text-slate-500">Criar no mapa</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/motoristas")}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition group active:scale-95"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl group-hover:scale-110 transition">
              👤
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Motorista</p>
              <p className="text-[10px] text-slate-500">Cadastrar</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/veiculos")}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition group active:scale-95"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-xl group-hover:scale-110 transition">
              🚌
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Veículo</p>
              <p className="text-[10px] text-slate-500">Cadastrar</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/pins")}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition group active:scale-95"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl group-hover:scale-110 transition">
              🔑
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Gerar PIN</p>
              <p className="text-[10px] text-slate-500">{stats.pinsAtivos} ativos</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}