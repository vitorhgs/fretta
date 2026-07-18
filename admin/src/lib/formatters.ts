// Formatadores de dados brasileiros

export function formatarCPF(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 10) {
    return nums
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return nums
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatarCNH(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 11);
}

export function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11) return false;
  if (/^(\d)\1+$/.test(nums)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
  let dig = 11 - (soma % 11);
  if (dig >= 10) dig = 0;
  if (dig !== parseInt(nums[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
  dig = 11 - (soma % 11);
  if (dig >= 10) dig = 0;
  return dig === parseInt(nums[10]);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatarData(data: string | Date): string {
  if (!data) return "-";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR");
}

export function iniciaisNome(nome: string): string {
  if (!nome) return "??";
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ============================================
// Formatadores para VEÍCULOS
// ============================================

export function formatarPlaca(valor: string): string {
  // Aceita tanto placa antiga (ABC-1234) quanto Mercosul (ABC1D23)
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (limpo.length <= 3) return limpo;
  return limpo.slice(0, 3) + "-" + limpo.slice(3);
}

export function validarPlaca(placa: string): boolean {
  const limpo = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Placa antiga: 3 letras + 4 números (ABC1234)
  // Placa Mercosul: 3 letras + 1 número + 1 letra + 2 números (ABC1D23)
  return (
    /^[A-Z]{3}[0-9]{4}$/.test(limpo) ||
    /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(limpo)
  );
}

export const rotulosTipoVeiculo: Record<string, string> = {
  van: "Van",
  microonibus: "Micro-ônibus",
  onibus: "Ônibus",
  carro: "Carro",
  utilitario: "Utilitário",
};

export const iconesTipoVeiculo: Record<string, string> = {
  van: "🚐",
  microonibus: "🚌",
  onibus: "🚍",
  carro: "🚗",
  utilitario: "🚙",
};

export const rotulosStatusVeiculo: Record<string, string> = {
  ativo: "Ativo",
  manutencao: "Manutenção",
  inativo: "Inativo",
};

export const coresStatusVeiculo: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  ativo: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  manutencao: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  inativo: {
    bg: "bg-slate-200",
    text: "text-slate-600",
    border: "border-slate-300",
  },
};

// ============================================
// 🆕 PINs de Autorização
// ============================================

export const rotulosTipoPin: Record<string, string> = {
  nova_rota: "Nova rota",
  editar_rota: "Editar rota",
};

export const iconesTipoPin: Record<string, string> = {
  nova_rota: "🆕",
  editar_rota: "✏️",
};

export const rotulosStatusPin: Record<string, string> = {
  ativo: "Ativo",
  usado: "Usado",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

export const coresStatusPin: Record<
  string,
  { bg: string; text: string; border: string; icone: string }
> = {
  ativo: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    icone: "🟢",
  },
  usado: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icone: "✅",
  },
  expirado: {
    bg: "bg-slate-200",
    text: "text-slate-600",
    border: "border-slate-300",
    icone: "⏰",
  },
  cancelado: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icone: "❌",
  },
};

/**
 * Retorna tempo restante formatado (ex: "45 min", "2h 15min", "expirado")
 */
export function tempoRestante(expiraEm?: string): {
  texto: string;
  minutos: number;
  urgente: boolean;
} {
  if (!expiraEm) return { texto: "Sem expiração", minutos: Infinity, urgente: false };

  const agora = Date.now();
  const expira = new Date(expiraEm).getTime();
  const diffMs = expira - agora;
  const minutos = Math.floor(diffMs / 60000);

  if (minutos < 0) return { texto: "Expirado", minutos: 0, urgente: false };
  if (minutos < 60) return { texto: `${minutos} min`, minutos, urgente: minutos < 15 };

  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return {
    texto: m > 0 ? `${h}h ${m}min` : `${h}h`,
    minutos,
    urgente: false,
  };
}

/**
 * Formata o código do PIN com espaços (ex: "1234" → "1 2 3 4")
 */
export function formatarPin(codigo: string): string {
  return codigo.split("").join(" ");
}