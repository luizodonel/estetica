export type Role = 'ROLE_CLIENTE' | 'ROLE_PROFISSIONAL' | 'ROLE_ADMIN';

export type StatusAgendamento = 'PENDENTE' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO' | 'NO_SHOW';

export type SetorAtuacao =
  | 'CLINICA_ESTETICA'
  | 'SALAO_BELEZA'
  | 'BARBEARIA'
  | 'RESTAURANTE'
  | 'DENTISTA'
  | 'MEDICA'
  | 'TATUAGEM'
  | 'PSICOLOGIA'
  | 'NUTRICAO'
  | 'PILATES_PERSONAL'
  | 'SPA_MASSOTERAPIA'
  | 'ESTETICA_AUTOMOTIVA'
  | 'ESTUDIO_FOTOGRAFICO';

export interface Usuario {
  id: number;
  nome: string;
  email?: string;
  telefoneWhatsApp: string;
  role: Role;
  ativo?: boolean;
  primeiroAcesso?: boolean;
  tenantSlug?: string;
  nomeEmpresa?: string;
  logoUrl?: string;
  setor?: SetorAtuacao;
}

export interface AuthResponse {
  token: string;
  id: number;
  nome: string;
  email?: string;
  telefoneWhatsApp: string;
  role: Role;
  primeiroAcesso?: boolean;
  tenantSlug?: string;
  nomeEmpresa?: string;
  logoUrl?: string;
  setor?: SetorAtuacao;
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
  imagemUrl?: string;
  ativo: boolean;
  ordemExibicao: number;
  duracaoMinutosPadrao?: number;
  precoPadrao?: number;
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
  login?: string;
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
  setor?: SetorAtuacao;
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
  statusPagamento?: string;
  ativo?: boolean;
  dataVencimento?: string;
  diasRestantes?: number;
}

export interface AtualizarBannerRequest {
  bannerTag: string;
  bannerTitulo: string;
  bannerSubtitulo: string;
  bannerBotaoTexto: string;
}

export interface AtualizarIdentidadeVisualRequest {
  nomeEmpresa?: string;
  setor?: SetorAtuacao;
  logoUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  telefoneWhatsApp?: string;
}

export interface CadastroLojistaRequest {
  nomeEmpresa: string;
  setor?: SetorAtuacao;
  slug: string;
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  nomeResponsavel: string;
  usuarioLogin?: string;
  email: string;
  telefoneWhatsApp: string;
  senha: string;
}

export interface CadastroLojistaResponse {
  paymentId?: string;
  pixCopiaCola?: string;
  pixQrCodeBase64?: string;
  valor?: number;
  statusPagamento?: string;
  linkPersonalizado: string;
  tenant: TenantPublicDTO;
  usuario: Usuario;
  token?: string;
}

export interface StatusPagamentoResponse {
  status: string;
  pago: boolean;
  token?: string;
  linkPersonalizado?: string;
  slug?: string;
  tenant?: TenantPublicDTO;
  usuario?: Usuario;
}

export interface AssinaturaStatusResponse {
  nomeEmpresa: string;
  status: 'ATIVA' | 'VENCENDO' | 'VENCIDA' | 'PENDENTE';
  dataVencimento?: string;
  dataPagamento?: string;
  diasRestantes?: number;
  podeRenovar: boolean;
  vencida: boolean;
  valorMensalidade: number;
  paymentId?: string;
  pixCopiaCola?: string;
  pixQrCodeBase64?: string;
}

export interface RelatorioEspecialistaItem {
  agendamentoId: number;
  dataHoraInicio: string;
  dataHoraFim: string;
  clienteNome: string;
  clienteWhatsApp: string;
  procedimentoTitulo: string;
  categoriaNome: string;
  duracaoMinutos: number;
  valorCobrado: number;
  status: string;
  notasInternas?: string;
}

export interface RelatorioEspecialista {
  profissionalId: number;
  profissionalNome: string;
  especialidade: string;
  fotoUrl?: string;
  corIdentificacao?: string;
  totalAtendimentos: number;
  totalFaturado: number;
  ticketMedio: number;
  atendimentos: RelatorioEspecialistaItem[];
}

export interface RelatorioGeralResponse {
  nomeEmpresa: string;
  logoUrl?: string;
  dataInicio: string;
  dataFim: string;
  totalAtendimentosGeral: number;
  totalFaturadoGeral: number;
  ticketMedioGeral: number;
  especialistas: RelatorioEspecialista[];
}


