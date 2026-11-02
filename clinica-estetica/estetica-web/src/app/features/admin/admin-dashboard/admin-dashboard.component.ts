import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { DashboardResumo } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      
      <!-- Cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-rose-600 block mb-1">
            Gestão Operacional
          </span>
          <h1 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Painel Geral da Clínica
          </h1>
          <p class="text-xs text-stone-500 mt-1">Métricas em tempo real para o dia de hoje.</p>
        </div>

        <div class="flex items-center gap-2">
          <a routerLink="/admin/gestao" class="px-4 py-2 rounded-xl bg-white border border-nude-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-all shadow-sm">
            ⚙️ Cadastros & Gestão
          </a>
          <a routerLink="/admin/agenda" class="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-sm">
            Ver Agenda Completa →
          </a>
        </div>
      </div>

      <!-- Cards de Métricas do Dia -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <!-- Card 1: Total Hoje -->
        <div class="bg-white rounded-3xl p-5 border border-nude-200 shadow-sm">
          <span class="text-[10px] uppercase tracking-wider font-bold text-stone-400 block mb-1">Agendamentos Hoje</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-serif font-black text-stone-900">{{ resumo()?.agendamentosHoje || 0 }}</span>
            <span class="text-xs text-stone-500">sessões</span>
          </div>
        </div>

        <!-- Card 2: Confirmados -->
        <div class="bg-white rounded-3xl p-5 border border-nude-200 shadow-sm">
          <span class="text-[10px] uppercase tracking-wider font-bold text-emerald-600 block mb-1">Confirmados / Concluídos</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-serif font-black text-emerald-700">{{ resumo()?.agendamentosConfirmadosHoje || 0 }}</span>
            <span class="text-xs text-emerald-600">garantidos</span>
          </div>
        </div>

        <!-- Card 3: Pendentes -->
        <div class="bg-white rounded-3xl p-5 border border-nude-200 shadow-sm">
          <span class="text-[10px] uppercase tracking-wider font-bold text-amber-600 block mb-1">Aguardando Confirmação</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-serif font-black text-amber-700">{{ resumo()?.agendamentosPendentesHoje || 0 }}</span>
            <span class="text-xs text-amber-600">pendentes</span>
          </div>
        </div>

        <!-- Card 4: Faturamento Estimado Hoje -->
        <div class="bg-gradient-to-br from-rose-50 to-champagne-50 rounded-3xl p-5 border border-rose-200 shadow-sm">
          <span class="text-[10px] uppercase tracking-wider font-bold text-rose-700 block mb-1">Faturamento Previsto Hoje</span>
          <div class="flex items-baseline gap-2">
            <span class="text-xl sm:text-2xl font-serif font-black text-rose-900">
              {{ (resumo()?.faturamentoEstimadoHoje || 0) | currency:'BRL':'symbol':'1.0-0':'pt-BR' }}
            </span>
          </div>
        </div>

      </div>

      <!-- Próximos Atendimentos de Hoje -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-nude-200 shadow-sm">
        <h2 class="font-serif text-lg font-bold text-stone-900 mb-4">Próximos Atendimentos Programados</h2>

        @if (carregando()) {
          <div class="py-12 text-center text-stone-400 text-xs animate-pulse">Carregando métricas...</div>
        } @else if (!resumo()?.proximosAtendimentos?.length) {
          <p class="text-xs text-stone-500 py-6 text-center">Nenhum atendimento pendente para as próximas horas de hoje.</p>
        } @else {
          <div class="space-y-3">
            @for (item of resumo()?.proximosAtendimentos; track item.id) {
              <div class="p-4 rounded-2xl border border-nude-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-300 transition-all">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                    {{ item.dataHoraInicio.substring(11, 16) }}
                  </div>
                  <div>
                    <h4 class="font-serif font-bold text-stone-900 text-sm">{{ item.clienteNome }}</h4>
                    <p class="text-[11px] text-stone-500">{{ item.procedimentoTitulo }} com {{ item.profissionalNome }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold text-stone-900">
                    {{ item.valorCobrado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </span>
                  <a routerLink="/admin/agenda" class="text-xs font-semibold text-rose-600 hover:text-rose-700">
                    Gerenciar →
                  </a>
                </div>
              </div>
            }
          </div>
        }
      </div>

    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);

  resumo = signal<DashboardResumo | null>(null);
  carregando = signal<boolean>(true);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.getDashboardResumo().subscribe({
      next: (dados) => {
        this.resumo.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.carregando.set(false);
      }
    });
  }
}

