import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Agendamento, StatusAgendamento } from '../../core/models';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      
      <!-- Cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-rose-600 block mb-1">
            Área do Cliente
          </span>
          <h1 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Minhas Sessões & Agendamentos
          </h1>
        </div>

        <a routerLink="/agendar" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-sm">
          + Novo Agendamento
        </a>
      </div>

      <!-- Abas de Filtro: Próximos vs Histórico -->
      <div class="flex items-center gap-2 border-b border-nude-200 pb-3 mb-6">
        <button 
          (click)="abaAtiva.set('proximos')"
          [class.border-rose-500]="abaAtiva() === 'proximos'"
          [class.text-rose-600]="abaAtiva() === 'proximos'"
          [class.font-bold]="abaAtiva() === 'proximos'"
          class="pb-2 px-3 text-xs border-b-2 font-medium text-stone-600 hover:text-stone-900 transition-all">
          Próximos Agendamentos ({{ proximosAgendamentos().length }})
        </button>
        <button 
          (click)="abaAtiva.set('historico')"
          [class.border-rose-500]="abaAtiva() === 'historico'"
          [class.text-rose-600]="abaAtiva() === 'historico'"
          [class.font-bold]="abaAtiva() === 'historico'"
          class="pb-2 px-3 text-xs border-b-2 font-medium text-stone-600 hover:text-stone-900 transition-all">
          Histórico de Sessões ({{ historicoAgendamentos().length }})
        </button>
      </div>

      <!-- Feedback de Sucesso/Erro -->
      @if (mensagemFeedback()) {
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-6 flex items-center justify-between">
          <span>{{ mensagemFeedback() }}</span>
          <button (click)="mensagemFeedback.set(null)" class="text-emerald-600 font-bold">✕</button>
        </div>
      }

      @if (erroFeedback()) {
        <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-6 flex items-center justify-between">
          <span>{{ erroFeedback() }}</span>
          <button (click)="erroFeedback.set(null)" class="text-rose-600 font-bold">✕</button>
        </div>
      }

      <!-- Lista de Agendamentos -->
      @if (carregando()) {
        <div class="py-16 text-center text-stone-400 text-xs animate-pulse">
          Carregando seus agendamentos...
        </div>
      } @else if (listaFiltrada().length === 0) {
        <div class="bg-white rounded-3xl p-10 text-center border border-nude-200">
          <p class="text-sm font-serif font-bold text-stone-800">Nenhum agendamento encontrado.</p>
          <p class="text-xs text-stone-500 mt-1 mb-6">Que tal reservar um momento especial para você hoje?</p>
          <a routerLink="/agendar" class="px-5 py-2.5 rounded-2xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition-all shadow-md">
            Agendar Agora
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (a of listaFiltrada(); track a.id) {
            <div class="bg-white rounded-3xl p-5 sm:p-6 border border-nude-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-2xl bg-nude-100 flex items-center justify-center font-serif font-bold text-stone-800 text-base shrink-0">
                  {{ a.dataHoraInicio.substring(8, 10) }}
                  <span class="text-[9px] block text-stone-500 uppercase font-sans">
                    {{ obterMesAbreviado(a.dataHoraInicio) }}
                  </span>
                </div>

                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span [class]="obterBadgeClass(a.status)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {{ a.status }}
                    </span>
                    <span class="text-xs text-stone-500">
                      Horário: {{ a.dataHoraInicio.substring(11, 16) }} às {{ a.dataHoraFim.substring(11, 16) }}
                    </span>
                  </div>

                  <h3 class="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                    {{ a.procedimentoTitulo }}
                  </h3>

                  <p class="text-xs text-stone-600 mt-1">
                    Especialista: <strong class="text-stone-800">{{ a.profissionalNome }}</strong> • {{ a.valorCobrado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </p>

                  @if (a.observacoesCliente) {
                    <p class="text-[11px] text-stone-400 italic mt-1">Obs: "{{ a.observacoesCliente }}"</p>
                  }
                </div>
              </div>

              <!-- Ações (Apenas para agendamentos futuros não cancelados) -->
              @if (a.status === 'PENDENTE' || a.status === 'CONFIRMADO') {
                <div class="flex items-center gap-2 self-end sm:self-center">
                  <button 
                    (click)="abrirModalRemarcar(a)"
                    class="px-3.5 py-2 rounded-xl border border-nude-300 text-stone-700 hover:bg-nude-50 font-semibold text-xs transition-colors">
                    Remarcar
                  </button>
                  <button 
                    (click)="cancelar(a.id)"
                    class="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors">
                    Cancelar
                  </button>
                </div>
              }

            </div>
          }
        </div>
      }

      <!-- Modal de Remarcação -->
      @if (agendamentoParaRemarcar()) {
        <div class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-nude-200 shadow-2xl">
            <h3 class="font-serif text-xl font-bold text-stone-900 mb-2">Remarcar Sessão</h3>
            <p class="text-xs text-stone-500 mb-4">
              Selecione o novo horário desejado para {{ agendamentoParaRemarcar()?.procedimentoTitulo }}.
            </p>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Nova Data:</label>
                <input type="date" [(ngModel)]="novaDataRemarcacao" class="w-full p-2.5 rounded-xl border border-nude-300 text-xs" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Novo Horário:</label>
                <input type="time" [(ngModel)]="novoHorarioRemarcacao" class="w-full p-2.5 rounded-xl border border-nude-300 text-xs" />
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-2">
              <button (click)="agendamentoParaRemarcar.set(null)" class="px-4 py-2 rounded-xl text-stone-600 text-xs font-semibold">
                Fechar
              </button>
              <button (click)="confirmarRemarcacao()" class="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold">
                Salvar Nova Data
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class MeusAgendamentosComponent implements OnInit {
  private api = inject(ApiService);

  agendamentos = signal<Agendamento[]>([]);
  abaAtiva = signal<'proximos' | 'historico'>('proximos');
  carregando = signal<boolean>(true);
  mensagemFeedback = signal<string | null>(null);
  erroFeedback = signal<string | null>(null);

  agendamentoParaRemarcar = signal<Agendamento | null>(null);
  novaDataRemarcacao = '';
  novoHorarioRemarcacao = '10:00';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.getMeusAgendamentos().subscribe({
      next: (dados) => {
        this.agendamentos.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.carregando.set(false);
      }
    });
  }

  proximosAgendamentos(): Agendamento[] {
    const agora = new Date().toISOString();
    return this.agendamentos().filter(a => a.dataHoraFim >= agora && a.status !== 'CANCELADO');
  }

  historicoAgendamentos(): Agendamento[] {
    const agora = new Date().toISOString();
    return this.agendamentos().filter(a => a.dataHoraFim < agora || a.status === 'CANCELADO' || a.status === 'CONCLUIDO');
  }

  listaFiltrada(): Agendamento[] {
    return this.abaAtiva() === 'proximos' ? this.proximosAgendamentos() : this.historicoAgendamentos();
  }

  cancelar(id: number): void {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;

    this.api.cancelarAgendamento(id, 'Cancelado pelo cliente no painel').subscribe({
      next: () => {
        this.mensagemFeedback.set('Agendamento cancelado com sucesso.');
        this.carregar();
      },
      error: (err) => {
        const detalhe = err?.error?.detail || err?.error?.detalheTecnico || 'Erro ao cancelar. Regra de antecedência de 2h pode ter sido atingida.';
        this.erroFeedback.set(detalhe);
      }
    });
  }

  abrirModalRemarcar(a: Agendamento): void {
    this.agendamentoParaRemarcar.set(a);
    this.novaDataRemarcacao = new Date().toISOString().split('T')[0];
  }

  confirmarRemarcacao(): void {
    const a = this.agendamentoParaRemarcar();
    if (!a || !this.novaDataRemarcacao || !this.novoHorarioRemarcacao) return;

    const novaDataHora = `${this.novaDataRemarcacao}T${this.novoHorarioRemarcacao}:00`;

    this.api.remarcarAgendamento(a.id, { novaDataHoraInicio: novaDataHora }).subscribe({
      next: () => {
        this.agendamentoParaRemarcar.set(null);
        this.mensagemFeedback.set('Sessão remarcada com sucesso!');
        this.carregar();
      },
      error: (err) => {
        const detalhe = err?.error?.detail || 'Horário indisponível para remarcação.';
        this.erroFeedback.set(detalhe);
      }
    });
  }

  obterMesAbreviado(dataStr: string): string {
    const mes = parseInt(dataStr.substring(5, 7), 10);
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[mes - 1] || '';
  }

  obterBadgeClass(status: StatusAgendamento): string {
    switch (status) {
      case 'CONFIRMADO': return 'bg-emerald-100 text-emerald-800';
      case 'PENDENTE': return 'bg-amber-100 text-amber-800';
      case 'CONCLUIDO': return 'bg-blue-100 text-blue-800';
      case 'CANCELADO': return 'bg-rose-100 text-rose-800';
      case 'NO_SHOW': return 'bg-stone-200 text-stone-700';
      default: return 'bg-nude-200 text-stone-700';
    }
  }
}

