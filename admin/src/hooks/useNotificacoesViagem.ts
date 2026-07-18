import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";

interface NotificacaoViagem {
  id: string;
  tipo: "iniciou" | "concluiu" | "cancelou";
  motorista: string;
  rota: string;
  timestamp: number;
}

export function useNotificacoesViagem() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoViagem[]>([]);
  const [ultima, setUltima] = useState<NotificacaoViagem | null>(null);
  const processadosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nomeCanal = `notif_viagens_${Date.now()}`;

    const canal = supabase.channel(nomeCanal);

    canal.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "viagens",
      },
      (payload) => {
        const viagem = payload.new as any;
        const id = `ini_${viagem.id}`;

        if (processadosRef.current.has(id)) return;
        processadosRef.current.add(id);

        const notif: NotificacaoViagem = {
          id,
          tipo: "iniciou",
          motorista: viagem.motorista_nome || "Motorista",
          rota: viagem.rota_nome || "Rota",
          timestamp: Date.now(),
        };

        setNotificacoes((prev) => [notif, ...prev].slice(0, 20));
        setUltima(notif);
      }
    );

    canal.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "viagens",
      },
      (payload) => {
        const viagem = payload.new as any;
        const status = viagem.status;

        if (status !== "concluida" && status !== "cancelada") return;

        const id = `${status}_${viagem.id}`;
        if (processadosRef.current.has(id)) return;
        processadosRef.current.add(id);

        const notif: NotificacaoViagem = {
          id,
          tipo: status === "concluida" ? "concluiu" : "cancelou",
          motorista: viagem.motorista_nome || "Motorista",
          rota: viagem.rota_nome || "Rota",
          timestamp: Date.now(),
        };

        setNotificacoes((prev) => [notif, ...prev].slice(0, 20));
        setUltima(notif);
      }
    );

    canal.subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const limparUltima = () => setUltima(null);

  return { notificacoes, ultima, limparUltima };
}