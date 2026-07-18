/**
 * Mascara CPF: 123.456.789-01 → 123.***.***-01
 */
export function mascararCPF(cpf?: string): string {
  if (!cpf) return "-";
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length !== 11) return cpf;
  return `${limpo.slice(0, 3)}.***.***-${limpo.slice(9, 11)}`;
}

/**
 * Formata CPF: 12345678901 → 123.456.789-01
 */
export function formatarCPF(cpf?: string): string {
  if (!cpf) return "-";
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length !== 11) return cpf;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

/**
 * Mascara telefone: (11) 99999-1234 → (11) *****-1234
 */
export function mascararTelefone(tel?: string): string {
  if (!tel) return "-";
  const limpo = tel.replace(/\D/g, "");
  if (limpo.length < 10) return tel;
  const ddd = limpo.slice(0, 2);
  const ultimos = limpo.slice(-4);
  return `(${ddd}) *****-${ultimos}`;
}

/**
 * Formata telefone: 11999991234 → (11) 99999-1234
 */
export function formatarTelefone(tel?: string): string {
  if (!tel) return "-";
  const limpo = tel.replace(/\D/g, "");
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return tel;
}

/**
 * Mascara CNH: 12345678901 → ********8901
 */
export function mascararCNH(cnh?: string): string {
  if (!cnh) return "-";
  const limpo = cnh.replace(/\D/g, "");
  if (limpo.length < 4) return cnh;
  return `${"*".repeat(limpo.length - 4)}${limpo.slice(-4)}`;
}

/**
 * Mascara email: joao@teste.com → j***@teste.com
 */
export function mascararEmail(email?: string): string {
  if (!email) return "-";
  const [nome, dominio] = email.split("@");
  if (!nome || !dominio) return email;
  const primeira = nome[0];
  return `${primeira}${"*".repeat(Math.max(nome.length - 1, 2))}@${dominio}`;
}