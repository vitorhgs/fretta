import { useState, useEffect } from "react";
import {
  Info,
  Bus,
  AlertTriangle,
  Siren,
  Megaphone,
  User,
  Send,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  useEnviarNotificacao,
  type TipoNotificacao,
} from "../../hooks/useEnviarNotificacao";
import type { Motorista } from "../../types/database";

import { FormField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface Props {
  onSucesso: (total: number) => void;
  onCancelar: () => void;
}

type TipoOption = {
  valor: TipoNotificacao;
  label: string;
  icon: LucideIcon;
  colors: { active: string; iconBg: string; iconColor: string };
};

const TIPOS: TipoOption[] = [
  {
    valor: "info",
    label: "Informação",
    icon: Info,
    colors: {
      active: "bg-slate-50 border-slate-500 text-slate-700",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
  },
  {
    valor: "rota",
    label: "Nova Rota",
    icon: Bus,
    colors: {
      active: "bg-blue-50 border-blue-500 text-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  },
  {
    valor: "alerta",
    label: "Alerta",
    icon: AlertTriangle,
    colors: {
      active: "bg-amber-50 border-amber-500 text-amber-700",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  },
  {
    valor: "emergencia",
    label: "Emergência",
    icon: Siren,
    colors: {
      active: "bg-red-50 border-red-500 text-red-700",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  },
];

export default function FormNovaNotificacao({ onSucesso, onCancelar }: Props) {
  const { empresa } = useAuth();
  const { enviar, enviando } = useEnviarNotificacao();

  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState<TipoNotificacao>("info");
  const [modoEnvio, setModoEnvio] = useState<"todos" | "selecionados">("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarMotoristas();
  }, []);

  const carregarMotoristas = async () => {
    if (!empresa) return;
    const { data } = await supabase
      .from("motoristas")
      .select("*")
      .eq("empresa_id", empresa.id)
      .eq("ativo", true)
      .order("nome");
    setMotoristas(data ?? []);
  };

  const toggleMotorista = (id: string) => {
    const novo = new Set(selecionados);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    setSelecionados(novo);
  };

  const selecionarTodos = () => {
    if (selecionados.size === motoristas.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(motoristas.map((m) => m.id)));
    }
  };

  const handleEnviar = async () => {
    setErro("");

    if (!titulo.trim()) {
      setErro("Digite um título");
      return;
    }
    if (!mensagem.trim()) {
      setErro("Digite uma mensagem");
      return;
    }
    if (modoEnvio === "selecionados" && selecionados.size === 0) {
      setErro("Selecione ao menos um motorista");
      return;
    }

    try {
      const result = await enviar({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        motoristaIds: modoEnvio === "todos" ? [] : Array.from(selecionados),
      });
      onSucesso(result.total);
    } catch (err: any) {
      setErro(err.message || "Erro ao enviar");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Tipo */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Tipo
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS.map((t) => {
            const Icon = t.icon;
            const isActive = tipo === t.valor;
            return (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                className={`p-3 rounded-xl border-2 text-xs font-semibold transition active:scale-95 flex flex-col items-center gap-1.5 ${
                  isActive
                    ? t.colors.active
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? t.colors.iconBg : "bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? t.colors.iconColor : "text-slate-500"
                    }`}
                    strokeWidth={2.2}
                  />
                </div>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Título */}
      <div>
        <FormField
          label="Título"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={80}
          placeholder="Ex: Nova rota disponível"
        />
        <p className="text-[10px] text-slate-400 mt-1 text-right">
          {titulo.length}/80
        </p>
      </div>

      {/* Mensagem */}
      <div>
        <FormField
          as="textarea"
          label="Mensagem"
          required
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Descreva a notificação..."
        />
        <p className="text-[10px] text-slate-400 mt-1 text-right">
          {mensagem.length}/200
        </p>
      </div>

      {/* Destinatários */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Destinatários
        </label>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setModoEnvio("todos")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition active:scale-95 flex items-center justify-center gap-2 ${
              modoEnvio === "todos"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Megaphone className="w-4 h-4" strokeWidth={2.2} />
            Todos ({motoristas.length})
          </button>
          <button
            type="button"
            onClick={() => setModoEnvio("selecionados")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition active:scale-95 flex items-center justify-center gap-2 ${
              modoEnvio === "selecionados"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" strokeWidth={2.2} />
            Selecionados ({selecionados.size})
          </button>
        </div>

        {modoEnvio === "selecionados" && (
          <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto bg-slate-50/30">
            <button
              type="button"
              onClick={selecionarTodos}
              className="w-full px-4 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-b border-slate-200 transition text-left"
            >
              {selecionados.size === motoristas.length
                ? "Desmarcar todos"
                : "Marcar todos"}
            </button>
            {motoristas.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white cursor-pointer border-b border-slate-100 last:border-b-0 transition"
              >
                <input
                  type="checkbox"
                  checked={selecionados.has(m.id)}
                  onChange={() => toggleMotorista(m.id)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {m.nome}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {m.email || m.telefone}
                  </p>
                </div>
                {m.auth_user_id && (
                  <Badge color="indigo" icon={Smartphone}>
                    App
                  </Badge>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" strokeWidth={2.2} />
          {erro}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          icon={Send}
          loading={enviando}
          onClick={handleEnviar}
        >
          {enviando ? "Enviando..." : "Enviar Notificação"}
        </Button>
      </div>
    </div>
  );
}