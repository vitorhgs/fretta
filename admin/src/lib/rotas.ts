import { Sun, CloudSun, Moon, MoonStar, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
 * Ícone Lucide do turno
 */
export function iconeTurno(turno: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    Manhã: Sun,
    Tarde: CloudSun,
    Noite: Moon,
    Madrugada: MoonStar,
  };
  return map[turno] || Circle;
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