import { CheckCircle2, PauseCircle, XCircle } from "lucide-react";

interface BadgeStatusLinhaProps {
  status: "ativa" | "pausada" | "encerrada";
  size?: "sm" | "md";
}

export default function BadgeStatusLinha({
  status,
  size = "md",
}: BadgeStatusLinhaProps) {
  const config = {
    ativa: {
      label: "Ativa",
      Icon: CheckCircle2,
      className: "bg-green-100 text-green-700 border-green-200",
    },
    pausada: {
      label: "Pausada",
      Icon: PauseCircle,
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    encerrada: {
      label: "Encerrada",
      Icon: XCircle,
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const { label, Icon, className } = config[status];
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${className} ${
        isSmall ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <Icon size={isSmall ? 12 : 14} />
      {label}
    </span>
  );
}