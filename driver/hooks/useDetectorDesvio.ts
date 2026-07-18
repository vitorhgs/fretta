import { useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { distanciaAteRota } from "../lib/desvio";
import { supabase } from "../supabase";

interface Ponto {
  latitude: number;
  longitude: number;
}

interface UseDetectorDesvioProps {
  localizacao: Ponto | null;
  rota: Ponto[];
  emViagem: boolean;
  viagemId: string | null;
  velocidade?: number; // 🆕 km/h
  tolerancia?: number; // metros
}

interface DesvioAtivo {
  iniciado_em: string;
  latitude_inicio: number;
  longitude_inicio: number;
  distancia_maxima_metros: number;
}

/**
 * 🆕 Calcula tempo de confirmação dinâmico baseado na velocidade
 * - Parado (0 km/h)      → 10s (evita falso positivo)
 * - Devagar (< 30 km/h)  → 7s
 * - Normal (>= 30 km/h)  → 4s
 */
function calcularTempoConfirmacao(velocidade: number): number {
  if (velocidade < 5) return 10000; // parado / quase parado
  if (velocidade < 30) return 7000; // devagar
  return 4000; // velocidade normal
}

/**
 * Hook que detecta quando o motorista sai da rota planejada.
 */
export function useDetectorDesvio({
  localizacao,
  rota,
  emViagem,
  viagemId,
  velocidade = 0,
  tolerancia = 50,
}: UseDetectorDesvioProps) {
  const [emDesvio, setEmDesvio] = useState(false);
  const [distanciaAtual, setDistanciaAtual] = useState(0);

  const desvioAtivoRef = useRef<DesvioAtivo | null>(null);
  const timerConfirmacaoRef = useRef<any>(null);
  const foraDaRotaDesdeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset quando não está em viagem
    if (!emViagem) {
      setEmDesvio(false);
      desvioAtivoRef.current = null;
      foraDaRotaDesdeRef.current = null;
      if (timerConfirmacaoRef.current) {
        clearTimeout(timerConfirmacaoRef.current);
        timerConfirmacaoRef.current = null;
      }
      return;
    }

    if (!localizacao || rota.length === 0) return;

    const { distancia } = distanciaAteRota(localizacao, rota);
    setDistanciaAtual(distancia);

    const foraDaRota = distancia > tolerancia;

    // ============ ENTRANDO EM DESVIO ============
    if (foraDaRota && !emDesvio) {
      if (foraDaRotaDesdeRef.current === null) {
        foraDaRotaDesdeRef.current = Date.now();

        // 🆕 Tempo dinâmico baseado na velocidade
        const tempoConfirmacao = calcularTempoConfirmacao(velocidade);

        timerConfirmacaoRef.current = setTimeout(() => {
          setEmDesvio(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

          desvioAtivoRef.current = {
            iniciado_em: new Date().toISOString(),
            latitude_inicio: localizacao.latitude,
            longitude_inicio: localizacao.longitude,
            distancia_maxima_metros: distancia,
          };
        }, tempoConfirmacao);
      }
    }

    // ============ VOLTOU PRA ROTA (antes de confirmar) ============
    if (!foraDaRota && foraDaRotaDesdeRef.current !== null && !emDesvio) {
      foraDaRotaDesdeRef.current = null;
      if (timerConfirmacaoRef.current) {
        clearTimeout(timerConfirmacaoRef.current);
        timerConfirmacaoRef.current = null;
      }
    }

    // ============ ATUALIZA DISTÂNCIA MÁXIMA ============
    if (
      emDesvio &&
      desvioAtivoRef.current &&
      distancia > desvioAtivoRef.current.distancia_maxima_metros
    ) {
      desvioAtivoRef.current.distancia_maxima_metros = distancia;
    }

    // ============ SAINDO DO DESVIO ============
    if (!foraDaRota && emDesvio) {
      setEmDesvio(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (desvioAtivoRef.current && viagemId) {
        salvarDesvio(viagemId, desvioAtivoRef.current);
      }

      desvioAtivoRef.current = null;
      foraDaRotaDesdeRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localizacao, emViagem, rota.length, viagemId, velocidade]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerConfirmacaoRef.current) {
        clearTimeout(timerConfirmacaoRef.current);
      }
      if (emDesvio && desvioAtivoRef.current && viagemId) {
        salvarDesvio(viagemId, desvioAtivoRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { emDesvio, distanciaAtual };
}

async function salvarDesvio(
  viagemId: string,
  desvio: DesvioAtivo
): Promise<void> {
  try {
    const finalizadoEm = new Date().toISOString();
    const duracaoSegundos = Math.floor(
      (new Date(finalizadoEm).getTime() -
        new Date(desvio.iniciado_em).getTime()) /
        1000
    );

    const { data, error: fetchError } = await supabase
      .from("viagens")
      .select("desvios, total_desvios")
      .eq("id", viagemId)
      .single();

    if (fetchError) {
      console.log("❌ Erro ao buscar desvios:", fetchError.message);
      return;
    }

    const desviosAtuais = data?.desvios || [];
    const totalAtual = data?.total_desvios || 0;

    const novoDesvio = {
      ...desvio,
      finalizado_em: finalizadoEm,
      duracao_segundos: duracaoSegundos,
    };

    const { error: updateError } = await supabase
      .from("viagens")
      .update({
        desvios: [...desviosAtuais, novoDesvio],
        total_desvios: totalAtual + 1,
      })
      .eq("id", viagemId);

    if (updateError) {
      console.log("❌ Erro ao salvar desvio:", updateError.message);
    } else {
      console.log("⚠️ Desvio registrado:", novoDesvio);
    }
  } catch (err) {
    console.log("❌ Exceção ao salvar desvio:", err);
  }
}