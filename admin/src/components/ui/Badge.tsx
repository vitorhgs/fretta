import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type BadgeColor =
  | "green"
  | "red"
  | "blue"
  | "amber"
  | "indigo"
  | "slate"
  | "purple"
  | "emerald";

interface BadgeProps {
  color?: BadgeColor;
  icon?: LucideIcon;
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

const COLORS: Record<BadgeColor, string> = {
  green: "bg-green-100 text-green-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  indigo: "bg-indigo-100 text-indigo-700",
  slate: "bg-slate-200 text-slate-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({
  color = "slate",
  icon: Icon,
  children,
  size = "sm",
  className = "",
}: BadgeProps) {
  const isSm = size === "sm";
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-bold uppercase rounded-full
        ${isSm ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}
        ${COLORS[color]}
        ${className}
      `}
    >
      {Icon && <Icon className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.5} />}
      {children}
    </span>
  );
}