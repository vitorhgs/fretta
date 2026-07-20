import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, PlayCircle } from "lucide-react";
import Modal from "../components/Modal";
import CardAlerta from "../components/alertas/CardAlerta";
import ModalAlertaDetalhes from "../components/alertas/ModalAlertaDetalhes";
import { useAlertasSOS, type AlertaSOS } from "../contexts/AlertasSOSContext";

export default function Alertas() {
  const {
    alertas,
    loading,
    stats,
    atender,
    resolver,
    marcarFalsoAlarme,
  } = useAlertasSOS();

  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaSOS | null>(
    null
  );
  const [filtro, setFiltro] = useState<
    "todos" | "aberto" | "em_atendimento" | "resolvidos"
  >("todos");

  const alertasFiltrados = alertas.filter((a) => {
    if (filtro === "todos") return true;
    if (filtro === "resolvidos")
      return a.status === "resolvido" || a.status === "falso_alarme";
    return a.status === filtro;
  });

  const handleAtender = async (id: string) => {
    await atender(id);
    // Atualiza o modal aberto
    const atualizado = alertas.find((a) => a.id === id);
    if (atualizado) setAlertaSelecionado(atualizado);
  };

  const handleResolver = async (id: string, obs?: string) => {
    await resolver(id, obs);
    setAlertaSelecionado(null);
  };

  const handleFalsoAlarme = async (id: string, obs?: string) => {
    await marcarFalsoAlarme(id, obs);
    setAlertaSelecionado(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <AlertTriangle size={28} className="text-red-600" />
          Alertas SOS
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Emergências e solicitações de ajuda dos motoristas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox
          label="Ativos agora"
          value={stats.ativos}
          Icon={AlertTriangle}
          color="red"
          pulse={stats.ativos > 0}
        />
        <StatBox
          label="Em atendimento"
          value={stats.emAtendimento}
          Icon={PlayCircle}
          color="amber"
        />
        <StatBox
          label="Resolvidos"
          value={stats.resolvidos}
          Icon={CheckCircle2}
          color="green"
        />
        <StatBox
          label="Total"
          value={stats.total}
          Icon={Bell}
          color="blue"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: "todos", l: "Todos", c: stats.total },
          { v: "aberto", l: "Ativos", c: stats.ativos },
          { v: "em_atendimento", l: "Em atendimento", c: stats.emAtendimento },
          { v: "resolvidos", l: "Resolvidos", c: stats.resolvidos },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFiltro(f.v as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filtro === f.v
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.l}
            <span className="ml-1.5 text-xs opacity-70">({f.c})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : alertasFiltrados.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center bg-white">
          <CheckCircle2 size={48} className="mx-auto text-green-400 mb-3" />
          <p className="font-semibold text-slate-700">
            {filtro === "aberto"
              ? "Nenhum alerta ativo no momento"
              : "Nenhum alerta encontrado"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {filtro === "aberto"
              ? "Tudo tranquilo por aqui! 👌"
              : "Tente outro filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertasFiltrados.map((alerta) => (
            <CardAlerta
              key={alerta.id}
              alerta={alerta}
              onClick={() => setAlertaSelecionado(alerta)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        aberto={!!alertaSelecionado}
        onFechar={() => setAlertaSelecionado(null)}
        titulo="Detalhes do alerta"
        tamanho="lg"
      >
        {alertaSelecionado && (
          <ModalAlertaDetalhes
            alerta={alertaSelecionado}
            onAtender={handleAtender}
            onResolver={handleResolver}
            onFalsoAlarme={handleFalsoAlarme}
          />
        )}
      </Modal>
    </div>
  );
}

function StatBox({
  label,
  value,
  Icon,
  color,
  pulse = false,
}: {
  label: string;
  value: number;
  Icon: any;
  color: "red" | "amber" | "green" | "blue";
  pulse?: boolean;
}) {
  const colorMap = {
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between ${
        pulse ? "ring-2 ring-red-400 animate-pulse" : ""
      }`}
    >
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}
      >
        <Icon size={22} strokeWidth={2.2} />
      </div>
    </div>
  );
}