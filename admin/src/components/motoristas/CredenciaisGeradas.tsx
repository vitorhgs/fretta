import { useState } from "react";

interface CredenciaisGeradasProps {
  email: string;
  senha: string;
  nomeMotorista: string;
  onFechar: () => void;
}

export default function CredenciaisGeradas({
  email,
  senha,
  nomeMotorista,
  onFechar,
}: CredenciaisGeradasProps) {
  const [copiadoEmail, setCopiadoEmail] = useState(false);
  const [copiadoSenha, setCopiadoSenha] = useState(false);
  const [copiadoTudo, setCopiadoTudo] = useState(false);

  const copiar = async (
    texto: string,
    setter: (v: boolean) => void
  ) => {
    await navigator.clipboard.writeText(texto);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const textoCompleto = `Olá ${nomeMotorista}! Seu acesso ao app Fretta foi criado:

📧 E-mail: ${email}
🔑 Senha: ${senha}

Baixe o app Fretta Driver e faça seu login. Você pode trocar a senha depois nas configurações.`;

  return (
    <div className="p-6">
      {/* Sucesso */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          Acesso criado com sucesso!
        </h3>
        <p className="text-sm text-slate-500">
          Envie as credenciais para <strong>{nomeMotorista}</strong>
        </p>
      </div>

      {/* Email */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            E-mail
          </p>
          <button
            onClick={() => copiar(email, setCopiadoEmail)}
            className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
              copiadoEmail
                ? "bg-green-600 text-white"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {copiadoEmail ? "✅ Copiado" : "📋 Copiar"}
          </button>
        </div>
        <p className="font-mono text-sm text-slate-800 break-all">
          {email}
        </p>
      </div>

      {/* Senha */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            Senha
          </p>
          <button
            onClick={() => copiar(senha, setCopiadoSenha)}
            className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
              copiadoSenha
                ? "bg-green-600 text-white"
                : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {copiadoSenha ? "✅ Copiado" : "📋 Copiar"}
          </button>
        </div>
        <p className="font-mono text-2xl font-black text-blue-900 tracking-wider">
          {senha}
        </p>
      </div>

      {/* Copiar tudo */}
      <button
        onClick={() => copiar(textoCompleto, setCopiadoTudo)}
        className={`w-full py-3 rounded-xl font-semibold transition active:scale-95 flex items-center justify-center gap-2 mb-3 ${
          copiadoTudo
            ? "bg-green-600 text-white"
            : "bg-slate-800 text-white hover:bg-slate-700"
        }`}
      >
        {copiadoTudo
          ? "✅ Mensagem copiada!"
          : "📱 Copiar mensagem completa pro WhatsApp"}
      </button>

      {/* Aviso */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
        <p className="font-semibold mb-1">⚠️ Guarde essas informações agora!</p>
        <p>
          A senha não fica visível depois de fechar essa tela. Se precisar,
          crie um novo acesso.
        </p>
      </div>

      <button
        onClick={onFechar}
        className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition active:scale-95"
      >
        Fechar
      </button>
    </div>
  );
}