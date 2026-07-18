import { useState } from "react";
import { supabase } from "../../supabase";
import type { Motorista } from "../../types/database";

interface FormCriarAcessoProps {
  motorista: Motorista;
  onSucesso: (credenciais: { email: string; senha: string }) => void;
  onCancelar: () => void;
}

function gerarSenhaSegura(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";
  let senha = "";
  for (let i = 0; i < 4; i++)
    senha += letras[Math.floor(Math.random() * letras.length)];
  for (let i = 0; i < 4; i++)
    senha += numeros[Math.floor(Math.random() * numeros.length)];
  return senha;
}

export default function FormCriarAcesso({
  motorista,
  onSucesso,
  onCancelar,
}: FormCriarAcessoProps) {
  const [email, setEmail] = useState(motorista.email || "");
  const [senha, setSenha] = useState(gerarSenhaSegura());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const handleCriar = async () => {
    setErro("");

    if (!email.trim()) {
      setErro("Informe um e-mail válido");
      return;
    }
    if (senha.length < 6) {
      setErro("Senha precisa ter no mínimo 6 caracteres");
      return;
    }

    setSalvando(true);

    try {
      const emailLimpo = email.trim().toLowerCase();

      // 1) Guarda a sessão do admin ANTES de criar o motorista
      const {
        data: { session: sessaoAdmin },
      } = await supabase.auth.getSession();

      if (!sessaoAdmin) {
        throw new Error("Sessão do admin expirada. Faça login novamente.");
      }

      // 2) Cria o usuário do motorista (isso desloga o admin temporariamente)
      const { data: authData, error: erroAuth } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          data: {
            nome: motorista.nome,
            tipo: "motorista",
          },
        },
      });

      // Se deu erro, restaura sessão do admin antes de reportar
      if (erroAuth) {
        await supabase.auth.setSession({
          access_token: sessaoAdmin.access_token,
          refresh_token: sessaoAdmin.refresh_token,
        });
        if (erroAuth.message.includes("already registered")) {
          throw new Error("Este e-mail já está cadastrado no sistema");
        }
        throw erroAuth;
      }

      if (!authData.user) {
        await supabase.auth.setSession({
          access_token: sessaoAdmin.access_token,
          refresh_token: sessaoAdmin.refresh_token,
        });
        throw new Error("Não foi possível criar o usuário");
      }

      const novoUserId = authData.user.id;

      // 3) Restaura a sessão do admin ANTES do update
      // (senão o RLS bloqueia porque agora está autenticado como o motorista novo)
      await supabase.auth.setSession({
        access_token: sessaoAdmin.access_token,
        refresh_token: sessaoAdmin.refresh_token,
      });

      // Pequeno delay pra garantir que a sessão foi restaurada
      await new Promise((r) => setTimeout(r, 300));

      // 4) Vincula o novo user ao motorista (agora como admin de novo)
      const { error: erroVinculo } = await supabase
        .from("motoristas")
        .update({
          auth_user_id: novoUserId,
          email: emailLimpo,
        })
        .eq("id", motorista.id);

      if (erroVinculo) {
        console.error("Erro ao vincular:", erroVinculo);
        throw new Error(
          `Motorista criado mas não vinculado: ${erroVinculo.message}`
        );
      }

      // 5) Sucesso! Retorna as credenciais pra mostrar
      onSucesso({ email: emailLimpo, senha });
    } catch (err: any) {
      console.error("Erro ao criar acesso:", err);
      setErro(err.message || "Erro ao criar acesso");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Info do motorista */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          Criando acesso para
        </p>
        <p className="font-bold text-slate-800 text-lg">{motorista.nome}</p>
        {motorista.telefone && (
          <p className="text-sm text-slate-600 mt-1">
            Telefone: {motorista.telefone}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          E-mail de acesso
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="joao@empresa.com"
          className="border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500 mt-1.5">
          O motorista usará este e-mail para entrar no app
        </p>
      </div>

      {/* Senha */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          Senha inicial
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="flex-1 border border-slate-300 px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setSenha(gerarSenhaSegura())}
            className="border border-slate-300 bg-slate-50 text-slate-700 px-4 py-3 rounded-xl text-xs font-semibold hover:bg-slate-100 transition active:scale-95"
            title="Gerar nova senha"
          >
            Gerar
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          O motorista poderá trocar essa senha depois
        </p>
      </div>

      {/* Aviso */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        <p className="font-semibold mb-1">Importante</p>
        <p>
          Você receberá as credenciais na próxima tela. Anote ou envie
          imediatamente para o motorista — a senha não fica salva depois.
        </p>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
          {erro}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition disabled:opacity-50 active:scale-95"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCriar}
          disabled={salvando}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-500 transition disabled:opacity-50 active:scale-95"
        >
          {salvando ? "Criando..." : "Criar acesso"}
        </button>
      </div>
    </div>
  );
}