import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  Route as RouteIcon,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  link: string | null;
  created_at: string;
}

function tempoRelativo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getIconByTipo(tipo: string) {
  switch (tipo) {
    case "alerta":
    case "emergencia":
      return { Icon: AlertTriangle, cor: "text-red-600", bg: "bg-red-100" };
    case "rota":
      return { Icon: RouteIcon, cor: "text-blue-600", bg: "bg-blue-100" };
    case "sistema":
    case "info":
    default:
      return { Icon: Info, cor: "text-slate-600", bg: "bg-slate-100" };
  }
}

export default function NotificacoesPopover() {
  const { empresa } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const canalRef = useRef<any>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);

    // Últimas 5
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Total não lidas
    const { count } = await supabase
      .from("notificacoes")
      .select("*", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("lida", false);

    if (data) setNotificacoes(data as Notificacao[]);
    setTotalNaoLidas(count || 0);
    setLoading(false);
  }, [empresa]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Realtime — escuta novas notificações
  useEffect(() => {
    if (!empresa) return;

    // Remove canal antigo se existir
    const canaisExistentes = supabase.getChannels();
    canaisExistentes.forEach((c) => {
      if (c.topic === `realtime:notif_header_${empresa.id}`) {
        supabase.removeChannel(c);
      }
    });

    const canal = supabase.channel(`notif_header_${empresa.id}`);

    canal
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificacoes",
          filter: `empresa_id=eq.${empresa.id}`,
        },
        () => {
          carregar();
        }
      )
      .subscribe();

    canalRef.current = canal;

    return () => {
      if (canalRef.current) {
        supabase.removeChannel(canalRef.current);
      }
    };
  }, [empresa, carregar]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const marcarComoLida = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", id);
    carregar();
  };

  const marcarTodasComoLidas = async () => {
    if (!empresa) return;
    await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("empresa_id", empresa.id)
      .eq("lida", false);
    carregar();
  };

  const abrirNotificacao = (n: Notificacao) => {
    if (!n.lida) marcarComoLida(n.id);
    setAberto(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate("/notificacoes");
    }
  };

  const irParaTodas = () => {
    setAberto(false);
    navigate("/notificacoes");
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setAberto(!aberto)}
        className="text-slate-500 hover:text-slate-700 relative p-2 rounded-full hover:bg-slate-100 transition"
        title="Notificações"
      >
        <Bell size={22} strokeWidth={2} />
        {totalNaoLidas > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Popover */}
      {aberto && (
        <div className="absolute right-0 top-12 z-[100] w-[380px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-700" strokeWidth={2.2} />
              <h3 className="font-bold text-slate-800">Notificações</h3>
              {totalNaoLidas > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {totalNaoLidas} nova{totalNaoLidas > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {totalNaoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                title="Marcar todas como lidas"
              >
                <CheckCheck size={14} />
                Marcar lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="py-10 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Bell size={24} className="text-slate-400" strokeWidth={2} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma notificação
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Você está em dia! 🎉
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notificacoes.map((n) => {
                  const { Icon, cor, bg } = getIconByTipo(n.tipo);
                  return (
                    <div
                      key={n.id}
                      onClick={() => abrirNotificacao(n)}
                      className={`px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition relative ${
                        !n.lida ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {/* Bolinha azul se não lida */}
                      {!n.lida && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon size={16} className={cor} strokeWidth={2.2} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <p
                              className={`text-sm truncate ${
                                !n.lida
                                  ? "font-bold text-slate-800"
                                  : "font-semibold text-slate-600"
                              }`}
                            >
                              {n.titulo}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 mt-0.5">
                              {tempoRelativo(n.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {n.mensagem}
                          </p>
                        </div>

                        {!n.lida && (
                          <button
                            onClick={(e) => marcarComoLida(n.id, e)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded flex-shrink-0"
                            title="Marcar como lida"
                          >
                            <Check size={14} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={irParaTodas}
              className="w-full py-3 text-sm text-blue-600 hover:text-blue-700 hover:bg-white font-semibold transition flex items-center justify-center gap-1 group"
            >
              Ver todas as notificações
              <ChevronRight
                size={16}
                className="group-hover:translate-x-0.5 transition"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}