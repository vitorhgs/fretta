import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, CheckCircle2, PlayCircle } from "lucide-react";
import { useAlertasSOS } from "../../contexts/AlertasSOSContext";

function tempoRelativo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

export default function AlertasRecentesWidget() {
  const navigate = useNavigate();
  const { alertas, stats } = useAlertasSOS();

  const recentes = alertas.slice(0, 4);
  const temAtivos = stats.ativos > 0;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        temAtivos ? "border-red-300" : "border-slate-200"
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 border-b flex items-center justify-between ${
          temAtivos
            ? "bg-gradient-to-r from-red-50 to-white border-red-200"
            : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              temAtivos ? "bg-red-100" : "bg-slate-100"
            }`}
          >
            <AlertTriangle
              size={16}
              className={temAtivos ? "text-red-600" : "text-slate-500"}
              strokeWidth={2.4}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Alertas SOS</h3>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">
              {temAtivos ? `${stats.ativos} ativo${stats.ativos > 1 ? "s" : ""}` : "Últimos"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/alertas")}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 group"
        >
          Ver todos
          <ChevronRight
            size={14}
            className="group-hover:translate-x-0.5 transition"
          />
        </button>
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-100">
        {recentes.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 size={36} className="mx-auto text-green-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhum alerta 🎉
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tudo tranquilo por aqui
            </p>
          </div>
        ) : (
          recentes.map((a) => {
            const config = {
              aberto: {
                Icon: AlertTriangle,
                bg: "bg-red-100",
                text: "text-red-700",
                label: "Ativo",
                pulse: true,
              },
              em_atendimento: {
                Icon: PlayCircle,
                bg: "bg-amber-100",
                text: "text-amber-700",
                label: "Em atendimento",
                pulse: false,
              },
              resolvido: {
                Icon: CheckCircle2,
                bg: "bg-green-100",
                text: "text-green-700",
                label: "Resolvido",
                pulse: false,
              },
              falso_alarme: {
                Icon: CheckCircle2,
                bg: "bg-slate-100",
                text: "text-slate-500",
                label: "Falso alarme",
                pulse: false,
              },
            }[a.status];

            const Icon = config.Icon;

            return (
              <div
                key={a.id}
                onClick={() => navigate("/alertas")}
                className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3"
              >
                <div className="relative flex-shrink-0">
                  {config.pulse && (
                    <div className={`absolute inset-0 rounded-lg ${config.bg} animate-ping opacity-60`} />
                  )}
                  <div className={`relative w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon size={16} className={config.text} strokeWidth={2.4} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {a.motorista_nome}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-black uppercase ${config.text}`}>
                      {config.label}
                    </span>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="text-[10px] text-slate-500">
                      {tempoRelativo(a.criado_em)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}