import { supabase } from "../supabase";

interface DispararAlertaSOSProps {
  motorista_id: string;
  empresa_id: string;
  viagem_id: string | null;
  motorista_nome: string;
  rota_nome?: string | null;
  latitude: number;
  longitude: number;
  velocidade_kmh?: number;
  tipo?: "emergencia" | "auxilio" | "acidente";
  observacao?: string;
}

export async function dispararAlertaSOS(
  dados: DispararAlertaSOSProps
): Promise<{ sucesso: boolean; id?: string; erro?: string }> {
  try {
    const { data, error } = await supabase
      .from("alertas_sos")
      .insert([
        {
          motorista_id: dados.motorista_id,
          empresa_id: dados.empresa_id,
          viagem_id: dados.viagem_id,
          motorista_nome: dados.motorista_nome,
          rota_nome: dados.rota_nome,
          latitude: dados.latitude,
          longitude: dados.longitude,
          velocidade_kmh: dados.velocidade_kmh || 0,
          tipo: dados.tipo || "emergencia",
          observacao_motorista: dados.observacao,
          status: "aberto",
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("❌ Erro ao disparar SOS:", error.message);
      return { sucesso: false, erro: error.message };
    }

    console.log("🚨 SOS disparado:", data.id);
    return { sucesso: true, id: data.id };
  } catch (err: any) {
    console.log("❌ Exceção ao disparar SOS:", err);
    return { sucesso: false, erro: err.message || "Erro desconhecido" };
  }
}

export async function buscarTelefoneEmergencia(
  empresa_id: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("empresas")
      .select("telefone_emergencia, telefone_suporte")
      .eq("id", empresa_id)
      .single();

    if (error || !data) return null;

    // Prioriza telefone de emergência, senão usa o de suporte
    return data.telefone_emergencia || data.telefone_suporte || null;
  } catch {
    return null;
  }
}