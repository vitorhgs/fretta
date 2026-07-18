import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Veiculo } from "../types/database";
import Modal from "../components/Modal";
import FormVeiculo from "../components/veiculos/FormVeiculo";
import {
  rotulosTipoVeiculo,
  iconesTipoVeiculo,
  rotulosStatusVeiculo,
  coresStatusVeiculo,
  formatarData,
} from "../lib/formatters";

export default function Veiculos() {
  const { empresa } = useAuth();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativo" | "manutencao" | "inativo"
  >("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState<Veiculo | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState<Veiculo | null>(
    null
  );
  const [visualizacao, setVisualizacao] = useState<"cards" | "tabela">("cards");
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  useEffect(() => {
    carregarVeiculos();
  }, []);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3500);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

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
        setMensagem({
          tipo: "sucesso",
          texto: `Veículo ${dados.placa} atualizado!`,
        });
      } else {
        const { error } = await supabase
          .from("veiculos")
          .insert([{ ...dados, empresa_id: empresa.id }]);
        if (error) throw error;
        setMensagem({
          tipo: "sucesso",
          texto: `Veículo ${dados.placa} cadastrado!`,
        });
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

  // Verifica se documento está próximo do vencimento (30 dias)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🚌 Veículos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie a frota da sua operação
          </p>
        </div>
        <button
          onClick={() => {
            setVeiculoEditando(null);
            setModalAberto(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition active:scale-95 shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <span>➕</span> Novo Veículo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", valor: stats.total, icone: "🚌", cor: "blue" },
          { label: "Ativos", valor: stats.ativos, icone: "✅", cor: "green" },
          {
            label: "Manutenção",
            valor: stats.manutencao,
            icone: "🔧",
            cor: "amber",
          },
          {
            label: "Inativos",
            valor: stats.inativos,
            icone: "💤",
            cor: "slate",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  s.cor === "blue"
                    ? "bg-blue-100"
                    : s.cor === "green"
                    ? "bg-green-100"
                    : s.cor === "amber"
                    ? "bg-amber-100"
                    : "bg-slate-100"
                }`}
              >
                {s.icone}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                  {s.label}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    s.cor === "blue"
                      ? "text-blue-600"
                      : s.cor === "green"
                      ? "text-green-600"
                      : s.cor === "amber"
                      ? "text-amber-600"
                      : "text-slate-500"
                  }`}
                >
                  {s.valor}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por placa, modelo ou marca..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { v: "todos", l: "Todos" },
            { v: "ativo", l: "Ativos" },
            { v: "manutencao", l: "Manutenção" },
            { v: "inativo", l: "Inativos" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltroStatus(f.v as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroStatus === f.v
                  ? "bg-white text-blue-700 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setVisualizacao("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              visualizacao === "cards"
                ? "bg-white text-blue-700 shadow"
                : "text-slate-600"
            }`}
          >
            📇
          </button>
          <button
            onClick={() => setVisualizacao("tabela")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              visualizacao === "tabela"
                ? "bg-white text-blue-700 shadow"
                : "text-slate-600"
            }`}
          >
            📊
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando veículos...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && veiculosFiltrados.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <div className="text-6xl mb-3">🚌</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {veiculos.length === 0
              ? "Nenhum veículo cadastrado"
              : "Nenhum veículo encontrado"}
          </h3>
          <p className="text-slate-500 mb-4 text-sm">
            {veiculos.length === 0
              ? "Comece cadastrando o primeiro veículo da sua frota."
              : "Tente ajustar os filtros de busca."}
          </p>
          {veiculos.length === 0 && (
            <button
              onClick={() => {
                setVeiculoEditando(null);
                setModalAberto(true);
              }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition"
            >
              ➕ Cadastrar primeiro veículo
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {!loading &&
        visualizacao === "cards" &&
        veiculosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {veiculosFiltrados.map((v) => {
              const cores = coresStatusVeiculo[v.status];
              const licVencido = documentoVencido(v.vencimento_licenciamento);
              const licProximo = alertaVencimento(v.vencimento_licenciamento);
              const segVencido = documentoVencido(v.vencimento_seguro);
              const segProximo = alertaVencimento(v.vencimento_seguro);
              const temAlerta = licVencido || segVencido;

              return (
                <div
                  key={v.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition hover:shadow-lg relative ${
                    v.status === "inativo" ? "opacity-70" : ""
                  }`}
                >
                  {/* Badge de alerta */}
                  {temAlerta && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10">
                      ⚠️ Documento vencido
                    </div>
                  )}

                  {/* Header */}
                  <div className="p-5 border-b bg-gradient-to-br from-slate-50 to-blue-50/30">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl shadow-md">
                        {iconesTipoVeiculo[v.tipo]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-black text-lg text-slate-800 tracking-wider">
                          {v.placa}
                        </p>
                        <p className="text-sm text-slate-600 truncate">
                          {v.marca} {v.modelo}
                        </p>
                        <span
                          className={`inline-block mt-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cores.bg} ${cores.text} border ${cores.border}`}
                        >
                          ● {rotulosStatusVeiculo[v.status]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-1.5 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-slate-600">
                        <span className="text-xs text-slate-400">Ano</span>
                        <p className="font-semibold">{v.ano || "-"}</p>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-xs text-slate-400">
                          Capacidade
                        </span>
                        <p className="font-semibold">
                          {v.capacidade ? `${v.capacidade} pass.` : "-"}
                        </p>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-xs text-slate-400">Tipo</span>
                        <p className="font-semibold">
                          {rotulosTipoVeiculo[v.tipo]}
                        </p>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-xs text-slate-400">KM</span>
                        <p className="font-semibold">
                          {v.km_atual?.toLocaleString("pt-BR") || "0"}
                        </p>
                      </div>
                    </div>

                    {/* Alertas de vencimento */}
                    {(licVencido || licProximo) && (
                      <div
                        className={`text-xs px-2 py-1 rounded ${
                          licVencido
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        📋 Licenciamento{" "}
                        {licVencido ? "VENCIDO" : "vence em breve"}:{" "}
                        {formatarData(v.vencimento_licenciamento!)}
                      </div>
                    )}
                    {(segVencido || segProximo) && (
                      <div
                        className={`text-xs px-2 py-1 rounded ${
                          segVencido
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        🛡️ Seguro {segVencido ? "VENCIDO" : "vence em breve"}:{" "}
                        {formatarData(v.vencimento_seguro!)}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="p-3 border-t bg-slate-50 flex gap-2">
                    <button
                      onClick={() => {
                        setVeiculoEditando(v);
                        setModalAberto(true);
                      }}
                      className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 transition active:scale-95"
                    >
                      ✏️ Editar
                    </button>
                    <select
                      value={v.status}
                      onChange={(e) =>
                        alterarStatus(v, e.target.value as Veiculo["status"])
                      }
                      className="flex-1 border border-slate-300 rounded-lg text-xs font-semibold px-2 py-2 bg-white cursor-pointer hover:bg-slate-100"
                    >
                      <option value="ativo">✅ Ativo</option>
                      <option value="manutencao">🔧 Manutenção</option>
                      <option value="inativo">🚫 Inativo</option>
                    </select>
                    <button
                      onClick={() => setConfirmarExclusao(v)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition active:scale-95"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Tabela */}
      {!loading &&
        visualizacao === "tabela" &&
        veiculosFiltrados.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-xs font-bold text-slate-500 uppercase">
                    <th className="px-4 py-3">Veículo</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Ano/Capacidade</th>
                    <th className="px-4 py-3">Documentos</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {veiculosFiltrados.map((v) => {
                    const cores = coresStatusVeiculo[v.status];
                    return (
                      <tr
                        key={v.id}
                        className="border-b hover:bg-slate-50 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {iconesTipoVeiculo[v.tipo]}
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
                        <td className="px-4 py-3 text-slate-600">
                          {rotulosTipoVeiculo[v.tipo]}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{v.ano || "-"}</p>
                          <p className="text-xs text-slate-400">
                            {v.capacidade ? `${v.capacidade} pass.` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          <p>
                            Lic:{" "}
                            {v.vencimento_licenciamento
                              ? formatarData(v.vencimento_licenciamento)
                              : "-"}
                          </p>
                          <p>
                            Seg:{" "}
                            {v.vencimento_seguro
                              ? formatarData(v.vencimento_seguro)
                              : "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${cores.bg} ${cores.text}`}
                          >
                            {rotulosStatusVeiculo[v.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => {
                                setVeiculoEditando(v);
                                setModalAberto(true);
                              }}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setConfirmarExclusao(v)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto mb-3">
              ⚠️
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
            <button
              onClick={() => setConfirmarExclusao(null)}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={excluirConfirmado}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-500 transition active:scale-95"
            >
              Sim, excluir
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {mensagem && (
        <div
          className={`fixed top-6 right-6 z-[3000] px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm ${
            mensagem.tipo === "sucesso"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {mensagem.tipo === "sucesso" ? "✅ " : "❌ "}
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}