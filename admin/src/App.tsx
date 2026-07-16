import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Rotas from "./pages/Rotas";

function App() {
  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-slate-800 font-sans">
      
      {/* SIDEBAR ESTILO MOCKUP (FRETTA) */}
      <aside className="w-64 bg-[#09152E] text-white flex flex-col shadow-xl shrink-0">
        
        {/* LOGO */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-white p-2 rounded-lg">
            <svg className="w-6 h-6 text-[#09152E]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-wider">Fretta</span>
        </div>

        {/* MENU LATERAL */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-[#1E56D4] text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </NavLink>

          <NavLink
            to="/rotas"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-[#1E56D4] text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Linhas & Rotas
          </NavLink>

          <NavLink
            to="/motoristas"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Motoristas
          </NavLink>

          <NavLink
            to="/veiculos"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Veículos
          </NavLink>
        </nav>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL COM CABEÇALHO */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER SUPERIOR */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Olá, Administrador</h1>
            <p className="text-xs text-slate-500">Bem-vindo ao painel do Fretta</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Ícone de Notificações */}
            <button className="text-slate-500 hover:text-slate-700 relative p-1 rounded-full hover:bg-slate-100 transition">
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            {/* Avatar do Usuário */}
            <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-[#09152E]">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER DO ROUTER */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rotas" element={<Rotas />} />
            <Route path="/motoristas" element={<div className="bg-white p-6 rounded-2xl shadow-sm border">Tela de Motoristas em construção.</div>} />
            <Route path="/veiculos" element={<div className="bg-white p-6 rounded-2xl shadow-sm border">Tela de Veículos em construção.</div>} />
          </Routes>
        </main>

      </div>
    </div>
  );
}

export default App;