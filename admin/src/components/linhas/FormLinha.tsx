import { useState, useEffect } from "react";
import {
  Building2,
  School,
  Calendar as CalendarIcon,
  Route as RouteIcon,
  Palette,
} from "lucide-react";
import { supabase } from "../../supabase";
import type { Linha } from "../../types/database";

interface FormLinhaProps {
  linha?: Linha | null;
  empresaId: string;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CORES = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#EF4444", "#06B6D4", "#6366F1",
];

const CATEGORIAS = [
  { valor: "empresa", label: "Empresa", Icon: Building2 },
  { valor: "escola", label: "Escola", Icon: School },
  { valor: "evento", label: "Evento", Icon: CalendarIcon },
  { valor: "outros", label: "Outros", Icon: RouteIcon },
];

export default function FormLinha({
  linha,
  empresaId,
  onSalvar,
  onCancelar,
}: FormLinhaProps) {
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    cliente_razao_social: "",
    cliente_nome_fantasia: "",
    cliente_cnpj: "",
    endereco_destino: "",
    cidade_destino: "",
    estado_destino: "",
    contato_nome: "",
    contato_telefone: "",
    contato_email: "",
    valor_mensal: "",
    valor_km: "",
    data_inicio_contrato: "",
    data_fim_contrato: "",
    cor: "#3B82F6",
    categoria: "empresa" as "empresa" | "escola" | "evento" | "outros",
    observacoes: "",
    status: "ativa" as "ativa" | "pausada" | "encerrada",
  });

  useEffect(() => {
    if (linha) {
      setForm({
        nome: linha.nome || "",
        codigo: linha.codigo || "",
        cliente_razao_social: linha.cliente_razao_social || "",
        cliente_nome_fantasia: linha.cliente_nome_fantasia || "",
        cliente_cnpj: linha.cliente_cnpj || "",
        endereco_destino: linha.endereco_destino || "",
        cidade_destino: linha.cidade_destino || "",
        estado_destino: linha.estado_destino || "",
        contato_nome: linha.contato_nome || "",
        contato_telefone: linha.contato_telefone || "",
        contato_email: linha.contato_email || "",
        valor_mensal: linha.valor_mensal?.toString() || "",
        valor_km: linha.valor_km?.toString() || "",
        data_inicio_contrato: linha.data_inicio_contrato || "",
        data_fim_contrato: linha.data_fim_contrato || "",
        cor: linha.cor || "#3B82F6",
        categoria: (linha.categoria as any) || "empresa",
        observacoes: linha.observacoes || "",
        status: linha.status,
      });
    }
  }, [linha]);

  const salvar = async () => {
    if (!form.nome.trim()) {
      alert("Nome da linha é obrigatório");
      return;
    }

    setSalvando(true);

    const dados = {
      ...form,
      empresa_id: empresaId,
      valor_mensal: form.valor_mensal ? parseFloat(form.valor_mensal) : null,
      valor_km: form.valor_km ? parseFloat(form.valor_km) : null,
      data_inicio_contrato: form.data_inicio_contrato || null,
      data_fim_contrato: form.data_fim_contrato || null,
      codigo: form.codigo || null,
      cliente_razao_social: form.cliente_razao_social || null,
      cliente_nome_fantasia: form.cliente_nome_fantasia || null,
      cliente_cnpj: form.cliente_cnpj || null,
      endereco_destino: form.endereco_destino || null,
      cidade_destino: form.cidade_destino || null,
      estado_destino: form.estado_destino || null,
      contato_nome: form.contato_nome || null,
      contato_telefone: form.contato_telefone || null,
      contato_email: form.contato_email || null,
      observacoes: form.observacoes || null,
    };

    let error;
    if (linha) {
      const res = await supabase.from("linhas").update(dados).eq("id", linha.id);
      error = res.error;
    } else {
      const res = await supabase.from("linhas").insert([dados]);
      error = res.error;
    }

    setSalvando(false);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }

    onSalvar();
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="space-y-6 p-1">
        {/* Identificação */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Identificação
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Nome da linha *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Mercedes São Bernardo"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Código interno
              </label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="MB-SBC-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="mt-3">
            <label className="mb-2 block text-xs font-semibold text-gray-600">
              Categoria
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIAS.map((cat) => {
                const Icon = cat.Icon;
                const ativo = form.categoria === cat.valor;
                return (
                  <button
                    key={cat.valor}
                    type="button"
                    onClick={() => setForm({ ...form, categoria: cat.valor as any })}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                      ativo
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-semibold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cor */}
          <div className="mt-3">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
              <Palette size={14} />
              Cor da linha
            </label>
            <div className="flex gap-2">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, cor: c })}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    form.cor === c ? "scale-110 border-gray-900" : "border-white"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Cliente */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Cliente / Contratante
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Razão social
              </label>
              <input
                type="text"
                value={form.cliente_razao_social}
                onChange={(e) =>
                  setForm({ ...form, cliente_razao_social: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Nome fantasia
              </label>
              <input
                type="text"
                value={form.cliente_nome_fantasia}
                onChange={(e) =>
                  setForm({ ...form, cliente_nome_fantasia: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                CNPJ
              </label>
              <input
                type="text"
                value={form.cliente_cnpj}
                onChange={(e) => setForm({ ...form, cliente_cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Endereço destino
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Endereço
              </label>
              <input
                type="text"
                value={form.endereco_destino}
                onChange={(e) =>
                  setForm({ ...form, endereco_destino: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Cidade
              </label>
              <input
                type="text"
                value={form.cidade_destino}
                onChange={(e) =>
                  setForm({ ...form, cidade_destino: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                UF
              </label>
              <input
                type="text"
                maxLength={2}
                value={form.estado_destino}
                onChange={(e) =>
                  setForm({ ...form, estado_destino: e.target.value.toUpperCase() })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Contato */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Contato responsável
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Nome
              </label>
              <input
                type="text"
                value={form.contato_nome}
                onChange={(e) => setForm({ ...form, contato_nome: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Telefone
              </label>
              <input
                type="text"
                value={form.contato_telefone}
                onChange={(e) =>
                  setForm({ ...form, contato_telefone: e.target.value })
                }
                placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                E-mail
              </label>
              <input
                type="email"
                value={form.contato_email}
                onChange={(e) =>
                  setForm({ ...form, contato_email: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Contrato */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Contrato (opcional)
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Valor mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.valor_mensal}
                onChange={(e) =>
                  setForm({ ...form, valor_mensal: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Valor por KM (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.valor_km}
                onChange={(e) => setForm({ ...form, valor_km: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Início contrato
              </label>
              <input
                type="date"
                value={form.data_inicio_contrato}
                onChange={(e) =>
                  setForm({ ...form, data_inicio_contrato: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Fim contrato
              </label>
              <input
                type="date"
                value={form.data_fim_contrato}
                onChange={(e) =>
                  setForm({ ...form, data_fim_contrato: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Status
          </label>
          <div className="flex gap-2">
            {[
              { valor: "ativa", label: "Ativa", cor: "green" },
              { valor: "pausada", label: "Pausada", cor: "yellow" },
              { valor: "encerrada", label: "Encerrada", cor: "red" },
            ].map((s) => {
              const ativo = form.status === s.valor;
              return (
                <button
                  key={s.valor}
                  type="button"
                  onClick={() => setForm({ ...form, status: s.valor as any })}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all ${
                    ativo
                      ? `border-${s.cor}-500 bg-${s.cor}-50 text-${s.cor}-700`
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Observações */}
        <section>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Observações
          </label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Notas internas sobre essa linha..."
          />
        </section>
      </div>

      {/* Footer com botões */}
      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-gray-200 bg-white pt-4">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : linha ? "Salvar alterações" : "Criar linha"}
        </button>
      </div>
    </div>
  );
}