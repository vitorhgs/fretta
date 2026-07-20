export interface Linha {
  id: string;
  empresa_id: string;
  
  nome: string;
  codigo?: string | null;
  
  cliente_razao_social?: string | null;
  cliente_nome_fantasia?: string | null;
  cliente_cnpj?: string | null;
  
  endereco_destino?: string | null;
  cidade_destino?: string | null;
  estado_destino?: string | null;
  
  contato_nome?: string | null;
  contato_telefone?: string | null;
  contato_email?: string | null;
  
  valor_mensal?: number | null;
  valor_km?: number | null;
  data_inicio_contrato?: string | null;
  data_fim_contrato?: string | null;
  
  cor: string;
  categoria?: 'empresa' | 'escola' | 'evento' | 'outros' | null;
  observacoes?: string | null;
  
  status: 'ativa' | 'pausada' | 'encerrada';
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos calculados
  total_rotas?: number;
  total_motoristas?: number;
  total_veiculos?: number;
}


export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  logo_url?: string;
  cor_primaria?: string;
  plano?: string;
  telefone_suporte?: string;
  email_suporte?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  onboarding_completo?: boolean;  // 🆕
  created_at?: string;
}

export interface Usuario {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  telefone?: string;
  avatar_url?: string;
  role: "owner" | "admin" | "operador";
  ativo: boolean;
  created_at?: string;
}

export interface Notificacao {
  id: string;
  empresa_id: string;
  usuario_id: string;
  tipo: "info" | "sucesso" | "alerta" | "erro";
  titulo: string;
  mensagem?: string;
  lida: boolean;
  link?: string;
  created_at: string;
}

export interface Motorista {
  id: string;
  empresa_id: string;
  auth_user_id?: string;
  nome: string;
  cpf?: string;
  cnh?: string;
  categoria_cnh?: string;
  validade_cnh?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  observacoes?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type TipoVeiculo = "van" | "microonibus" | "onibus" | "carro" | "utilitario";
export type StatusVeiculo = "ativo" | "manutencao" | "inativo";
export type CombustivelVeiculo = "diesel" | "gasolina" | "etanol" | "flex" | "eletrico";

export interface Veiculo {
  id: string;
  empresa_id: string;
  placa: string;
  modelo: string;
  marca?: string;
  ano?: number;
  cor?: string;
  chassi?: string;
  renavam?: string;
  tipo: TipoVeiculo;
  capacidade?: number;
  combustivel?: CombustivelVeiculo;
  vencimento_licenciamento?: string;
  vencimento_seguro?: string;
  status: StatusVeiculo;
  observacoes?: string;
  foto_url?: string;
  km_atual?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// PINs de Autorização
// ============================================
export type TipoPin = "nova_rota" | "editar_rota";
export type StatusPin = "ativo" | "usado" | "expirado" | "cancelado";

export interface PinAutorizacao {
  id: string;
  empresa_id: string;
  codigo: string;
  tipo: TipoPin;
  motorista_id: string;
  rota_id?: string;
  criado_por?: string;
  expira_em?: string;
  usado_em?: string;
  status: StatusPin;
  observacao?: string;
  created_at: string;

  motorista?: Motorista;
  rota?: { id: string; nome: string; cor?: string };
  criador?: { nome: string };
}

// ============================================
// 🆕 ROTAS (agora com turnos múltiplos e status)
// ============================================
export type StatusRota = "ativa" | "pausada" | "arquivada";
export type TurnoRota = "Manhã" | "Tarde" | "Noite" | "Madrugada";

export interface ParadaInfo {
  nome?: string;
  endereco?: string;
  horario?: string;
  observacao?: string;
}

export interface Rota {
  id: string;
  empresa_id?: string;
  nome: string;
  cor: string;
  pontos_snap: any[];
  pontos_originais: any[];
  paradas_info?: ParadaInfo[];
  distancia_km: number;
  duracao_min: number;
  categoria?: string;
  turno?: string; // legado — mantido pra compatibilidade
  turnos_atendidos?: string[]; // 🆕 múltiplos turnos
  status_rota?: StatusRota; // 🆕
  horario_saida?: string;
  dias_semana?: number[];
  gravada_por_motorista_id?: string;
  metodo_criacao?: "admin_mapa" | "motorista_gps";
  created_at?: string;
  updated_at?: string;
}

// ============================================
// 🆕 VIAGENS (execução de rotas)
// ============================================
export type StatusViagem = "em_andamento" | "concluida" | "cancelada" | "pausada";

export interface Viagem {
  id: string;
  empresa_id: string;
  motorista_id?: string;
  rota_id?: string;

  // Snapshot dos dados
  motorista_nome?: string;
  rota_nome?: string;
  rota_cor?: string;

  // Timing
  iniciada_em: string;
  finalizada_em?: string;
  duracao_segundos?: number;

  // Status
  status: StatusViagem;

  // Progresso
  paradas_totais: number;
  paradas_concluidas: number;
  paradas_ids_concluidas: number[];

  // Métricas
  distancia_planejada_km?: number;
  distancia_real_km: number;
  velocidade_media_kmh?: number;
  velocidade_maxima_kmh?: number;

  // Trajeto real (array de {lat, lng, timestamp, velocidade})
  trajeto_real: any[];

  observacoes?: string;
  created_at?: string;
  updated_at?: string;

  // Campos de join
  motorista?: Motorista;
  rota?: Rota;
}

// ============================================
// 🆕 POSIÇÕES ATUAIS (tempo real — 1 por motorista)
// ============================================
export interface PosicaoAtual {
  motorista_id: string;
  empresa_id: string;
  viagem_id?: string;
  latitude: number;
  longitude: number;
  heading: number;
  velocidade_kmh: number;
  em_viagem: boolean;
  online: boolean;
  atualizado_em: string;

  // Campos de join
  motorista?: Motorista;
  viagem?: Viagem;
}