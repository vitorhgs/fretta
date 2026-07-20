import { useEffect } from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: () => void | Promise<void>;
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const VARIANTS = {
  danger: {
    Icon: AlertTriangle,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    btnColor: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    btnColor: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    Icon: Info,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  success: {
    Icon: CheckCircle2,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    btnColor: "bg-green-600 hover:bg-green-700",
  },
};

export default function ConfirmDialog({
  aberto,
  onFechar,
  onConfirmar,
  titulo,
  descricao,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const config = VARIANTS[variant];
  const Icon = config.Icon;

  // ESC pra fechar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onFechar();
    };
    if (aberto) {
      window.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar, loading]);

  if (!aberto) return null;

  const handleConfirmar = async () => {
    await onConfirmar();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={loading ? undefined : onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <Icon size={22} className={config.iconColor} strokeWidth={2.2} />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
              {descricao && (
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {descricao}
                </p>
              )}
            </div>
            <button
              onClick={onFechar}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-30"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Ações */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
          <button
            onClick={onFechar}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white transition disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2 ${config.btnColor}`}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Aguarde...
              </>
            ) : (
              textoConfirmar
            )}
          </button>
        </div>
      </div>
    </div>
  );
}