import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "sucesso" | "erro" | "info" | "aviso";

interface ToastProps {
  tipo: ToastType;
  texto: string;
  onFechar: () => void;
  duracao?: number;
}

const CONFIG: Record<
  ToastType,
  { icon: typeof CheckCircle2; bg: string; iconColor: string }
> = {
  sucesso: {
    icon: CheckCircle2,
    bg: "bg-green-600",
    iconColor: "text-white",
  },
  erro: {
    icon: XCircle,
    bg: "bg-red-600",
    iconColor: "text-white",
  },
  info: {
    icon: Info,
    bg: "bg-blue-600",
    iconColor: "text-white",
  },
  aviso: {
    icon: AlertTriangle,
    bg: "bg-amber-500",
    iconColor: "text-white",
  },
};

export function Toast({ tipo, texto, onFechar, duracao = 3500 }: ToastProps) {
  const { icon: Icon, bg, iconColor } = CONFIG[tipo];

  useEffect(() => {
    const t = setTimeout(onFechar, duracao);
    return () => clearTimeout(t);
  }, [onFechar, duracao]);

  return (
    <div
      className={`
        fixed top-6 right-6 z-[3000] flex items-center gap-3
        px-4 py-3 pr-3 rounded-xl shadow-2xl text-white font-medium text-sm
        min-w-[280px] max-w-md
        animate-in slide-in-from-top-2 fade-in duration-300
        ${bg}
      `}
    >
      <Icon className={`w-5 h-5 ${iconColor} shrink-0`} strokeWidth={2.2} />
      <span className="flex-1">{texto}</span>
      <button
        onClick={onFechar}
        className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition shrink-0"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}