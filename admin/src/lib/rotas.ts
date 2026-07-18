import type { Rota } from "../types/database";

/**
 * Retorna os turnos de uma rota (compatibilidade com legado)
 */
export function getTurnosRota(rota: Partial<Rota>): string[] {
  if (rota.turnos_atendidos && rota.turnos_atendidos.length > 0) {
    return rota.turnos_atendidos;
  }
  if (rota.turno) {
    return [rota.turno];
  }
  return [];
}

/**
 * Retorna o status da rota (default: ativa)
 */
export function getStatusRota(
  rota: Partial<Rota>
): "ativa" | "pausada" | "arquivada" {
  return rota.status_rota || "ativa";
}

/**
 * Icone do turno
 */
export function iconeTurno(turno: string): string {
  const map: Record<string, string> = {
    Manhã: "☀",
    Tarde: "🌤",
    Noite: "🌙",
    Madrugada: "🌑",
  };
  return map[turno] || "•";
}

/**
 * Cor associada ao turno (pra badges)
 */
export function corTurno(turno: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    Manhã: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Tarde: { bg: "bg-orange-100", text: "text-orange-700" },
    Noite: { bg: "bg-indigo-100", text: "text-indigo-700" },
    Madrugada: { bg: "bg-slate-200", text: "text-slate-700" },
  };
  return map[turno] || { bg: "bg-slate-100", text: "text-slate-600" };
}