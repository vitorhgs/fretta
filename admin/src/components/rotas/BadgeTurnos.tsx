import { iconeTurno, corTurno } from "../../lib/rotas";

interface BadgeTurnosProps {
  turnos: string[];
  size?: "sm" | "md";
  compact?: boolean;
}

export default function BadgeTurnos({
  turnos,
  size = "sm",
  compact = false,
}: BadgeTurnosProps) {
  if (!turnos || turnos.length === 0) return null;

  const ehSm = size === "sm";
  const iconSize = ehSm ? "w-3 h-3" : "w-3.5 h-3.5";

  // Compact: mostra só os ícones
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        {turnos.map((t) => {
          const Icon = iconeTurno(t);
          const c = corTurno(t);
          return (
            <span
              key={t}
              title={t}
              className={`inline-flex items-center justify-center rounded ${c.bg} ${c.text} ${
                ehSm ? "w-4 h-4" : "w-5 h-5"
              }`}
            >
              <Icon className={iconSize} strokeWidth={2.2} />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {turnos.map((t) => {
        const Icon = iconeTurno(t);
        const c = corTurno(t);
        return (
          <span
            key={t}
            className={`
              inline-flex items-center gap-1 rounded-md font-semibold
              ${c.bg} ${c.text}
              ${ehSm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"}
            `}
          >
            <Icon className={iconSize} strokeWidth={2.2} />
            <span>{t}</span>
          </span>
        );
      })}
    </div>
  );
}