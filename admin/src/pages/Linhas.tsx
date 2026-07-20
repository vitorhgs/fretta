import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Building2 } from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Linha } from "../types/database";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import CardLinha from "../components/linhas/CardLinha";
import FormLinha from "../components/linhas/FormLinha";
import { SkeletonList } from "../components/ui/Skeleton";

export default function Linhas() {
  const { empresa } = useAuth();
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "ativa" | "pausada" | "encerrada">("todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [linhaEditando, setLinhaEditando] = useState<Linha | null>(null);

  // 🆕 Exclusão
  const [linhaExcluir, setLinhaExcluir] = useState<Linha | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);

    // Busca linhas
    const { data: linhasData } = await supabase
      .from("linhas")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false });

    if (!linhasData) {
      setLoading(false);
      return;
    }

    // Conta rotas por linha
    const linhasComContagem = await Promise.all(
      linhasData.map(async (linha) => {
        const { count: totalRotas } = await supabase
          .from("rotas")
          .select("*", { count: "exact", head: true })
          .eq("linha_id", linha.id);

        return {
          ...linha,
          total_rotas: totalRotas || 0,
          total_motoristas: 0,
          total_veiculos: 0,
        };
      })
    );

    setLinhas(linhasComContagem);
    setLoading(false);
  }, [empresa]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const linhasFiltradas = linhas.filter((l) => {
    const passaBusca =
      l.nome.toLowerCase().includes(busca.toLowerCase()) ||
      l.cliente_nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) ||
      l.codigo?.toLowerCase().includes(busca.toLowerCase());
    const passaStatus = filtroStatus === "todas" || l.status === filtroStatus;
    return passaBusca && passaStatus;
  });

  const abrirNova = () => {
    setLinhaEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (linha: Linha) => {
    setLinhaEditando(linha);
    setModalAberto(true);
  };

  const onSalvar = () => {
    setModalAberto(false);
    carregar();
  };

  // 🆕 Excluir linha
  const excluirLinha = async () => {
    if (!linhaExcluir) return;
    setExcluindo(true);

    const { error } = await supabase
      .from("linhas")
      .delete()
      .eq("id", linhaExcluir.id);

    setExcluindo(false);

    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }

    setLinhaExcluir(null);
    carregar();
  };

  const totais = {
    todas: linhas.length,
    ativa: linhas.filter((l) => l.status === "ativa").length,
    pausada: linhas.filter((l) => l.status === "pausada").length,
    encerrada: linhas.filter((l) => l.status === "encerrada").length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Building2 size={28} className="text-blue-600" />
            Linhas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os clientes e contratos de fretamento
          </p>
        </div>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition"
        >
          <Plus size={18} />
          Nova linha
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nome, cliente ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { valor: "todas", label: "Todas" },
            { valor: "ativa", label: "Ativas" },
            { valor: "pausada", label: "Pausadas" },
            { valor: "encerrada", label: "Encerradas" },
          ].map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltroStatus(f.valor as any)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                filtroStatus === f.valor
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs text-gray-400">
                {totais[f.valor as keyof typeof totais]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonList count={6} />
        </div>
      ) : linhasFiltradas.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center bg-white">
          <Building2 size={48} className="mx-auto text-gray-300" />
          <p className="mt-3 font-semibold text-gray-700">
            {linhas.length === 0 ? "Nenhuma linha cadastrada" : "Nenhuma linha encontrada"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {linhas.length === 0
              ? "Cadastre sua primeira linha para começar"
              : "Ajuste os filtros ou faça uma nova busca"}
          </p>
          {linhas.length === 0 && (
            <button
              onClick={abrirNova}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-md"
            >
              <Plus size={18} />
              Cadastrar linha
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {linhasFiltradas.map((linha) => (
            <CardLinha
              key={linha.id}
              linha={linha}
              onEdit={() => abrirEdicao(linha)}
              onClick={() => abrirEdicao(linha)}
            />
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={linhaEditando ? "Editar linha" : "Nova linha"}
        tamanho="xl"
      >
        <FormLinha
          linha={linhaEditando}
          empresaId={empresa!.id}
          onSalvar={onSalvar}
          onCancelar={() => setModalAberto(false)}
        />
      </Modal>

      {/* 🆕 Confirmação de exclusão */}
      <ConfirmDialog
        aberto={!!linhaExcluir}
        onFechar={() => setLinhaExcluir(null)}
        onConfirmar={excluirLinha}
        titulo="Excluir linha?"
        descricao={
          linhaExcluir
            ? `A linha "${linhaExcluir.nome}" será excluída permanentemente. As rotas vinculadas ficarão sem cliente. Esta ação não pode ser desfeita.`
            : ""
        }
        textoConfirmar="Sim, excluir"
        textoCancelar="Cancelar"
        variant="danger"
        loading={excluindo}
      />
    </div>
  );
}