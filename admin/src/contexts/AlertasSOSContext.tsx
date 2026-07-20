import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "../supabase";
import { useAuth } from "./AuthContext";

export interface AlertaSOS {
  id: string;
  empresa_id: string;
  motorista_id: string;
  viagem_id: string | null;
  motorista_nome: string;
  rota_nome: string | null;
  latitude: number;
  longitude: number;
  velocidade_kmh: number;
  tipo: string;
  status: "aberto" | "em_atendimento" | "resolvido" | "falso_alarme";
  observacao_motorista: string | null;
  observacao_admin: string | null;
  criado_em: string;
  atendido_em: string | null;
  resolvido_em: string | null;
  atendido_por: string | null;
}

interface AlertasSOSContextType {
  alertas: AlertaSOS[];
  loading: boolean;
  stats: {
    ativos: number;
    emAtendimento: number;
    resolvidos: number;
    total: number;
  };
  novoAlerta: AlertaSOS | null;
  limparNovoAlerta: () => void;
  atender: (id: string) => Promise<void>;
  resolver: (id: string, observacao?: string) => Promise<void>;
  marcarFalsoAlarme: (id: string, observacao?: string) => Promise<void>;
  recarregar: () => Promise<void>;
}

const AlertasSOSContext = createContext<AlertasSOSContextType | null>(null);

export function AlertasSOSProvider({ children }: { children: ReactNode }) {
  const { empresa } = useAuth();
  const [alertas, setAlertas] = useState<AlertaSOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoAlerta, setNovoAlerta] = useState<AlertaSOS | null>(null);

  const canalRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const carregar = useCallback(async () => {
    if (!empresa) return;

    const { data, error } = await supabase
      .from("alertas_sos")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("criado_em", { ascending: false })
      .limit(50);

    if (!error && data && isMountedRef.current) {
      setAlertas(data as AlertaSOS[]);
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  }, [empresa]);

  // Carrega ao montar
  useEffect(() => {
    carregar();
  }, [carregar]);

  // Realtime — SÓ 1 canal global
  useEffect(() => {
    if (!empresa) return;

    isMountedRef.current = true;

    // Nome fixo do canal (singleton)
    const nomeCanal = `sos_global_${empresa.id}`;

    // Remove canal anterior se existir
    const canaisExistentes = supabase.getChannels();
    canaisExistentes.forEach((c) => {
      if (c.topic === `realtime:${nomeCanal}`) {
        supabase.removeChannel(c);
      }
    });

    const canal = supabase.channel(nomeCanal);

    canal
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alertas_sos",
          filter: `empresa_id=eq.${empresa.id}`,
        },
        (payload) => {
          const novo = payload.new as AlertaSOS;
          console.log("🚨 Novo alerta SOS:", novo);

          setAlertas((prev) => {
            if (prev.some((a) => a.id === novo.id)) return prev;
            return [novo, ...prev];
          });

          setNovoAlerta(novo);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alertas_sos",
          filter: `empresa_id=eq.${empresa.id}`,
        },
        (payload) => {
          const atualizado = payload.new as AlertaSOS;
          setAlertas((prev) =>
            prev.map((a) => (a.id === atualizado.id ? atualizado : a))
          );
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime SOS conectado (global)");
        }
      });

    canalRef.current = canal;

    return () => {
      isMountedRef.current = false;
      if (canalRef.current) {
        supabase.removeChannel(canalRef.current);
        canalRef.current = null;
      }
    };
  }, [empresa]);

  const atender = async (id: string) => {
    const { data: user } = await supabase.auth.getUser();
    await supabase
      .from("alertas_sos")
      .update({
        status: "em_atendimento",
        atendido_em: new Date().toISOString(),
        atendido_por: user?.user?.id || null,
      })
      .eq("id", id);
    carregar();
  };

  const resolver = async (id: string, observacao?: string) => {
    await supabase
      .from("alertas_sos")
      .update({
        status: "resolvido",
        resolvido_em: new Date().toISOString(),
        observacao_admin: observacao || null,
      })
      .eq("id", id);
    carregar();
  };

  const marcarFalsoAlarme = async (id: string, observacao?: string) => {
    await supabase
      .from("alertas_sos")
      .update({
        status: "falso_alarme",
        resolvido_em: new Date().toISOString(),
        observacao_admin: observacao || null,
      })
      .eq("id", id);
    carregar();
  };

  const stats = {
    ativos: alertas.filter((a) => a.status === "aberto").length,
    emAtendimento: alertas.filter((a) => a.status === "em_atendimento").length,
    resolvidos: alertas.filter((a) => a.status === "resolvido").length,
    total: alertas.length,
  };

  return (
    <AlertasSOSContext.Provider
      value={{
        alertas,
        loading,
        stats,
        novoAlerta,
        limparNovoAlerta: () => setNovoAlerta(null),
        atender,
        resolver,
        marcarFalsoAlarme,
        recarregar: carregar,
      }}
    >
      {children}
    </AlertasSOSContext.Provider>
  );
}

// Hook pra usar em qualquer componente
export function useAlertasSOS() {
  const context = useContext(AlertasSOSContext);
  if (!context) {
    throw new Error(
      "useAlertasSOS deve ser usado dentro de AlertasSOSProvider"
    );
  }
  return context;
}