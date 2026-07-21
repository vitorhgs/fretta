import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";
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
        <div className="absolute right-0 top-14 z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-w-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
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
                <p className="text-sm font-semibold text-blue-700 mt-0.5 truncate">
                  {empresa.nome}
                </p>
              </div>
            )}
          </div>

          {/* Links funcionais */}
          <div className="py-1">
            <button
              onClick={() => irPara("/perfil")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <User size={16} className="text-slate-400" strokeWidth={2.2} />
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={() => irPara("/configuracoes")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <Settings
                size={16}
                className="text-slate-400"
                strokeWidth={2.2}
              />
              <span>Configurações</span>
            </button>
          </div>

          <div className="border-t border-slate-100" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-semibold"
          >
            <LogOut size={16} strokeWidth={2.2} />
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}