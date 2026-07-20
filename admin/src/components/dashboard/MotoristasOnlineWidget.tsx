import { useNavigate } from "react-router-dom";
import { Radio, User, ChevronRight, Circle } from "lucide-react";
import { useMotoristasAoVivo } from "../../hooks/useMotoristasAoVivo";

function tempoRelativo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function MotoristasOnlineWidget() {
  const navigate = useNavigate();
  const { motoristas, stats } = useMotoristasAoVivo();

  // Ordena: em viagem → online → offline
  const ordenados = [...motoristas].sort((a, b) => {
    const scoreA = a.em_viagem ? 2 : a.realmente_online ? 1 : 0;
    const scoreB = b.em_viagem ? 2 : b.realmente_online ? 1 : 0;
    return scoreB - scoreA;
  });

  const topMotoristas = ordenados.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Radio size={16} className="text-blue-600" strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Motoristas</h3>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">
              Tempo real
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/ao-vivo")}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 group"
        >
          Ver todos
          <ChevronRight
            size={14}
            className="group-hover:translate-x-0.5 transition"
          />
        </button>
      </div>

      {/* Stats resumidos */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2 bg-slate-50 border-b border-slate-100">
        <div className="text-center">
          <p className="text-lg font-black text-green-600">{stats.emViagem}</p>
          <p className="text-[9px] text-slate-500 uppercase font-bold">
            Em viagem
          </p>
        </div>
        <div className="text-center border-x border-slate-200">
          <p className="text-lg font-black text-blue-600">{stats.online}</p>
          <p className="text-[9px] text-slate-500 uppercase font-bold">
            Online
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-slate-400">{stats.offline}</p>
          <p className="text-[9px] text-slate-500 uppercase font-bold">
            Offline
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-[320px] overflow-y-auto">
        {topMotoristas.length === 0 && (
          <div className="py-8 text-center">
            <User size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Nenhum motorista ainda</p>
          </div>
        )}

        {topMotoristas.map((m) => {
          const status = m.em_viagem
            ? "viagem"
            : m.realmente_online
            ? "online"
            : "offline";

          const statusConfig = {
            viagem: {
              cor: "bg-green-500",
              texto: "Em viagem",
              corTexto: "text-green-600",
              anima: true,
            },
            online: {
              cor: "bg-blue-500",
              texto: "Online",
              corTexto: "text-blue-600",
              anima: false,
            },
            offline: {
              cor: "bg-slate-300",
              texto: "Offline",
              corTexto: "text-slate-400",
              anima: false,
            },
          }[status];

          const iniciais = m.motorista_nome
            ?.split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?";

          return (
            <div
              key={m.motorista_id}
              onClick={() => navigate("/ao-vivo")}
              className="px-5 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-sm flex items-center justify-center">
                  {iniciais}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex">
                  {statusConfig.anima && (
                    <div className={`absolute w-3 h-3 rounded-full ${statusConfig.cor} animate-ping opacity-60`} />
                  )}
                  <div className={`relative w-3 h-3 rounded-full ${statusConfig.cor} border-2 border-white`} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {m.motorista_nome}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Circle
                    size={6}
                    fill="currentColor"
                    className={statusConfig.corTexto}
                  />
                  <span className={`text-xs font-semibold ${statusConfig.corTexto}`}>
                    {statusConfig.texto}
                  </span>
                  {m.em_viagem && m.rota_nome && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 truncate">
                        {m.rota_nome}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Tempo */}
              {m.atualizado_em && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {tempoRelativo(m.atualizado_em)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}