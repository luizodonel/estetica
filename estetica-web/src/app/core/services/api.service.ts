import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Agendamento,
  Categoria,
  DashboardResumo,
  DisponibilidadeResponse,
  HistoricoAtendimento,
  Procedimento,
  Profissional,
  HorarioTrabalho,
  BloqueioAgenda,
  StatusAgendamento,
  Usuario,
  TenantPublicDTO,
  CadastroLojistaRequest,
  CadastroLojistaResponse,
  PrimeiroAcessoRequest,
  VerificarPrimeiroAcessoResponse,
  AuthResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? '/api/v1'
    : 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  // Catálogo e Procedimentos
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/procedimentos/categorias`);
  }

  getProcedimentos(categoriaId?: number): Observable<Procedimento[]> {
    let params = new HttpParams();
    if (categoriaId) {
      params = params.set('categoriaId', categoriaId.toString());
    }
    return this.http.get<Procedimento[]>(`${this.baseUrl}/procedimentos`, { params });
  }

  getProcedimentosAdmin(): Observable<Procedimento[]> {
    return this.http.get<Procedimento[]>(`${this.baseUrl}/procedimentos/todos`);
  }

  getProcedimentoById(id: number): Observable<Procedimento> {
    return this.http.get<Procedimento>(`${this.baseUrl}/procedimentos/${id}`);
  }

  criarProcedimento(payload: {
    categoriaId: number;
    titulo: string;
    descricao?: string;
    duracaoMinutos: number;
    preco: number;
    imagemUrl?: string;
  }): Observable<Procedimento> {
    return this.http.post<Procedimento>(`${this.baseUrl}/procedimentos`, payload);
  }

  atualizarProcedimento(id: number, payload: {
    categoriaId: number;
    titulo: string;
    descricao?: string;
    duracaoMinutos: number;
    preco: number;
    imagemUrl?: string;
  }): Observable<Procedimento> {
    return this.http.put<Procedimento>(`${this.baseUrl}/procedimentos/${id}`, payload);
  }

  alternarStatusProcedimento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/procedimentos/${id}`);
  }

  // Profissionais
  getProfissionais(procedimentoId?: number): Observable<Profissional[]> {
    let params = new HttpParams();
    if (procedimentoId) {
      params = params.set('procedimentoId', procedimentoId.toString());
    }
    return this.http.get<Profissional[]>(`${this.baseUrl}/profissionais`, { params });
  }

  getProfissionaisAdmin(): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${this.baseUrl}/profissionais/todos`);
  }

  criarProfissional(payload: {
    nome: string;
    email: string;
    telefoneWhatsApp: string;
    senha?: string;
    especialidade: string;
    bio?: string;
    fotoUrl?: string;
    corIdentificacao?: string;
    procedimentosIds: number[];
  }): Observable<Profissional> {
    return this.http.post<Profissional>(`${this.baseUrl}/profissionais`, payload);
  }

  atualizarProfissional(id: number, payload: {
    nome: string;
    email: string;
    telefoneWhatsApp: string;
    senha?: string;
    especialidade: string;
    bio?: string;
    fotoUrl?: string;
    corIdentificacao?: string;
    procedimentosIds: number[];
  }): Observable<Profissional> {
    return this.http.put<Profissional>(`${this.baseUrl}/profissionais/${id}`, payload);
  }

  alternarStatusProfissional(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profissionais/${id}`);
  }

  // Motor de Slots em Tempo Real
  getSlotsDisponiveis(procedimentoId: number, data: string, profissionalId?: number): Observable<DisponibilidadeResponse> {
    let params = new HttpParams()
      .set('procedimentoId', procedimentoId.toString())
      .set('data', data);
    if (profissionalId) {
      params = params.set('profissionalId', profissionalId.toString());
    }
    return this.http.get<DisponibilidadeResponse>(`${this.baseUrl}/disponibilidade/slots`, { params });
  }

  // Clientes / Pacientes
  getClientes(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios/clientes`);
  }

  criarCliente(payload: {
    nome: string;
    email: string;
    telefoneWhatsApp: string;
    senha?: string;
  }): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/usuarios/clientes`, payload);
  }

  atualizarCliente(id: number, payload: {
    nome: string;
    email: string;
    telefoneWhatsApp: string;
    senha?: string;
  }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/usuarios/clientes/${id}`, payload);
  }

  alternarStatusCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/usuarios/clientes/${id}`);
  }

  // Agendamentos
  criarAgendamento(payload: {
    clienteId?: number;
    procedimentoId: number;
    profissionalId?: number;
    dataHoraInicio: string; // ISO string
    observacoesCliente?: string;
  }): Observable<Agendamento> {
    return this.http.post<Agendamento>(`${this.baseUrl}/agendamentos`, payload);
  }

  getMeusAgendamentos(): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamentos/meus`);
  }

  getCalendarioGeral(inicio: string, fim: string): Observable<Agendamento[]> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamentos/calendario`, { params });
  }

  cancelarAgendamento(id: number, motivo?: string): Observable<Agendamento> {
    let params = new HttpParams();
    if (motivo) {
      params = params.set('motivo', motivo);
    }
    return this.http.post<Agendamento>(`${this.baseUrl}/agendamentos/${id}/cancelar`, {}, { params });
  }

  remarcarAgendamento(id: number, payload: {
    novaDataHoraInicio: string;
    novoProfissionalId?: number;
  }): Observable<Agendamento> {
    return this.http.put<Agendamento>(`${this.baseUrl}/agendamentos/${id}/remarcar`, payload);
  }

  atualizarStatusAgendamento(id: number, status: StatusAgendamento, notasInternas?: string): Observable<Agendamento> {
    return this.http.put<Agendamento>(`${this.baseUrl}/agendamentos/${id}/status`, { status, notasInternas });
  }

  // Prontuário & Anamnese
  getProntuarioPorCliente(clienteId: number): Observable<HistoricoAtendimento[]> {
    return this.http.get<HistoricoAtendimento[]>(`${this.baseUrl}/prontuarios/cliente/${clienteId}`);
  }

  salvarProntuario(payload: {
    clienteId: number;
    profissionalId?: number;
    agendamentoId?: number;
    notasAnamnese: string;
    orientacoesPosProcedimento?: string;
    reacoesAdversas?: string;
  }): Observable<HistoricoAtendimento> {
    return this.http.post<HistoricoAtendimento>(`${this.baseUrl}/prontuarios`, payload);
  }

  // Dashboard
  getDashboardResumo(): Observable<DashboardResumo> {
    return this.http.get<DashboardResumo>(`${this.baseUrl}/dashboard/resumo`);
  }

  // Onboarding de Lojistas / Parceiros Whitelabel
  cadastrarLojista(payload: CadastroLojistaRequest): Observable<CadastroLojistaResponse> {
    return this.http.post<CadastroLojistaResponse>(`${this.baseUrl}/onboarding/lojista`, payload);
  }

  getTenantPorSlug(slug: string): Observable<TenantPublicDTO> {
    return this.http.get<TenantPublicDTO>(`${this.baseUrl}/onboarding/tenant/${slug}`);
  }

  verificarDisponibilidadeSlug(slug: string): Observable<{ disponivel: boolean }> {
    const params = new HttpParams().set('slug', slug);
    return this.http.get<{ disponivel: boolean }>(`${this.baseUrl}/onboarding/verificar-slug`, { params });
  }

  // Upload de Imagens (Logotipos, Fotos de Especialistas e Capas de Procedimentos)
  uploadImagem(file: File): Observable<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; filename: string; size: number }>(`${this.baseUrl}/uploads`, formData);
  }

  formatarUrlImagem(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const host = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      ? ''
      : 'http://localhost:8080';
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // Jornada e Horários de Atendimento do Especialista
  getJornadaProfissional(profissionalId: number): Observable<HorarioTrabalho[]> {
    return this.http.get<HorarioTrabalho[]>(`${this.baseUrl}/profissionais/${profissionalId}/jornada`);
  }

  salvarJornada(profissionalId: number, itens: HorarioTrabalho[]): Observable<HorarioTrabalho[]> {
    return this.http.put<HorarioTrabalho[]>(`${this.baseUrl}/profissionais/${profissionalId}/jornada`, itens);
  }

  // Bloqueios de Agenda (Travar Horários / Folgas)
  getBloqueiosProfissional(profissionalId: number): Observable<BloqueioAgenda[]> {
    return this.http.get<BloqueioAgenda[]>(`${this.baseUrl}/profissionais/${profissionalId}/bloqueios`);
  }

  criarBloqueio(profissionalId: number, payload: { dataInicio: string; dataFim: string; motivo: string }): Observable<BloqueioAgenda> {
    return this.http.post<BloqueioAgenda>(`${this.baseUrl}/profissionais/${profissionalId}/bloqueios`, payload);
  }

  removerBloqueio(bloqueioId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profissionais/bloqueios/${bloqueioId}`);
  }

  // Primeiro Acesso
  verificarPrimeiroAcesso(telefone: string): Observable<VerificarPrimeiroAcessoResponse> {
    const params = new HttpParams().set('telefone', telefone);
    return this.http.get<VerificarPrimeiroAcessoResponse>(`${this.baseUrl}/auth/verificar-primeiro-acesso`, { params });
  }

  primeiroAcesso(payload: PrimeiroAcessoRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/primeiro-acesso`, payload);
  }
}
