import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, ChevronRight, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Viagem {
  id: string;
  motorista_nome: string;
  rota_nome: string;
  rota_cor: string;
  status: string;
  iniciada_em: string;
  finalizada_em: string | null;
}

function tempoRelativo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

export default function UltimasViagensWidget() {
  const navigate = useNavigate();
  const { empresa } = useAuth();
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (empresa) carregar();
  }, [empresa]);

  const carregar = async () => {
    if (!empresa) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("viagens")
      .select("id, motorista_nome, rota_nome, rota_cor, status, iniciada_em, finalizada_em")
      .eq("empresa_id", empresa.id)
      .order("iniciada_em", { ascending: false })
      .limit(5);

    if (!error && data) {
      setViagens(data as Viagem[]);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <History size={16} className="text-slate-600" strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Últimas viagens</h3>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">
              Recentes
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/historico")}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 group"
        >
          Ver histórico
          <ChevronRight
            size={14}
            className="group-hover:translate-x-0.5 transition"
          />
        </button>
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : viagens.length === 0 ? (
          <div className="py-8 text-center">
            <History size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Nenhuma viagem ainda</p>
          </div>
        ) : (
          viagens.map((v) => {
            const config = {
              concluida: {
                Icon: CheckCircle2,
                cor: "text-green-600",
                label: "Concluída",
              },
              cancelada: {
                Icon: XCircle,
                cor: "text-red-600",
                label: "Cancelada",
              },
              em_andamento: {
                Icon: PlayCircle,
                cor: "text-blue-600",
                label: "Em andamento",
              },
            }[v.status] || {
              Icon: History,
              cor: "text-slate-500",
              label: v.status,
            };

            const Icon = config.Icon;

            return (
              <div
                key={v.id}
                onClick={() => navigate("/historico")}
                className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-start gap-3">
                  {/* Barra colorida da rota */}
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: v.rota_cor }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {v.rota_nome}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {v.motorista_nome}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon size={11} className={config.cor} strokeWidth={2.4} />
                      <span className={`text-[10px] font-bold uppercase ${config.cor}`}>
                        {config.label}
                      </span>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-[10px] text-slate-500">
                        {tempoRelativo(v.iniciada_em)}
                      </span>
                    </div>
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