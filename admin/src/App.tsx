import { useAuth } from "./contexts/AuthContext";
import { AlertasSOSProvider } from "./contexts/AlertasSOSContext";
import Configuracoes from "./pages/Configuracoes";
import Onboarding from "./components/Onboarding";
import Historico from "./pages/Historico";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Rotas from "./pages/Rotas";
import Motoristas from "./pages/Motoristas";
import Veiculos from "./pages/Veiculos";
import Pins from "./pages/Pins";
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AoVivo from "./pages/AoVivo";
import Notificacoes from "./pages/Notificacoes";
import Linhas from "./pages/Linhas";
import Alertas from "./pages/Alertas";
import Perfil from "./pages/Perfil";
import AlertaSOSNotificacaoGlobal from "./components/AlertaSOSNotificacaoGlobal";

function AppLayout() {
  const { empresa } = useAuth();

  if (empresa && !empresa.onboarding_completo) {
    return <Onboarding />;
  }

  return (
    <AlertasSOSProvider>
      <div className="min-h-screen flex bg-[#F8F9FA] text-slate-800 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Header />
          <main className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/linhas" element={<Linhas />} />
              <Route path="/alertas" element={<Alertas />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/rotas" element={<Rotas />} />
              <Route path="/motoristas" element={<Motoristas />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/pins" element={<Pins />} />
              <Route path="/ao-vivo" element={<AoVivo />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/notificacoes" element={<Notificacoes />} />
            </Routes>
          </main>
        </div>
      </div>
       <AlertaSOSNotificacaoGlobal/>
    </AlertasSOSProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;