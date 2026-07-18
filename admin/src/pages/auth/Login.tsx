import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../components/Logo";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos"
          : error.message
      );
      return;
    }

    navigate("/");
  };

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setLoading(true);

    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setMensagem(
      "📧 E-mail de recuperação enviado! Confira sua caixa de entrada."
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#09152E] to-blue-950 p-4 relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* LOGO */}
        <div className="flex justify-center mb-8">
          <Logo size={60} variant="dark" />
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg">
          {!modoRecuperar ? (
            <>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                Bem-vindo de volta 👋
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Entre com sua conta para continuar
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    E-mail
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      📧
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="border border-slate-300 pl-10 pr-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      🔒
                    </span>
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border border-slate-300 pl-10 pr-12 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                    >
                      {mostrarSenha ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                    <span>❌</span>
                    <span>{erro}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#1E56D4] to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition active:scale-95 shadow-lg shadow-blue-500/30"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperar(true);
                      setErro("");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
                Não tem conta?{" "}
                <Link
                  to="/cadastro"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Cadastre-se grátis
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                Recuperar senha 🔑
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Enviaremos um link para redefinir sua senha
              </p>

              <form onSubmit={handleRecuperar} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    E-mail
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      📧
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="border border-slate-300 pl-10 pr-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                    <span>❌</span>
                    <span>{erro}</span>
                  </div>
                )}

                {mensagem && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {mensagem}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#1E56D4] to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition active:scale-95 shadow-lg shadow-blue-500/30"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoRecuperar(false);
                    setErro("");
                    setMensagem("");
                  }}
                  className="w-full text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  ← Voltar ao login
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2025 Fretta. Gestão inteligente de rotas.
        </p>
      </div>
    </div>
  );
}