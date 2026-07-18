type StatusRota = "ativa" | "pausada" | "arquivada";

interface BadgeStatusProps {
  status: StatusRota;
  size?: "sm" | "md";
}

export default function BadgeStatus({ status, size = "sm" }: BadgeStatusProps) {
  const config = {
    ativa: {
      label: "Ativa",
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
      pulse: true,
    },
    pausada: {
      label: "Pausada",
      bg: "bg-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
      pulse: false,
    },
    arquivada: {
      label: "Arquivada",
      bg: "bg-slate-200",
      text: "text-slate-600",
      dot: "bg-slate-400",
      pulse: false,
    },
  };

  const c = config[status];
  const ehSm = size === "sm";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold
        ${c.bg} ${c.text}
        ${ehSm ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  );
}