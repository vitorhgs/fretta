import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

interface DadosDia {
  dia: string;
  diaCompleto: string;
  concluidas: number;
  canceladas: number;
  total: number;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function GraficoViagens() {
  const { empresa } = useAuth();
  const [dados, setDados] = useState<DadosDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSemana, setTotalSemana] = useState(0);
  const [variacao, setVariacao] = useState(0);

  useEffect(() => {
    if (empresa) carregar();
  }, [empresa]);

  const carregar = async () => {
    if (!empresa) return;
    setLoading(true);

    // Últimos 7 dias (incluindo hoje)
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
    seteDiasAtras.setHours(0, 0, 0, 0);

    // Semana anterior (pra calcular variação)
    const quatorzeDiasAtras = new Date();
    quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 13);
    quatorzeDiasAtras.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("viagens")
      .select("iniciada_em, status")
      .eq("empresa_id", empresa.id)
      .gte("iniciada_em", quatorzeDiasAtras.toISOString())
      .lte("iniciada_em", hoje.toISOString());

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Cria estrutura dos 7 dias
    const diasArray: DadosDia[] = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      diasArray.push({
        dia: DIAS_SEMANA[data.getDay()],
        diaCompleto: data.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        concluidas: 0,
        canceladas: 0,
        total: 0,
      });
    }

    // Conta viagens por dia (últimos 7 dias)
    let totalUltimos7 = 0;
    let totalAnteriores7 = 0;

    data.forEach((viagem: any) => {
      const dataViagem = new Date(viagem.iniciada_em);
      const diffDias = Math.floor(
        (hoje.getTime() - dataViagem.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDias >= 0 && diffDias <= 6) {
        const indice = 6 - diffDias;
        if (diasArray[indice]) {
          diasArray[indice].total++;
          if (viagem.status === "concluida") {
            diasArray[indice].concluidas++;
          } else if (viagem.status === "cancelada") {
            diasArray[indice].canceladas++;
          } else {
            diasArray[indice].concluidas++;
          }
        }
        totalUltimos7++;
      } else if (diffDias >= 7 && diffDias <= 13) {
        totalAnteriores7++;
      }
    });

    setDados(diasArray);
    setTotalSemana(totalUltimos7);

    // Calcula variação percentual
    if (totalAnteriores7 > 0) {
      const varPercent = ((totalUltimos7 - totalAnteriores7) / totalAnteriores7) * 100;
      setVariacao(Math.round(varPercent));
    } else if (totalUltimos7 > 0) {
      setVariacao(100);
    } else {
      setVariacao(0);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Viagens por dia
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Últimos 7 dias</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-black text-slate-800">{totalSemana}</p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">
              Total
            </p>
          </div>
          {variacao !== 0 && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                variacao > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <TrendingUp
                size={14}
                className={variacao < 0 ? "rotate-180" : ""}
              />
              {variacao > 0 ? "+" : ""}
              {variacao}%
            </div>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="p-4 h-[280px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="dia"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
  cursor={{ fill: "#f8fafc" }}
  contentStyle={{
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "12px",
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  }}
  labelFormatter={(label: any, payload: any) => {
    const item = payload?.[0]?.payload;
    return item ? `${label}, ${item.diaCompleto}` : label;
  }}
  formatter={(value: any, name: any) => {
    const nomes: Record<string, string> = {
      concluidas: "Concluídas",
      canceladas: "Canceladas",
    };
    return [value, nomes[name as string] || name];
  }}
/>
              <Bar
                dataKey="concluidas"
                fill="#1E56D4"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="canceladas"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legenda */}
      <div className="px-6 pb-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#1E56D4]" />
          <span className="text-slate-600 font-medium">Concluídas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-slate-600 font-medium">Canceladas</span>
        </div>
      </div>
    </div>
  );
}