import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Plus,
  Calendar,
  CalendarDays,
  BellOff,
  User,
  Info,
  Bus,
  AlertTriangle,
  Siren,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import FormNovaNotificacao from "../components/notificacoes/FormNovaNotificacao";

import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterTabs } from "../components/ui/FilterTabs";
import { EmptyState } from "../components/ui/EmptyState";
import { Toast, type ToastType } from "../components/ui/Toast";

interface NotificacaoEnviada {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
  motorista_id: string;
  motoristas?: { nome: string } | null;
}

type TipoConfig = {
  icon: LucideIcon;
  badge: "slate" | "blue" | "amber" | "red";
  bg: string;
  text: string;
  label: string;
};

const TIPO_CONFIG: Record<string, TipoConfig> = {
  info: {
    icon: Info,
    badge: "slate",
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: "Informação",
  },
  rota: {
    icon: Bus,
    badge: "blue",
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Rota",
  },
  alerta: {
    icon: AlertTriangle,
    badge: "amber",
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Alerta",
  },
  emergencia: {
    icon: Siren,
    badge: "red",
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Emergência",
  },
};

type FiltroTipo = "todos" | "info" | "rota" | "alerta" | "emergencia";

export default function Notificacoes() {
  const { empresa } = useAuth();
  const [notificacoes, setNotificacoes] = useState<NotificacaoEnviada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: ToastType;
    texto: string;
  } | null>(null);

  useEffect(() => {
    if (empresa) carregarNotificacoes();
  }, [empresa]);

  const carregarNotificacoes = async () => {
    if (!empresa) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*, motoristas(nome)")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setNotificacoes(data as any);
    }
    setLoading(false);
  };

  const notificacoesFiltradas = useMemo(() => {
    let lista = notificacoes;
    if (filtroTipo !== "todos") {
      lista = lista.filter((n) => n.tipo === filtroTipo);
    }
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (n) =>
          n.titulo.toLowerCase().includes(t) ||
          n.mensagem.toLowerCase().includes(t) ||
          n.motoristas?.nome.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [notificacoes, busca, filtroTipo]);

  const stats = useMemo(() => {
    const hoje = new Date().toDateString();
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);

    return {
      total: notificacoes.length,
      hoje: notificacoes.filter(
        (n) => new Date(n.created_at).toDateString() === hoje
      ).length,
      semana: notificacoes.filter(
        (n) => new Date(n.created_at) >= semanaAtras
      ).length,
      naoLidas: notificacoes.filter((n) => !n.lida).length,
    };
  }, [notificacoes]);

  const formatarData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Notificações"
        subtitle="Envie avisos e alertas para os motoristas da sua operação"
        action={{
          label: "Nova Notificação",
          icon: Plus,
          onClick: () => setModalAberto(true),
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={Bell} color="blue" />
        <StatCard label="Hoje" value={stats.hoje} icon={Calendar} color="emerald" />
        <StatCard
          label="Últimos 7 dias"
          value={stats.semana}
          icon={CalendarDays}
          color="indigo"
        />
        <StatCard
          label="Não Lidas"
          value={stats.naoLidas}
          icon={BellOff}
          color="amber"
        />
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <SearchInput
              value={busca}
              onChange={setBusca}
              placeholder="Buscar por título, mensagem ou motorista..."
            />
          </div>

          <FilterTabs
            options={[
              { value: "todos", label: "Todos" },
              { value: "info", label: "Info" },
              { value: "rota", label: "Rota" },
              { value: "alerta", label: "Alerta" },
              { value: "emergencia", label: "SOS" },
            ]}
            value={filtroTipo}
            onChange={setFiltroTipo}
          />
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando notificações...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && notificacoesFiltradas.length === 0 && (
        <Card>
          <EmptyState
            icon={BellOff}
            title={
              notificacoes.length === 0
                ? "Nenhuma notificação enviada"
                : "Nenhuma notificação encontrada"
            }
            description={
              notificacoes.length === 0
                ? "Envie a primeira notificação aos seus motoristas."
                : "Tente ajustar os filtros de busca."
            }
            action={
              notificacoes.length === 0
                ? {
                    label: "Enviar primeira notificação",
                    onClick: () => setModalAberto(true),
                  }
                : undefined
            }
          />
        </Card>
      )}

      {/* Lista */}
      {!loading && notificacoesFiltradas.length > 0 && (
        <div className="space-y-2">
          {notificacoesFiltradas.map((n) => {
            const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
            const Icon = config.icon;

            return (
              <div
                key={n.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition flex items-start gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${config.text}`} strokeWidth={2} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-bold text-slate-800 truncate">
                      {n.titulo}
                    </h3>
                    <Badge color={config.badge}>{config.label}</Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                    {n.mensagem}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" strokeWidth={2.2} />
                      {n.motoristas?.nome || "Motorista removido"}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>{formatarData(n.created_at)}</span>
                    <span className="text-slate-300">·</span>
                    {n.lida ? (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                        Lida
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Circle className="w-3 h-3 fill-current" strokeWidth={2.2} />
                        Não lida
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Nova Notificação"
        tamanho="lg"
      >
        <FormNovaNotificacao
          onSucesso={(total) => {
            setModalAberto(false);
            setMensagem({
              tipo: "sucesso",
              texto: `Notificação enviada para ${total} motorista${
                total > 1 ? "s" : ""
              }!`,
            });
            carregarNotificacoes();
          }}
          onCancelar={() => setModalAberto(false)}
        />
      </Modal>

      {/* Toast */}
      {mensagem && (
        <Toast
          tipo={mensagem.tipo}
          texto={mensagem.texto}
          onFechar={() => setMensagem(null)}
        />
      )}
    </div>
  );
}