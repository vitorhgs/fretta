import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { Usuario, Empresa } from "../types/database";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  usuario: Usuario | null;
  empresa: Empresa | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    nome: string,
    empresa: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  atualizarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = async (userId: string) => {
    try {
      const { data: dadosUsuario, error: erroUsuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (erroUsuario) {
        console.error("Erro ao carregar usuário:", erroUsuario);
        return;
      }

      if (dadosUsuario) {
        setUsuario(dadosUsuario);

        const { data: dadosEmpresa, error: erroEmpresa } = await supabase
          .from("empresas")
          .select("*")
          .eq("id", dadosUsuario.empresa_id)
          .single();

        if (erroEmpresa) {
          console.error("Erro ao carregar empresa:", erroEmpresa);
        } else if (dadosEmpresa) {
          setEmpresa(dadosEmpresa);
        }
      }
    } catch (err) {
      console.error("Erro geral ao carregar perfil:", err);
    }
  };

  useEffect(() => {
    // Buscar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        carregarPerfil(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Ouvir mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await carregarPerfil(session.user.id);
      } else {
        setUsuario(null);
        setEmpresa(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    nome: string,
    empresa: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, empresa },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setEmpresa(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error };
  };

  const atualizarPerfil = async () => {
    if (user) await carregarPerfil(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        usuario,
        empresa,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        atualizarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro do AuthProvider");
  return ctx;
}