import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Configuracoes() {
  const { empresa, atualizarPerfil } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    telefone_suporte: "",
    email_suporte: "",
    endereco: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    if (empresa) {
      carregarDados();
    }
  }, [empresa]);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3500);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const carregarDados = async () => {
    if (!empresa) return;

    const { data } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresa.id)
      .single();

    if (data) {
      setForm({
        nome: data.nome || "",
        cnpj: data.cnpj || "",
        telefone_suporte: data.telefone_suporte || "",
        email_suporte: data.email_suporte || "",
        endereco: data.endereco || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
      });
    }
  };

  const formatarCNPJ = (valor: string): string => {
    const nums = valor.replace(/\D/g, "").slice(0, 14);
    return nums
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

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

  const salvar = async () => {
    if (!empresa) return;

    if (!form.nome.trim()) {
      setMensagem({ tipo: "erro", texto: "Nome da empresa é obrigatório" });
      return;
    }
    if (!form.telefone_suporte.trim()) {
      setMensagem({
        tipo: "erro",
        texto: "Telefone de suporte é obrigatório",
      });
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase
        .from("empresas")
        .update({
          nome: form.nome.trim(),
          cnpj: form.cnpj || null,
          telefone_suporte: form.telefone_suporte || null,
          email_suporte: form.email_suporte || null,
          endereco: form.endereco || null,
          cidade: form.cidade || null,
          estado: form.estado || null,
          onboarding_completo: true,
        })
        .eq("id", empresa.id);

      if (error) throw error;

      await atualizarPerfil();
      setMensagem({
        tipo: "sucesso",
        texto: "Configurações salvas com sucesso!",
      });
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: `Erro: ${err.message}` });
    } finally {
      setSalvando(false);
    }
  };

  const estados = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Configurações da Empresa
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Informações da sua empresa e dados de contato
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Seção: Dados da empresa */}
        <div className="p-6 border-b">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            Dados da Empresa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Nome fantasia *
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
              <label className="text-xs font-semibold text-slate-600 uppercase">
                CNPJ
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

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Estado
              </label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="mt-1 border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione</option>
                {estados.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Cidade
              </label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                className="mt-1 border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="São Paulo"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Endereço
              </label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) =>
                  setForm({ ...form, endereco: e.target.value })
                }
                className="mt-1 border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rua das Flores, 123"
              />
            </div>
          </div>
        </div>

        {/* Seção: Contato/Suporte */}
        <div className="p-6 border-b">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            Contato e Suporte
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Estas informações aparecem no app do motorista quando ele precisa
            de ajuda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">
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
                O motorista liga pra esse número ao tocar "Contatar
                administrador"
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Email de suporte
              </label>
              <input
                type="email"
                value={form.email_suporte}
                onChange={(e) =>
                  setForm({ ...form, email_suporte: e.target.value })
                }
                className="mt-1 border border-slate-300 px-4 py-3 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="suporte@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* Botão salvar */}
        <div className="p-6 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Campos com * são obrigatórios
          </p>
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition disabled:opacity-50 active:scale-95"
          >
            {salvando ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>

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