import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Location from "expo-location";
import { supabase } from "../supabase";
import type { Session, User } from "@supabase/supabase-js";
import { pedirPermissaoGPS } from "../lib/gps";

interface Motorista {
  id: string;
  empresa_id: string;
  nome: string;
  cpf?: string;
  cnh?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  motorista: Motorista | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  recarregarMotorista: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs pra presença
  const presencaIntervalRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  const carregarMotorista = async (userId: string) => {
    try {
      console.log("🔍 Buscando motorista pelo auth_user_id:", userId);

      const { data, error } = await supabase
        .from("motoristas")
        .select("*")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.log("❌ Erro ao buscar motorista:", error.message);
        return;
      }

      if (!data) {
        console.log("⚠️ Motorista não encontrado para este auth_user_id");
        return;
      }

      console.log("✅ Motorista encontrado:", data.nome);
      setMotorista(data);
    } catch (err) {
      console.log("❌ Exceção ao carregar motorista:", err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        carregarMotorista(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await carregarMotorista(session.user.id);
      } else {
        setMotorista(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🆕 PRESENÇA — Envia posição periodicamente pro admin ver
  const enviarPresenca = async () => {
    if (!motorista) return;

    try {
      const permitido = await pedirPermissaoGPS();
      if (!permitido) return;

      let pos = await Location.getLastKnownPositionAsync({
        maxAge: 120000, // aceita até 2 min de idade
      });

      if (!pos) {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { error } = await supabase.rpc("atualizar_posicao_motorista", {
        p_latitude: pos.coords.latitude,
        p_longitude: pos.coords.longitude,
        p_heading: 0,
        p_velocidade_kmh: 0,
        p_em_viagem: false,
        p_viagem_id: null,
      });

      if (error) {
        console.log("❌ Erro presença:", error.message);
      } else {
        console.log("📡 Presença enviada");
      }
    } catch (err: any) {
      console.log("❌ Exceção presença:", err.message);
    }
  };

  const marcarOffline = async () => {
    try {
      await supabase.rpc("marcar_motorista_offline");
      console.log("📴 Motorista offline");
    } catch (err) {
      console.log("Erro ao marcar offline:", err);
    }
  };

  // 🆕 Detecta background/foreground do app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const anterior = appStateRef.current;
      appStateRef.current = nextAppState;

      if (!motorista) return;

      // App voltou ao foreground → envia presença
      if (
        anterior.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("📱 App voltou ao foreground");
        enviarPresenca();
      }

      // App foi pro background → marca offline
      if (
        anterior === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log("📱 App foi pro background");
        marcarOffline();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, [motorista]);

  // 🆕 Envia presença a cada 30s enquanto motorista tá logado
  useEffect(() => {
    if (!motorista) {
      if (presencaIntervalRef.current) {
        clearInterval(presencaIntervalRef.current);
        presencaIntervalRef.current = null;
      }
      return;
    }

    // Envia imediatamente ao logar
    enviarPresenca();

    // Depois a cada 30s
    presencaIntervalRef.current = setInterval(() => {
      enviarPresenca();
    }, 30000);

    return () => {
      if (presencaIntervalRef.current) {
        clearInterval(presencaIntervalRef.current);
        presencaIntervalRef.current = null;
      }
    };
  }, [motorista]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Marca como offline ANTES de deslogar (senão perde a permissão RLS)
    await marcarOffline();
    await supabase.auth.signOut();
    setMotorista(null);
  };

  const recarregarMotorista = async () => {
    if (user) await carregarMotorista(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        motorista,
        loading,
        signIn,
        signOut,
        recarregarMotorista,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de AuthProvider");
  return ctx;
}