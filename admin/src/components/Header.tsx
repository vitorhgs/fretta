import { useEffect, useState } from "react";
import { Play, CheckCircle2, XCircle, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotificacoesViagem } from "../hooks/useNotificacoesViagem";
import AvatarMenu from "./AvatarMenu";
import NotificacoesPopover from "./NotificacoesPopover";

export default function Header() {
  const { usuario } = useAuth();
  const { ultima, limparUltima } = useNotificacoesViagem();
  const [toast, setToast] = useState<{
    tipo: string;
    texto: string;
  } | null>(null);

  const primeiroNome = usuario?.nome?.split(" ")[0] || "Usuário";

  const horaAtual = new Date().getHours();
  const saudacao =
    horaAtual < 12 ? "Bom dia" : horaAtual < 18 ? "Boa tarde" : "Boa noite";

  // Mostra toast quando recebe notificação de viagem
  useEffect(() => {
    if (!ultima) return;

    const textos = {
      iniciou: `${ultima.motorista} iniciou viagem na rota ${ultima.rota}`,
      concluiu: `${ultima.motorista} concluiu viagem na rota ${ultima.rota}`,
      cancelou: `${ultima.motorista} cancelou viagem na rota ${ultima.rota}`,
    };

    setToast({
      tipo: ultima.tipo,
      texto: textos[ultima.tipo],
    });

    limparUltima();

    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [ultima]);

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm relative">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {saudacao}, {primeiroNome}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bem-vindo ao painel do Fretta
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notificações com popover funcional */}
          <NotificacoesPopover />

          {/* Avatar */}
          <AvatarMenu />
        </div>
      </header>

      {/* Toast de notificação de viagem */}
      {toast && (
        <div
          className={`
            fixed top-4 right-4 z-[5000] max-w-sm
            px-5 py-4 rounded-xl shadow-2xl border
            flex items-start gap-3
            animate-in slide-in-from-right duration-300
            ${
              toast.tipo === "iniciou"
                ? "bg-blue-50 border-blue-200"
                : toast.tipo === "concluiu"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }
          `}
        >
          {/* Ícone */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${
                toast.tipo === "iniciou"
                  ? "bg-blue-100"
                  : toast.tipo === "concluiu"
                  ? "bg-green-100"
                  : "bg-red-100"
              }
            `}
          >
            {toast.tipo === "iniciou" && (
              <Play size={20} className="text-blue-600" strokeWidth={2.2} />
            )}
            {toast.tipo === "concluiu" && (
              <CheckCircle2
                size={20}
                className="text-green-600"
                strokeWidth={2.2}
              />
            )}
            {toast.tipo === "cancelou" && (
              <XCircle size={20} className="text-red-600" strokeWidth={2.2} />
            )}
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-bold ${
                toast.tipo === "iniciou"
                  ? "text-blue-800"
                  : toast.tipo === "concluiu"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {toast.tipo === "iniciou"
                ? "Viagem iniciada"
                : toast.tipo === "concluiu"
                ? "Viagem concluída"
                : "Viagem cancelada"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5 truncate">
              {toast.texto}
            </p>
          </div>

          {/* Fechar */}
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </>
  );
}