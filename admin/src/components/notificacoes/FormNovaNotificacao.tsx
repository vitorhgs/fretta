import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useEnviarNotificacao, type TipoNotificacao } from "../../hooks/useEnviarNotificacao";
import type { Motorista } from "../../types/database";

interface Props {
  onSucesso: (total: number) => void;
  onCancelar: () => void;
}

const TIPOS: { valor: TipoNotificacao; label: string; cor: string; icone: string }[] = [
  { valor: "info", label: "Informação", cor: "slate", icone: "ℹ️" },
  { valor: "rota", label: "Nova Rota", cor: "blue", icone: "🚌" },
  { valor: "alerta", label: "Alerta", cor: "amber", icone: "⚠️" },
  { valor: "emergencia", label: "Emergência", cor: "red", icone: "🚨" },
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
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
          Tipo
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setTipo(t.valor)}
              className={`p-3 rounded-xl border-2 text-xs font-semibold transition ${
                tipo === t.valor
                  ? `bg-${t.cor}-50 border-${t.cor}-500 text-${t.cor}-700`
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="text-xl mb-1">{t.icone}</div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={80}
          placeholder="Ex: Nova rota disponível"
          className="w-full border border-slate-300 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-[10px] text-slate-400 mt-1 text-right">
          {titulo.length}/80
        </p>
      </div>

      {/* Mensagem */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
          Mensagem <span className="text-red-500">*</span>
        </label>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Descreva a notificação..."
          className="w-full border border-slate-300 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-[10px] text-slate-400 mt-1 text-right">
          {mensagem.length}/200
        </p>
      </div>

      {/* Destinatários */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
          Destinatários
        </label>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setModoEnvio("todos")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
              modoEnvio === "todos"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            📣 Todos ({motoristas.length})
          </button>
          <button
            type="button"
            onClick={() => setModoEnvio("selecionados")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
              modoEnvio === "selecionados"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            👤 Selecionados ({selecionados.size})
          </button>
        </div>

        {modoEnvio === "selecionados" && (
          <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={selecionarTodos}
              className="w-full px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-b transition text-left"
            >
              {selecionados.size === motoristas.length
                ? "Desmarcar todos"
                : "Marcar todos"}
            </button>
            {motoristas.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selecionados.has(m.id)}
                  onChange={() => toggleMotorista(m.id)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {m.nome}
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.email || m.telefone}
                  </p>
                </div>
                {m.auth_user_id && (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    App
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">
          {erro}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleEnviar}
          disabled={enviando}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition active:scale-95 shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {enviando ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Enviando...
            </>
          ) : (
            <>📤 Enviar Notificação</>
          )}
        </button>
      </div>
    </div>
  );
}