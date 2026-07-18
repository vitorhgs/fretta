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

  // Barra de progresso das paradas
  const paradasTotais = motorista.paradas_totais || 0;
  const paradasConcluidas = motorista.paradas_concluidas || 0;
  const progresso =
    paradasTotais > 0 ? (paradasConcluidas / paradasTotais) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-xl border-2 transition-all p-3
        ${
          selecionado
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        }
        ${!online ? "opacity-60" : ""}
      `}
    >
      {/* Header do card */}
      <div className="flex items-start gap-3">
        {/* Avatar com status */}
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{
              background: `linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%)`,
            }}
          >
            {iniciais(motorista.motorista_nome)}
          </div>
          {/* Indicador de status */}
          <div
            className={`
              absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white
              ${
                emViagem
                  ? "bg-green-500 animate-pulse"
                  : online
                  ? "bg-slate-400"
                  : "bg-slate-300"
              }
            `}
          />
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">
            {motorista.motorista_nome}
          </p>
          {emViagem && motorista.rota_nome ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cor }}
              />
              <p className="text-xs text-slate-600 truncate font-semibold">
                {motorista.rota_nome}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">
              {online ? "Disponível" : "Offline"}
            </p>
          )}
        </div>

        {/* Badge de status */}
        <div
          className={`
            text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0
            ${
              emViagem
                ? "bg-green-100 text-green-700"
                : online
                ? "bg-slate-100 text-slate-600"
                : "bg-slate-100 text-slate-400"
            }
          `}
        >
          {emViagem ? "Em viagem" : online ? "Online" : "Offline"}
        </div>
      </div>

      {/* Métricas — só se em viagem */}
      {emViagem && (
        <>
          {/* Barra de progresso */}
          {paradasTotais > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Progresso
                </span>
                <span className="text-[10px] font-bold text-slate-700">
                  {paradasConcluidas}/{paradasTotais} paradas
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
            <div className="text-center bg-slate-50 rounded-lg py-1.5">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {Math.round(motorista.velocidade_kmh)}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-1">
                km/h
              </p>
            </div>
            <div className="text-center bg-slate-50 rounded-lg py-1.5">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {tempoDesde(motorista.iniciada_em)}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-1">
                tempo
              </p>
            </div>
            <div className="text-center bg-slate-50 rounded-lg py-1.5">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {Math.round(progresso)}%
              </p>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-1">
                completo
              </p>
            </div>
          </div>
        </>
      )}

      {/* Última atualização (só se offline ou parado) */}
      {!emViagem && (
        <p className="text-[10px] text-slate-400 mt-2">
          Atualizado {tempoAtualizado(motorista.atualizado_em)}
        </p>
      )}
    </button>
  );
}