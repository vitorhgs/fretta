import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Map as MapIcon,
  Users,
  Truck,
  UserPlus,
  Bus,
  KeyRound,
  Sun,
  Moon,
  Sunrise,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import GraficoViagens from "../components/dashboard/GraficoViagens";
import MotoristasOnlineWidget from "../components/dashboard/MotoristasOnlineWidget";
import AlertasRecentesWidget from "../components/dashboard/AlertasRecentesWidget";
import TopRotasWidget from "../components/dashboard/TopRotasWidget";
import UltimasViagensWidget from "../components/dashboard/UltimasViagensWidget";

/* =========================
   HELPERS
========================= */
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

/* =========================
   COMPONENTE
========================= */
export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario, empresa } = useAuth();

  const [stats, setStats] = useState({
    rotas: 0,
    motoristasAtivos: 0,
    motoristasTotal: 0,
    veiculosAtivos: 0,
    veiculosTotal: 0,
    pinsAtivos: 0,
    linhasTotal: 0,
    linhasAtivas: 0,
  });
  const [loading, setLoading] = useState(true);

  const primeiroNome = usuario?.nome?.split(" ")[0] || "Usuário";
  const sauda = saudacao();
  const SaudaIcon = sauda.Icon;

  useEffect(() => {
    if (empresa) carregarStats();
  }, [empresa]);

  const carregarStats = async () => {
    if (!empresa) return;
    setLoading(true);

    try {
      const [rotasRes, motoristasRes, veiculosRes, pinsRes, linhasRes] =
        await Promise.all([
          supabase
         .from("rotas")
         .select("id", { count: "exact", head: true })
          .or(`empresa_id.eq.${empresa.id},empresa_id.is.null`),
          supabase
            .from("motoristas")
            .select("id, ativo")
            .eq("empresa_id", empresa.id),
          supabase
            .from("veiculos")
            .select("id, status")
            .eq("empresa_id", empresa.id),
          supabase
            .from("pins_autorizacao")
            .select("id", { count: "exact", head: true })
            .eq("empresa_id", empresa.id)
            .eq("status", "ativo"),
          supabase
            .from("linhas")
            .select("id, status")
            .eq("empresa_id", empresa.id),
        ]);

      setStats({
        rotas: rotasRes.count || 0,
        motoristasAtivos: motoristasRes.data?.filter((m: any) => m.ativo).length || 0,
        motoristasTotal: motoristasRes.data?.length || 0,
        veiculosAtivos: veiculosRes.data?.filter((v: any) => v.status === "ativo").length || 0,
        veiculosTotal: veiculosRes.data?.length || 0,
        pinsAtivos: pinsRes.count || 0,
        linhasTotal: linhasRes.data?.length || 0,
        linhasAtivas: linhasRes.data?.filter((l: any) => l.status === "ativa").length || 0,
      });
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const helpTextLinhas = () => {
    if (stats.linhasTotal === 0) return "Cadastre a primeira";
    if (stats.linhasTotal === stats.linhasAtivas) {
      return stats.linhasAtivas === 1 ? "ativa" : "ativas";
    }
    return `${stats.linhasAtivas} ativas de ${stats.linhasTotal}`;
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
          value={stats.linhasTotal}
          helpText={helpTextLinhas()}
          icon={Building2}
          color="blue"
          loading={loading}
          onClick={() => navigate("/linhas")}
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

      {/* LAYOUT PRINCIPAL: 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA — Gráfico + Top Rotas */}
        <div className="lg:col-span-2 space-y-6">
          <GraficoViagens />
          <TopRotasWidget />
        </div>

        {/* COLUNA DIREITA — Widgets laterais */}
        <div className="space-y-6">
          <AlertasRecentesWidget />
          <MotoristasOnlineWidget />
          <UltimasViagensWidget />
        </div>
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
              icon={Building2}
              label="Nova Linha"
              hint="Cliente/contrato"
              color="blue"
              onClick={() => navigate("/linhas")}
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
   QUICK ACTION
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