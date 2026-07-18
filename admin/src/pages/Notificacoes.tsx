import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import FormNovaNotificacao from "../components/notificacoes/FormNovaNotificacao";

interface NotificacaoEnviada {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
  motorista_id: string;
  motoristas?: { nome: string } | null;
}

const CORES_TIPO: Record<string, { bg: string; text: string; icone: string }> = {
  info: { bg: "bg-slate-100", text: "text-slate-700", icone: "ℹ️" },
  rota: { bg: "bg-blue-100", text: "text-blue-700", icone: "🚌" },
  alerta: { bg: "bg-amber-100", text: "text-amber-700", icone: "⚠️" },
  emergencia: { bg: "bg-red-100", text: "text-red-700", icone: "🚨" },
};

export default function Notificacoes() {
  const { empresa } = useAuth();
  const [notificacoes, setNotificacoes] = useState<NotificacaoEnviada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    if (empresa) carregarNotificacoes();
  }, [empresa]);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3500);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const carregarNotificacoes = async () => {
    if (!empresa) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*, motoristas(nome)")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setNotificacoes(data as any);
    }
    setLoading(false);
  };

  const notificacoesFiltradas = useMemo(() => {
    let lista = notificacoes;
    if (filtroTipo !== "todos") {
      lista = lista.filter((n) => n.tipo === filtroTipo);
    }
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (n) =>
          n.titulo.toLowerCase().includes(t) ||
          n.mensagem.toLowerCase().includes(t) ||
          n.motoristas?.nome.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [notificacoes, busca, filtroTipo]);

  const stats = useMemo(() => {
    const hoje = new Date().toDateString();
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);

    return {
      total: notificacoes.length,
      hoje: notificacoes.filter(
        (n) => new Date(n.created_at).toDateString() === hoje
      ).length,
      semana: notificacoes.filter(
        (n) => new Date(n.created_at) >= semanaAtras
      ).length,
      naoLidas: notificacoes.filter((n) => !n.lida).length,
    };
  }, [notificacoes]);

  const formatarData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notificações</h1>
          <p className="text-sm text-slate-500 mt-1">
            Envie avisos e alertas para os motoristas da sua operação
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition active:scale-95 shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <span>+</span> Nova Notificação
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Total
              </p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Hoje
              </p>
              <p className="text-2xl font-bold text-green-600">{stats.hoje}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Últimos 7 dias
              </p>
              <p className="text-2xl font-bold text-indigo-600">{stats.semana}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                Não Lidas
              </p>
              <p className="text-2xl font-bold text-amber-600">{stats.naoLidas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por título, mensagem ou motorista..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-slate-300 pl-10 pr-4 py-2.5 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { v: "todos", l: "Todos" },
            { v: "info", l: "Info" },
            { v: "rota", l: "Rota" },
            { v: "alerta", l: "Alerta" },
            { v: "emergencia", l: "SOS" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltroTipo(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTipo === f.v
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
          <p className="text-slate-500 mt-3">Carregando notificações...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && notificacoesFiltradas.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <div className="text-6xl mb-3">🔔</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {notificacoes.length === 0
              ? "Nenhuma notificação enviada"
              : "Nenhuma notificação encontrada"}
          </h3>
          <p className="text-slate-500 mb-4 text-sm">
            {notificacoes.length === 0
              ? "Envie a primeira notificação aos seus motoristas."
              : "Tente ajustar os filtros de busca."}
          </p>
          {notificacoes.length === 0 && (
            <button
              onClick={() => setModalAberto(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-500 transition"
            >
              Enviar primeira notificação
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {!loading && notificacoesFiltradas.length > 0 && (
        <div className="space-y-2">
          {notificacoesFiltradas.map((n) => {
            const cor = CORES_TIPO[n.tipo] || CORES_TIPO.info;
            return (
              <div
                key={n.id}
                className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-xl ${cor.bg} flex items-center justify-center text-2xl shrink-0`}>
                  {cor.icone}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-bold text-slate-800 truncate">
                      {n.titulo}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cor.bg} ${cor.text} shrink-0`}>
                      {n.tipo}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                    {n.mensagem}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {n.motoristas?.nome || "Motorista removido"}
                    </span>
                    <span>·</span>
                    <span>{formatarData(n.created_at)}</span>
                    <span>·</span>
                    {n.lida ? (
                      <span className="text-green-600 font-semibold">✓ Lida</span>
                    ) : (
                      <span className="text-amber-600 font-semibold">● Não lida</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Nova Notificação"
        tamanho="lg"
      >
        <FormNovaNotificacao
          onSucesso={(total) => {
            setModalAberto(false);
            setMensagem({
              tipo: "sucesso",
              texto: `Notificação enviada para ${total} motorista${total > 1 ? "s" : ""}!`,
            });
            carregarNotificacoes();
          }}
          onCancelar={() => setModalAberto(false)}
        />
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
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}