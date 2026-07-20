import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
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
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  const padding = compact ? "py-8 px-6" : "py-16 px-8";
  const iconSize = compact ? 40 : 56;
  const titleSize = compact ? "text-base" : "text-lg";

  return (
    <div className={`flex flex-col items-center justify-center text-center ${padding}`}>
      {/* Ícone com fundo circular gradiente */}
      <div
        className={`
          relative flex items-center justify-center rounded-full mb-4
          bg-gradient-to-br from-blue-50 to-indigo-100
          border border-blue-200/50
          ${compact ? "w-16 h-16" : "w-24 h-24"}
        `}
      >
        <Icon
          size={iconSize}
          className="text-blue-500"
          strokeWidth={1.5}
        />
        {/* Pontinho decorativo */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full opacity-60" />
      </div>

      {/* Título */}
      <h3 className={`font-bold text-slate-800 mb-2 ${titleSize}`}>
        {title}
      </h3>

      {/* Descrição */}
      {description && (
        <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* Ações */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {action.icon && <action.icon size={16} strokeWidth={2.4} />}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}