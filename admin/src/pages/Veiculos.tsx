import { useState, useEffect, useMemo } from "react";
import {
  Bus,
  Plus,
  CheckCircle2,
  Wrench,
  Moon,
  Truck,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  Shield,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Veiculo } from "../types/database";
import Modal from "../components/Modal";
import FormVeiculo from "../components/veiculos/FormVeiculo";
import {
  rotulosTipoVeiculo,
  rotulosStatusVeiculo,
  formatarData,
} from "../lib/formatters";

import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterTabs } from "../components/ui/FilterTabs";
import { EmptyState } from "../components/ui/EmptyState";
import { Toast, type ToastType } from "../components/ui/Toast";

type FiltroStatus = "todos" | "ativo" | "manutencao" | "inativo";
type Visualizacao = "cards" | "tabela";

/* =========================
   STATUS CONFIG
========================= */
const STATUS_CONFIG: Record<
  Veiculo["status"],
  {
    badge: "green" | "amber" | "slate";
    label: string;
    icon: typeof CheckCircle2;
  }
> = {
  ativo: { badge: "green", label: "Ativo", icon: CheckCircle2 },
  manutencao: { badge: "amber", label: "Manutenção", icon: Wrench },
  inativo: { badge: "slate", label: "Inativo", icon: Moon },
};

export default function Veiculos() {
  const { empresa } = useAuth();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState<Veiculo | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState<Veiculo | null>(null);
  const [visualizacao, setVisualizacao] = useState<Visualizacao>("cards");
  const [mensagem, setMensagem] = useState<{ tipo: ToastType; texto: string } | null>(null);

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const carregarVeiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("veiculos")
      .select("*")
      .order("placa");
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao carregar veículos" });
    } else if (data) {
      setVeiculos(data);
    }
    setLoading(false);
  };

  const handleSalvar = async (dados: Partial<Veiculo>) => {
    if (!empresa) {
      setMensagem({ tipo: "erro", texto: "Empresa não carregada" });
      return;
    }
    setSalvando(true);
    try {
      if (veiculoEditando) {
        const { error } = await supabase
          .from("veiculos")
          .update(dados)
          .eq("id", veiculoEditando.id);
        if (error) throw error;
        setMensagem({ tipo: "sucesso", texto: `Veículo ${dados.placa} atualizado!` });
      } else {
        const { error } = await supabase
          .from("veiculos")
          .insert([{ ...dados, empresa_id: empresa.id }]);
        if (error) throw error;
        setMensagem({ tipo: "sucesso", texto: `Veículo ${dados.placa} cadastrado!` });
      }
      setModalAberto(false);
      setVeiculoEditando(null);
      carregarVeiculos();
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: `Erro: ${err.message}` });
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatus = async (v: Veiculo, novoStatus: Veiculo["status"]) => {
    const { error } = await supabase
      .from("veiculos")
      .update({ status: novoStatus })
      .eq("id", v.id);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao alterar status" });
      return;
    }
    setMensagem({
      tipo: "sucesso",
      texto: `${v.placa} → ${rotulosStatusVeiculo[novoStatus]}`,
    });
    carregarVeiculos();
  };

  const excluirConfirmado = async () => {
    if (!confirmarExclusao) return;
    const { error } = await supabase
      .from("veiculos")
      .delete()
      .eq("id", confirmarExclusao.id);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao excluir" });
      return;
    }
    setMensagem({ tipo: "sucesso", texto: "Veículo excluído" });
    setConfirmarExclusao(null);
    carregarVeiculos();
  };

  const veiculosFiltrados = useMemo(() => {
    let lista = veiculos;
    if (filtroStatus !== "todos")
      lista = lista.filter((v) => v.status === filtroStatus);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (v) =>
          v.placa.toLowerCase().includes(t) ||
          v.modelo.toLowerCase().includes(t) ||
          v.marca?.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [veiculos, busca, filtroStatus]);

  const stats = useMemo(
    () => ({
      total: veiculos.length,
      ativos: veiculos.filter((v) => v.status === "ativo").length,
      manutencao: veiculos.filter((v) => v.status === "manutencao").length,
      inativos: veiculos.filter((v) => v.status === "inativo").length,
    }),
    [veiculos]
  );

  const alertaVencimento = (data?: string): boolean => {
    if (!data) return false;
    const dias = Math.floor(
      (new Date(data).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return dias >= 0 && dias <= 30;
  };

  const documentoVencido = (data?: string): boolean => {
    if (!data) return false;
    return new Date(data).getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Veículos"
        subtitle="Gerencie a frota da sua operação"
        action={{
          label: "Novo Veículo",
          icon: Plus,
          onClick: () => {
            setVeiculoEditando(null);
            setModalAberto(true);
          },
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={Bus} color="blue" />
        <StatCard label="Ativos" value={stats.ativos} icon={CheckCircle2} color="emerald" />
        <StatCard label="Manutenção" value={stats.manutencao} icon={Wrench} color="amber" />
        <StatCard label="Inativos" value={stats.inativos} icon={Moon} color="slate" />
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <SearchInput
              value={busca}
              onChange={setBusca}
              placeholder="Buscar por placa, modelo ou marca..."
            />
          </div>

          <FilterTabs
            options={[
              { value: "todos", label: "Todos" },
              { value: "ativo", label: "Ativos" },
              { value: "manutencao", label: "Manutenção" },
              { value: "inativo", label: "Inativos" },
            ]}
            value={filtroStatus}
            onChange={setFiltroStatus}
          />

          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setVisualizacao("cards")}
              className={`p-2 rounded-lg transition ${
                visualizacao === "cards"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600"
              }`}
              title="Visualizar em cards"
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setVisualizacao("tabela")}
              className={`p-2 rounded-lg transition ${
                visualizacao === "tabela"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600"
              }`}
              title="Visualizar em tabela"
            >
              <TableIcon className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando veículos...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && veiculosFiltrados.length === 0 && (
        <Card>
          <EmptyState
            icon={Truck}
            title={
              veiculos.length === 0
                ? "Nenhum veículo cadastrado"
                : "Nenhum veículo encontrado"
            }
            description={
              veiculos.length === 0
                ? "Comece cadastrando o primeiro veículo da sua frota."
                : "Tente ajustar os filtros de busca."
            }
            action={
              veiculos.length === 0
                ? {
                    label: "Cadastrar primeiro veículo",
                    onClick: () => {
                      setVeiculoEditando(null);
                      setModalAberto(true);
                    },
                  }
                : undefined
            }
          />
        </Card>
      )}

      {/* Cards */}
      {!loading && visualizacao === "cards" && veiculosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {veiculosFiltrados.map((v) => {
            const status = STATUS_CONFIG[v.status];
            const StatusIcon = status.icon;
            const licVencido = documentoVencido(v.vencimento_licenciamento);
            const licProximo = alertaVencimento(v.vencimento_licenciamento);
            const segVencido = documentoVencido(v.vencimento_seguro);
            const segProximo = alertaVencimento(v.vencimento_seguro);
            const temAlerta = licVencido || segVencido;

            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition hover:shadow-lg hover:border-slate-300 relative ${
                  v.status === "inativo" ? "opacity-70" : ""
                }`}
              >
                {/* Badge de alerta */}
                {temAlerta && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                    Documento vencido
                  </div>
                )}

                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/30">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md flex-shrink-0">
                      <Bus className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-black text-lg text-slate-800 tracking-wider">
                        {v.placa}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {v.marca} {v.modelo}
                      </p>
                      <div className="mt-1.5">
                        <Badge color={status.badge} icon={StatusIcon}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                        Ano
                      </p>
                      <p className="font-semibold text-slate-700">
                        {v.ano || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                        Capacidade
                      </p>
                      <p className="font-semibold text-slate-700">
                        {v.capacidade ? `${v.capacidade} pass.` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                        Tipo
                      </p>
                      <p className="font-semibold text-slate-700">
                        {rotulosTipoVeiculo[v.tipo]}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                        KM
                      </p>
                      <p className="font-semibold text-slate-700">
                        {v.km_atual?.toLocaleString("pt-BR") || "0"}
                      </p>
                    </div>
                  </div>

                  {/* Alertas de vencimento */}
                  {(licVencido || licProximo) && (
                    <div
                      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                        licVencido
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                      <span>
                        Licenciamento{" "}
                        <strong>
                          {licVencido ? "VENCIDO" : "vence em breve"}
                        </strong>
                        {" · "}
                        {formatarData(v.vencimento_licenciamento!)}
                      </span>
                    </div>
                  )}
                  {(segVencido || segProximo) && (
                    <div
                      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                        segVencido
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                      <span>
                        Seguro{" "}
                        <strong>{segVencido ? "VENCIDO" : "vence em breve"}</strong>
                        {" · "}
                        {formatarData(v.vencimento_seguro!)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Pencil}
                    fullWidth
                    onClick={() => {
                      setVeiculoEditando(v);
                      setModalAberto(true);
                    }}
                  >
                    Editar
                  </Button>

                  <select
                    value={v.status}
                    onChange={(e) =>
                      alterarStatus(v, e.target.value as Veiculo["status"])
                    }
                    className="flex-1 border border-slate-300 rounded-xl text-xs font-semibold px-2 py-2 bg-white cursor-pointer hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="inativo">Inativo</option>
                  </select>

                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setConfirmarExclusao(v)}
                    title="Excluir"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabela */}
      {!loading && visualizacao === "tabela" && veiculosFiltrados.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Veículo</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Ano/Cap.</th>
                  <th className="px-5 py-3">Documentos</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {veiculosFiltrados.map((v) => {
                  const status = STATUS_CONFIG[v.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                            <Bus className="w-5 h-5 text-white" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-slate-800">
                              {v.placa}
                            </p>
                            <p className="text-xs text-slate-500">
                              {v.marca} {v.modelo}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {rotulosTipoVeiculo[v.tipo]}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        <p>{v.ano || "-"}</p>
                        <p className="text-xs text-slate-400">
                          {v.capacidade ? `${v.capacidade} pass.` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        <p className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-slate-400" strokeWidth={2} />
                          Lic:{" "}
                          {v.vencimento_licenciamento
                            ? formatarData(v.vencimento_licenciamento)
                            : "-"}
                        </p>
                        <p className="flex items-center gap-1.5 mt-0.5">
                          <Shield className="w-3 h-3 text-slate-400" strokeWidth={2} />
                          Seg:{" "}
                          {v.vencimento_seguro
                            ? formatarData(v.vencimento_seguro)
                            : "-"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={status.badge} icon={StatusIcon}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setVeiculoEditando(v);
                              setModalAberto(true);
                            }}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setConfirmarExclusao(v)}
                            className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal cadastro/edição */}
      <Modal
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false);
          setVeiculoEditando(null);
        }}
        titulo={veiculoEditando ? "Editar Veículo" : "Novo Veículo"}
        tamanho="lg"
      >
        <FormVeiculo
          veiculo={veiculoEditando}
          onSalvar={handleSalvar}
          onCancelar={() => {
            setModalAberto(false);
            setVeiculoEditando(null);
          }}
          salvando={salvando}
        />
      </Modal>

      {/* Modal confirmação */}
      <Modal
        aberto={!!confirmarExclusao}
        onFechar={() => setConfirmarExclusao(null)}
        titulo="Excluir veículo?"
        tamanho="sm"
      >
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2.2} />
            </div>
            <p className="text-slate-700">
              Tem certeza que deseja excluir o veículo{" "}
              <span className="font-mono font-bold">
                {confirmarExclusao?.placa}
              </span>
              ?
            </p>
            <p className="text-xs text-red-600 mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setConfirmarExclusao(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={Trash2}
              onClick={excluirConfirmado}
              className="!bg-red-600 hover:!bg-red-500 !shadow-red-500/30"
            >
              Sim, excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {mensagem && (
        <Toast
          tipo={mensagem.tipo}
          texto={mensagem.texto}
          onFechar={() => setMensagem(null)}
        />
      )}
    </div>
  );
}