import { useState, useEffect } from "react";
import type { Motorista } from "../../types/database";
import {
  formatarCPF,
  formatarTelefone,
  validarCPF,
  validarEmail,
} from "../../lib/formatters";

interface FormMotoristaProps {
  motorista?: Motorista | null;
  onSalvar: (dados: Partial<Motorista>) => Promise<void>;
  onCancelar: () => void;
  salvando: boolean;
}

const categoriasCNH = ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"];
const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function FormMotorista({
  motorista,
  onSalvar,
  onCancelar,
  salvando,
}: FormMotoristaProps) {
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    cnh: "",
    categoria_cnh: "D",
    validade_cnh: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "SP",
    observacoes: "",
    ativo: true,
  });

  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (motorista) {
      setForm({
        nome: motorista.nome || "",
        cpf: motorista.cpf || "",
        cnh: motorista.cnh || "",
        categoria_cnh: motorista.categoria_cnh || "D",
        validade_cnh: motorista.validade_cnh || "",
        telefone: motorista.telefone || "",
        email: motorista.email || "",
        endereco: motorista.endereco || "",
        cidade: motorista.cidade || "",
        estado: motorista.estado || "SP",
        observacoes: motorista.observacoes || "",
        ativo: motorista.ativo ?? true,
      });
    }
  }, [motorista]);

  const validar = () => {
    const novosErros: Record<string, string> = {};
    if (!form.nome.trim()) novosErros.nome = "Nome é obrigatório";
    if (form.cpf && !validarCPF(form.cpf)) novosErros.cpf = "CPF inválido";
    if (form.email && !validarEmail(form.email))
      novosErros.email = "E-mail inválido";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    await onSalvar({
      ...form,
      validade_cnh: form.validade_cnh || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Dados Pessoais */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          👤 Dados Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">
              Nome completo *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className={`mt-1 border px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                erros.nome ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="João da Silva"
              autoFocus
            />
            {erros.nome && (
              <p className="text-xs text-red-500 mt-1">{erros.nome}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">CPF</label>
            <input
              type="text"
              value={form.cpf}
              onChange={(e) =>
                setForm({ ...form, cpf: formatarCPF(e.target.value) })
              }
              className={`mt-1 border px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                erros.cpf ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="000.000.000-00"
            />
            {erros.cpf && (
              <p className="text-xs text-red-500 mt-1">{erros.cpf}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Telefone
            </label>
            <input
              type="text"
              value={form.telefone}
              onChange={(e) =>
                setForm({ ...form, telefone: formatarTelefone(e.target.value) })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">
              E-mail (para login no app)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`mt-1 border px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                erros.email ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="joao@email.com"
            />
            {erros.email && (
              <p className="text-xs text-red-500 mt-1">{erros.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* CNH */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          🪪 Habilitação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Número da CNH
            </label>
            <input
              type="text"
              value={form.cnh}
              onChange={(e) =>
                setForm({
                  ...form,
                  cnh: e.target.value.replace(/\D/g, "").slice(0, 11),
                })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00000000000"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Categoria
            </label>
            <select
              value={form.categoria_cnh}
              onChange={(e) =>
                setForm({ ...form, categoria_cnh: e.target.value })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categoriasCNH.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Validade
            </label>
            <input
              type="date"
              value={form.validade_cnh}
              onChange={(e) =>
                setForm({ ...form, validade_cnh: e.target.value })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          📍 Endereço
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-slate-600">
              Endereço
            </label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rua das Flores, 123"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">
              Cidade
            </label>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="São Paulo"
            />
          </div>

          <div className="md:col-span-6">
            <label className="text-xs font-semibold text-slate-600">
              Estado
            </label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="text-xs font-semibold text-slate-600">
          Observações
        </label>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="Informações adicionais..."
        />
      </div>

      {/* Status */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.ativo}
          onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
          className="w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-slate-700 font-medium">
          Motorista ativo
        </span>
      </label>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition disabled:opacity-50 active:scale-95"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-500 transition disabled:opacity-50 active:scale-95"
        >
          {salvando
            ? "Salvando..."
            : motorista
            ? "Salvar Alterações"
            : "Cadastrar Motorista"}
        </button>
      </div>
    </form>
  );
}