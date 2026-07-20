import { Building2, LinkIcon } from "lucide-react";

interface BadgeLinhaProps {
  nomeLinha?: string | null;
  corLinha?: string | null;
  clienteFantasia?: string | null;
  onClick?: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
}

export default function BadgeLinha({
  nomeLinha,
  corLinha,
  clienteFantasia,
  onClick,
  size = "sm",
}: BadgeLinhaProps) {
  const semLinha = !nomeLinha;

  // Sem linha vinculada = botão chamativo pra vincular
  if (semLinha) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wide hover:bg-amber-500/20 transition"
        title="Rota sem linha vinculada — clique para vincular"
      >
        <LinkIcon className="w-3 h-3" strokeWidth={2.5} />
        Vincular linha
      </button>
    );
  }

  // Com linha vinculada = badge visual
  const isMedium = size === "md";
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold transition hover:opacity-80 ${
        isMedium ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
      style={{
        backgroundColor: corLinha ? `${corLinha}20` : "#3B82F620",
        borderColor: corLinha ? `${corLinha}50` : "#3B82F650",
        color: corLinha || "#3B82F6",
      }}
      title={
        clienteFantasia
          ? `${nomeLinha} — ${clienteFantasia}`
          : `Vinculada à linha: ${nomeLinha}`
      }
    >
      <Building2 className={isMedium ? "w-3.5 h-3.5" : "w-3 h-3"} strokeWidth={2.2} />
      <span className="truncate max-w-[120px]">{nomeLinha}</span>
    </button>
  );
}