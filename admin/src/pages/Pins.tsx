import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import type { PinAutorizacao, StatusPin } from "../types/database";
import Modal from "../components/Modal";
import FormGerarPin from "../components/pins/FormGerarPin";
import PinGerado from "../components/pins/PinGerado";
import {
  rotulosTipoPin,
  iconesTipoPin,
  rotulosStatusPin,
  coresStatusPin,
  tempoRestante,
  formatarPin,
  formatarData,
  iniciaisNome,
} from "../lib/formatters";

export default function Pins() {
  const [pins, setPins] = useState<PinAutorizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusPin>("todos");
  const [busca, setBusca] = useState("");
  const [modalGerar, setModalGerar] = useState(false);
  const [pinRecemGerado, setPinRecemGerado] = useState<string | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] =
    useState<PinAutorizacao | null>(null);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  useEffect(() => {
    carregarPins();
    // Atualiza a cada 30s pra refletir expirações
    const interval = setInterval(carregarPins, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3500);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const carregarPins = async () => {
    // Marca PINs vencidos primeiro
    await supabase.rpc("expirar_pins_vencidos");

    const { data, error } = await supabase
      .from("pins_autorizacao")
      .select(
        `
        *,
        motorista:motoristas(id, nome, telefone),
        rota:rotas(id, nome, cor),
        criador:usuarios!criado_por(nome)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMensagem({ tipo: "erro", texto: "Erro ao carregar PINs" });
    } else if (data) {
      setPins(data as any);
    }
    setLoading(false);
  };

  const cancelarPin = async () => {
    if (!confirmarCancelar) return;
    const { error } = await supabase
      .from("pins_autorizacao")
      .update({ status: "cancelado" })
      .eq("id", confirmarCancelar.id);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao cancelar" });
      return;
    }
    setMensagem({ tipo: "sucesso", texto: "PIN cancelado" });
    setConfirmarCancelar(null);
    carregarPins();
  };

  const pinsFiltrados = useMemo(() => {
    let lista = pins;
    if (filtroStatus !== "todos")
      lista = lista.filter((p) => p.status === filtroStatus);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.codigo.includes(t) ||
          p.motorista?.nome?.toLowerCase().includes(t) ||
          p.observacao?.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [pins, busca, filtroStatus]);

  const stats = useMemo(
    () => ({
      total: pins.length,
      ativos: pins.filter((p) => p.status === "ativo").length,
      usados: pins.filter((p) => p.status === "usado").length,
      expirados: pins.filter((p) => p.status === "expirado" || p.status === "cancelado").length,
    }),
    [pins]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🔓 PINs de Autorização</h1>
          <p className="text-sm text-slate-500 mt-1">
            Libere motoristas para gravar ou editar rotas via app
          </p>
        </div>
        <button
          onClick={() => setModalGerar(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition active:scale-95 shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <span>➕</span> Gerar PIN
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Total", v: stats.total, i: "🔑", c: "blue" },
          { l: "Ativos", v: stats.ativos, i: "🟢", c: "green" },
          { l: "Usados", v: stats.usados, i: "✅", c: "blue" },
          { l: "Expirados", v: stats.expirados, i: "⏰", c: "slate" },
        ].map((s) => (
          <div key={s.l} className="bg-white p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  s.c === "blue"
                    ? "bg-blue-100"
                    : s.c === "green"
                    ? "bg-green-100"
                    : "bg-slate-100"
                }`}
              >
                {s.i}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                  {s.l}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    s.c === "blue"
                      ? "text-blue-600"
                      : s.c === "green"
                      ? "text-green-600"
                      : "text-slate-500"
                  }`}
                >
                  {s.v}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por PIN, motorista ou observação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { v: "todos", l: "Todos" },
            { v: "ativo", l: "Ativos" },
            { v: "usado", l: "Usados" },
            { v: "expirado", l: "Expirados" },
            { v: "cancelado", l: "Cancelados" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltroStatus(f.v as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroStatus === f.v
                  ? "bg-white text-blue-700 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando PINs...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && pinsFiltrados.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <div className="text-6xl mb-3">🔓</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {pins.length === 0
              ? "Nenhum PIN gerado ainda"
              : "Nenhum PIN encontrado"}
          </h3>
          <p className="text-slate-500 mb-4 text-sm max-w-md mx-auto">
            {pins.length === 0
              ? "Gere PINs para autorizar motoristas a gravarem ou editarem rotas pelo aplicativo."
              : "Tente ajustar os filtros de busca."}
          </p>
          {pins.length === 0 && (
            <button
              onClick={() => setModalGerar(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition"
            >
              ➕ Gerar primeiro PIN
            </button>
          )}
        </div>
      )}

      {/* Lista de PINs */}
      {!loading && pinsFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pinsFiltrados.map((pin) => {
            const cores = coresStatusPin[pin.status];
            const tempo = tempoRestante(pin.expira_em);
            const ehAtivo = pin.status === "ativo";

            return (
              <div
                key={pin.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${
                  !ehAtivo ? "opacity-75" : ""
                }`}
              >
                {/* Header colorido */}
                <div
                  className={`px-5 py-4 border-b ${cores.bg} ${cores.border}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cores.icone}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${cores.text}`}
                      >
                        {rotulosStatusPin[pin.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                      {iconesTipoPin[pin.tipo]} {rotulosTipoPin[pin.tipo]}
                    </div>
                  </div>
                </div>

                {/* Código PIN */}
                <div className="p-5 text-center border-b">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Código
                  </p>
                  <p className="text-3xl font-black text-slate-800 font-mono tracking-widest">
                    {formatarPin(pin.codigo)}
                  </p>
                  {ehAtivo && pin.expira_em && (
                    <p
                      className={`text-xs mt-2 font-semibold ${
                        tempo.urgente ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      ⏱️ Expira em {tempo.texto}
                    </p>
                  )}
                  {ehAtivo && !pin.expira_em && (
                    <p className="text-xs mt-2 font-semibold text-slate-500">
                      ♾️ Sem expiração
                    </p>
                  )}
                </div>

                {/* Info motorista */}
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">
                      {iniciaisNome(pin.motorista?.nome || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {pin.motorista?.nome || "Motorista removido"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {pin.motorista?.telefone || "-"}
                      </p>
                    </div>
                  </div>

                  {pin.rota && (
                    <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-2 py-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: pin.rota.cor || "#3B82F6" }}
                      />
                      <span className="text-slate-600">
                        📍 {pin.rota.nome}
                      </span>
                    </div>
                  )}

                  {pin.observacao && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg p-2">
                      💬 {pin.observacao}
                    </p>
                  )}

                  <div className="pt-2 border-t text-xs text-slate-400">
                    <p>Gerado em {formatarData(pin.created_at)}</p>
                    {pin.criador && (
                      <p>por {pin.criador.nome}</p>
                    )}
                    {pin.usado_em && (
                      <p className="text-blue-600 font-semibold mt-1">
                        ✅ Usado em {formatarData(pin.usado_em)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                {ehAtivo && (
                  <div className="p-3 border-t bg-slate-50 flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pin.codigo);
                        setMensagem({
                          tipo: "sucesso",
                          texto: "PIN copiado!",
                        });
                      }}
                      className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 transition active:scale-95"
                    >
                      📋 Copiar
                    </button>
                    <button
                      onClick={() => setConfirmarCancelar(pin)}
                      className="flex-1 bg-red-50 border border-red-200 text-red-600 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition active:scale-95"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal gerar PIN */}
      <Modal
        aberto={modalGerar}
        onFechar={() => setModalGerar(false)}
        titulo="🔓 Gerar novo PIN"
        tamanho="md"
      >
        <FormGerarPin
          onSucesso={(codigo) => {
            setModalGerar(false);
            setPinRecemGerado(codigo);
            carregarPins();
          }}
          onCancelar={() => setModalGerar(false)}
        />
      </Modal>

      {/* Modal PIN gerado */}
      <Modal
        aberto={!!pinRecemGerado}
        onFechar={() => setPinRecemGerado(null)}
        titulo=""
        tamanho="sm"
      >
        {pinRecemGerado && (
          <PinGerado
            codigo={pinRecemGerado}
            onFechar={() => setPinRecemGerado(null)}
          />
        )}
      </Modal>

      {/* Confirmação cancelar */}
      <Modal
        aberto={!!confirmarCancelar}
        onFechar={() => setConfirmarCancelar(null)}
        titulo="Cancelar PIN?"
        tamanho="sm"
      >
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto mb-3">
              ⚠️
            </div>
            <p className="text-slate-700">
              Tem certeza que deseja cancelar o PIN{" "}
              <span className="font-mono font-bold">
                {confirmarCancelar && formatarPin(confirmarCancelar.codigo)}
              </span>
              ?
            </p>
            <p className="text-xs text-slate-500 mt-2">
              O motorista não conseguirá mais usá-lo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmarCancelar(null)}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition active:scale-95"
            >
              Voltar
            </button>
            <button
              onClick={cancelarPin}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-500 transition active:scale-95"
            >
              Sim, cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {mensagem && (
        <div
          className={`fixed top-6 right-6 z-[3000] px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm ${
            mensagem.tipo === "sucesso"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {mensagem.tipo === "sucesso" ? "✅ " : "❌ "}
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}