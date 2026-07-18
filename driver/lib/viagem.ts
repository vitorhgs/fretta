import { supabase } from "../supabase";

interface CriarViagemProps {
  motorista_id: string;
  empresa_id: string;
  rota_id: string;
  motorista_nome: string;
  rota_nome: string;
  rota_cor: string;
  paradas_totais: number;
  distancia_planejada_km: number;
}

export async function criarViagem(dados: CriarViagemProps): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("viagens")
      .insert([
        {
          motorista_id: dados.motorista_id,
          empresa_id: dados.empresa_id,
          rota_id: dados.rota_id,
          motorista_nome: dados.motorista_nome,
          rota_nome: dados.rota_nome,
          rota_cor: dados.rota_cor,
          paradas_totais: dados.paradas_totais,
          distancia_planejada_km: dados.distancia_planejada_km,
          status: "em_andamento",
          iniciada_em: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("❌ Erro ao criar viagem:", error.message);
      return null;
    }

    console.log("✅ Viagem criada:", data.id);
    return data.id;
  } catch (err) {
    console.log("❌ Exceção ao criar viagem:", err);
    return null;
  }
}

interface AtualizarViagemProps {
  viagem_id: string;
  paradas_concluidas?: number;
  paradas_ids_concluidas?: number[];
  distancia_real_km?: number;
  velocidade_maxima_kmh?: number;
  trajeto_ponto?: {
    lat: number;
    lng: number;
    velocidade?: number;
    timestamp: string;
  };
}

export async function atualizarViagem({
  viagem_id,
  paradas_concluidas,
  paradas_ids_concluidas,
  distancia_real_km,
  velocidade_maxima_kmh,
  trajeto_ponto,
}: AtualizarViagemProps): Promise<void> {
  try {
    const update: any = {};

    if (paradas_concluidas !== undefined)
      update.paradas_concluidas = paradas_concluidas;
    if (paradas_ids_concluidas !== undefined)
      update.paradas_ids_concluidas = paradas_ids_concluidas;
    if (distancia_real_km !== undefined)
      update.distancia_real_km = distancia_real_km;
    if (velocidade_maxima_kmh !== undefined)
      update.velocidade_maxima_kmh = velocidade_maxima_kmh;

    // Se recebeu trajeto novo, adiciona ao array
    if (trajeto_ponto) {
      // Busca trajeto atual pra adicionar (não sobrescrever)
      const { data } = await supabase
        .from("viagens")
        .select("trajeto_real")
        .eq("id", viagem_id)
        .single();

      const trajetoAtual = data?.trajeto_real || [];
      update.trajeto_real = [...trajetoAtual, trajeto_ponto];
    }

    if (Object.keys(update).length === 0) return;

    const { error } = await supabase
      .from("viagens")
      .update(update)
      .eq("id", viagem_id);

    if (error) console.log("❌ Erro ao atualizar viagem:", error.message);
  } catch (err) {
    console.log("❌ Exceção ao atualizar viagem:", err);
  }
}

export async function finalizarViagem(
  viagem_id: string,
  dados: {
    paradas_concluidas: number;
    distancia_real_km: number;
    duracao_segundos: number;
    velocidade_media_kmh: number;
    velocidade_maxima_kmh: number;
    status?: "concluida" | "cancelada";
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from("viagens")
      .update({
        finalizada_em: new Date().toISOString(),
        status: dados.status || "concluida",
        paradas_concluidas: dados.paradas_concluidas,
        distancia_real_km: dados.distancia_real_km,
        duracao_segundos: dados.duracao_segundos,
        velocidade_media_kmh: dados.velocidade_media_kmh,
        velocidade_maxima_kmh: dados.velocidade_maxima_kmh,
      })
      .eq("id", viagem_id);

    if (error) console.log("❌ Erro ao finalizar viagem:", error.message);
    else console.log("✅ Viagem finalizada:", viagem_id);
  } catch (err) {
    console.log("❌ Exceção ao finalizar viagem:", err);
  }
}