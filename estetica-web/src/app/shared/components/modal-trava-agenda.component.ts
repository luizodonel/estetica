import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Profissional, BloqueioAgenda, HorarioTrabalho } from '../../core/models';

export type DiaSemanaTipo = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface JornadaDiaItem {
  diaSemana: DiaSemanaTipo;
  label: string;
  ativo: boolean;
  horaInicio: string;
  horaFim: string;
  inicioIntervalo: string;
  fimIntervalo: string;
}

const DIAS_PADRAO: { diaSemana: DiaSemanaTipo; label: string }[] = [
  { diaSemana: 'MONDAY', label: 'Segunda-feira' },
  { diaSemana: 'TUESDAY', label: 'Terça-feira' },
  { diaSemana: 'WEDNESDAY', label: 'Quarta-feira' },
  { diaSemana: 'THURSDAY', label: 'Quinta-feira' },
  { diaSemana: 'FRIDAY', label: 'Sexta-feira' },
  { diaSemana: 'SATURDAY', label: 'Sábado' },
  { diaSemana: 'SUNDAY', label: 'Domingo' }
];

@Component({
  selector: 'app-modal-trava-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (aberto) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-nude-200 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
          
          <!-- Cabeçalho -->
          <div class="flex items-center justify-between pb-4 border-b border-nude-200 mb-6">
            <div>
              <span class="text-[10px] uppercase tracking-wider font-bold text-rose-600">Disponibilidade & Agenda</span>
              <h3 class="font-serif font-bold text-xl text-stone-900">
                Horários de Atendimento & Trava de Agenda
              </h3>
            </div>
            <button (click)="fecharModal()" class="text-stone-400 hover:text-stone-600 p-2 text-xl font-bold">✕</button>
          </div>

          <!-- Seletor de Especialista -->
          <div class="mb-6 p-4 rounded-2xl bg-stone-50 border border-nude-200">
            @if (auth.isAdmin()) {
              <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                Selecione o Especialista para Configurar:
              </label>
              <select 
                [ngModel]="profissionalSelecionadoId()"
                (ngModelChange)="aoTrocarProfissional($event)"
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 bg-white font-medium text-stone-800 focus:ring-2 focus:ring-rose-400 focus:outline-none">
                @for (p of profissionais(); track p.id) {
                  <option [value]="p.id">{{ p.nome }} — {{ p.especialidade }}</option>
                }
              </select>
            } @else {
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold text-rose-700 text-sm">
                  👩‍⚕️
                </div>
                <div>
                  <p class="text-xs text-stone-500 font-medium">Configurando agenda de:</p>
                  <p class="text-sm font-bold text-stone-800">{{ profissionalAtualNome() }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Mensagens de Alerta -->
          @if (mensagemSucesso()) {
            <div class="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>✓</span>
                <span>{{ mensagemSucesso() }}</span>
              </div>
              <button (click)="mensagemSucesso.set(null)" class="text-emerald-700 font-bold ml-2">✕</button>
            </div>
          }

          @if (mensagemErro()) {
            <div class="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>⚠️</span>
                <span>{{ mensagemErro() }}</span>
              </div>
              <button (click)="mensagemErro.set(null)" class="text-rose-700 font-bold ml-2">✕</button>
            </div>
          }

          <!-- Abas de Navegação -->
          <div class="flex items-center gap-2 mb-6 border-b border-nude-200 pb-2">
            <button
              type="button"
              (click)="abaAtiva.set('jornada')"
              [class.bg-stone-900]="abaAtiva() === 'jornada'"
              [class.text-white]="abaAtiva() === 'jornada'"
              [class.bg-nude-100]="abaAtiva() !== 'jornada'"
              [class.text-stone-700]="abaAtiva() !== 'jornada'"
              class="px-4 py-2 rounded-xl text-xs font-semibold transition-all">
              🕒 Dias e Horários de Atendimento
            </button>
            <button
              type="button"
              (click)="abaAtiva.set('bloqueios')"
              [class.bg-stone-900]="abaAtiva() === 'bloqueios'"
              [class.text-white]="abaAtiva() === 'bloqueios'"
              [class.bg-nude-100]="abaAtiva() !== 'bloqueios'"
              [class.text-stone-700]="abaAtiva() !== 'bloqueios'"
              class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5">
              <span>🔒 Travar Agenda (Bloqueios / Folgas)</span>
              @if (bloqueios().length > 0) {
                <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {{ bloqueios().length }}
                </span>
              }
            </button>
          </div>

          <!-- =================== ABA 1: DIAS E HORÁRIOS (JORNADA) =================== -->
          @if (abaAtiva() === 'jornada') {
            @if (carregando()) {
              <div class="py-12 text-center text-xs text-stone-400 animate-pulse">
                Carregando horários de atendimento...
              </div>
            } @else {
              <div class="space-y-3 mb-6">
                <p class="text-xs text-stone-500 mb-3">
                  Marque os dias da semana em que este especialista atende clientes e especifique o expediente e horário de almoço.
                </p>

                @for (item of dias(); track item.diaSemana; let i = $index) {
                  <div class="p-3.5 rounded-2xl border transition-all"
                       [class.border-rose-300]="item.ativo"
                       [class.bg-rose-50/30]="item.ativo"
                       [class.border-stone-200]="!item.ativo"
                       [class.bg-stone-50/50]="!item.ativo">
                    
                    <div class="flex items-center justify-between mb-2">
                      <label class="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="item.ativo" 
                          class="w-4 h-4 text-rose-600 rounded border-stone-300 focus:ring-rose-500" />
                        <span class="text-xs font-bold" [class.text-stone-900]="item.ativo" [class.text-stone-400]="!item.ativo">
                          {{ item.label }}
                        </span>
                      </label>
                      <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                            [class.bg-emerald-100]="item.ativo"
                            [class.text-emerald-800]="item.ativo"
                            [class.bg-stone-200]="!item.ativo"
                            [class.text-stone-600]="!item.ativo">
                        {{ item.ativo ? 'Atende' : 'Folga' }}
                      </span>
                    </div>

                    @if (item.ativo) {
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-nude-200/60 animate-fade-in">
                        <div>
                          <label class="block text-[10px] text-stone-500 font-medium mb-1">Entrada</label>
                          <input 
                            type="time" 
                            [(ngModel)]="item.horaInicio"
                            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-nude-300 bg-white focus:ring-1 focus:ring-rose-400" />
                        </div>
                        <div>
                          <label class="block text-[10px] text-stone-500 font-medium mb-1">Saída</label>
                          <input 
                            type="time" 
                            [(ngModel)]="item.horaFim"
                            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-nude-300 bg-white focus:ring-1 focus:ring-rose-400" />
                        </div>
                        <div>
                          <label class="block text-[10px] text-stone-500 font-medium mb-1">Início Almoço</label>
                          <input 
                            type="time" 
                            [(ngModel)]="item.inicioIntervalo"
                            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-nude-300 bg-white focus:ring-1 focus:ring-rose-400" />
                        </div>
                        <div>
                          <label class="block text-[10px] text-stone-500 font-medium mb-1">Fim Almoço</label>
                          <input 
                            type="time" 
                            [(ngModel)]="item.fimIntervalo"
                            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-nude-300 bg-white focus:ring-1 focus:ring-rose-400" />
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-nude-200">
                <button
                  type="button"
                  (click)="fecharModal()"
                  class="px-4 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                  Fechar
                </button>
                <button
                  type="button"
                  (click)="salvarJornada()"
                  [disabled]="salvando()"
                  class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-200 disabled:opacity-50">
                  {{ salvando() ? 'Salvando...' : 'Salvar Horários da Semana' }}
                </button>
              </div>
            }
          }

          <!-- =================== ABA 2: TRAVAR AGENDA (BLOQUEIOS) =================== -->
          @if (abaAtiva() === 'bloqueios') {
            <div class="space-y-6">
              
              <!-- Formulário de Novo Bloqueio -->
              <div class="p-4 rounded-2xl bg-rose-50/40 border border-rose-200">
                <h4 class="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>Travar Período / Inserir Indisponibilidade</span>
                </h4>
                <p class="text-[11px] text-stone-500 mb-3">
                  Durante o período bloqueado, nenhum cliente ou recepcionista conseguirá marcar consultas com este especialista.
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-stone-700 mb-1">Início do Bloqueio *</label>
                    <input 
                      type="datetime-local" 
                      [(ngModel)]="novoBloqueio.dataInicio"
                      class="w-full text-xs px-3 py-2 rounded-xl border border-nude-300 bg-white focus:ring-1 focus:ring-rose-400" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-stone-700 mb-1">Término do Bloqueio *</label>
                    <input 
                      type="datetime-local" 
                      [(ngModel)]="novoBloqueio.dataFim"
                      class="w-full text-xs px-3 py-2 rounded-xl border border-nude-300 bg-white focus:ring-1 focus:ring-rose-400" />
                  </div>
                </div>

                <div class="mb-4">
                  <label class="block text-[11px] font-semibold text-stone-700 mb-1">Motivo / Descrição *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="novoBloqueio.motivo"
                    placeholder="Ex: Folga, Consulta médica particular, Treinamento ou Férias"
                    class="w-full text-xs px-3.5 py-2 rounded-xl border border-nude-300 bg-white focus:ring-1 focus:ring-rose-400" />
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    (click)="criarBloqueio()"
                    [disabled]="salvando() || !novoBloqueio.dataInicio || !novoBloqueio.dataFim"
                    class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-200 disabled:opacity-50 flex items-center gap-1.5">
                    <span>🔒 Travar Horário</span>
                  </button>
                </div>
              </div>

              <!-- Lista de Bloqueios Cadastrados -->
              <div>
                <h4 class="text-xs font-bold text-stone-800 mb-3 flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Períodos Travados Cadastrados ({{ bloqueios().length }})</span>
                </h4>

                @if (carregando()) {
                  <div class="py-8 text-center text-xs text-stone-400 animate-pulse">
                    Consultando períodos travados...
                  </div>
                } @else if (bloqueios().length === 0) {
                  <div class="p-6 rounded-2xl bg-stone-50 border border-nude-200 text-center text-xs text-stone-500">
                    Nenhum período ou dia travado para este especialista.
                  </div>
                } @else {
                  <div class="space-y-2.5">
                    @for (b of bloqueios(); track b.id) {
                      <div class="p-3.5 rounded-2xl border border-nude-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-nude-300 transition-all">
                        <div>
                          <div class="flex items-center gap-2 mb-1">
                            <span class="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                              Travado
                            </span>
                            <span class="text-xs font-bold text-stone-800">
                              {{ formatarDataHora(b.dataInicio) }} até {{ formatarDataHora(b.dataFim) }}
                            </span>
                          </div>
                          <p class="text-xs text-stone-600 italic">"{{ b.motivo }}"</p>
                        </div>

                        <button
                          type="button"
                          (click)="removerBloqueio(b.id)"
                          class="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 text-xs font-semibold transition-all self-end sm:self-center">
                          🔓 Destravar Período
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="flex items-center justify-end pt-4 border-t border-nude-200">
                <button
                  type="button"
                  (click)="fecharModal()"
                  class="px-4 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                  Fechar
                </button>
              </div>

            </div>
          }

        </div>
      </div>
    }
  `
})
export class ModalTravaAgendaComponent implements OnInit, OnChanges {
  @Input() aberto: boolean = false;
  @Input() profissionalIdInicial: number | null = null;
  @Output() fechar = new EventEmitter<void>();
  @Output() atualizado = new EventEmitter<void>();

  api = inject(ApiService);
  auth = inject(AuthService);

  abaAtiva = signal<'jornada' | 'bloqueios'>('jornada');
  profissionais = signal<Profissional[]>([]);
  profissionalSelecionadoId = signal<number | null>(null);
  dias = signal<JornadaDiaItem[]>([]);
  bloqueios = signal<BloqueioAgenda[]>([]);

  carregando = signal<boolean>(false);
  salvando = signal<boolean>(false);
  mensagemSucesso = signal<string | null>(null);
  mensagemErro = signal<string | null>(null);

  novoBloqueio = {
    dataInicio: '',
    dataFim: '',
    motivo: ''
  };

  ngOnInit(): void {
    this.carregarProfissionais();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto'] && this.aberto) {
      this.mensagemSucesso.set(null);
      this.mensagemErro.set(null);
      this.carregarProfissionais();
    }
    if (changes['profissionalIdInicial'] && this.profissionalIdInicial) {
      this.profissionalSelecionadoId.set(this.profissionalIdInicial);
      this.carregarDados();
    }
  }

  carregarProfissionais(): void {
    this.api.getProfissionais().subscribe({
      next: (profs) => {
        this.profissionais.set(profs);

        // Se o usuário logado for um especialista, seleciona o especialista dele
        if (this.auth.isProfissional()) {
          const userEmail = this.auth.currentUser()?.email;
          const meuProf = profs.find(p => p.email === userEmail);
          if (meuProf) {
            this.profissionalSelecionadoId.set(meuProf.id);
          }
        } else if (this.profissionalIdInicial) {
          this.profissionalSelecionadoId.set(this.profissionalIdInicial);
        } else if (!this.profissionalSelecionadoId() && profs.length > 0) {
          this.profissionalSelecionadoId.set(profs[0].id);
        }

        if (this.profissionalSelecionadoId()) {
          this.carregarDados();
        }
      },
      error: (err) => console.error(err)
    });
  }

  profissionalAtualNome(): string {
    const id = this.profissionalSelecionadoId();
    const p = this.profissionais().find(x => x.id === id);
    return p ? p.nome : 'Especialista';
  }

  aoTrocarProfissional(novoId: any): void {
    const id = Number(novoId);
    this.profissionalSelecionadoId.set(id);
    this.carregarDados();
  }

  carregarDados(): void {
    const profId = this.profissionalSelecionadoId();
    if (!profId) return;

    this.carregando.set(true);
    this.mensagemSucesso.set(null);
    this.mensagemErro.set(null);

    // Carrega Jornada
    this.api.getJornadaProfissional(profId).subscribe({
      next: (jornadaList) => {
        const mapa = new Map<DiaSemanaTipo, HorarioTrabalho>();
        jornadaList.forEach(j => mapa.set(j.diaSemana, j));

        const novosDias: JornadaDiaItem[] = DIAS_PADRAO.map(d => {
          const existente = mapa.get(d.diaSemana);
          return {
            diaSemana: d.diaSemana,
            label: d.label,
            ativo: existente ? Boolean(existente.ativo) : false,
            horaInicio: existente?.horaInicio ? existente.horaInicio.substring(0, 5) : '08:00',
            horaFim: existente?.horaFim ? existente.horaFim.substring(0, 5) : '18:00',
            inicioIntervalo: existente?.inicioIntervalo ? existente.inicioIntervalo.substring(0, 5) : '12:00',
            fimIntervalo: existente?.fimIntervalo ? existente.fimIntervalo.substring(0, 5) : '13:00'
          };
        });

        this.dias.set(novosDias);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.carregando.set(false);
      }
    });

    // Carrega Bloqueios
    this.api.getBloqueiosProfissional(profId).subscribe({
      next: (bloqs) => this.bloqueios.set(bloqs),
      error: (err) => console.error(err)
    });
  }

  salvarJornada(): void {
    const profId = this.profissionalSelecionadoId();
    if (!profId) return;

    this.salvando.set(true);
    this.mensagemSucesso.set(null);
    this.mensagemErro.set(null);

    const payload: HorarioTrabalho[] = this.dias().map(d => ({
      diaSemana: d.diaSemana,
      horaInicio: `${d.horaInicio}:00`,
      horaFim: `${d.horaFim}:00`,
      inicioIntervalo: d.inicioIntervalo ? `${d.inicioIntervalo}:00` : undefined,
      fimIntervalo: d.fimIntervalo ? `${d.fimIntervalo}:00` : undefined,
      ativo: d.ativo
    }));

    this.api.salvarJornada(profId, payload).subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagemSucesso.set('Horários e dias de atendimento salvos com sucesso!');
        this.atualizado.emit();
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err?.error?.message || 'Falha ao salvar horários de trabalho.');
      }
    });
  }

  criarBloqueio(): void {
    const profId = this.profissionalSelecionadoId();
    if (!profId) return;

    if (!this.novoBloqueio.dataInicio || !this.novoBloqueio.dataFim) {
      this.mensagemErro.set('Informe a data/horário de início e término.');
      return;
    }

    const inicio = this.novoBloqueio.dataInicio.length === 16 ? `${this.novoBloqueio.dataInicio}:00` : this.novoBloqueio.dataInicio;
    const fim = this.novoBloqueio.dataFim.length === 16 ? `${this.novoBloqueio.dataFim}:00` : this.novoBloqueio.dataFim;

    if (new Date(fim) <= new Date(inicio)) {
      this.mensagemErro.set('A data/horário de término deve ser posterior ao início.');
      return;
    }

    this.salvando.set(true);
    this.mensagemSucesso.set(null);
    this.mensagemErro.set(null);

    this.api.criarBloqueio(profId, {
      dataInicio: inicio,
      dataFim: fim,
      motivo: this.novoBloqueio.motivo || 'Agenda travada / Indisponível'
    }).subscribe({
      next: (b) => {
        this.salvando.set(false);
        this.bloqueios.update(lista => [b, ...lista]);
        this.mensagemSucesso.set('Agenda travada com sucesso para o período selecionado!');
        this.novoBloqueio = { dataInicio: '', dataFim: '', motivo: '' };
        this.atualizado.emit();
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err?.error?.message || 'Falha ao travar agenda.');
      }
    });
  }

  removerBloqueio(bloqueioId: number): void {
    if (!confirm('Deseja realmente destravar a agenda e remover este bloqueio?')) {
      return;
    }

    this.mensagemSucesso.set(null);
    this.mensagemErro.set(null);

    this.api.removerBloqueio(bloqueioId).subscribe({
      next: () => {
        this.bloqueios.update(lista => lista.filter(b => b.id !== bloqueioId));
        this.mensagemSucesso.set('Período destravado com sucesso!');
        this.atualizado.emit();
      },
      error: (err) => {
        this.mensagemErro.set(err?.error?.message || 'Falha ao destravar período.');
      }
    });
  }

  fecharModal(): void {
    this.fechar.emit();
  }

  formatarDataHora(isoString: string): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

