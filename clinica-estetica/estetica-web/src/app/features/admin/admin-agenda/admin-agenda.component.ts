import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Agendamento, Profissional, StatusAgendamento } from '../../../core/models';

@Component({
  selector: 'app-admin-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      
      <!-- Cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-rose-600 block mb-1">
            Recepção & Operação
          </span>
          <h1 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Agenda Clínica de Atendimentos
          </h1>
        </div>

        <!-- Filtro Rápido de Data -->
        <div class="flex items-center gap-2">
          <input 
            type="date" 
            [ngModel]="dataFiltro()"
            (ngModelChange)="onDataChange($event)"
            class="px-4 py-2 rounded-xl border border-nude-300 text-stone-800 text-xs font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none" />
          <button (click)="irParaHoje()" class="px-3.5 py-2 rounded-xl bg-nude-200 hover:bg-nude-300 text-stone-800 text-xs font-semibold transition-colors">
            Hoje
          </button>
        </div>
      </div>

      <!-- Filtros por Profissional e Status -->
      <div class="flex flex-wrap items-center gap-2 mb-6">
        <button 
          (click)="filtroProfissional.set(null)"
          [class.bg-stone-900]="filtroProfissional() === null"
          [class.text-white]="filtroProfissional() === null"
          [class.bg-white]="filtroProfissional() !== null"
          [class.text-stone-700]="filtroProfissional() !== null"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-nude-200 shadow-sm transition-all">
          Todos os Profissionais
        </button>

        @for (prof of profissionais(); track prof.id) {
          <button 
            (click)="filtroProfissional.set(prof.id)"
            [class.bg-stone-900]="filtroProfissional() === prof.id"
            [class.text-white]="filtroProfissional() === prof.id"
            [class.bg-white]="filtroProfissional() !== prof.id"
            [class.text-stone-700]="filtroProfissional() !== prof.id"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-nude-200 shadow-sm transition-all">
            {{ prof.nome }}
          </button>
        }
      </div>

      <!-- Lista / Grade de Agendamentos da Data -->
      @if (carregando()) {
        <div class="py-20 text-center text-stone-400 text-xs animate-pulse">
          Consultando atendimentos da clínica...
        </div>
      } @else if (agendamentosFiltrados().length === 0) {
        <div class="bg-white rounded-3xl p-12 text-center border border-nude-200">
          <p class="font-serif font-bold text-stone-700 text-lg">Nenhum atendimento agendado para esta data.</p>
          <p class="text-xs text-stone-400 mt-1">Selecione outro dia ou divulgue horários na recepção.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (a of agendamentosFiltrados(); track a.id) {
            <div class="bg-white rounded-3xl p-5 border border-nude-200 hover:border-nude-300 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <!-- Info Principal -->
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-nude-100 flex flex-col items-center justify-center font-bold text-stone-800 shrink-0">
                  <span class="text-xs text-rose-600">{{ a.dataHoraInicio.substring(11, 16) }}</span>
                  <span class="text-[10px] text-stone-400">{{ a.dataHoraFim.substring(11, 16) }}</span>
                </div>

                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span [class]="obterBadgeClass(a.status)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {{ a.status }}
                    </span>
                    <span class="text-xs font-semibold text-stone-600">
                      {{ a.profissionalNome }}
                    </span>
                  </div>

                  <h3 class="font-serif text-base font-bold text-stone-900 leading-snug">
                    {{ a.clienteNome }}
                    <span class="font-sans font-normal text-xs text-stone-500">({{ a.clienteWhatsApp }})</span>
                  </h3>

                  <p class="text-xs text-stone-600 mt-0.5">
                    Procedimento: <strong class="text-stone-800">{{ a.procedimentoTitulo }}</strong> • {{ a.valorCobrado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </p>

                  @if (a.observacoesCliente) {
                    <p class="text-[11px] text-stone-400 italic mt-0.5">Obs: "{{ a.observacoesCliente }}"</p>
                  }
                  @if (a.notasInternas) {
                    <p class="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded mt-1 inline-block">Nota Clínica: {{ a.notasInternas }}</p>
                  }
                </div>
              </div>

              <!-- Mudança de Status Operacional Rápido -->
              <div class="flex flex-wrap items-center gap-1.5 self-end md:self-center">
                @if (a.status !== 'CONFIRMADO') {
                  <button (click)="alterarStatus(a.id, 'CONFIRMADO')" class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold">
                    ✓ Confirmar
                  </button>
                }
                @if (a.status !== 'CONCLUIDO') {
                  <button (click)="alterarStatus(a.id, 'CONCLUIDO')" class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold">
                    ✓ Concluir
                  </button>
                }
                @if (a.status !== 'NO_SHOW' && a.status !== 'CONCLUIDO') {
                  <button (click)="alterarStatus(a.id, 'NO_SHOW')" class="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 text-[11px] font-semibold">
                    Faltou (No-Show)
                  </button>
                }
                @if (a.status !== 'CANCELADO') {
                  <button (click)="alterarStatus(a.id, 'CANCELADO')" class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold">
                    Cancelar
                  </button>
                }
              </div>

            </div>
          }
        </div>
      }

    </div>
  `
})
export class AdminAgendaComponent implements OnInit {
  private api = inject(ApiService);

  dataFiltro = signal<string>(new Date().toISOString().split('T')[0]);
  profissionais = signal<Profissional[]>([]);
  filtroProfissional = signal<number | null>(null);

  agendamentos = signal<Agendamento[]>([]);
  carregando = signal<boolean>(true);

  ngOnInit(): void {
    this.carregarProfissionais();
    this.carregarAgendamentos();
  }

  carregarProfissionais(): void {
    this.api.getProfissionais().subscribe({
      next: (dados) => this.profissionais.set(dados)
    });
  }

  carregarAgendamentos(): void {
    this.carregando.set(true);
    const data = this.dataFiltro();
    const inicio = `${data}T00:00:00`;
    const fim = `${data}T23:59:59`;

    this.api.getCalendarioGeral(inicio, fim).subscribe({
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

  agendamentosFiltrados(): Agendamento[] {
    const profId = this.filtroProfissional();
    if (!profId) return this.agendamentos();
    return this.agendamentos().filter(a => a.profissionalId === profId);
  }

  onDataChange(novaData: string): void {
    this.dataFiltro.set(novaData);
    this.carregarAgendamentos();
  }

  irParaHoje(): void {
    this.dataFiltro.set(new Date().toISOString().split('T')[0]);
    this.carregarAgendamentos();
  }

  alterarStatus(id: number, status: StatusAgendamento): void {
    this.api.atualizarStatusAgendamento(id, status).subscribe({
      next: () => this.carregarAgendamentos(),
      error: (err) => console.error(err)
    });
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

