import { useState, useEffect } from "react";
import type { Veiculo } from "../../types/database";
import {
  formatarPlaca,
  validarPlaca,
  rotulosTipoVeiculo,
} from "../../lib/formatters";

interface FormVeiculoProps {
  veiculo?: Veiculo | null;
  onSalvar: (dados: Partial<Veiculo>) => Promise<void>;
  onCancelar: () => void;
  salvando: boolean;
}

const anoAtual = new Date().getFullYear();

export default function FormVeiculo({
  veiculo,
  onSalvar,
  onCancelar,
  salvando,
}: FormVeiculoProps) {
  const [form, setForm] = useState({
    placa: "",
    modelo: "",
    marca: "",
    ano: anoAtual,
    cor: "",
    chassi: "",
    renavam: "",
    tipo: "van" as Veiculo["tipo"],
    capacidade: 15,
    combustivel: "diesel" as Veiculo["combustivel"],
    vencimento_licenciamento: "",
    vencimento_seguro: "",
    status: "ativo" as Veiculo["status"],
    observacoes: "",
    km_atual: 0,
  });

  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (veiculo) {
      setForm({
        placa: veiculo.placa || "",
        modelo: veiculo.modelo || "",
        marca: veiculo.marca || "",
        ano: veiculo.ano || anoAtual,
        cor: veiculo.cor || "",
        chassi: veiculo.chassi || "",
        renavam: veiculo.renavam || "",
        tipo: veiculo.tipo || "van",
        capacidade: veiculo.capacidade || 15,
        combustivel: veiculo.combustivel || "diesel",
        vencimento_licenciamento: veiculo.vencimento_licenciamento || "",
        vencimento_seguro: veiculo.vencimento_seguro || "",
        status: veiculo.status || "ativo",
        observacoes: veiculo.observacoes || "",
        km_atual: veiculo.km_atual || 0,
      });
    }
  }, [veiculo]);

  const validar = () => {
    const novosErros: Record<string, string> = {};
    if (!form.placa.trim()) novosErros.placa = "Placa é obrigatória";
    else if (!validarPlaca(form.placa)) novosErros.placa = "Placa inválida";
    if (!form.modelo.trim()) novosErros.modelo = "Modelo é obrigatório";
    if (form.ano < 1900 || form.ano > anoAtual + 1)
      novosErros.ano = "Ano inválido";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    await onSalvar({
      ...form,
      placa: form.placa.toUpperCase(),
      vencimento_licenciamento: form.vencimento_licenciamento || undefined,
      vencimento_seguro: form.vencimento_seguro || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Identificação */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          🪪 Identificação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Placa *
            </label>
            <input
              type="text"
              value={form.placa}
              onChange={(e) =>
                setForm({ ...form, placa: formatarPlaca(e.target.value) })
              }
              className={`mt-1 border px-3 py-2.5 rounded-lg w-full text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                erros.placa ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="ABC-1234"
              autoFocus
            />
            {erros.placa && (
              <p className="text-xs text-red-500 mt-1">{erros.placa}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Marca
            </label>
            <input
              type="text"
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value })}
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mercedes-Benz"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Modelo *
            </label>
            <input
              type="text"
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              className={`mt-1 border px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                erros.modelo ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="Sprinter 415"
            />
            {erros.modelo && (
              <p className="text-xs text-red-500 mt-1">{erros.modelo}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Ano *
            </label>
            <input
              type="number"
              value={form.ano}
              onChange={(e) =>
                setForm({ ...form, ano: parseInt(e.target.value) || 0 })
              }
              min={1900}
              max={anoAtual + 1}
              className={`mt-1 border px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                erros.ano ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="2024"
            />
            {erros.ano && (
              <p className="text-xs text-red-500 mt-1">{erros.ano}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Cor</label>
            <input
              type="text"
              value={form.cor}
              onChange={(e) => setForm({ ...form, cor: e.target.value })}
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Branco"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              KM atual
            </label>
            <input
              type="number"
              value={form.km_atual}
              onChange={(e) =>
                setForm({ ...form, km_atual: parseInt(e.target.value) || 0 })
              }
              min={0}
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Características */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          🚌 Características
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Tipo *
            </label>
            <select
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as Veiculo["tipo"] })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Object.entries(rotulosTipoVeiculo).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Capacidade (passageiros)
            </label>
            <input
              type="number"
              value={form.capacidade}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacidade: parseInt(e.target.value) || 0,
                })
              }
              min={1}
              max={100}
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Combustível
            </label>
            <select
              value={form.combustivel}
              onChange={(e) =>
                setForm({
                  ...form,
                  combustivel: e.target.value as Veiculo["combustivel"],
                })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="diesel">Diesel</option>
              <option value="gasolina">Gasolina</option>
              <option value="etanol">Etanol</option>
              <option value="flex">Flex</option>
              <option value="eletrico">Elétrico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documentação */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          📋 Documentação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Chassi
            </label>
            <input
              type="text"
              value={form.chassi}
              onChange={(e) =>
                setForm({ ...form, chassi: e.target.value.toUpperCase() })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="9BWZZZ377VT004251"
              maxLength={17}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              RENAVAM
            </label>
            <input
              type="text"
              value={form.renavam}
              onChange={(e) =>
                setForm({
                  ...form,
                  renavam: e.target.value.replace(/\D/g, "").slice(0, 11),
                })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00000000000"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Vencimento Licenciamento
            </label>
            <input
              type="date"
              value={form.vencimento_licenciamento}
              onChange={(e) =>
                setForm({ ...form, vencimento_licenciamento: e.target.value })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Vencimento Seguro
            </label>
            <input
              type="date"
              value={form.vencimento_seguro}
              onChange={(e) =>
                setForm({ ...form, vencimento_seguro: e.target.value })
              }
              className="mt-1 border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-semibold text-slate-600">Status</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { v: "ativo", l: "✅ Ativo", cor: "green" },
            { v: "manutencao", l: "🔧 Manutenção", cor: "amber" },
            { v: "inativo", l: "🚫 Inativo", cor: "slate" },
          ].map((s) => (
            <button
              key={s.v}
              type="button"
              onClick={() =>
                setForm({ ...form, status: s.v as Veiculo["status"] })
              }
              className={`py-2.5 rounded-lg text-sm font-semibold transition active:scale-95 border-2 ${
                form.status === s.v
                  ? s.cor === "green"
                    ? "bg-green-50 border-green-500 text-green-700"
                    : s.cor === "amber"
                    ? "bg-amber-50 border-amber-500 text-amber-700"
                    : "bg-slate-100 border-slate-400 text-slate-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {s.l}
            </button>
          ))}
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
          placeholder="Ex: Ar condicionado, wi-fi, cinto de segurança..."
        />
      </div>

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
            : veiculo
            ? "Salvar Alterações"
            : "Cadastrar Veículo"}
        </button>
      </div>
    </form>
  );
}