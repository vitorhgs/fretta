import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { dispararNotificacaoLocal } from './usePushNotifications';

export type TipoNotificacao = 'info' | 'alerta' | 'rota' | 'emergencia';

export type Notificacao = {
  id: string;
  empresa_id: string;
  motorista_id: string | null;
  usuario_id?: string | null;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao | string;
  lida: boolean;
  link: string | null;
  created_at: string;
};

type MotoristaLogado = {
  id: string;
  empresa_id: string;
  nome: string | null;
  auth_user_id: string | null;
};

export function useNotificacoes() {
  const [motorista, setMotorista] = useState<MotoristaLogado | null>(null);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const naoLidas = useMemo(() => {
    return notificacoes.filter((item) => !item.lida).length;
  }, [notificacoes]);

  const carregarMotorista = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMotorista(null);
      return null;
    }

    const { data, error } = await supabase
      .from('motoristas')
      .select('id, empresa_id, nome, auth_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (error) {
      console.log('Erro ao carregar motorista:', error.message);
      setMotorista(null);
      return null;
    }

    setMotorista(data);
    return data;
  }, []);

  const carregarNotificacoes = useCallback(
    async (motoristaId?: string) => {
      const id = motoristaId ?? motorista?.id;

      if (!id) {
        setNotificacoes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('motorista_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Erro ao carregar notificações:', error.message);
      } else {
        setNotificacoes((data ?? []) as Notificacao[]);
      }

      setLoading(false);
    },
    [motorista?.id]
  );

  const recarregar = useCallback(async () => {
    setRefreshing(true);

    const motoristaAtual = motorista ?? (await carregarMotorista());

    if (motoristaAtual?.id) {
      await carregarNotificacoes(motoristaAtual.id);
    }

    setRefreshing(false);
  }, [motorista, carregarMotorista, carregarNotificacoes]);

  const marcarComoLida = useCallback(async (id: string) => {
    setNotificacoes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, lida: true } : item))
    );

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);

    if (error) {
      console.log('Erro ao marcar como lida:', error.message);
    }
  }, []);

  const marcarTodasComoLidas = useCallback(async () => {
    if (!motorista?.id) return;

    setNotificacoes((prev) => prev.map((item) => ({ ...item, lida: true })));

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('motorista_id', motorista.id)
      .eq('lida', false);

    if (error) {
      console.log('Erro ao marcar todas como lidas:', error.message);
    }
  }, [motorista?.id]);

  const limparTodas = useCallback(async () => {
    if (!motorista?.id) return;

    await marcarTodasComoLidas();
  }, [motorista?.id, marcarTodasComoLidas]);

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      setLoading(true);

      const motoristaAtual = await carregarMotorista();

      if (!ativo) return;

      if (motoristaAtual?.id) {
        await carregarNotificacoes(motoristaAtual.id);
      } else {
        setLoading(false);
      }
    }

    iniciar();

    return () => {
      ativo = false;
    };
  }, [carregarMotorista, carregarNotificacoes]);

const instanceId = useRef(Math.random().toString(36).slice(2)).current;

useEffect(() => {
  if (!motorista?.id) return;

  const channel = supabase
    .channel(`notificacoes_motorista_${motorista.id}_${instanceId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `motorista_id=eq.${motorista.id}`,
      },
      (payload) => {
        // Nova notificação chegou!
        const nova = payload.new as Notificacao;
        
        // Dispara notificação local (som + vibração + banner)
        dispararNotificacaoLocal(
          nova.titulo,
          nova.mensagem,
          { notificacaoId: nova.id, tipo: nova.tipo }
        );

        // Recarrega lista
        carregarNotificacoes(motorista.id);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notificacoes',
        filter: `motorista_id=eq.${motorista.id}`,
      },
      () => {
        carregarNotificacoes(motorista.id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [motorista?.id, carregarNotificacoes, instanceId]);

  return {
    motorista,
    notificacoes,
    naoLidas,
    loading,
    refreshing,
    recarregar,
    marcarComoLida,
    marcarTodasComoLidas,
    limparTodas,
  };
}