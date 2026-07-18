import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AvatarMenu() {
  const { usuario, empresa, signOut } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const iniciais =
    usuario?.nome
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "??";

  const roleLabel: Record<string, string> = {
    owner: "Proprietário",
    admin: "Administrador",
    operador: "Operador",
  };

  const handleLogout = async () => {
    setAberto(false);
    await signOut();
    navigate("/login");
  };

  const irPara = (rota: string) => {
    setAberto(false);
    navigate(rota);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-3 border-l pl-4 border-slate-200 hover:opacity-80 transition"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-800 leading-tight">
            {usuario?.nome || "Usuário"}
          </p>
          <p className="text-xs text-slate-500">
            {roleLabel[usuario?.role || ""] || usuario?.role}
          </p>
        </div>
        <div className="w-11 h-11 bg-gradient-to-br from-[#1E56D4] to-[#09152E] rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm">
          {iniciais}
        </div>
      </button>

      {aberto && (
        <div className="absolute right-0 top-14 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-w-[260px]">
          {/* Cabeçalho */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1E56D4] to-[#09152E] rounded-full flex items-center justify-center font-bold text-white text-lg shadow-md">
                {iniciais}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">
                  {usuario?.nome}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {usuario?.email}
                </p>
              </div>
            </div>
            {empresa && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
                  Empresa
                </p>
                <p className="text-sm font-semibold text-blue-700 mt-0.5">
                  {empresa.nome}
                </p>
              </div>
            )}
          </div>

          {/* Links funcionais */}
          <div className="py-1">
            <button
              onClick={() => irPara("/configuracoes")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Meu Perfil</span>
            </button>
            <button
              onClick={() => irPara("/configuracoes")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Empresa</span>
            </button>
            <button
              onClick={() => irPara("/configuracoes")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Configurações</span>
            </button>
          </div>

          <div className="border-t border-slate-100" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}