import { useEffect, useRef } from "react";
import { supabase } from "../supabase";

interface UseEnviarPosicaoProps {
  latitude: number | null;
  longitude: number | null;
  heading: number;
  velocidade: number;
  emViagem: boolean;
  viagemId: string | null;
  intervalo?: number; // ms
}

/**
 * Hook que envia a posição do motorista pro Supabase a cada X segundos.
 * Também envia updates imediatos quando estados-chave mudam.
 */
export function useEnviarPosicao({
  latitude,
  longitude,
  heading,
  velocidade,
  emViagem,
  viagemId,
  intervalo = 10000, // 10 segundos default
}: UseEnviarPosicaoProps) {
  const intervalRef = useRef<any>(null);
  const ultimoEnvioRef = useRef<number>(0);

  const enviarPosicao = async () => {
    if (latitude === null || longitude === null) return;

    try {
      const { error } = await supabase.rpc("atualizar_posicao_motorista", {
        p_latitude: latitude,
        p_longitude: longitude,
        p_heading: heading,
        p_velocidade_kmh: velocidade,
        p_em_viagem: emViagem,
        p_viagem_id: viagemId,
      });

      if (error) {
        console.log("❌ Erro ao enviar posição:", error.message);
      } else {
        ultimoEnvioRef.current = Date.now();
      }
    } catch (err) {
      console.log("❌ Exceção ao enviar posição:", err);
    }
  };

  // Envia posição em intervalos regulares (só se em viagem)
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (emViagem && latitude !== null && longitude !== null) {
      // Envia imediatamente ao iniciar
      enviarPosicao();

      // E depois a cada X segundos
      intervalRef.current = setInterval(() => {
        enviarPosicao();
      }, intervalo);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [emViagem, viagemId, intervalo]);

  // Envia update imediato quando muda estado importante
  useEffect(() => {
    // Se está em viagem e passou mais de 3s do último envio, força envio
    if (
      emViagem &&
      latitude !== null &&
      longitude !== null &&
      Date.now() - ultimoEnvioRef.current > 3000
    ) {
      enviarPosicao();
    }
  }, [latitude, longitude]);

  // Marca como offline ao desmontar
  useEffect(() => {
    return () => {
      supabase.rpc("marcar_motorista_offline").then(() => {
        console.log("Motorista marcado como offline");
      });
    };
  }, []);

  return { enviarPosicao };
}