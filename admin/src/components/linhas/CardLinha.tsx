import {
  Building2,
  School,
  Calendar,
  MoreVertical,
  MapPin,
  Route,
  Phone,
  Mail,
} from "lucide-react";
import type { Linha } from "../../types/database";
import BadgeStatusLinha from "./BadgeStatusLinha";

interface CardLinhaProps {
  linha: Linha;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function CardLinha({ linha, onClick, onEdit }: CardLinhaProps) {
  // Ícone por categoria
  const IconeCategoria = {
    empresa: Building2,
    escola: School,
    evento: Calendar,
    outros: Route,
  }[linha.categoria || "outros"];

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      {/* Barra lateral colorida */}
      <div
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ backgroundColor: linha.cor }}
      />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${linha.cor}15` }}
            >
              <IconeCategoria size={20} style={{ color: linha.cor }} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900">
                {linha.nome}
              </h3>
              {linha.cliente_nome_fantasia && (
                <p className="truncate text-sm text-gray-500">
                  {linha.cliente_nome_fantasia}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Status + Categoria */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <BadgeStatusLinha status={linha.status} size="sm" />
          {linha.codigo && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              {linha.codigo}
            </span>
          )}
        </div>

        {/* Destino */}
        {linha.endereco_destino && (
          <div className="mb-3 flex items-start gap-2 text-sm text-gray-600">
            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-1">
              {linha.endereco_destino}
              {linha.cidade_destino && ` — ${linha.cidade_destino}`}
            </span>
          </div>
        )}

        {/* Contatos */}
        <div className="mb-4 space-y-1.5">
          {linha.contato_telefone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="text-gray-400" />
              <span>{linha.contato_telefone}</span>
            </div>
          )}
          {linha.contato_email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} className="text-gray-400" />
              <span className="truncate">{linha.contato_email}</span>
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {linha.total_rotas ?? 0}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Rotas
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {linha.total_motoristas ?? 0}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Motoristas
              </div>
            </div>
          </div>

          {linha.valor_mensal && (
            <div className="text-right">
              <div className="text-sm font-bold text-green-600">
                R$ {linha.valor_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                /mês
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}