interface SeletorTurnosProps {
  turnosSelecionados: string[];
  onChange: (turnos: string[]) => void;
  size?: "sm" | "md";
}

const TURNOS = [
  { valor: "Manhã", icone: "☀", horario: "05h-12h" },
  { valor: "Tarde", icone: "🌤", horario: "12h-18h" },
  { valor: "Noite", icone: "🌙", horario: "18h-23h" },
  { valor: "Madrugada", icone: "🌑", horario: "23h-5h" },
];

export default function SeletorTurnos({
  turnosSelecionados,
  onChange,
  size = "md",
}: SeletorTurnosProps) {
  const toggle = (turno: string) => {
    if (turnosSelecionados.includes(turno)) {
      onChange(turnosSelecionados.filter((t) => t !== turno));
    } else {
      onChange([...turnosSelecionados, turno]);
    }
  };

  const ehSm = size === "sm";

  return (
    <div className={`grid grid-cols-2 ${ehSm ? "gap-2" : "gap-3"}`}>
      {TURNOS.map((t) => {
        const ativo = turnosSelecionados.includes(t.valor);
        return (
          <button
            key={t.valor}
            type="button"
            onClick={() => toggle(t.valor)}
            className={`
              relative flex items-center gap-2 border-2 rounded-xl
              transition-all active:scale-95
              ${ehSm ? "px-3 py-2" : "px-4 py-3"}
              ${
                ativo
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }
            `}
          >
            {/* Ícone */}
            <span className={ehSm ? "text-lg" : "text-xl"}>{t.icone}</span>

            {/* Texto */}
            <div className="flex-1 text-left">
              <p
                className={`font-bold ${ehSm ? "text-xs" : "text-sm"} ${
                  ativo ? "text-blue-700" : "text-slate-700"
                }`}
              >
                {t.valor}
              </p>
              {!ehSm && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {t.horario}
                </p>
              )}
            </div>

            {/* Check */}
            {ativo && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
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