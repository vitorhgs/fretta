import type { LucideIcon } from "lucide-react";

type StatColor = "blue" | "emerald" | "purple" | "amber" | "red" | "indigo" | "slate";

interface StatCardProps {
  label: string;
  value: string | number;
  helpText?: string;
  icon: LucideIcon;
  color?: StatColor;
  onClick?: () => void;
  loading?: boolean;
}

const COLOR_MAP: Record<StatColor, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

export function StatCard({
  label,
  value,
  helpText,
  icon: Icon,
  color = "blue",
  onClick,
  loading,
}: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${
        onClick
          ? "hover:shadow-md hover:border-slate-300 transition cursor-pointer group"
          : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-4xl font-black text-slate-800 mt-2">
            {loading ? "..." : value}
          </p>
          {helpText && (
            <p className="text-xs text-slate-500 mt-1 truncate">{helpText}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${
            onClick ? "group-hover:scale-110 transition" : ""
          }`}
        >
          <Icon className={`w-6 h-6 ${colors.text}`} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}