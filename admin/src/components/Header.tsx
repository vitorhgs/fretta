import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotificacoesViagem } from "../hooks/useNotificacoesViagem";
import AvatarMenu from "./AvatarMenu";

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
          {/* Notificações (sino) */}
          <button
            className="text-slate-500 hover:text-slate-700 relative p-2 rounded-full hover:bg-slate-100 transition"
            title="Notificações"
          >
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

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
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.tipo === "concluiu" && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.tipo === "cancelou" && (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}