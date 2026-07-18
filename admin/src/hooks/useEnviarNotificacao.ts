import { useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";

export type TipoNotificacao = "info" | "alerta" | "rota" | "emergencia";

interface EnviarParams {
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  motoristaIds: string[]; // vazio = todos da empresa
  link?: string;
}

export function useEnviarNotificacao() {
  const { empresa } = useAuth();
  const [enviando, setEnviando] = useState(false);

  const enviar = async (params: EnviarParams) => {
    if (!empresa) {
      throw new Error("Empresa não carregada");
    }

    setEnviando(true);

    try {
      let motoristaIds = params.motoristaIds;

      // Se vazio, busca todos os motoristas ativos da empresa
      if (motoristaIds.length === 0) {
        const { data, error } = await supabase
          .from("motoristas")
          .select("id")
          .eq("empresa_id", empresa.id)
          .eq("ativo", true);

        if (error) throw error;
        motoristaIds = (data ?? []).map((m) => m.id);
      }

      if (motoristaIds.length === 0) {
        throw new Error("Nenhum motorista para enviar");
      }

      // Cria uma notificação por motorista
      const registros = motoristaIds.map((id) => ({
        empresa_id: empresa.id,
        motorista_id: id,
        titulo: params.titulo,
        mensagem: params.mensagem,
        tipo: params.tipo,
        link: params.link ?? null,
      }));

      const { error } = await supabase
        .from("notificacoes")
        .insert(registros);

      if (error) throw error;

      return { sucesso: true, total: motoristaIds.length };
    } finally {
      setEnviando(false);
    }
  };

  return { enviar, enviando };
}