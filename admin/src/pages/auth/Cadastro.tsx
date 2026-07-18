import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../components/Logo";

export default function Cadastro() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // Força da senha (visual)
  const forcaSenha = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return 4;
    return 3;
  };

  const forca = forcaSenha();
  const forcaLabel = ["", "Fraca", "Média", "Boa", "Forte"];
  const forcaCor = [
    "bg-slate-200",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!aceitouTermos) {
      setErro("Você precisa aceitar os Termos de Uso");
      return;
    }

    if (password !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setErro("A senha precisa ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, nome, empresa);
    setLoading(false);

    if (error) {
      setErro(
        error.message === "User already registered"
          ? "Este e-mail já está cadastrado"
          : error.message
      );
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#09152E] to-blue-950 p-4 relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Logo size={54} variant="dark" />
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Criar conta 🚀
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Cadastre sua empresa em 1 minuto
          </p>

          <form onSubmit={handleCadastro} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Seu nome
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  👤
                </span>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Nome da empresa
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🏢
                </span>
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Transportes XYZ"
                  className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

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
                  className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                  placeholder="Mínimo 6 caracteres"
                  className="border border-slate-300 pl-10 pr-12 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  {mostrarSenha ? "🙈" : "👁"}
                </button>
              </div>

              {/* Indicador de força da senha */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition ${
                          n <= forca ? forcaCor[forca] : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Força da senha: <span className="font-semibold">{forcaLabel[forca]}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Confirmar senha
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔐
                </span>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              {confirmarSenha && password !== confirmarSenha && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">
                  ⚠️ As senhas não coincidem
                </p>
              )}
              {confirmarSenha && password === confirmarSenha && password.length >= 6 && (
                <p className="text-[10px] text-green-600 mt-1 font-medium">
                  ✅ As senhas coincidem
                </p>
              )}
            </div>

            {/* Termos de uso */}
            <label className="flex items-start gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-0.5 accent-blue-600 w-4 h-4"
              />
              <span className="text-xs text-slate-600">
                Eu li e aceito os{" "}
                <a href="#" className="text-blue-600 hover:underline font-semibold">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a href="#" className="text-blue-600 hover:underline font-semibold">
                  Política de Privacidade
                </a>
              </span>
            </label>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <span>❌</span>
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1E56D4] to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition active:scale-95 shadow-lg shadow-blue-500/30 mt-4"
            >
              {loading ? "Criando conta..." : "Criar conta grátis"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
            Já tem conta?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2025 Fretta. Gestão inteligente de rotas.
        </p>
      </div>
    </div>
  );
}