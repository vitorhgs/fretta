import { Gauge, Clock, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MotoristaAoVivo } from "../../hooks/useMotoristasAoVivo";

interface CardMotoristaAoVivoProps {
  motorista: MotoristaAoVivo;
  selecionado: boolean;
  onClick: () => void;
}

function iniciais(nome: string): string {
  if (!nome) return "?";
  return nome
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function tempoDesde(iso: string | null): string {
  if (!iso) return "-";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}min`;
}

function tempoAtualizado(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 15) return "agora mesmo";
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export default function CardMotoristaAoVivo({
  motorista,
  selecionado,
  onClick,
}: CardMotoristaAoVivoProps) {
  const online = motorista.realmente_online;
  const emViagem = motorista.em_viagem && online;
  const cor = motorista.rota_cor || "#3B82F6";

  const paradasTotais = motorista.paradas_totais || 0;
  const paradasConcluidas = motorista.paradas_concluidas || 0;
  const progresso =
    paradasTotais > 0 ? (paradasConcluidas / paradasTotais) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={`
        btn-press w-full text-left rounded-xl border transition-all p-3
        ${
          selecionado
            ? "border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/10"
            : "border-slate-700 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800"
        }
        ${!online ? "opacity-60" : ""}
      `}
    >
      {/* HEADER */}
      <div className="flex items-start gap-3">
        {/* Avatar com status dot */}
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%)`,
            }}
          >
            {iniciais(motorista.motorista_nome)}
          </div>
          <div
            className={`
              absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#09152E]
              ${
                emViagem
                  ? "bg-green-500 animate-pulse"
                  : online
                  ? "bg-slate-400"
                  : "bg-slate-600"
              }
            `}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">
            {motorista.motorista_nome}
          </p>
          {emViagem && motorista.rota_nome ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cor }}
              />
              <p className="text-xs text-slate-300 truncate font-semibold">
                {motorista.rota_nome}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">
              {online ? "Disponível" : "Offline"}
            </p>
          )}
        </div>

        {/* Badge de status */}
        <span
          className={`
            text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0
            ${
              emViagem
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : online
                ? "bg-slate-700 text-slate-300"
                : "bg-slate-800 text-slate-500"
            }
          `}
        >
          {emViagem ? "Em viagem" : online ? "Online" : "Offline"}
        </span>
      </div>

      {/* MÉTRICAS - só se em viagem */}
      {emViagem && (
        <>
          {/* Progresso */}
          {paradasTotais > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Progresso
                </span>
                <span className="text-[10px] font-bold text-white">
                  {paradasConcluidas}/{paradasTotais} paradas
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progresso}%`,
                    background: cor,
                  }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MetricaMini
              icon={Gauge}
              value={Math.round(motorista.velocidade_kmh).toString()}
              label="km/h"
            />
            <MetricaMini
              icon={Clock}
              value={tempoDesde(motorista.iniciada_em)}
              label="tempo"
            />
            <MetricaMini
              icon={TrendingUp}
              value={`${Math.round(progresso)}%`}
              label="completo"
            />
          </div>
        </>
      )}

      {/* Última atualização */}
      {!emViagem && (
        <p className="text-[10px] text-slate-500 mt-2">
          Atualizado {tempoAtualizado(motorista.atualizado_em)}
        </p>
      )}
    </button>
  );
}

/* =========================
   MÉTRICA MINI
========================= */
function MetricaMini({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center bg-slate-900/50 border border-slate-800 rounded-lg py-2">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Icon className="w-3 h-3 text-slate-400" strokeWidth={2.2} />
        <p className="text-sm font-bold text-white leading-none">{value}</p>
      </div>
      <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
        {label}
      </p>
    </div>
  );
}