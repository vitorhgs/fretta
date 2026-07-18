import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { Motorista, TipoPin } from "../../types/database";
import { iniciaisNome } from "../../lib/formatters";

interface FormGerarPinProps {
  onSucesso: (codigo: string) => void;
  onCancelar: () => void;
  rotaId?: string; // opcional: se veio da tela de rotas
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
      // Gera código único via função do banco
      const { data: codigoData, error: erroCodigo } = await supabase.rpc(
        "gerar_pin_unico",
        { p_empresa_id: empresa.id }
      );

      if (erroCodigo) throw erroCodigo;
      const codigo = codigoData as string;

      // Calcula expiração
      const expiraEm =
        form.validadeMinutos > 0
          ? new Date(Date.now() + form.validadeMinutos * 60000).toISOString()
          : null;

      // Insere PIN
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
      <div className="p-8 text-center">
        <div className="text-5xl mb-3">👤</div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Nenhum motorista ativo
        </h3>
        <p className="text-slate-500 mb-4 text-sm">
          Cadastre um motorista antes de gerar PINs.
        </p>
        <button
          onClick={onCancelar}
          className="border border-slate-300 text-slate-700 px-5 py-2 rounded-lg font-semibold hover:bg-slate-50"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Se veio da tela de rotas, mostra qual rota */}
      {rotaNome && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
          <p className="text-slate-600 text-xs mb-1">Rota selecionada:</p>
          <p className="font-bold text-blue-800">📍 {rotaNome}</p>
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
              className={`p-3 rounded-xl border-2 text-left transition ${
                form.tipo === "nova_rota"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-2xl mb-1">🆕</div>
              <p className="font-bold text-sm text-slate-800">Nova Rota</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Motorista grava uma rota nova
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo: "editar_rota" })}
              disabled={!rotaId}
              className={`p-3 rounded-xl border-2 text-left transition ${
                form.tipo === "editar_rota"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              } ${!rotaId ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className="text-2xl mb-1">✏️</div>
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
          {motoristas.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setForm({ ...form, motoristaId: m.id })}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                form.motoristaId === m.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {iniciaisNome(m.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">
                  {m.nome}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {m.telefone || m.email || "Sem contato"}
                </p>
              </div>
              {form.motoristaId === m.id && (
                <span className="text-blue-600 text-lg">✓</span>
              )}
            </button>
          ))}
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
              className={`py-2.5 rounded-lg text-xs font-semibold border-2 transition ${
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
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          Observação (opcional)
        </label>
        <input
          type="text"
          value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          placeholder="Ex: Gravar linha Ipanema"
          className="border border-slate-300 px-3 py-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
          ❌ {erro}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-2">
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
          {salvando ? "Gerando..." : "🔓 Gerar PIN"}
        </button>
      </div>
    </form>
  );
}