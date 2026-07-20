import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  Route as RouteIcon,
  Building2,
  Map,
  Users,
  Bell,
  Truck,
  Key,
  History,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useMotoristasAoVivo } from "../hooks/useMotoristasAoVivo";
import { useAlertasSOS } from "../contexts/AlertasSOSContext";
import Logo from "./Logo";

export default function Sidebar() {
  const { empresa } = useAuth();
  const { stats } = useMotoristasAoVivo();
  const { stats: statsAlertas } = useAlertasSOS();
  const location = useLocation();

  // Detecta se alguma rota do submenu está ativa
  const submenuAtivo =
    location.pathname === "/linhas" || location.pathname === "/rotas";

  const [submenuAberto, setSubmenuAberto] = useState(submenuAtivo);

  // Abre o submenu automaticamente ao navegar pra alguma rota dele
  useEffect(() => {
    if (submenuAtivo) setSubmenuAberto(true);
  }, [submenuAtivo]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-[#1E56D4] text-white shadow-lg"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-[#1E56D4]/20 text-white border-l-2 border-[#1E56D4] rounded-l-none"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside className="w-64 bg-[#09152E] text-white flex flex-col shadow-xl shrink-0">
      {/* LOGO */}
      <div className="p-5 border-b border-slate-800">
        <Logo size={44} variant="dark" />
        {empresa && (
          <p className="text-[11px] text-slate-500 mt-3 truncate font-medium">
            {empresa.nome}
          </p>
        )}
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        {/* Ao Vivo com badge */}
        <NavLink to="/ao-vivo" className={linkClass}>
          {({ isActive }) => (
            <>
              <div className="relative">
                <Radio size={20} />
                {stats.emViagem > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className="flex-1">Ao Vivo</span>
              {stats.emViagem > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {stats.emViagem}
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* 🆕 Alertas SOS com badge pulsante */}
        <NavLink to="/alertas" className={linkClass}>
          {({ isActive }) => (
            <>
              <div className="relative">
                <AlertTriangle size={20} />
                {statsAlertas.ativos > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className="flex-1">Alertas SOS</span>
              {statsAlertas.ativos > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {statsAlertas.ativos}
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* Submenu Linhas & Rotas */}
        <div>
          <button
            onClick={() => setSubmenuAberto(!submenuAberto)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              submenuAtivo
                ? "text-white bg-slate-800/60"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <RouteIcon size={20} />
            <span className="flex-1 text-left">Linhas & Rotas</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                submenuAberto ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Sub-itens */}
          {submenuAberto && (
            <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
              <NavLink to="/linhas" className={subLinkClass}>
                <Building2 size={16} />
                Linhas
              </NavLink>
              <NavLink to="/rotas" className={subLinkClass}>
                <Map size={16} />
                Rotas
              </NavLink>
            </div>
          )}
        </div>

        {/* Motoristas */}
        <NavLink to="/motoristas" className={linkClass}>
          <Users size={20} />
          Motoristas
        </NavLink>

        {/* Notificações */}
        <NavLink to="/notificacoes" className={linkClass}>
          <Bell size={20} />
          Notificações
        </NavLink>

        {/* Veículos */}
        <NavLink to="/veiculos" className={linkClass}>
          <Truck size={20} />
          Veículos
        </NavLink>

        {/* PINs */}
        <NavLink to="/pins" className={linkClass}>
          <Key size={20} />
          PINs
        </NavLink>

        {/* Histórico */}
        <NavLink to="/historico" className={linkClass}>
          <History size={20} />
          Histórico
        </NavLink>
      </nav>
    </aside>
  );
}