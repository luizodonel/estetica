import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Procedimento, Profissional, SlotDisponivel, Usuario } from '../../core/models';
import { formatarTelefoneBR } from '../../shared/pipes/telefone.pipe';

@Component({
  selector: 'app-agendamento-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      
      <!-- Cabeçalho do Wizard -->
      <div class="text-center mb-8">
        <span class="text-xs font-semibold uppercase tracking-widest text-rose-600 block mb-1">
          Agendamento Online
        </span>
        <h1 class="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
          Reserve Seu Horário
        </h1>
        <p class="text-xs sm:text-sm text-stone-500 mt-1.5">
          Conclua em poucos passos o agendamento do cuidado estético.
        </p>

        <!-- Banner se for Perfil Administrativo/Especialista -->
        @if (authService.isAdminOrProfissional()) {
          <div class="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
            <span>🛡️ Modo Recepção / Clínica</span>
            <span class="opacity-60">•</span>
            <span>Agendando em nome do paciente</span>
          </div>
        }
      </div>

      <!-- Barra de Progresso em Passos (Mobile Friendly) -->
      <div class="bg-white rounded-2xl p-3 border border-nude-200 mb-8 shadow-sm">
        <div class="flex items-center justify-between relative">
          
          <!-- Linha de fundo -->
          <div class="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-nude-200 z-0"></div>
          <div 
            class="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 z-0 transition-all duration-300"
            [style.width]="(passoAtual() - 1) * 33.33 + '%'">
          </div>

          <!-- Passo 1 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              (click)="irParaPasso(1)"
              [class.bg-rose-500]="passoAtual() >= 1"
              [class.text-white]="passoAtual() >= 1"
              [class.bg-white]="passoAtual() < 1"
              [class.text-stone-400]="passoAtual() < 1"
              class="w-8 h-8 rounded-full border-2 border-rose-500 flex items-center justify-center font-bold text-xs shadow-sm transition-all">
              1
            </button>
            <span class="text-[10px] font-semibold mt-1 text-stone-700 hidden sm:block">Serviço</span>
          </div>

          <!-- Passo 2 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              (click)="irParaPasso(2)"
              [disabled]="!procedimentoSelecionado()"
              [class.bg-rose-500]="passoAtual() >= 2"
              [class.text-white]="passoAtual() >= 2"
              [class.bg-white]="passoAtual() < 2"
              [class.text-stone-400]="passoAtual() < 2"
              class="w-8 h-8 rounded-full border-2 border-nude-300 flex items-center justify-center font-bold text-xs shadow-sm transition-all disabled:opacity-50">
              2
            </button>
            <span class="text-[10px] font-semibold mt-1 text-stone-700 hidden sm:block">Especialista</span>
          </div>

          <!-- Passo 3 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              (click)="irParaPasso(3)"
              [disabled]="!procedimentoSelecionado()"
              [class.bg-rose-500]="passoAtual() >= 3"
              [class.text-white]="passoAtual() >= 3"
              [class.bg-white]="passoAtual() < 3"
              [class.text-stone-400]="passoAtual() < 3"
              class="w-8 h-8 rounded-full border-2 border-nude-300 flex items-center justify-center font-bold text-xs shadow-sm transition-all disabled:opacity-50">
              3
            </button>
            <span class="text-[10px] font-semibold mt-1 text-stone-700 hidden sm:block">Horário</span>
          </div>

          <!-- Passo 4 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              (click)="irParaPasso(4)"
              [disabled]="!slotSelecionado()"
              [class.bg-rose-500]="passoAtual() >= 4"
              [class.text-white]="passoAtual() >= 4"
              [class.bg-white]="passoAtual() < 4"
              [class.text-stone-400]="passoAtual() < 4"
              class="w-8 h-8 rounded-full border-2 border-nude-300 flex items-center justify-center font-bold text-xs shadow-sm transition-all disabled:opacity-50">
              4
            </button>
            <span class="text-[10px] font-semibold mt-1 text-stone-700 hidden sm:block">Confirmar</span>
          </div>

        </div>
      </div>

      <!-- CONTEÚDO DO WIZARD -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-nude-200 shadow-sm transition-all">
        
        <!-- ========================================== -->
        <!-- PASSO 1: SELEÇÃO DE PROCEDIMENTO -->
        <!-- ========================================== -->
        @if (passoAtual() === 1) {
          <div>
            <h2 class="font-serif text-xl font-bold text-stone-900 mb-2">1. Escolha o Procedimento</h2>
            <p class="text-xs text-stone-500 mb-6">Selecione o tratamento estético que será realizado.</p>

            <div class="space-y-3">
              @for (proc of procedimentos(); track proc.id) {
                <div 
                  (click)="selecionarProcedimento(proc)"
                  [class.border-rose-500]="procedimentoSelecionado()?.id === proc.id"
                  [class.bg-rose-50/50]="procedimentoSelecionado()?.id === proc.id"
                  class="p-4 rounded-2xl border border-nude-200 hover:border-rose-300 cursor-pointer transition-all flex items-center justify-between gap-4 group">
                  <div class="flex items-center gap-3">
                    <img [src]="proc.imagemUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=200'" class="w-14 h-14 rounded-xl object-cover" />
                    <div>
                      <h4 class="font-serif font-bold text-stone-900 group-hover:text-rose-600 transition-colors text-sm sm:text-base">
                        {{ proc.titulo }}
                      </h4>
                      <span class="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span>⏱️ {{ proc.duracaoMinutos }} minutos</span>
                        <span>•</span>
                        <span>{{ proc.categoriaNome }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-stone-900 block text-sm sm:text-base">
                      {{ proc.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </span>
                    <span class="text-[10px] text-rose-600 font-semibold uppercase tracking-wider">
                      {{ procedimentoSelecionado()?.id === proc.id ? 'Selecionado ✓' : 'Escolher' }}
                    </span>
                  </div>
                </div>
              }
            </div>

            <div class="mt-8 flex justify-end">
              <button 
                [disabled]="!procedimentoSelecionado()"
                (click)="avancarParaPasso2()"
                class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs sm:text-sm hover:bg-stone-800 disabled:opacity-40 transition-all shadow-md">
                Próximo: Escolher Especialista →
              </button>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PASSO 2: SELEÇÃO DE PROFISSIONAL -->
        <!-- ========================================== -->
        @if (passoAtual() === 2) {
          <div>
            <h2 class="font-serif text-xl font-bold text-stone-900 mb-2">2. Escolha o Especialista</h2>
            <p class="text-xs text-stone-500 mb-6">Prefere atendimento com uma profissional específica ou o horário mais rápido?</p>

            <div class="space-y-3">
              <!-- Opção "Primeiro Horário Disponível" -->
              <div 
                (click)="selecionarProfissional(null)"
                [class.border-rose-500]="profissionalSelecionado() === null"
                [class.bg-rose-50/50]="profissionalSelecionado() === null"
                class="p-4 rounded-2xl border-2 border-dashed border-nude-300 hover:border-rose-400 cursor-pointer transition-all flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-champagne-100 text-champagne-700 flex items-center justify-center font-bold text-lg">
                    ⚡
                  </div>
                  <div>
                    <h4 class="font-serif font-bold text-stone-900 text-sm sm:text-base">Primeiro Horário Disponível</h4>
                    <p class="text-[11px] text-stone-500">Agiliza a agenda buscando vagas com qualquer especialista habilitada.</p>
                  </div>
                </div>
                <span class="text-xs font-semibold text-rose-600">
                  {{ profissionalSelecionado() === null ? 'Selecionado ✓' : 'Selecionar' }}
                </span>
              </div>

              <!-- Lista de Profissionais Habilitados -->
              @for (prof of profissionais(); track prof.id) {
                <div 
                  (click)="selecionarProfissional(prof)"
                  [class.border-rose-500]="profissionalSelecionado()?.id === prof.id"
                  [class.bg-rose-50/50]="profissionalSelecionado()?.id === prof.id"
                  class="p-4 rounded-2xl border border-nude-200 hover:border-rose-300 cursor-pointer transition-all flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <img [src]="prof.fotoUrl || 'https://images.unsplash.com/photo-1594824813626-d62f6b865664?auto=format&fit=crop&q=80&w=200'" class="w-12 h-12 rounded-full object-cover border-2 border-nude-200" />
                    <div>
                      <h4 class="font-serif font-bold text-stone-900 text-sm sm:text-base">{{ prof.nome }}</h4>
                      <p class="text-[11px] text-stone-500">{{ prof.especialidade }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-semibold text-rose-600">
                    {{ profissionalSelecionado()?.id === prof.id ? 'Selecionado ✓' : 'Escolher' }}
                  </span>
                </div>
              }
            </div>

            <div class="mt-8 flex justify-between">
              <button (click)="irParaPasso(1)" class="px-5 py-2.5 rounded-xl border border-nude-300 text-stone-700 font-semibold text-xs hover:bg-nude-50">
                ← Voltar
              </button>
              <button (click)="avancarParaPasso3()" class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs sm:text-sm hover:bg-stone-800 transition-all shadow-md">
                Próximo: Escolher Data e Hora →
              </button>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PASSO 3: CALENDÁRIO E GRADE DE HORÁRIOS LIVRES -->
        <!-- ========================================== -->
        @if (passoAtual() === 3) {
          <div>
            <h2 class="font-serif text-xl font-bold text-stone-900 mb-2">3. Data & Grade de Horários</h2>
            <p class="text-xs text-stone-500 mb-6">
              Vagas calculadas dinamicamente sem conflito de horário para {{ procedimentoSelecionado()?.titulo }}.
            </p>

            <!-- Seletor de Data -->
            <div class="mb-6">
              <label class="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Selecione o Dia do Atendimento:
              </label>
              <input 
                type="date" 
                [min]="dataMinima"
                [ngModel]="dataSelecionada()"
                (ngModelChange)="onDataChange($event)"
                class="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-nude-300 text-stone-800 font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none" />
            </div>

            <!-- Grade de Horários Livres (Slots) -->
            <div class="mt-4">
              <h4 class="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-3">
                Horários Livres Disponíveis (Duração: {{ procedimentoSelecionado()?.duracaoMinutos }} min):
              </h4>

              @if (carregandoSlots()) {
                <div class="py-12 text-center text-stone-400 text-xs animate-pulse">
                  Consultando grade de horários disponíveis em tempo real...
                </div>
              } @else if (slots().length === 0) {
                <div class="p-6 rounded-2xl bg-nude-100 text-center border border-nude-200">
                  <p class="text-xs text-stone-600 font-medium">Nenhum horário livre encontrado nesta data.</p>
                  <p class="text-[11px] text-stone-400 mt-1">Por favor, experimente selecionar outro dia ou profissional.</p>
                </div>
              } @else {
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  @for (slot of slots(); track slot.horarioInicio) {
                    <button 
                      (click)="selecionarSlot(slot)"
                      [class.bg-rose-500]="slotSelecionado()?.horarioInicio === slot.horarioInicio && slotSelecionado()?.profissionalId === slot.profissionalId"
                      [class.text-white]="slotSelecionado()?.horarioInicio === slot.horarioInicio && slotSelecionado()?.profissionalId === slot.profissionalId"
                      [class.border-rose-500]="slotSelecionado()?.horarioInicio === slot.horarioInicio && slotSelecionado()?.profissionalId === slot.profissionalId"
                      [class.bg-white]="slotSelecionado()?.horarioInicio !== slot.horarioInicio || slotSelecionado()?.profissionalId !== slot.profissionalId"
                      [class.text-stone-800]="slotSelecionado()?.horarioInicio !== slot.horarioInicio || slotSelecionado()?.profissionalId !== slot.profissionalId"
                      class="p-3 rounded-2xl border border-nude-200 hover:border-rose-400 text-center transition-all shadow-sm">
                      <span class="block text-sm font-bold">{{ formatarHora(slot.horarioInicio) }}</span>
                      <span class="block text-[10px] opacity-80 mt-0.5 truncate">{{ slot.profissionalNome.split(' ')[0] }}</span>
                    </button>
                  }
                </div>
              }
            </div>

            <div class="mt-8 flex justify-between">
              <button (click)="irParaPasso(2)" class="px-5 py-2.5 rounded-xl border border-nude-300 text-stone-700 font-semibold text-xs hover:bg-nude-50">
                ← Voltar
              </button>
              <button 
                [disabled]="!slotSelecionado()"
                (click)="avancarParaPasso4()" 
                class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs sm:text-sm hover:bg-stone-800 disabled:opacity-40 transition-all shadow-md">
                Próximo: Resumo & Confirmação →
              </button>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PASSO 4: CONFIRMAÇÃO & RESUMO DO AGENDAMENTO -->
        <!-- ========================================== -->
        @if (passoAtual() === 4) {
          <div>
            <h2 class="font-serif text-xl font-bold text-stone-900 mb-2">4. Resumo e Confirmação</h2>
            <p class="text-xs text-stone-500 mb-6">Confira os detalhes da sessão antes de confirmar o agendamento.</p>

            <!-- Seletor Obrigatório de Paciente para Administradores e Especialistas -->
            @if (authService.isAdminOrProfissional()) {
              <div class="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
                <div class="flex items-center gap-2 mb-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <label class="block text-xs font-bold uppercase tracking-wider text-amber-900">
                    Selecione o Paciente para quem está marcando a consulta:
                  </label>
                </div>
                
                <select 
                  [ngModel]="clienteIdSelecionado"
                  (ngModelChange)="onClienteSelecionadoChange($event)"
                  class="w-full p-3 rounded-xl border border-amber-300 text-xs sm:text-sm font-semibold text-stone-800 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none">
                  <option [ngValue]="null">-- Selecione o Paciente Cadastrado na Clínica --</option>
                  @for (cli of clientes(); track cli.id) {
                    <option [ngValue]="cli.id">
                      {{ cli.nome }} • WhatsApp: {{ formatarTelefone(cli.telefoneWhatsApp) }} ({{ cli.email }})
                    </option>
                  }
                </select>

                @if (clienteIdSelecionado && pacienteSelecionado()) {
                  <div class="mt-3 text-xs text-amber-900 font-medium flex items-center gap-2">
                    <span>✓ Paciente Selecionado:</span>
                    <strong>{{ pacienteSelecionado()?.nome }}</strong>
                    <span class="text-stone-500">({{ pacienteSelecionado()?.telefoneWhatsApp }})</span>
                  </div>
                } @else {
                  <p class="text-xs text-rose-600 mt-2 font-semibold">
                    * Obrigatório: você deve selecionar o paciente antes de confirmar.
                  </p>
                }
              </div>
            }

            <!-- Card de Resumo Elegante -->
            <div class="bg-gradient-to-br from-nude-50 to-rose-50/40 rounded-2xl p-6 border border-rose-100 mb-6 space-y-4">
              
              @if (authService.isAdminOrProfissional() && pacienteSelecionado()) {
                <div class="border-b border-nude-200/80 pb-3">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-rose-600 block">Paciente / Beneficiário</span>
                  <h4 class="font-serif text-base font-bold text-stone-900">{{ pacienteSelecionado()?.nome }}</h4>
                  <span class="text-xs text-stone-500">WhatsApp: {{ pacienteSelecionado()?.telefoneWhatsApp }} • E-mail: {{ pacienteSelecionado()?.email }}</span>
                </div>
              }

              <div class="flex items-start justify-between border-b border-nude-200/80 pb-4">
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-rose-600 block">Procedimento</span>
                  <h3 class="font-serif text-lg font-bold text-stone-900">{{ procedimentoSelecionado()?.titulo }}</h3>
                  <span class="text-xs text-stone-500">Duração estimada: {{ procedimentoSelecionado()?.duracaoMinutos }} minutos</span>
                </div>
                <span class="text-lg font-bold text-stone-900">
                  {{ procedimentoSelecionado()?.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-nude-200/80 pb-4 text-xs">
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Especialista</span>
                  <span class="font-semibold text-stone-800 text-sm">{{ slotSelecionado()?.profissionalNome }}</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Data e Horário</span>
                  <span class="font-semibold text-rose-700 text-sm">
                    {{ dataSelecionada() }} às {{ formatarHora(slotSelecionado()?.horarioInicio || '') }}
                  </span>
                </div>
              </div>

              <!-- Observações -->
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">
                  Observações ou Recomendações Pré-Consulta (opcional):
                </label>
                <textarea 
                  [(ngModel)]="observacoesCliente"
                  rows="2"
                  placeholder="Ex: Primeira vez fazendo este tratamento, pele com tendência a acne..."
                  class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"></textarea>
              </div>

            </div>

            <!-- Aviso de Autenticação se não logado -->
            @if (!authService.isAuthenticated()) {
              <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6 text-xs text-amber-800">
                <span class="font-bold">Atenção:</span> Você precisará entrar ou criar uma conta para concluir o agendamento.
              </div>
            }

            @if (erroAgendamento()) {
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 mb-6 text-xs text-rose-800">
                {{ erroAgendamento() }}
              </div>
            }

            <div class="mt-8 flex justify-between items-center">
              <button (click)="irParaPasso(3)" class="px-5 py-2.5 rounded-xl border border-nude-300 text-stone-700 font-semibold text-xs hover:bg-nude-50">
                ← Voltar
              </button>

              <button 
                [disabled]="salvando() || (authService.isAdminOrProfissional() && !clienteIdSelecionado)"
                (click)="confirmarAgendamento()" 
                class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-sm hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-200 flex items-center gap-2">
                @if (salvando()) {
                  <span>Confirmando...</span>
                } @else {
                  <span>Confirmar Agendamento ✓</span>
                }
              </button>
            </div>
          </div>
        }

      </div>

    </div>
  `
})
export class AgendamentoWizardComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  passoAtual = signal<number>(1);
  procedimentos = signal<Procedimento[]>([]);
  profissionais = signal<Profissional[]>([]);
  procedimentoSelecionado = signal<Procedimento | null>(null);
  profissionalSelecionado = signal<Profissional | null>(null);

  // Lista de pacientes para Admin/Profissional
  clientes = signal<Usuario[]>([]);
  clienteIdSelecionado: number | null = null;
  pacienteSelecionado = signal<Usuario | null>(null);

  dataMinima = new Date().toISOString().split('T')[0];
  dataSelecionada = signal<string>(new Date().toISOString().split('T')[0]);

  slots = signal<SlotDisponivel[]>([]);
  slotSelecionado = signal<SlotDisponivel | null>(null);
  carregandoSlots = signal<boolean>(false);

  observacoesCliente = '';
  salvando = signal<boolean>(false);
  erroAgendamento = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarProcedimentos();
    this.carregarClientesSeAdmin();

    this.route.queryParams.subscribe(params => {
      if (params['procedimentoId']) {
        const id = Number(params['procedimentoId']);
        this.api.getProcedimentoById(id).subscribe({
          next: (proc) => {
            this.selecionarProcedimento(proc);
            this.passoAtual.set(2);
          }
        });
      }
    });
  }

  carregarClientesSeAdmin(): void {
    if (this.authService.isAdminOrProfissional()) {
      this.api.getClientes().subscribe({
        next: (dados) => {
          this.clientes.set(dados);
          if (dados.length > 0 && !this.clienteIdSelecionado) {
            this.onClienteSelecionadoChange(dados[0].id);
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  onClienteSelecionadoChange(id: number | null): void {
    this.clienteIdSelecionado = id;
    if (id) {
      const p = this.clientes().find(c => c.id === id) || null;
      this.pacienteSelecionado.set(p);
    } else {
      this.pacienteSelecionado.set(null);
    }
  }

  carregarProcedimentos(): void {
    this.api.getProcedimentos().subscribe({
      next: (dados) => this.procedimentos.set(dados),
      error: (err) => console.error(err)
    });
  }

  selecionarProcedimento(proc: Procedimento): void {
    this.procedimentoSelecionado.set(proc);
    this.carregarProfissionaisHabilitados(proc.id);
  }

  carregarProfissionaisHabilitados(procId: number): void {
    this.api.getProfissionais(procId).subscribe({
      next: (dados) => this.profissionais.set(dados),
      error: (err) => console.error(err)
    });
  }

  selecionarProfissional(prof: Profissional | null): void {
    this.profissionalSelecionado.set(prof);
  }

  avancarParaPasso2(): void {
    if (this.procedimentoSelecionado()) {
      this.passoAtual.set(2);
    }
  }

  avancarParaPasso3(): void {
    this.passoAtual.set(3);
    this.consultarSlots();
  }

  avancarParaPasso4(): void {
    if (this.slotSelecionado()) {
      this.carregarClientesSeAdmin();
      this.passoAtual.set(4);
    }
  }

  irParaPasso(p: number): void {
    if (p === 4) {
      this.carregarClientesSeAdmin();
    }
    this.passoAtual.set(p);
  }

  formatarTelefone(tel: string | null | undefined): string {
    return formatarTelefoneBR(tel);
  }

  onDataChange(novaData: string): void {
    this.dataSelecionada.set(novaData);
    this.consultarSlots();
  }

  consultarSlots(): void {
    const proc = this.procedimentoSelecionado();
    if (!proc) return;

    this.carregandoSlots.set(true);
    this.slotSelecionado.set(null);

    const profId = this.profissionalSelecionado()?.id;
    this.api.getSlotsDisponiveis(proc.id, this.dataSelecionada(), profId).subscribe({
      next: (res) => {
        this.slots.set(res.slots || []);
        this.carregandoSlots.set(false);
      },
      error: (err) => {
        console.error(err);
        this.carregandoSlots.set(false);
      }
    });
  }

  selecionarSlot(slot: SlotDisponivel): void {
    this.slotSelecionado.set(slot);
  }

  formatarHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5);
  }

  confirmarAgendamento(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/agendar' } });
      return;
    }

    if (this.authService.isAdminOrProfissional() && !this.clienteIdSelecionado) {
      this.erroAgendamento.set('Como administrador ou especialista, selecione o paciente para quem a consulta será agendada.');
      return;
    }

    const proc = this.procedimentoSelecionado();
    const slot = this.slotSelecionado();
    if (!proc || !slot) return;

    this.salvando.set(true);
    this.erroAgendamento.set(null);

    const horaInicioLimpa = slot.horarioInicio.length === 5 ? slot.horarioInicio + ':00' : slot.horarioInicio;
    const dataHoraInicio = `${this.dataSelecionada()}T${horaInicioLimpa}`;

    this.api.criarAgendamento({
      clienteId: this.authService.isAdminOrProfissional() ? (this.clienteIdSelecionado || undefined) : undefined,
      procedimentoId: proc.id,
      profissionalId: slot.profissionalId,
      dataHoraInicio: dataHoraInicio,
      observacoesCliente: this.observacoesCliente
    }).subscribe({
      next: (agendamento) => {
        this.salvando.set(false);
        if (this.authService.isAdminOrProfissional()) {
          this.router.navigate(['/admin/agenda'], { queryParams: { sucesso: agendamento.id } });
        } else {
          this.router.navigate(['/meus-agendamentos'], { queryParams: { sucesso: agendamento.id } });
        }
      },
      error: (err) => {
        this.salvando.set(false);
        const detalhe = err?.error?.detail || err?.error?.detalheTecnico || 'Erro ao confirmar agendamento. Horário pode ter sido ocupado.';
        this.erroAgendamento.set(detalhe);
      }
    });
  }
}
