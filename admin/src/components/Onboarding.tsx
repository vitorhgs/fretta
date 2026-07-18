import { useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import Logo from "./Logo";

export default function Onboarding() {
  const { empresa, atualizarPerfil } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: empresa?.nome || "",
    telefone_suporte: "",
    cnpj: "",
  });

  const formatarTelefone = (valor: string): string => {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 10) {
      return nums
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return nums
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatarCNPJ = (valor: string): string => {
    const nums = valor.replace(/\D/g, "").slice(0, 14);
    return nums
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const salvar = async () => {
    setErro("");

    if (!form.nome.trim()) {
      setErro("Nome da empresa é obrigatório");
      return;
    }
    if (!form.telefone_suporte.trim()) {
      setErro("Telefone de suporte é obrigatório");
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase
        .from("empresas")
        .update({
          nome: form.nome.trim(),
          telefone_suporte: form.telefone_suporte,
          cnpj: form.cnpj || null,
          onboarding_completo: true,
        })
        .eq("id", empresa?.id);

      if (error) throw error;

      await atualizarPerfil();
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#09152E] to-blue-950 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size={54} variant="dark" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Complete seu cadastro
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Preencha as informações da sua empresa pra começar a usar o Fretta
          </p>

          {/* Indicador de progresso */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1.5 rounded-full bg-blue-500" />
            <div className="flex-1 h-1.5 rounded-full bg-blue-500" />
            <div className="flex-1 h-1.5 rounded-full bg-slate-200" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Nome da empresa *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1 border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transportes XYZ"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Telefone de suporte *
              </label>
              <input
                type="text"
                value={form.telefone_suporte}
                onChange={(e) =>
                  setForm({
                    ...form,
                    telefone_suporte: formatarTelefone(e.target.value),
                  })
                }
                className="mt-1 border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(11) 99999-9999"
              />
              <p className="text-xs text-slate-400 mt-1">
                Este telefone aparece no app do motorista
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                CNPJ (opcional)
              </label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) =>
                  setForm({ ...form, cnpj: formatarCNPJ(e.target.value) })
                }
                className="mt-1 border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00.000.000/0000-00"
              />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {erro}
              </div>
            )}

            <button
              onClick={salvar}
              disabled={salvando}
              className="w-full bg-gradient-to-r from-[#1E56D4] to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition active:scale-95 shadow-lg shadow-blue-500/30 mt-4"
            >
              {salvando ? "Salvando..." : "Continuar"}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            Você pode ajustar essas informações depois em Configurações
          </p>
        </div>
      </div>
    </div>
  );
}