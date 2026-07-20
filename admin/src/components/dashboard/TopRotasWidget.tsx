import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ChevronRight, Map as MapIcon } from "lucide-react";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

interface RotaTop {
  rota_id: string;
  rota_nome: string;
  rota_cor: string;
  total: number;
}

export default function TopRotasWidget() {
  const navigate = useNavigate();
  const { empresa } = useAuth();
  const [rotas, setRotas] = useState<RotaTop[]>([]);
  const [loading, setLoading] = useState(true);
  const [maiorTotal, setMaiorTotal] = useState(1);

  useEffect(() => {
    if (empresa) carregar();
  }, [empresa]);

  const carregar = async () => {
    if (!empresa) return;
    setLoading(true);

    // Últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const { data, error } = await supabase
      .from("viagens")
      .select("rota_id, rota_nome, rota_cor")
      .eq("empresa_id", empresa.id)
      .gte("iniciada_em", trintaDiasAtras.toISOString())
      .not("rota_id", "is", null);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Agrupa por rota
    const contagem: Record<string, RotaTop> = {};
    data.forEach((v: any) => {
      if (!v.rota_id) return;
      if (!contagem[v.rota_id]) {
        contagem[v.rota_id] = {
          rota_id: v.rota_id,
          rota_nome: v.rota_nome || "Sem nome",
          rota_cor: v.rota_cor || "#3B82F6",
          total: 0,
        };
      }
      contagem[v.rota_id].total++;
    });

    const ordenadas = Object.values(contagem)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    setRotas(ordenadas);
    setMaiorTotal(ordenadas[0]?.total || 1);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <TrendingUp size={16} className="text-purple-600" strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Top rotas</h3>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">
              Últimos 30 dias
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/rotas")}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 group"
        >
          Ver todas
          <ChevronRight
            size={14}
            className="group-hover:translate-x-0.5 transition"
          />
        </button>
      </div>

      {/* Lista */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          </div>
        ) : rotas.length === 0 ? (
          <div className="py-8 text-center">
            <MapIcon size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">
              Nenhuma viagem registrada ainda
            </p>
          </div>
        ) : (
          rotas.map((rota, i) => {
            const percentual = (rota.total / maiorTotal) * 100;

            return (
              <div key={rota.rota_id} className="flex items-center gap-3">
                {/* Ranking */}
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-slate-600">
                    {i + 1}
                  </span>
                </div>

                {/* Barra + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {rota.rota_nome}
                    </p>
                    <span className="text-xs font-black text-slate-600 ml-2 flex-shrink-0">
                      {rota.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentual}%`,
                        backgroundColor: rota.rota_cor,
                      }}
                    />
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