type StatusRota = "ativa" | "pausada" | "arquivada";

interface SeletorStatusProps {
  status: StatusRota;
  onChange: (status: StatusRota) => void;
}

const STATUS = [
  {
    valor: "ativa" as const,
    label: "Ativa",
    descricao: "Motoristas veem no app",
    cor: "green",
    icone: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" />
      </svg>
    ),
  },
  {
    valor: "pausada" as const,
    label: "Pausada",
    descricao: "Não aparece no app temporariamente",
    cor: "amber",
    icone: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
      </svg>
    ),
  },
  {
    valor: "arquivada" as const,
    label: "Arquivada",
    descricao: "Registro histórico, não é mais usada",
    cor: "slate",
    icone: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 6H12l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
];

export default function SeletorStatus({ status, onChange }: SeletorStatusProps) {
  return (
    <div className="space-y-2">
      {STATUS.map((s) => {
        const ativo = status === s.valor;
        const cores = {
          green: ativo
            ? "border-green-500 bg-green-50"
            : "border-slate-200 bg-white",
          amber: ativo
            ? "border-amber-500 bg-amber-50"
            : "border-slate-200 bg-white",
          slate: ativo
            ? "border-slate-500 bg-slate-50"
            : "border-slate-200 bg-white",
        };
        const coresIcone = {
          green: ativo ? "text-green-600" : "text-slate-400",
          amber: ativo ? "text-amber-600" : "text-slate-400",
          slate: ativo ? "text-slate-600" : "text-slate-400",
        };
        const coresLabel = {
          green: ativo ? "text-green-700" : "text-slate-700",
          amber: ativo ? "text-amber-700" : "text-slate-700",
          slate: ativo ? "text-slate-700" : "text-slate-700",
        };

        return (
          <button
            key={s.valor}
            type="button"
            onClick={() => onChange(s.valor)}
            className={`
              w-full flex items-center gap-3 border-2 rounded-xl px-4 py-3
              transition-all active:scale-95
              ${cores[s.cor as keyof typeof cores]}
            `}
          >
            {/* Ícone com bolinha pulsante se ativo */}
            <div className={`relative ${coresIcone[s.cor as keyof typeof coresIcone]}`}>
              {s.icone}
              {ativo && s.valor === "ativa" && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>

            <div className="flex-1 text-left">
              <p className={`font-bold text-sm ${coresLabel[s.cor as keyof typeof coresLabel]}`}>
                {s.label}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {s.descricao}
              </p>
            </div>

            {/* Check */}
            {ativo && (
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  s.cor === "green"
                    ? "bg-green-500"
                    : s.cor === "amber"
                    ? "bg-amber-500"
                    : "bg-slate-500"
                }`}
              >
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}