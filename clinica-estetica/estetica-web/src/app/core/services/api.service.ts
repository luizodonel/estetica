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
  StatusAgendamento,
  Usuario
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/api/v1';

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
}

