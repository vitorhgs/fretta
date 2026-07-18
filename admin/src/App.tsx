import { useAuth } from "./contexts/AuthContext";
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

function AppLayout() {
  const { empresa } = useAuth();

  // Se empresa não completou onboarding, mostra tela obrigatória
  if (empresa && !empresa.onboarding_completo) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-slate-800 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rotas" element={<Rotas />} />
            <Route path="/motoristas" element={<Motoristas />} />
            <Route path="/veiculos" element={<Veiculos />} />
            <Route path="/pins" element={<Pins />} />
            <Route path="/ao-vivo" element={<AoVivo />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </main>
      </div>
    </div>
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