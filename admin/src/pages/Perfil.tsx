import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit2,
  Lock,
  LogOut,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";

export default function Perfil() {
  const { usuario, empresa, signOut } = useAuth();
  const navigate = useNavigate();

  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState(usuario?.nome || "");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  // Trocar senha
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    setNome(usuario?.nome || "");
  }, [usuario]);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 4000);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const iniciais =
    usuario?.nome
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "??";

  const roleLabel: Record<string, string> = {
    owner: "Proprietário",
    admin: "Administrador",
    operador: "Operador",
  };

  const roleCor: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 border-purple-200",
    admin: "bg-blue-100 text-blue-700 border-blue-200",
    operador: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const salvarNome = async () => {
    if (!nome.trim()) {
      setMensagem({ tipo: "erro", texto: "Nome não pode ficar vazio" });
      return;
    }

    setSalvando(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      // Atualiza na tabela usuarios (se existir)
      const { error } = await supabase
        .from("usuarios")
        .update({ nome: nome.trim() })
        .eq("id", userData.user.id);

      if (error) throw error;

      // Atualiza metadata do auth também
      await supabase.auth.updateUser({
        data: { nome: nome.trim() },
      });

      setEditandoNome(false);
      setMensagem({ tipo: "sucesso", texto: "Nome atualizado com sucesso!" });

      // Recarrega pra atualizar o context
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      setMensagem({
        tipo: "erro",
        texto: err.message || "Erro ao atualizar nome",
      });
    } finally {
      setSalvando(false);
    }
  };

  const trocarSenha = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      setMensagem({
        tipo: "erro",
        texto: "A nova senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: "erro", texto: "As senhas não coincidem" });
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) throw error;

      setMensagem({
        tipo: "sucesso",
        texto: "Senha alterada com sucesso!",
      });
      setTrocandoSenha(false);
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err: any) {
      setMensagem({
        tipo: "erro",
        texto: err.message || "Erro ao trocar senha",
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Deseja realmente sair do sistema?")) return;
    await signOut();
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <User size={26} className="text-blue-600" />
          Meu Perfil
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie suas informações pessoais e conta
        </p>
      </div>

      {/* Mensagem */}
      {mensagem && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
            mensagem.tipo === "sucesso"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {mensagem.tipo === "sucesso" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <p className="text-sm font-semibold">{mensagem.texto}</p>
        </div>
      )}

      {/* Card principal — Info pessoal */}
      <Card>
        <div className="p-6">
          {/* Avatar + Nome */}
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1E56D4] to-[#09152E] rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg">
              {iniciais}
            </div>
            <div className="flex-1">
              {editandoNome ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="flex-1 max-w-md text-xl font-bold border-2 border-blue-500 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                  <button
                    onClick={salvarNome}
                    disabled={salvando}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    onClick={() => {
                      setEditandoNome(false);
                      setNome(usuario?.nome || "");
                    }}
                    disabled={salvando}
                    className="text-slate-500 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {usuario?.nome}
                  </h2>
                  <button
                    onClick={() => setEditandoNome(true)}
                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                    title="Editar nome"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
              <span
                className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${
                  roleCor[usuario?.role || ""] || roleCor.operador
                }`}
              >
                <Shield size={11} />
                {roleLabel[usuario?.role || ""] || usuario?.role}
              </span>
            </div>
          </div>

          {/* Info em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <InfoRow
              Icon={Mail}
              label="E-mail"
              value={usuario?.email || "—"}
              hint="Não pode ser alterado"
            />
            <InfoRow
              Icon={Building2}
              label="Empresa"
              value={empresa?.nome || "—"}
              hint="Sua empresa no sistema"
            />
            <InfoRow
              Icon={Shield}
              label="Perfil de acesso"
              value={roleLabel[usuario?.role || ""] || usuario?.role || "—"}
              hint="Define o que você pode fazer"
            />
            <InfoRow
              Icon={Calendar}
              label="Membro desde"
              value={
                usuario?.created_at
                  ? new Date(usuario.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
              hint="Data de cadastro"
            />
          </div>
        </div>
      </Card>

      {/* Card — Segurança */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock size={20} className="text-slate-600" strokeWidth={2.2} />
              <h3 className="font-bold text-slate-800">Segurança</h3>
            </div>
            {!trocandoSenha && (
              <button
                onClick={() => setTrocandoSenha(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Trocar senha
              </button>
            )}
          </div>

          {trocandoSenha ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                  Confirmar nova senha
                </label>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite novamente"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setTrocandoSenha(false);
                    setNovaSenha("");
                    setConfirmarSenha("");
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={trocarSenha}
                  disabled={salvando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Alterar senha"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              <p>Última alteração de senha não registrada</p>
              <p className="text-xs text-slate-500 mt-1">
                Recomendamos trocar sua senha periodicamente
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Card — Ações da conta */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-slate-600" strokeWidth={2.2} />
            <h3 className="font-bold text-slate-800">Ações da conta</h3>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => navigate("/configuracoes")}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition">
                  <Building2
                    size={18}
                    className="text-slate-600 group-hover:text-blue-600 transition"
                    strokeWidth={2.2}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Configurações da empresa
                  </p>
                  <p className="text-xs text-slate-500">
                    Editar dados da {empresa?.nome || "empresa"}
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-blue-600 transition">
                →
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 hover:border-red-400 hover:bg-red-50 transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <LogOut size={18} className="text-red-600" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">
                    Sair do sistema
                  </p>
                  <p className="text-xs text-red-500">
                    Encerrar sessão atual
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* =========================
   COMPONENTES AUXILIARES
========================= */

function InfoRow({
  Icon,
  label,
  value,
  hint,
}: {
  Icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className="text-slate-500" strokeWidth={2.2} />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
      {hint && (
        <p className="text-[10px] text-slate-400 mt-1">{hint}</p>
      )}
    </div>
  );
}