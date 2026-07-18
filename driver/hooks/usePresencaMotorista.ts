import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Location from "expo-location";
import { supabase } from "../supabase";
import { pedirPermissaoGPS } from "../lib/gps";

/**
 * Hook que mantém o motorista "online" no painel admin.
 * - Envia posição a cada 30s quando não está em viagem
 * - Marca como offline ao fechar o app
 * - Detecta background/foreground do app
 */
export function usePresencaMotorista(motoristaLogado: boolean) {
  const intervalRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  const enviarPresenca = async () => {
    try {
      // Pega localização rápida
      const permitido = await pedirPermissaoGPS();
      if (!permitido) return;

      const pos = await Location.getLastKnownPositionAsync({
        maxAge: 120000, // aceita até 2 min de idade
      });

      if (!pos) {
        // Se não tem última conhecida, pega uma nova (rápida)
        const nova = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { error } = await supabase.rpc("atualizar_posicao_motorista", {
          p_latitude: nova.coords.latitude,
          p_longitude: nova.coords.longitude,
          p_heading: 0,
          p_velocidade_kmh: 0,
          p_em_viagem: false,
          p_viagem_id: null,
        });

        if (error) console.log("Erro presença:", error.message);
        return;
      }

      const { error } = await supabase.rpc("atualizar_posicao_motorista", {
        p_latitude: pos.coords.latitude,
        p_longitude: pos.coords.longitude,
        p_heading: 0,
        p_velocidade_kmh: 0,
        p_em_viagem: false,
        p_viagem_id: null,
      });

      if (error) console.log("Erro presença:", error.message);
    } catch (err: any) {
      console.log("Exceção presença:", err.message);
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

  // Detecta background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const anterior = appStateRef.current;
      appStateRef.current = nextAppState;

      // App voltou pro foreground → envia presença
      if (
        motoristaLogado &&
        anterior.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("📱 App voltou ao foreground");
        enviarPresenca();
      }

      // App foi pro background → marca offline
      if (
        motoristaLogado &&
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
  }, [motoristaLogado]);

  // Envia presença periodicamente
  useEffect(() => {
    if (!motoristaLogado) return;

    // Envia imediatamente ao logar
    enviarPresenca();

    // Depois a cada 30s
    intervalRef.current = setInterval(() => {
      enviarPresenca();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Marca offline ao desmontar (logout)
      marcarOffline();
    };
  }, [motoristaLogado]);
}