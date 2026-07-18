import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Motorista } from "../types/database";
import Modal from "../components/Modal";
import FormMotorista from "../components/motoristas/FormMotorista";
import FormCriarAcesso from "../components/motoristas/FormCriarAcesso";
import CredenciaisGeradas from "../components/motoristas/CredenciaisGeradas";
import { iniciaisNome, formatarData } from "../lib/formatters";

export default function Motoristas() {
  const { empresa } = useAuth();
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [motoristaEditando, setMotoristaEditando] = useState<Motorista | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState<Motorista | null>(null);
  const [visualizacao, setVisualizacao] = useState<"cards" | "tabela">("cards");
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // 🆕 Estados do fluxo "Criar acesso ao app"
  const [motoristaCriarAcesso, setMotoristaCriarAcesso] = useState<Motorista | null>(null);
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<{
    email: string;
    senha: string;
    nome: string;
  } | null>(null);

  useEffect(() => {
    carregarMotoristas();
  }, []);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3500);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const carregarMotoristas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("motoristas")
      .select("*")
      .order("nome");

    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao carregar motoristas" });
    } else if (data) {
      setMotoristas(data);
    }
    setLoading(false);
  };  

  

  const handleSalvar = async (dados: Partial<Motorista>) => {
    if (!empresa) {
      setMensagem({ tipo: "erro", texto: "Empresa não carregada" });
      return;
    }

    setSalvando(true);
    try {
      if (motoristaEditando) {
        const { error } = await supabase
          .from("motoristas")
          .update(dados)
          .eq("id", motoristaEditando.id);
        if (error) throw error;
        setMensagem({ tipo: "sucesso", texto: `Motorista "${dados.nome}" atualizado!` });
      } else {
        const { error } = await supabase.from("motoristas").insert([
          { ...dados, empresa_id: empresa.id },
        ]);
        if (error) throw error;
        setMensagem({ tipo: "sucesso", texto: `Motorista "${dados.nome}" cadastrado!` });
      }
      setModalAberto(false);
      setMotoristaEditando(null);
      carregarMotoristas();
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: `Erro: ${err.message}` });
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (m: Motorista) => {
    const { error } = await supabase
      .from("motoristas")
      .update({ ativo: !m.ativo })
      .eq("id", m.id);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao alterar status" });
      return;
    }
    setMensagem({
      tipo: "sucesso",
      texto: `${m.nome} ${!m.ativo ? "ativado" : "desativado"}`,
    });
    carregarMotoristas();
  };

  const resetarSenha = async (m: Motorista) => {
  if (!m.auth_user_id || !m.email) {
    setMensagem({ tipo: "erro", texto: "Motorista não tem acesso ao app" });
    return;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(m.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) throw error;

    setMensagem({
      tipo: "sucesso",
      texto: `Email de redefinição enviado para ${m.email}`,
    });
  } catch (err: any) {
    setMensagem({ tipo: "erro", texto: `Erro: ${err.message}` });
  }
};

  const excluirConfirmado = async () => {
    if (!confirmarExclusao) return;
    const { error } = await supabase
      .from("motoristas")
      .delete()
      .eq("id", confirmarExclusao.id);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao excluir" });
      return;
    }
    setMensagem({ tipo: "sucesso", texto: "Motorista excluído" });
    setConfirmarExclusao(null);
    carregarMotoristas();
  };

  const motoristasFiltrados = useMemo(() => {
    let lista = motoristas;
    if (filtroStatus === "ativos") lista = lista.filter((m) => m.ativo);
    if (filtroStatus === "inativos") lista = lista.filter((m) => !m.ativo);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (m) =>
          m.nome.toLowerCase().includes(t) ||
          m.email?.toLowerCase().includes(t) ||
          m.cpf?.includes(t) ||
          m.telefone?.includes(t)
      );
    }
    return lista;
  }, [motoristas, busca, filtroStatus]);

  const stats = useMemo(() => ({
    total: motoristas.length,
    ativos: motoristas.filter((m) => m.ativo).length,
    inativos: motoristas.filter((m) => !m.ativo).length,
    comAcesso: motoristas.filter((m) => m.auth_user_id).length,
  }), [motoristas]);

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Motoristas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie os motoristas da sua operação
          </p>
        </div>
        <button
          onClick={() => {
            setMotoristaEditando(null);
            setModalAberto(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition active:scale-95 shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <span>+</span> Novo Motorista
        </button>
      </div>

      {/* Cards de stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Total
              </p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Ativos
              </p>
              <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Inativos
              </p>
              <p className="text-2xl font-bold text-slate-500">{stats.inativos}</p>
            </div>
          </div>
        </div>

        {/* 🆕 Card de acessos ao app */}
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Com acesso ao app
              </p>
              <p className="text-2xl font-bold text-indigo-600">{stats.comAcesso}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { v: "todos", l: "Todos" },
            { v: "ativos", l: "Ativos" },
            { v: "inativos", l: "Inativos" },
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
            title="Cards"
          >
            Cards
          </button>
          <button
            onClick={() => setVisualizacao("tabela")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              visualizacao === "tabela"
                ? "bg-white text-blue-700 shadow"
                : "text-slate-600"
            }`}
            title="Tabela"
          >
            Tabela
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando motoristas...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && motoristasFiltrados.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <div className="text-6xl mb-3">👤</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {motoristas.length === 0
              ? "Nenhum motorista cadastrado"
              : "Nenhum motorista encontrado"}
          </h3>
          <p className="text-slate-500 mb-4 text-sm">
            {motoristas.length === 0
              ? "Comece cadastrando o primeiro motorista da sua operação."
              : "Tente ajustar os filtros de busca."}
          </p>
          {motoristas.length === 0 && (
            <button
              onClick={() => {
                setMotoristaEditando(null);
                setModalAberto(true);
              }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition"
            >
              Cadastrar primeiro motorista
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {!loading && visualizacao === "cards" && motoristasFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {motoristasFiltrados.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition hover:shadow-lg ${
                !m.ativo ? "opacity-70" : ""
              }`}
            >
              {/* Header */}
              <div className="p-5 border-b bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {iniciaisNome(m.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">
                      {m.nome}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {m.email || "Sem e-mail"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          m.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {m.ativo ? "Ativo" : "Inativo"}
                      </span>
                      {/* 🆕 Badge de acesso ao app */}
                      {m.auth_user_id && (
                        <span
                          className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"
                          title="Tem acesso ao app do motorista"
                        >
                          App
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-2 text-sm">
                {m.telefone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {m.telefone}
                  </div>
                )}
                {m.cnh && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M8 16h.01M12 12h4M12 16h4" />
                    </svg>
                    CNH {m.categoria_cnh || "-"} ·{" "}
                    {m.cnh.slice(-4).padStart(m.cnh.length, "•")}
                  </div>
                )}
                {m.cidade && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {m.cidade}/{m.estado}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="p-3 border-t bg-slate-50 space-y-2">
                {/* Linha 1: Editar + Desativar/Ativar + Excluir */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMotoristaEditando(m);
                      setModalAberto(true);
                    }}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 transition active:scale-95"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition active:scale-95 ${
                      m.ativo
                        ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {m.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => setConfirmarExclusao(m)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition active:scale-95"
                    title="Excluir"
                  >
                    Excluir
                  </button>
                </div>

                {/* 🆕 Linha 2: Acesso ao app */}
                {!m.auth_user_id && (
                  <button
                    onClick={() => setMotoristaCriarAcesso(m)}
                    className="w-full bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg text-xs font-semibold hover:bg-blue-100 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Criar acesso ao app
                  </button>
                )}
            {m.auth_user_id && (
  <div className="flex gap-2">
    <div className="flex-1 bg-green-50 border border-green-200 text-green-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Tem acesso
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        resetarSenha(m);
      }}
      className="bg-slate-50 border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 transition active:scale-95"
    >
      Resetar senha
    </button>
  </div>
)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      {!loading && visualizacao === "tabela" && motoristasFiltrados.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr className="text-left text-xs font-bold text-slate-500 uppercase">
                  <th className="px-4 py-3">Motorista</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">CNH</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">App</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {motoristasFiltrados.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">
                          {iniciaisNome(m.nome)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{m.nome}</p>
                          <p className="text-xs text-slate-500">
                            {m.cpf || "Sem CPF"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{m.telefone || "-"}</p>
                      <p className="text-xs text-slate-400">{m.email || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.cnh ? (
                        <div>
                          <p className="font-mono text-xs">{m.cnh}</p>
                          <p className="text-[10px] text-slate-400">
                            Cat. {m.categoria_cnh} · até{" "}
                            {formatarData(m.validade_cnh || "")}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.cidade ? `${m.cidade}/${m.estado}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          m.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {m.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    {/* 🆕 Coluna App */}
                    <td className="px-4 py-3">
                      {m.auth_user_id ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                          Sim
                        </span>
                      ) : (
                        <button
                          onClick={() => setMotoristaCriarAcesso(m)}
                          className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                        >
                          Criar
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => {
                            setMotoristaEditando(m);
                            setModalAberto(true);
                          }}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition text-xs font-semibold"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleAtivo(m)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition text-xs font-semibold"
                          title={m.ativo ? "Desativar" : "Ativar"}
                        >
                          {m.ativo ? "Off" : "On"}
                        </button>
                        <button
                          onClick={() => setConfirmarExclusao(m)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition text-xs font-semibold"
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de cadastro/edição */}
      <Modal
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false);
          setMotoristaEditando(null);
        }}
        titulo={motoristaEditando ? "Editar Motorista" : "Novo Motorista"}
        tamanho="lg"
      >
        <FormMotorista
          motorista={motoristaEditando}
          onSalvar={handleSalvar}
          onCancelar={() => {
            setModalAberto(false);
            setMotoristaEditando(null);
          }}
          salvando={salvando}
        />
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        aberto={!!confirmarExclusao}
        onFechar={() => setConfirmarExclusao(null)}
        titulo="Excluir motorista?"
        tamanho="sm"
      >
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto mb-3">
              !
            </div>
            <p className="text-slate-700">
              Tem certeza que deseja excluir{" "}
              <span className="font-bold">"{confirmarExclusao?.nome}"</span>?
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

      {/* 🆕 Modal: Criar Acesso */}
      <Modal
        aberto={!!motoristaCriarAcesso}
        onFechar={() => setMotoristaCriarAcesso(null)}
        titulo="Criar acesso ao app"
        tamanho="md"
      >
        {motoristaCriarAcesso && (
          <FormCriarAcesso
            motorista={motoristaCriarAcesso}
            onSucesso={(cred) => {
              setCredenciaisGeradas({
                ...cred,
                nome: motoristaCriarAcesso.nome,
              });
              setMotoristaCriarAcesso(null);
              carregarMotoristas();
            }}
            onCancelar={() => setMotoristaCriarAcesso(null)}
          />
        )}
      </Modal>

      {/* 🆕 Modal: Credenciais Geradas */}
      <Modal
        aberto={!!credenciaisGeradas}
        onFechar={() => setCredenciaisGeradas(null)}
        titulo=""
        tamanho="md"
      >
        {credenciaisGeradas && (
          <CredenciaisGeradas
            email={credenciaisGeradas.email}
            senha={credenciaisGeradas.senha}
            nomeMotorista={credenciaisGeradas.nome}
            onFechar={() => setCredenciaisGeradas(null)}
          />
        )}
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
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}