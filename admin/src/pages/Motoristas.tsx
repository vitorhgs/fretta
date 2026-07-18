import { useState, useEffect, useMemo } from "react";
import {
  Users,
  CheckCircle2,
  Ban,
  Smartphone,
  UserPlus,
  Phone,
  IdCard,
  MapPin,
  Pencil,
  Power,
  Trash2,
  KeyRound,
  Check,
  UserX,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Motorista } from "../types/database";
import Modal from "../components/Modal";
import FormMotorista from "../components/motoristas/FormMotorista";
import FormCriarAcesso from "../components/motoristas/FormCriarAcesso";
import CredenciaisGeradas from "../components/motoristas/CredenciaisGeradas";
import { formatarData } from "../lib/formatters";

import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterTabs } from "../components/ui/FilterTabs";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { Toast, type ToastType } from "../components/ui/Toast";

type FiltroStatus = "todos" | "ativos" | "inativos";
type Visualizacao = "cards" | "tabela";

export default function Motoristas() {
  const { empresa } = useAuth();
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [motoristaEditando, setMotoristaEditando] = useState<Motorista | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState<Motorista | null>(null);
  const [visualizacao, setVisualizacao] = useState<Visualizacao>("cards");
  const [mensagem, setMensagem] = useState<{ tipo: ToastType; texto: string } | null>(null);

  const [motoristaCriarAcesso, setMotoristaCriarAcesso] = useState<Motorista | null>(null);
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<{
    email: string;
    senha: string;
    nome: string;
  } | null>(null);

  useEffect(() => {
    carregarMotoristas();
  }, []);

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
        const { error } = await supabase
          .from("motoristas")
          .insert([{ ...dados, empresa_id: empresa.id }]);
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

  const stats = useMemo(
    () => ({
      total: motoristas.length,
      ativos: motoristas.filter((m) => m.ativo).length,
      inativos: motoristas.filter((m) => !m.ativo).length,
      comAcesso: motoristas.filter((m) => m.auth_user_id).length,
    }),
    [motoristas]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Motoristas"
        subtitle="Gerencie os motoristas da sua operação"
        action={{
          label: "Novo Motorista",
          icon: UserPlus,
          onClick: () => {
            setMotoristaEditando(null);
            setModalAberto(true);
          },
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={Users} color="blue" />
        <StatCard label="Ativos" value={stats.ativos} icon={CheckCircle2} color="emerald" />
        <StatCard label="Inativos" value={stats.inativos} icon={Ban} color="slate" />
        <StatCard label="Com acesso ao app" value={stats.comAcesso} icon={Smartphone} color="indigo" />
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <SearchInput
              value={busca}
              onChange={setBusca}
              placeholder="Buscar por nome, CPF, e-mail ou telefone..."
            />
          </div>

          <FilterTabs
            options={[
              { value: "todos", label: "Todos" },
              { value: "ativos", label: "Ativos" },
              { value: "inativos", label: "Inativos" },
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
          <p className="text-slate-500 mt-3">Carregando motoristas...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && motoristasFiltrados.length === 0 && (
        <Card>
          <EmptyState
            icon={UserX}
            title={
              motoristas.length === 0
                ? "Nenhum motorista cadastrado"
                : "Nenhum motorista encontrado"
            }
            description={
              motoristas.length === 0
                ? "Comece cadastrando o primeiro motorista da sua operação."
                : "Tente ajustar os filtros de busca."
            }
            action={
              motoristas.length === 0
                ? {
                    label: "Cadastrar primeiro motorista",
                    onClick: () => {
                      setMotoristaEditando(null);
                      setModalAberto(true);
                    },
                  }
                : undefined
            }
          />
        </Card>
      )}

      {/* Cards */}
      {!loading && visualizacao === "cards" && motoristasFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {motoristasFiltrados.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition hover:shadow-lg hover:border-slate-300 ${
                !m.ativo ? "opacity-70" : ""
              }`}
            >
              {/* Header do card */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex items-start gap-3">
                  <Avatar name={m.nome} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{m.nome}</h3>
                    <p className="text-xs text-slate-500 truncate">
                      {m.email || "Sem e-mail"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Badge color={m.ativo ? "green" : "slate"}>
                        {m.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      {m.auth_user_id && (
                        <Badge color="indigo" icon={Smartphone}>
                          App
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-2.5 text-sm">
                {m.telefone && (
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" strokeWidth={2} />
                    {m.telefone}
                  </div>
                )}
                {m.cnh && (
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <IdCard className="w-4 h-4 text-slate-400" strokeWidth={2} />
                    CNH {m.categoria_cnh || "-"} ·{" "}
                    <span className="font-mono text-xs">
                      {m.cnh.slice(-4).padStart(m.cnh.length, "•")}
                    </span>
                  </div>
                )}
                {m.cidade && (
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" strokeWidth={2} />
                    {m.cidade}/{m.estado}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Pencil}
                    fullWidth
                    onClick={() => {
                      setMotoristaEditando(m);
                      setModalAberto(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant={m.ativo ? "warning" : "success"}
                    size="sm"
                    icon={Power}
                    fullWidth
                    onClick={() => toggleAtivo(m)}
                  >
                    {m.ativo ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setConfirmarExclusao(m)}
                    title="Excluir"
                  />
                </div>

                {!m.auth_user_id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={KeyRound}
                    fullWidth
                    onClick={() => setMotoristaCriarAcesso(m)}
                    className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    Criar acesso ao app
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 bg-green-50 border border-green-200 text-green-700 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Tem acesso
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetarSenha(m);
                      }}
                    >
                      Resetar senha
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      {!loading && visualizacao === "tabela" && motoristasFiltrados.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Motorista</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">CNH</th>
                  <th className="px-5 py-3">Cidade</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">App</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {motoristasFiltrados.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.nome} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800">{m.nome}</p>
                          <p className="text-xs text-slate-500">
                            {m.cpf || "Sem CPF"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <p>{m.telefone || "-"}</p>
                      <p className="text-xs text-slate-400">{m.email || "-"}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
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
                    <td className="px-5 py-3 text-slate-600">
                      {m.cidade ? `${m.cidade}/${m.estado}` : "-"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={m.ativo ? "green" : "slate"}>
                        {m.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {m.auth_user_id ? (
                        <Badge color="indigo" icon={Smartphone}>
                          Sim
                        </Badge>
                      ) : (
                        <button
                          onClick={() => setMotoristaCriarAcesso(m)}
                          className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" strokeWidth={2.5} />
                          Criar
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => {
                            setMotoristaEditando(m);
                            setModalAberto(true);
                          }}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => toggleAtivo(m)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition"
                          title={m.ativo ? "Desativar" : "Ativar"}
                        >
                          <Power className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setConfirmarExclusao(m)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Modal confirmação exclusão */}
      <Modal
        aberto={!!confirmarExclusao}
        onFechar={() => setConfirmarExclusao(null)}
        titulo="Excluir motorista?"
        tamanho="sm"
      >
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2.2} />
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

      {/* Modal criar acesso */}
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

      {/* Modal credenciais geradas */}
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
        <Toast
          tipo={mensagem.tipo}
          texto={mensagem.texto}
          onFechar={() => setMensagem(null)}
        />
      )}
    </div>
  );
}