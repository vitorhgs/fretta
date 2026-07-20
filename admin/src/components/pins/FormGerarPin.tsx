import { useState, useEffect } from "react";
import {
  Sparkles,
  Pencil,
  Check,
  MapPin,
  KeyRound,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { Motorista, TipoPin } from "../../types/database";

import { FormField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { EmptyState } from "../ui/EmptyState";

interface FormGerarPinProps {
  onSucesso: (codigo: string) => void;
  onCancelar: () => void;
  rotaId?: string;
  rotaNome?: string;
}

const validades = [
  { valor: 60, label: "1 hora" },
  { valor: 360, label: "6 horas" },
  { valor: 1440, label: "24 horas" },
  { valor: 0, label: "Sem expiração" },
];

export default function FormGerarPin({
  onSucesso,
  onCancelar,
  rotaId,
  rotaNome,
}: FormGerarPinProps) {
  const { empresa, usuario } = useAuth();
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState<{
    tipo: TipoPin;
    motoristaId: string;
    validadeMinutos: number;
    observacao: string;
  }>({
    tipo: rotaId ? "editar_rota" : "nova_rota",
    motoristaId: "",
    validadeMinutos: 60,
    observacao: "",
  });

  useEffect(() => {
    carregarMotoristas();
  }, []);

  const carregarMotoristas = async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("motoristas")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    if (data) setMotoristas(data);
    setCarregando(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!form.motoristaId) {
      setErro("Selecione um motorista");
      return;
    }
    if (!empresa) {
      setErro("Empresa não carregada");
      return;
    }

    setSalvando(true);

    try {
      const { data: codigoData, error: erroCodigo } = await supabase.rpc(
        "gerar_pin_unico",
        { p_empresa_id: empresa.id }
      );

      if (erroCodigo) throw erroCodigo;
      const codigo = codigoData as string;

      const expiraEm =
        form.validadeMinutos > 0
          ? new Date(Date.now() + form.validadeMinutos * 60000).toISOString()
          : null;

      const { error } = await supabase.from("pins_autorizacao").insert([
        {
          empresa_id: empresa.id,
          codigo,
          tipo: form.tipo,
          motorista_id: form.motoristaId,
          rota_id: form.tipo === "editar_rota" ? rotaId : null,
          criado_por: usuario?.id,
          expira_em: expiraEm,
          observacao: form.observacao || null,
        },
      ]);

      if (error) throw error;

      onSucesso(codigo);
    } catch (err: any) {
      setErro(`Erro ao gerar PIN: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 mt-3 text-sm">Carregando motoristas...</p>
      </div>
    );
  }

  if (motoristas.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={UserX}
          title="Nenhum motorista ativo"
          description="Cadastre um motorista antes de gerar PINs."
          action={{
            label: "Fechar",
            onClick: onCancelar,
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Rota vinculada (se veio da tela de rotas) */}
      {rotaNome && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-blue-600" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-slate-600 text-xs">Rota selecionada:</p>
            <p className="font-bold text-blue-800 truncate">{rotaNome}</p>
          </div>
        </div>
      )}

      {/* Tipo de PIN */}
      {!rotaId && (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            Tipo de autorização
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo: "nova_rota" })}
              className={`p-4 rounded-xl border-2 text-left transition active:scale-95 ${
                form.tipo === "nova_rota"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" strokeWidth={2.2} />
              </div>
              <p className="font-bold text-sm text-slate-800">Nova Rota</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Motorista grava uma rota nova
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo: "editar_rota" })}
              disabled={!rotaId}
              className={`p-4 rounded-xl border-2 text-left transition active:scale-95 ${
                form.tipo === "editar_rota"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              } ${!rotaId ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                <Pencil className="w-5 h-5 text-amber-600" strokeWidth={2.2} />
              </div>
              <p className="font-bold text-sm text-slate-800">Editar Rota</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {rotaId ? "Refazer rota existente" : "Escolha uma rota primeiro"}
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Motorista */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          Motorista autorizado
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {motoristas.map((m) => {
            const isSelected = form.motoristaId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setForm({ ...form, motoristaId: m.id })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left active:scale-[0.98] ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <Avatar name={m.nome} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">
                    {m.nome}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {m.telefone || m.email || "Sem contato"}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Validade */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          Validade do PIN
        </label>
        <div className="grid grid-cols-4 gap-2">
          {validades.map((v) => (
            <button
              key={v.valor}
              type="button"
              onClick={() => setForm({ ...form, validadeMinutos: v.valor })}
              className={`py-2.5 rounded-lg text-xs font-semibold border-2 transition active:scale-95 ${
                form.validadeMinutos === v.valor
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Observação */}
      <FormField
        label="Observação (opcional)"
        value={form.observacao}
        onChange={(e) => setForm({ ...form, observacao: e.target.value })}
        placeholder="Ex: Gravar linha Ipanema"
      />

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" strokeWidth={2.2} />
          {erro}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-2 border-t border-slate-100">
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
          icon={KeyRound}
          loading={salvando}
        >
          {salvando ? "Gerando..." : "Gerar PIN"}
        </Button>
      </div>
    </form>
  );
}