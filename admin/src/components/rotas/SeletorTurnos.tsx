import { Sun, CloudSun, Moon, MoonStar, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SeletorTurnosProps {
  turnosSelecionados: string[];
  onChange: (turnos: string[]) => void;
  size?: "sm" | "md";
}

const TURNOS: { valor: string; icon: LucideIcon; horario: string }[] = [
  { valor: "Manhã", icon: Sun, horario: "05h-12h" },
  { valor: "Tarde", icon: CloudSun, horario: "12h-18h" },
  { valor: "Noite", icon: Moon, horario: "18h-23h" },
  { valor: "Madrugada", icon: MoonStar, horario: "23h-5h" },
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
        const Icon = t.icon;

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
            <Icon
              className={`${ehSm ? "w-4 h-4" : "w-5 h-5"} ${
                ativo ? "text-blue-600" : "text-slate-500"
              }`}
              strokeWidth={2.2}
            />

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
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}