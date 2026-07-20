import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../components/Logo";

const CHAVE_EMAIL_SALVO = "@fretta:email_lembrado";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Carrega email salvo se "Lembrar de mim" foi marcado antes
  useEffect(() => {
    const emailSalvo = localStorage.getItem(CHAVE_EMAIL_SALVO);
    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrar(true);
    }
  }, []);

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

    // Salva ou remove email baseado no "Lembrar de mim"
    if (lembrar) {
      localStorage.setItem(CHAVE_EMAIL_SALVO, email);
    } else {
      localStorage.removeItem(CHAVE_EMAIL_SALVO);
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
      "E-mail de recuperação enviado! Confira sua caixa de entrada."
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#09152E] to-blue-950 p-4 relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* LOGO */}
        <div className="flex justify-center mb-8">
          <Logo size={64} variant="dark" showSlogan={true} />
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg border border-white/10">
          {!modoRecuperar ? (
            <>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                Bem-vindo de volta
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Entre com sua conta para continuar
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* E-mail */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    E-mail
                  </label>
                  <div className="relative mt-1.5">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
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

                {/* Senha */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative mt-1.5">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Lembrar de mim + Esqueci senha */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={lembrar}
                        onChange={(e) => setLembrar(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`
                          w-5 h-5 rounded-md border-2 flex items-center justify-center transition
                          ${
                            lembrar
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-slate-300 group-hover:border-blue-400"
                          }
                        `}
                      >
                        {lembrar && (
                          <CheckCircle2
                            size={12}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                      Lembrar de mim
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperar(true);
                      setErro("");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                  >
                    Esqueci senha
                  </button>
                </div>

                {/* Erro */}
                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{erro}</span>
                  </div>
                )}

                {/* Botão entrar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#1E56D4] to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition active:scale-95 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
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
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <KeyRound size={20} className="text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Recuperar senha
                </h1>
              </div>
              <p className="text-slate-500 text-sm mb-6">
                Enviaremos um link para redefinir sua senha
              </p>

              <form onSubmit={handleRecuperar} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    E-mail
                  </label>
                  <div className="relative mt-1.5">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
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
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{erro}</span>
                  </div>
                )}

                {mensagem && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{mensagem}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#1E56D4] to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition active:scale-95 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoRecuperar(false);
                    setErro("");
                    setMensagem("");
                  }}
                  className="w-full text-sm text-slate-600 hover:text-slate-800 font-medium flex items-center justify-center gap-1.5 pt-2"
                >
                  <ArrowLeft size={14} />
                  Voltar ao login
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2025 Fretta. Gestão inteligente de fretamento.
        </p>
      </div>
    </div>
  );
}