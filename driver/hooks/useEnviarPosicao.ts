import { useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useConexao } from "./useConexao";
import { adicionarPosicaoFila } from "../lib/cacheRota";

interface UseEnviarPosicaoProps {
  latitude: number | null;
  longitude: number | null;
  heading: number;
  velocidade: number;
  emViagem: boolean;
  viagemId: string | null;
  intervalo?: number;
}

export function useEnviarPosicao({
  latitude,
  longitude,
  heading,
  velocidade,
  emViagem,
  viagemId,
  intervalo = 10000,
}: UseEnviarPosicaoProps) {
  const { online } = useConexao();
  const intervalRef = useRef<any>(null);
  const ultimoEnvioRef = useRef<number>(0);
  const onlineRef = useRef(online);

  // Mantém ref atualizada
  useEffect(() => {
    onlineRef.current = online;
  }, [online]);

  const enviarOuArmazenarPosicao = async () => {
    if (latitude === null || longitude === null) return;

    const dadosPosicao = {
      latitude,
      longitude,
      heading,
      velocidade_kmh: velocidade,
      em_viagem: emViagem,
      viagem_id: viagemId,
    };

    // 🆕 Se offline, salva na fila SILENCIOSAMENTE
    if (!onlineRef.current) {
      await adicionarPosicaoFila(dadosPosicao);
      return;
    }

    // Online: tenta enviar
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
        // Erro do banco (não de rede) — só loga
        console.log("⚠️ Erro RPC:", error.message);
        await adicionarPosicaoFila(dadosPosicao);
      } else {
        ultimoEnvioRef.current = Date.now();
      }
    } catch (err: any) {
      // Erro de rede (mesmo com online=true, pode dar timeout)
      // Silencioso — apenas adiciona à fila
      await adicionarPosicaoFila(dadosPosicao);
    }
  };

  // Intervalo periódico
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (emViagem && latitude !== null && longitude !== null) {
      enviarOuArmazenarPosicao();

      intervalRef.current = setInterval(() => {
        enviarOuArmazenarPosicao();
      }, intervalo);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [emViagem, viagemId, intervalo]);

  // Envia update imediato quando muda GPS
  useEffect(() => {
    if (
      emViagem &&
      latitude !== null &&
      longitude !== null &&
      Date.now() - ultimoEnvioRef.current > 3000
    ) {
      enviarOuArmazenarPosicao();
    }
  }, [latitude, longitude]);

// Marca como offline ao desmontar (só se estiver online)
useEffect(() => {
  return () => {
    if (onlineRef.current) {
      // Envolve em async IIFE pra poder usar try/catch
      (async () => {
        try {
          await supabase.rpc("marcar_motorista_offline");
        } catch {
          // Silencioso
        }
      })();
    }
  };
}, []);

  return { enviarPosicao: enviarOuArmazenarPosicao };
}