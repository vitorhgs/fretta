import { useState, useEffect } from "react";
import {
  IdCard,
  Bus,
  FileText,
  Activity,
  CheckCircle2,
  Wrench,
  Moon,
} from "lucide-react";
import type { Veiculo } from "../../types/database";
import {
  formatarPlaca,
  validarPlaca,
  rotulosTipoVeiculo,
} from "../../lib/formatters";
import { FormField } from "../ui/FormField";
import { FormSection } from "../ui/FormSection";
import { Button } from "../ui/Button";

interface FormVeiculoProps {
  veiculo?: Veiculo | null;
  onSalvar: (dados: Partial<Veiculo>) => Promise<void>;
  onCancelar: () => void;
  salvando: boolean;
}

const anoAtual = new Date().getFullYear();

const STATUS_OPTIONS: {
  value: Veiculo["status"];
  label: string;
  icon: typeof CheckCircle2;
  colors: { active: string; inactive: string };
}[] = [
  {
    value: "ativo",
    label: "Ativo",
    icon: CheckCircle2,
    colors: {
      active: "bg-green-50 border-green-500 text-green-700",
      inactive: "bg-white border-slate-200 text-slate-500 hover:border-slate-300",
    },
  },
  {
    value: "manutencao",
    label: "Manutenção",
    icon: Wrench,
    colors: {
      active: "bg-amber-50 border-amber-500 text-amber-700",
      inactive: "bg-white border-slate-200 text-slate-500 hover:border-slate-300",
    },
  },
  {
    value: "inativo",
    label: "Inativo",
    icon: Moon,
    colors: {
      active: "bg-slate-100 border-slate-400 text-slate-700",
      inactive: "bg-white border-slate-200 text-slate-500 hover:border-slate-300",
    },
  },
];

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
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Identificação */}
      <FormSection title="Identificação" icon={IdCard}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            label="Placa"
            required
            value={form.placa}
            onChange={(e) => setForm({ ...form, placa: formatarPlaca(e.target.value) })}
            placeholder="ABC-1234"
            className="font-mono uppercase tracking-wider"
            error={erros.placa}
            autoFocus
          />
          <FormField
            label="Marca"
            value={form.marca}
            onChange={(e) => setForm({ ...form, marca: e.target.value })}
            placeholder="Mercedes-Benz"
          />
          <FormField
            label="Modelo"
            required
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            placeholder="Sprinter 415"
            error={erros.modelo}
          />
          <FormField
            label="Ano"
            required
            type="number"
            value={form.ano}
            onChange={(e) => setForm({ ...form, ano: parseInt(e.target.value) || 0 })}
            min={1900}
            max={anoAtual + 1}
            placeholder="2024"
            error={erros.ano}
          />
          <FormField
            label="Cor"
            value={form.cor}
            onChange={(e) => setForm({ ...form, cor: e.target.value })}
            placeholder="Branco"
          />
          <FormField
            label="KM atual"
            type="number"
            value={form.km_atual}
            onChange={(e) => setForm({ ...form, km_atual: parseInt(e.target.value) || 0 })}
            min={0}
            placeholder="0"
          />
        </div>
      </FormSection>

      {/* Características */}
      <FormSection title="Características" icon={Bus}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            as="select"
            label="Tipo"
            required
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as Veiculo["tipo"] })}
          >
            {Object.entries(rotulosTipoVeiculo).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </FormField>

          <FormField
            label="Capacidade (passageiros)"
            type="number"
            value={form.capacidade}
            onChange={(e) =>
              setForm({ ...form, capacidade: parseInt(e.target.value) || 0 })
            }
            min={1}
            max={100}
            placeholder="15"
          />

          <FormField
            as="select"
            label="Combustível"
            value={form.combustivel}
            onChange={(e) =>
              setForm({ ...form, combustivel: e.target.value as Veiculo["combustivel"] })
            }
          >
            <option value="diesel">Diesel</option>
            <option value="gasolina">Gasolina</option>
            <option value="etanol">Etanol</option>
            <option value="flex">Flex</option>
            <option value="eletrico">Elétrico</option>
          </FormField>
        </div>
      </FormSection>

      {/* Documentação */}
      <FormSection title="Documentação" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            label="Chassi"
            value={form.chassi}
            onChange={(e) =>
              setForm({ ...form, chassi: e.target.value.toUpperCase() })
            }
            className="font-mono"
            placeholder="9BWZZZ377VT004251"
            maxLength={17}
          />
          <FormField
            label="RENAVAM"
            value={form.renavam}
            onChange={(e) =>
              setForm({
                ...form,
                renavam: e.target.value.replace(/\D/g, "").slice(0, 11),
              })
            }
            className="font-mono"
            placeholder="00000000000"
          />
          <FormField
            label="Vencimento Licenciamento"
            type="date"
            value={form.vencimento_licenciamento}
            onChange={(e) =>
              setForm({ ...form, vencimento_licenciamento: e.target.value })
            }
          />
          <FormField
            label="Vencimento Seguro"
            type="date"
            value={form.vencimento_seguro}
            onChange={(e) =>
              setForm({ ...form, vencimento_seguro: e.target.value })
            }
          />
        </div>
      </FormSection>

      {/* Status */}
      <FormSection title="Status Operacional" icon={Activity}>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = form.status === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm({ ...form, status: s.value })}
                className={`py-3 rounded-xl text-sm font-semibold transition active:scale-95 border-2 flex items-center justify-center gap-2 ${
                  isActive ? s.colors.active : s.colors.inactive
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.2} />
                {s.label}
              </button>
            );
          })}
        </div>
      </FormSection>

      {/* Observações */}
      <FormField
        as="textarea"
        label="Observações"
        value={form.observacoes}
        onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
        rows={3}
        placeholder="Ex: Ar condicionado, wi-fi, cinto de segurança..."
      />

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onCancelar}
          disabled={salvando}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={salvando}
        >
          {veiculo ? "Salvar Alterações" : "Cadastrar Veículo"}
        </Button>
      </div>
    </form>
  );
}