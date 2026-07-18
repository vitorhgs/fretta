import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase";

export interface MotoristaAoVivo {
  motorista_id: string;
  empresa_id: string;
  viagem_id: string | null;
  latitude: number;
  longitude: number;
  heading: number;
  velocidade_kmh: number;
  em_viagem: boolean;
  online: boolean;
  atualizado_em: string;
  motorista_nome: string;
  motorista_telefone: string | null;
  rota_id: string | null;
  rota_nome: string | null;
  rota_cor: string | null;
  iniciada_em: string | null;
  paradas_totais: number | null;
  paradas_concluidas: number | null;
  viagem_status: string | null;
  realmente_online: boolean;
}

/**
 * Hook que escuta as posições dos motoristas em tempo real
 */
export function useMotoristasAoVivo() {
  const [motoristas, setMotoristas] = useState<MotoristaAoVivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const debounceRef = useRef<any>(null);
  const canalIdRef = useRef<string>(
    `realtime_ao_vivo_${Math.random().toString(36).substring(7)}_${Date.now()}`
  );

  const carregar = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("motoristas_ativos")
        .select("*")
        .order("atualizado_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar motoristas ao vivo:", error);
        setErro(error.message);
        return;
      }

      const novos = (data || []) as MotoristaAoVivo[];

      // Update inteligente: só atualiza o que mudou
      setMotoristas((atual) => {
        if (atual.length !== novos.length) return novos;

        return novos.map((n) => {
          const existente = atual.find(
            (m) => m.motorista_id === n.motorista_id
          );
          if (!existente) return n;

          if (
            existente.latitude === n.latitude &&
            existente.longitude === n.longitude &&
            existente.velocidade_kmh === n.velocidade_kmh &&
            existente.em_viagem === n.em_viagem &&
            existente.online === n.online &&
            existente.paradas_concluidas === n.paradas_concluidas &&
            existente.atualizado_em === n.atualizado_em
          ) {
            return existente;
          }

          return n;
        });
      });

      setErro(null);
    } catch (err: any) {
      console.error("Exceção:", err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(carregar, 500);
  }, [carregar]);

  useEffect(() => {
    let ativo = true;
    let canal: any = null;

    // Carrega inicial
    carregar();

    // ✨ Cria canal com nome ÚNICO por instância do hook
    const nomeCanal = canalIdRef.current;

    canal = supabase.channel(nomeCanal);

    // Registra os listeners ANTES do subscribe
    canal.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "posicoes_atuais",
      },
      () => {
        if (ativo) carregarDebounced();
      }
    );

    canal.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "viagens",
      },
      () => {
        if (ativo) carregarDebounced();
      }
    );

    // Só agora faz o subscribe
    canal.subscribe();

    // Fallback: recarrega a cada 30s
    const interval = setInterval(() => {
      if (ativo) carregar();
    }, 30000);

    return () => {
      ativo = false;
      if (canal) {
        supabase.removeChannel(canal);
      }
      clearInterval(interval);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [carregar, carregarDebounced]);

  return {
    motoristas,
    loading,
    erro,
    recarregar: carregar,
    stats: {
      total: motoristas.length,
      online: motoristas.filter((m) => m.realmente_online).length,
      emViagem: motoristas.filter((m) => m.em_viagem && m.realmente_online)
        .length,
      offline: motoristas.filter((m) => !m.realmente_online).length,
    },
  };
}