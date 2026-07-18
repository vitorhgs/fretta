import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: EmptyStateProps) {
  return (
    <div className={`text-center ${compact ? "py-8 px-4" : "py-12 px-6"}`}>
      <div
        className={`inline-flex items-center justify-center rounded-full bg-slate-100 mb-4 ${
          compact ? "w-12 h-12" : "w-16 h-16"
        }`}
      >
        <Icon
          className={`text-slate-400 ${compact ? "w-6 h-6" : "w-8 h-8"}`}
          strokeWidth={1.5}
        />
      </div>
      <h3 className={`font-bold text-slate-800 mb-1 ${compact ? "text-sm" : "text-lg"}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-slate-500 ${compact ? "text-xs" : "text-sm"} max-w-sm mx-auto`}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-500 transition active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}