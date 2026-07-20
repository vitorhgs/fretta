import { useEffect, useRef, useState } from "react";
import { calcularRotaRetorno } from "../lib/rotaRetorno";

interface Ponto {
  latitude: number;
  longitude: number;
}

interface UseRotaRetornoProps {
  emDesvio: boolean;
  localizacao: Ponto | null;
  rotaOficial: Ponto[];
  intervaloRecalculo?: number; // ms — recalcula a cada X segundos
}

interface EstadoRotaRetorno {
  pontos: Ponto[];
  distanciaMetros: number;
  calculando: boolean;
  fallback: boolean;
}

/**
 * Hook que calcula e mantém atualizada a rota de retorno
 * quando o motorista está em desvio.
 *
 * - Só ativa quando emDesvio = true
 * - Recalcula a cada 10 segundos (evita spammar a API)
 * - Some quando volta à rota
 */
export function useRotaRetorno({
  emDesvio,
  localizacao,
  rotaOficial,
  intervaloRecalculo = 10000,
}: UseRotaRetornoProps) {
  const [estado, setEstado] = useState<EstadoRotaRetorno>({
    pontos: [],
    distanciaMetros: 0,
    calculando: false,
    fallback: false,
  });

  const ultimoCalculoRef = useRef<number>(0);
  const calculandoRef = useRef(false);

  const calcular = async () => {
    if (calculandoRef.current) return;
    if (!localizacao || rotaOficial.length === 0) return;

    calculandoRef.current = true;
    setEstado((prev) => ({ ...prev, calculando: true }));

    const resultado = await calcularRotaRetorno(localizacao, rotaOficial);

    if (resultado && resultado.sucesso) {
      setEstado({
        pontos: resultado.pontos,
        distanciaMetros: resultado.distancia_metros,
        calculando: false,
        fallback: resultado.fallback,
      });
    } else {
      // Falha total — limpa
      setEstado({
        pontos: [],
        distanciaMetros: 0,
        calculando: false,
        fallback: false,
      });
    }

    calculandoRef.current = false;
    ultimoCalculoRef.current = Date.now();
  };

  // Ativa/desativa baseado no desvio
  useEffect(() => {
    if (!emDesvio) {
      // Limpa quando voltou à rota
      setEstado({
        pontos: [],
        distanciaMetros: 0,
        calculando: false,
        fallback: false,
      });
      ultimoCalculoRef.current = 0;
      return;
    }

    // Calcula imediatamente ao entrar em desvio
    calcular();
  }, [emDesvio]);

  // Recalcula periodicamente enquanto em desvio
  useEffect(() => {
    if (!emDesvio || !localizacao) return;

    const agora = Date.now();
    const passou = agora - ultimoCalculoRef.current;

    // Se passou tempo suficiente desde o último cálculo
    if (passou >= intervaloRecalculo) {
      calcular();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localizacao, emDesvio]);

  return estado;
}