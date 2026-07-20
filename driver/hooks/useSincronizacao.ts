import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { useConexao } from "./useConexao";
import {
  buscarFilaPosicoes,
  removerPosicoesFila,
  contarFilaPosicoes,
} from "../lib/cacheRota";

interface EstadoSync {
  sincronizando: boolean;
  pendentes: number;
  ultimaSincronizacao: number | null;
  ultimoResultado: {
    enviadas: number;
    falhas: number;
  } | null;
}

/**
 * Hook global que sincroniza automaticamente quando volta a internet.
 * - Envia posições pendentes em lotes de 20
 * - Atualiza contador em tempo real
 */
export function useSincronizacao() {
  const { online } = useConexao();
  const [estado, setEstado] = useState<EstadoSync>({
    sincronizando: false,
    pendentes: 0,
    ultimaSincronizacao: null,
    ultimoResultado: null,
  });

  const sincronizandoRef = useRef(false);
  const onlineAnteriorRef = useRef(online);

  // Atualiza contador de pendentes periodicamente
  useEffect(() => {
    const atualizarContador = async () => {
      const total = await contarFilaPosicoes();
      setEstado((prev) => ({ ...prev, pendentes: total }));
    };

    atualizarContador();
    const interval = setInterval(atualizarContador, 3000);
    return () => clearInterval(interval);
  }, []);

  // Detecta quando VOLTA online e sincroniza
  useEffect(() => {
    const acabouDeVoltarOnline = online && !onlineAnteriorRef.current;
    onlineAnteriorRef.current = online;

    if (acabouDeVoltarOnline) {
      console.log("🌐 Internet voltou — iniciando sincronização");
      // Espera 2 segundos pra rede estabilizar
      setTimeout(() => {
        sincronizar();
      }, 2000);
    }
  }, [online]);

  /**
   * Sincroniza todas as posições pendentes
   */
  const sincronizar = async (): Promise<void> => {
    // Evita sincronizações simultâneas
    if (sincronizandoRef.current) {
      console.log("⏭️ Sincronização já em andamento");
      return;
    }

    if (!online) {
      console.log("⏭️ Sem internet, sincronização adiada");
      return;
    }

    const fila = await buscarFilaPosicoes();
    if (fila.length === 0) {
      console.log("✅ Nada pra sincronizar");
      return;
    }

    sincronizandoRef.current = true;
    setEstado((prev) => ({
      ...prev,
      sincronizando: true,
      pendentes: fila.length,
    }));

    console.log(`🔄 Sincronizando ${fila.length} posições...`);

    let enviadas = 0;
    let falhas = 0;
    const idsEnviados: string[] = [];

    // Envia uma por uma (poderia ser em lote mas a RPC é individual)
    for (const posicao of fila) {
      // Ignora posições de viagens locais (não sincronizadas ainda)
      if (posicao.viagem_id?.startsWith("local_")) {
        // Marca pra remover mesmo — vamos ignorar essas
        idsEnviados.push(posicao.id);
        continue;
      }

      try {
        const { error } = await supabase.rpc("atualizar_posicao_motorista", {
          p_latitude: posicao.latitude,
          p_longitude: posicao.longitude,
          p_heading: posicao.heading,
          p_velocidade_kmh: posicao.velocidade_kmh,
          p_em_viagem: posicao.em_viagem,
          p_viagem_id: posicao.viagem_id,
        });

        if (error) {
          falhas++;
        } else {
          enviadas++;
          idsEnviados.push(posicao.id);
        }
      } catch {
        falhas++;
      }
    }

    // Remove as enviadas com sucesso
    if (idsEnviados.length > 0) {
      await removerPosicoesFila(idsEnviados);
    }

    const restantes = await contarFilaPosicoes();

    setEstado({
      sincronizando: false,
      pendentes: restantes,
      ultimaSincronizacao: Date.now(),
      ultimoResultado: { enviadas, falhas },
    });

    sincronizandoRef.current = false;

    console.log(
      `✅ Sync concluída: ${enviadas} enviadas, ${falhas} falhas, ${restantes} restantes`
    );
  };

  return {
    ...estado,
    sincronizar, // permite chamar manualmente também
    online,
  };
}