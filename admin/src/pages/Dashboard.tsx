import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Route,
  Map as MapIcon,
  Users,
  Truck,
  AlertTriangle,
  ChevronRight,
  Crosshair,
  MapPin,
  IdCard,
  FileText,
  Shield,
  UserPlus,
  Bus,
  KeyRound,
  Sun,
  Moon,
  Sunrise,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Motorista, Veiculo } from "../types/database";
import { formatarData } from "../lib/formatters";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { EmptyState } from "../components/ui/EmptyState";

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

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return { texto: "Bom dia", Icon: Sunrise };
  if (hora < 18) return { texto: "Boa tarde", Icon: Sun };
  return { texto: "Boa noite", Icon: Moon };
}

function dataFormatada(): string {
  const dias = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
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

const ICON_ALERTA = {
  cnh: IdCard,
  licenciamento: FileText,
  seguro: Shield,
};

/* =========================
   FIT BOUNDS
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
  const SaudaIcon = sauda.Icon;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [rotasRes, motoristasRes, veiculosRes, pinsRes] =
        await Promise.all([
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

  const centralizarMapa = () => {
    const map = (window as any).__dashboardMap;
    if (!map) return;
    if (boundsMapa) {
      map.flyToBounds(boundsMapa, {
        padding: [30, 30],
        maxZoom: 14,
        duration: 1,
      });
    } else {
      map.flyTo([-23.55, -46.63], 12, { duration: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* SAUDAÇÃO */}
      <div>
        <div className="flex items-center gap-2.5">
          <SaudaIcon className="w-6 h-6 text-amber-500" strokeWidth={2.2} />
          <h1 className="text-2xl font-bold text-slate-800">
            {sauda.texto}, {primeiroNome}
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 capitalize">
          {dataFormatada()}
        </p>
      </div>

      {/* CARDS DE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Linhas"
          value={0}
          helpText="Em breve"
          icon={Route}
          color="blue"
          onClick={() => navigate("/rotas")}
        />

        <StatCard
          label="Rotas"
          value={stats.rotas}
          helpText={stats.rotas === 1 ? "cadastrada" : "cadastradas"}
          icon={MapIcon}
          color="emerald"
          loading={loading}
          onClick={() => navigate("/rotas")}
        />

        <StatCard
          label="Motoristas"
          value={stats.motoristasAtivos}
          helpText={
            stats.motoristasTotal > stats.motoristasAtivos
              ? `${stats.motoristasAtivos} ativos de ${stats.motoristasTotal}`
              : "ativos"
          }
          icon={Users}
          color="purple"
          loading={loading}
          onClick={() => navigate("/motoristas")}
        />

        <StatCard
          label="Veículos"
          value={stats.veiculosAtivos}
          helpText={
            stats.veiculosTotal > stats.veiculosAtivos
              ? `${stats.veiculosAtivos} ativos de ${stats.veiculosTotal}`
              : "ativos"
          }
          icon={Truck}
          color="amber"
          loading={loading}
          onClick={() => navigate("/veiculos")}
        />
      </div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-red-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <AlertTriangle
                  className="w-5 h-5 text-amber-600"
                  strokeWidth={2.2}
                />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">
                  {alertas.length}{" "}
                  {alertas.length === 1 ? "alerta" : "alertas"} de documentos
                </h2>
                <p className="text-xs text-slate-500">
                  Documentos vencidos ou próximos do vencimento
                </p>
              </div>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alertas.slice(0, 5).map((a) => {
              const AlertIcon = ICON_ALERTA[a.tipo];
              const isVencido = a.urgencia === "vencido";
              return (
                <div
                  key={a.id}
                  onClick={() => navigate(a.link)}
                  className="px-6 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3 group"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isVencido ? "bg-red-100" : "bg-amber-100"
                    }`}
                  >
                    <AlertIcon
                      className={`w-4.5 h-4.5 ${
                        isVencido ? "text-red-600" : "text-amber-600"
                      }`}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isVencido ? "text-red-700" : "text-amber-700"
                      }`}
                    >
                      {a.titulo}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {a.descricao}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
                </div>
              );
            })}
            {alertas.length > 5 && (
              <div className="px-6 py-3 text-center text-xs text-slate-500 bg-slate-50">
                +{alertas.length - 5}{" "}
                {alertas.length - 5 === 1
                  ? "outro alerta"
                  : "outros alertas"}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* MAPA + LATERAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAPA */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader
            title="Mapa da operação"
            subtitle={
              rotas.length > 0
                ? `${rotas.length} ${
                    rotas.length === 1 ? "rota" : "rotas"
                  } cadastrada${rotas.length === 1 ? "" : "s"}`
                : "Nenhuma rota cadastrada ainda"
            }
            action={
              <button
                onClick={centralizarMapa}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-semibold transition active:scale-95 flex items-center gap-1.5"
                title="Centralizar mapa"
              >
                <Crosshair className="w-3.5 h-3.5" strokeWidth={2.2} />
                Centralizar
              </button>
            }
          />
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
          <div className="px-6 py-3 border-t border-slate-100">
            <button
              onClick={() => navigate("/rotas")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 group"
            >
              Ver no mapa completo
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </Card>

        {/* LATERAL - Últimas rotas */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader
            title="Rotas recentes"
            subtitle="Últimas cadastradas"
          />
          <div className="flex-1 overflow-y-auto">
            {ultimasRotas.length === 0 && (
              <EmptyState
                icon={MapPin}
                title="Nenhuma rota cadastrada"
                description="Comece cadastrando a primeira rota"
                compact
                action={{
                  label: "Cadastrar rota",
                  onClick: () => navigate("/rotas"),
                }}
              />
            )}
            {ultimasRotas.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate("/rotas")}
                className="px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: r.cor }}
                      />
                      <p className="font-bold text-slate-800 truncate">
                        {r.nome}
                      </p>
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
          <div className="px-6 py-3 border-t border-slate-100">
            <button
              onClick={() => navigate("/rotas")}
              className="w-full bg-[#1E56D4] hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition active:scale-95 shadow-lg shadow-blue-500/20"
            >
              Ver todas as rotas
            </button>
          </div>
        </Card>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <Card>
        <div className="p-6">
          <div className="mb-4">
            <h2 className="font-bold text-slate-800">Ações rápidas</h2>
            <p className="text-xs text-slate-500">
              Atalhos para o que você mais faz
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction
              icon={MapPin}
              label="Nova Rota"
              hint="Criar no mapa"
              color="blue"
              onClick={() => navigate("/rotas")}
            />
            <QuickAction
              icon={UserPlus}
              label="Motorista"
              hint="Cadastrar"
              color="purple"
              onClick={() => navigate("/motoristas")}
            />
            <QuickAction
              icon={Bus}
              label="Veículo"
              hint="Cadastrar"
              color="amber"
              onClick={() => navigate("/veiculos")}
            />
            <QuickAction
              icon={KeyRound}
              label="Gerar PIN"
              hint={`${stats.pinsAtivos} ativos`}
              color="emerald"
              onClick={() => navigate("/pins")}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* =========================
   QUICK ACTION (subcomponente)
========================= */
type ActionColor = "blue" | "purple" | "amber" | "emerald";

const ACTION_COLORS: Record<
  ActionColor,
  { border: string; bg: string; iconBg: string; iconText: string }
> = {
  blue: {
    border: "hover:border-blue-500",
    bg: "hover:bg-blue-50",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
  },
  purple: {
    border: "hover:border-purple-500",
    bg: "hover:bg-purple-50",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
  },
  amber: {
    border: "hover:border-amber-500",
    bg: "hover:bg-amber-50",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
  },
  emerald: {
    border: "hover:border-emerald-500",
    bg: "hover:bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
  },
};

function QuickAction({
  icon: Icon,
  label,
  hint,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  hint: string;
  color: ActionColor;
  onClick: () => void;
}) {
  const c = ACTION_COLORS[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 ${c.border} ${c.bg} transition group active:scale-95 text-left`}
    >
      <div
        className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center group-hover:scale-110 transition flex-shrink-0`}
      >
        <Icon className={`w-5 h-5 ${c.iconText}`} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{label}</p>
        <p className="text-[10px] text-slate-500 truncate">{hint}</p>
      </div>
    </button>
  );
}