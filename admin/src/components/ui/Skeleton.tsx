interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  variant?: "light" | "dark"; // 🆕
}

export function Skeleton({
  className = "",
  width,
  height,
  rounded = "md",
  variant = "light",
}: SkeletonProps) {
  const roundedMap = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const gradientClass =
    variant === "dark"
      ? "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800"
      : "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200";

  return (
    <div
      className={`animate-pulse ${gradientClass} bg-[length:200%_100%] ${roundedMap[rounded]} ${className}`}
      style={{
        width,
        height,
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton pra card de linha/rota (tema claro)
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} rounded="md" />
          <Skeleton width="40%" height={12} rounded="md" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton width={60} height={20} rounded="full" />
        <Skeleton width={80} height={20} rounded="full" />
      </div>
      <div className="pt-2 border-t border-slate-100 flex justify-between">
        <Skeleton width={50} height={14} rounded="md" />
        <Skeleton width={80} height={14} rounded="md" />
      </div>
    </div>
  );
}

/**
 * 🆕 Skeleton pra card de rota (tema escuro — sidebar de rotas)
 */
export function SkeletonRotaCard() {
  return (
    <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton width={10} height={10} rounded="full" variant="dark" />
        <Skeleton width="55%" height={14} rounded="md" variant="dark" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton width={50} height={16} rounded="md" variant="dark" />
        <Skeleton width={60} height={16} rounded="md" variant="dark" />
      </div>
      <Skeleton width="80%" height={11} rounded="md" variant="dark" />
    </div>
  );
}

/**
 * Skeleton pra linha de tabela
 */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-slate-100">
      <Skeleton width={36} height={36} rounded="full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton width="40%" height={14} rounded="md" />
        <Skeleton width="60%" height={12} rounded="md" />
      </div>
      <Skeleton width={80} height={24} rounded="full" />
    </div>
  );
}

/**
 * Lista de skeletons (tema claro)
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

/**
 * 🆕 Lista de skeletons pra rotas (tema escuro)
 */
export function SkeletonRotasList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRotaCard key={i} />
      ))}
    </div>
  );
}