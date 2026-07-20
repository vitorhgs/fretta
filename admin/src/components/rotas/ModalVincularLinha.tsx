import { useState, useEffect } from "react";
import { Building2, X, Check } from "lucide-react";
import { supabase } from "../../supabase";

interface Linha {
  id: string;
  nome: string;
  cor: string;
  cliente_nome_fantasia?: string | null;
}

interface ModalVincularLinhaProps {
  rotaId: string;
  rotaNome: string;
  linhaAtualId?: string | null;
  onSucesso: () => void;
  onCancelar: () => void;
}

export default function ModalVincularLinha({
  rotaId,
  rotaNome,
  linhaAtualId,
  onSucesso,
  onCancelar,
}: ModalVincularLinhaProps) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [linhaSelecionada, setLinhaSelecionada] = useState<string>(linhaAtualId || "");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarLinhas();
  }, []);

  const carregarLinhas = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("linhas")
      .select("id, nome, cor, cliente_nome_fantasia")
      .eq("status", "ativa")
      .order("nome", { ascending: true });

    if (error) {
      setErro("Erro ao carregar linhas");
    } else if (data) {
      setLinhas(data);
    }
    setCarregando(false);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);

    const { error } = await supabase
      .from("rotas")
      .update({ linha_id: linhaSelecionada || null })
      .eq("id", rotaId);

    setSalvando(false);

    if (error) {
      setErro("Erro ao vincular linha: " + error.message);
      return;
    }

    onSucesso();
  };

  return (
    <div className="p-6">
      {/* Descrição */}
      <p className="text-sm text-slate-600 mb-4">
        Escolha a linha (cliente/contrato) para vincular à rota{" "}
        <span className="font-bold text-slate-800">"{rotaNome}"</span>
      </p>

      {/* Loading */}
      {carregando && (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-xs text-slate-500 mt-2">Carregando linhas...</p>
        </div>
      )}

      {/* Sem linhas cadastradas */}
      {!carregando && linhas.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
          <Building2 size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700 text-sm">
            Nenhuma linha cadastrada
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Vá em <strong>Linhas & Rotas → Linhas</strong> para cadastrar
          </p>
        </div>
      )}

      {/* Lista de linhas */}
      {!carregando && linhas.length > 0 && (
        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {/* Opção "Nenhuma" */}
          <label
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
              linhaSelecionada === ""
                ? "border-slate-400 bg-slate-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="linha"
              value=""
              checked={linhaSelecionada === ""}
              onChange={() => setLinhaSelecionada("")}
              className="w-4 h-4 accent-slate-500"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Sem vínculo</p>
              <p className="text-xs text-slate-500">Rota não vinculada a nenhuma linha</p>
            </div>
          </label>

          {/* Linhas cadastradas */}
          {linhas.map((linha) => {
            const selecionada = linhaSelecionada === linha.id;
            return (
              <label
                key={linha.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                  selecionada
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="linha"
                  value={linha.id}
                  checked={selecionada}
                  onChange={() => setLinhaSelecionada(linha.id)}
                  className="w-4 h-4 accent-blue-600"
                />
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                  style={{ backgroundColor: linha.cor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {linha.nome}
                  </p>
                  {linha.cliente_nome_fantasia && (
                    <p className="text-xs text-slate-500 truncate">
                      {linha.cliente_nome_fantasia}
                    </p>
                  )}
                </div>
                {selecionada && (
                  <Check size={18} className="text-blue-600 flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Botões */}
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <X size={16} />
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || carregando}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {salvando ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Salvando...
            </>
          ) : (
            <>
              <Check size={16} />
              Vincular
            </>
          )}
        </button>
      </div>
    </div>
  );
}