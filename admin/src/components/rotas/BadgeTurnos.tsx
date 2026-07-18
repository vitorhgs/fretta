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

  // Compact: mostra só os ícones
  if (compact) {
    return (
      <div className="inline-flex items-center gap-0.5">
        {turnos.map((t) => (
          <span
            key={t}
            title={t}
            className={ehSm ? "text-xs" : "text-sm"}
          >
            {iconeTurno(t)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {turnos.map((t) => {
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
            <span>{iconeTurno(t)}</span>
            <span>{t}</span>
          </span>
        );
      })}
    </div>
  );
}