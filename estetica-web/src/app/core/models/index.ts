export type Role = 'ROLE_CLIENTE' | 'ROLE_PROFISSIONAL' | 'ROLE_ADMIN';

export type StatusAgendamento = 'PENDENTE' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO' | 'NO_SHOW';

export interface Usuario {
  id: number;
  nome: string;
  email?: string;
  telefoneWhatsApp: string;
  role: Role;
  ativo?: boolean;
  primeiroAcesso?: boolean;
}

export interface AuthResponse {
  token: string;
  id: number;
  nome: string;
  email?: string;
  telefoneWhatsApp: string;
  role: Role;
  primeiroAcesso?: boolean;
}

export interface PrimeiroAcessoRequest {
  telefoneWhatsApp: string;
  novaSenha: string;
}

export interface VerificarPrimeiroAcessoResponse {
  existe: boolean;
  nome: string;
  primeiroAcesso: boolean;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  icone?: string;
  ativo: boolean;
  ordemExibicao: number;
}

export interface Procedimento {
  id: number;
  categoriaId: number;
  categoriaNome: string;
  titulo: string;
  descricao?: string;
  duracaoMinutos: number;
  preco: number;
  imagemUrl?: string;
  ativo: boolean;
}

export interface Profissional {
  id: number;
  usuarioId?: number;
  nome: string;
  email?: string;
  telefoneWhatsApp?: string;
  especialidade?: string;
  bio?: string;
  fotoUrl?: string;
  corIdentificacao?: string;
  ativo: boolean;
  procedimentosIds: number[];
}

export interface SlotDisponivel {
  horarioInicio: string; // "14:00:00" ou "14:00"
  horarioFim: string;    // "15:00:00"
  profissionalId: number;
  profissionalNome: string;
  profissionalFotoUrl?: string;
  profissionalCor?: string;
}

export interface DisponibilidadeResponse {
  data: string; // "YYYY-MM-DD"
  procedimentoId: number;
  procedimentoTitulo: string;
  duracaoMinutos: number;
  slots: SlotDisponivel[];
}

export interface Agendamento {
  id: number;
  clienteId: number;
  clienteNome: string;
  clienteEmail: string;
  clienteWhatsApp: string;
  profissionalId: number;
  profissionalNome: string;
  profissionalFotoUrl?: string;
  profissionalCor?: string;
  procedimentoId: number;
  procedimentoTitulo: string;
  procedimentoDuracao: number;
  valorCobrado: number;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: StatusAgendamento;
  observacoesCliente?: string;
  notasInternas?: string;
  dataCriacao: string;
}

export interface HistoricoAtendimento {
  id: number;
  clienteId: number;
  clienteNome: string;
  profissionalId?: number;
  profissionalNome?: string;
  agendamentoId?: number;
  dataAtendimento: string;
  notasAnamnese?: string;
  orientacoesPosProcedimento?: string;
  reacoesAdversas?: string;
}

export interface DashboardResumo {
  agendamentosHoje: number;
  agendamentosConfirmadosHoje: number;
  agendamentosPendentesHoje: number;
  totalClientesAtivos: number;
  faturamentoEstimadoHoje: number;
  proximosAtendimentos: Agendamento[];
  faturamentoPorEspecialista?: FaturamentoEspecialista[];
  isAdmin?: boolean;
}

export interface FaturamentoEspecialista {
  profissionalId: number;
  profissionalNome: string;
  fotoUrl?: string;
  especialidade: string;
  corIdentificacao?: string;
  totalAtendimentos: number;
  totalFaturado: number;
}

export interface HorarioTrabalho {
  id?: number;
  profissionalId?: number;
  diaSemana: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  horaInicio: string;
  horaFim: string;
  inicioIntervalo?: string;
  fimIntervalo?: string;
  ativo: boolean;
}

export interface BloqueioAgenda {
  id: number;
  profissionalId: number;
  dataInicio: string;
  dataFim: string;
  motivo: string;
}

export interface TenantPublicDTO {
  id: number;
  nomeEmpresa: string;
  slug: string;
  linkPersonalizado: string;
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  telefoneWhatsApp?: string;
  bannerTag?: string;
  bannerTitulo?: string;
  bannerSubtitulo?: string;
  bannerBotaoTexto?: string;
}

export interface AtualizarBannerRequest {
  bannerTag: string;
  bannerTitulo: string;
  bannerSubtitulo: string;
  bannerBotaoTexto: string;
}

export interface CadastroLojistaRequest {
  nomeEmpresa: string;
  slug: string;
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  nomeResponsavel: string;
  email: string;
  telefoneWhatsApp: string;
  senha: string;
}

export interface CadastroLojistaResponse {
  token: string;
  linkPersonalizado: string;
  tenant: TenantPublicDTO;
  usuario: Usuario;
}


