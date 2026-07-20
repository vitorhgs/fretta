import {
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Route as RouteIcon,
} from "lucide-react";
import type { AlertaSOS } from "../../contexts/AlertasSOSContext";

interface CardAlertaProps {
  alerta: AlertaSOS;
  onClick: () => void;
}

const STATUS_CONFIG = {
  aberto: {
    label: "ATIVO",
    Icon: AlertTriangle,
    color: "red",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    pulse: true,
  },
  em_atendimento: {
    label: "EM ATENDIMENTO",
    Icon: PlayCircle,
    color: "amber",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    pulse: false,
  },
  resolvido: {
    label: "RESOLVIDO",
    Icon: CheckCircle2,
    color: "green",
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
    pulse: false,
  },
  falso_alarme: {
    label: "FALSO ALARME",
    Icon: XCircle,
    color: "slate",
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-600",
    pulse: false,
  },
};

function tempoRelativo(iso: string): string {
  const agora = Date.now();
  const data = new Date(iso).getTime();
  const diff = Math.floor((agora - data) / 1000);

  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

export default function CardAlerta({ alerta, onClick }: CardAlertaProps) {
  const config = STATUS_CONFIG[alerta.status];
  const StatusIcon = config.Icon;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border-2 ${config.border} ${config.bg} cursor-pointer transition-all hover:shadow-lg ${
        config.pulse ? "animate-pulse-subtle" : ""
      }`}
    >
      {/* Barra lateral pulsante se ativo */}
      {alerta.status === "aberto" && (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500 animate-pulse" />
      )}

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center ${
                alerta.status === "aberto" ? "bg-red-100" : `bg-${config.color}-100`
              }`}
            >
              <StatusIcon
                size={22}
                className={config.text}
                strokeWidth={2.5}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 text-lg">
                  {alerta.motorista_nome}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={12} />
                <span>{tempoRelativo(alerta.criado_em)}</span>
                <span>•</span>
                <span>
                  {new Date(alerta.criado_em).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black ${config.bg} ${config.text} border ${config.border}`}
          >
            {config.label}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-2">
          {alerta.rota_nome && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <RouteIcon size={14} className="text-slate-400" />
              <span>
                Rota: <strong>{alerta.rota_nome}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} className="text-slate-400" />
            <span className="font-mono text-xs">
              {alerta.latitude.toFixed(4)}, {alerta.longitude.toFixed(4)}
            </span>
          </div>

          {alerta.velocidade_kmh > 0 && (
            <div className="text-xs text-slate-500">
              Velocidade no momento: <strong>{Math.round(alerta.velocidade_kmh)} km/h</strong>
            </div>
          )}
        </div>

        {/* Observação do motorista */}
        {alerta.observacao_motorista && (
          <div className="mt-3 p-3 bg-white/60 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
              Observação
            </p>
            <p className="text-sm text-slate-700">
              {alerta.observacao_motorista}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}