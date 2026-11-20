import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type CicloFaturacao = 'MENSAL' | 'SEMESTRAL' | 'ANUAL';
export type PlanoId = 'STARTER' | 'PRO' | 'VIP';

export interface PlanoConfig {
  id: PlanoId;
  nome: string;
  subtitulo: string;
  destaque: boolean;
  etiquetaDestaque?: string;
  precoMensal: number;
  precoSemestralTotal: number;
  precoSemestralMensalEq: number;
  poupancaSemestral: number;
  precoAnualTotal: number;
  precoAnualMensalEq: number;
  poupancaAnual: number;
  ctaTexto: string;
  beneficiosBaseTexto?: string;
  funcionalidades: string[];
}

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-7xl mx-auto">

        <!-- ========================================================================= -->
        <!-- CABEÇALHO & PROPOSTA DE VALOR -->
        <!-- ========================================================================= -->
        <div class="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold tracking-wide uppercase mb-4 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Agendoou • Plataforma Multi-Nicho de Agendamento & Gestão</span>
          </div>

          <h1 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Planos transparentes que crescem com o seu negócio
          </h1>

          <p class="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Elimine as faltas (No-Show) com lembretes no WhatsApp, tenha seu próprio link de agendamento 24h e gerencie sua equipe sem burocracia. <strong>Comece hoje com 7 dias de teste grátis.</strong>
          </p>
        </div>

        <!-- ========================================================================= -->
        <!-- 1. SELETOR DE CICLO DE FATURAÇÃO (TOGGLE / TABS INTERATIVO) -->
        <!-- ========================================================================= -->
        <div class="flex flex-col items-center justify-center mb-10 sm:mb-12">
          <div
            role="tablist"
            aria-label="Seletor de ciclo de faturação"
            class="inline-grid grid-cols-3 p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/70 shadow-inner w-full max-w-md">

            <!-- Opção 1: Mensal -->
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="cicloSelecionado() === 'MENSAL'"
              (click)="selecionarCiclo('MENSAL')"
              [class.bg-white]="cicloSelecionado() === 'MENSAL'"
              [class.text-slate-900]="cicloSelecionado() === 'MENSAL'"
              [class.shadow-sm]="cicloSelecionado() === 'MENSAL'"
              [class.text-slate-600]="cicloSelecionado() !== 'MENSAL'"
              class="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center">
              <span>Mensal</span>
              <span class="text-[10px] font-medium text-slate-400 hidden sm:inline">Sem fidelidade</span>
            </button>

            <!-- Opção 2: Semestral (-10%) -->
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="cicloSelecionado() === 'SEMESTRAL'"
              (click)="selecionarCiclo('SEMESTRAL')"
              [class.bg-white]="cicloSelecionado() === 'SEMESTRAL'"
              [class.text-slate-900]="cicloSelecionado() === 'SEMESTRAL'"
              [class.shadow-sm]="cicloSelecionado() === 'SEMESTRAL'"
              [class.text-slate-600]="cicloSelecionado() !== 'SEMESTRAL'"
              class="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center relative">
              <div class="flex items-center gap-1">
                <span>Semestral</span>
              </div>
              <span class="text-[10px] font-extrabold text-emerald-600">-10% OFF</span>
            </button>

            <!-- Opção 3: Anual (2 Meses Grátis) -->
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="cicloSelecionado() === 'ANUAL'"
              (click)="selecionarCiclo('ANUAL')"
              [class.bg-slate-900]="cicloSelecionado() === 'ANUAL'"
              [class.text-white]="cicloSelecionado() === 'ANUAL'"
              [class.shadow-md]="cicloSelecionado() === 'ANUAL'"
              [class.text-slate-700]="cicloSelecionado() !== 'ANUAL'"
              class="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex flex-col items-center justify-center relative">
              <span>Anual</span>
              <span
                class="text-[10px] font-extrabold"
                [class.text-amber-300]="cicloSelecionado() === 'ANUAL'"
                [class.text-rose-600]="cicloSelecionado() !== 'ANUAL'">
                2 Meses Grátis
              </span>
            </button>

          </div>

          <!-- Sub-etiqueta Dinâmica de Economia -->
          <div class="mt-3 text-xs font-semibold flex items-center gap-1.5">
            @if (cicloSelecionado() === 'MENSAL') {
              <span class="text-slate-500">💡 Dica: Mude para o ciclo <strong>Semestral (-10%)</strong> ou <strong>Anual (2 meses grátis)</strong> para economizar.</span>
            } @else if (cicloSelecionado() === 'SEMESTRAL') {
              <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Economia de 10% ativada em todos os planos semestrais!
              </span>
            } @else {
              <span class="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                🔥 Maior Economia: Você ganha 2 meses inteiramente grátis no ciclo anual!
              </span>
            }
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 2. MATRIZ DE PLANOS (GRID RESPONSIVO: 1 COL MOBILE | 2-3 TABLET | 3 DESKTOP) -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">

          @for (plano of planos; track plano.id) {
            <div
              [class.border-2]="plano.destaque"
              [class.border-rose-500]="plano.destaque"
              [class.shadow-xl]="plano.destaque"
              [class.shadow-rose-100]="plano.destaque"
              [class.lg:-translate-y-2]="plano.destaque"
              [class.border]="!plano.destaque"
              [class.border-slate-200]="!plano.destaque"
              [class.shadow-sm]="!plano.destaque"
              [class.md:col-span-2]="plano.id === 'VIP'"
              [class.lg:col-span-1]="plano.id === 'VIP'"
              class="bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-200 hover:shadow-md">

              <!-- Etiqueta Superior (Plano Clínica Pro em Destaque) -->
              @if (plano.destaque && plano.etiquetaDestaque) {
                <div class=" -mt-10 sm:-mt-11 mb-4 flex justify-center">
                  <span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                    <span>★</span>
                    <span>{{ plano.etiquetaDestaque }}</span>
                  </span>
                </div>
              }

              <div>
                <!-- Cabeçalho do Card -->
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">
                      {{ plano.nome }}
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">
                      {{ plano.subtitulo }}
                    </p>
                  </div>

                  <!-- Pill de Economia do Ciclo -->
                  @if (cicloSelecionado() === 'SEMESTRAL') {
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold shrink-0">
                      -10% OFF
                    </span>
                  } @else if (cicloSelecionado() === 'ANUAL') {
                    <span class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold shrink-0">
                      2 Meses Grátis
                    </span>
                  }
                </div>

                <!-- Bloco de Preço Dinâmico -->
                <div class="my-5 p-4 rounded-xl border"
                     [class.bg-rose-50/50]="plano.destaque"
                     [class.border-rose-100]="plano.destaque"
                     [class.bg-slate-50]="!plano.destaque"
                     [class.border-slate-200/70]="!plano.destaque">

                  @if (cicloSelecionado() === 'MENSAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {{ formatarMoeda(plano.precoMensal) }}
                      </span>
                      <span class="text-xs font-semibold text-slate-500">/mês</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">
                      Cobrança mensal via PIX • Sem fidelidade
                    </p>
                  }

                  @if (cicloSelecionado() === 'SEMESTRAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {{ formatarMoeda(plano.precoSemestralMensalEq) }}
                      </span>
                      <span class="text-xs font-semibold text-slate-500">/mês*</span>
                    </div>
                    <div class="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span class="font-semibold text-slate-700">
                        Total: R$ {{ formatarMoeda(plano.precoSemestralTotal) }}/semestre
                      </span>
                      <span class="font-bold text-emerald-700">
                        Poupança de R$ {{ formatarMoeda(plano.poupancaSemestral) }} (10%)
                      </span>
                    </div>
                  }

                  @if (cicloSelecionado() === 'ANUAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {{ formatarMoeda(plano.precoAnualMensalEq) }}
                      </span>
                      <span class="text-xs font-semibold text-slate-500">/mês*</span>
                    </div>
                    <div class="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span class="font-semibold text-slate-700">
                        Total: R$ {{ formatarMoeda(plano.precoAnualTotal) }}/ano
                      </span>
                      <span class="font-bold text-rose-600">
                        Poupança de R$ {{ formatarMoeda(plano.poupancaAnual) }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Lista de Funcionalidades -->
                <div class="space-y-3 mb-6">
                  @if (plano.beneficiosBaseTexto) {
                    <div class="text-xs font-bold text-rose-600 uppercase tracking-wider">
                      {{ plano.beneficiosBaseTexto }}
                    </div>
                  } @else {
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Recursos incluídos:
                    </div>
                  }

                  <ul class="space-y-2.5 text-xs sm:text-sm text-slate-700">
                    @for (item of plano.funcionalidades; track item) {
                      <li class="flex items-start gap-2.5 leading-snug">
                        <span
                          class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                          [class.bg-rose-100]="plano.destaque"
                          [class.text-rose-600]="plano.destaque"
                          [class.bg-emerald-100]="!plano.destaque"
                          [class.text-emerald-700]="!plano.destaque">
                          ✓
                        </span>
                        <span>{{ item }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>

              <!-- Botão CTA Mobile-First (Altura mínima 48px >= 44px) -->
              <div class="pt-4 border-t border-slate-100">
                <a
                  routerLink="/parceiro/cadastro-lojista"
                  [queryParams]="{ plano: plano.id, ciclo: cicloSelecionado() }"
                  [class.bg-gradient-to-r]="plano.destaque"
                  [class.from-rose-600]="plano.destaque"
                  [class.to-rose-500]="plano.destaque"
                  [class.hover:from-rose-700]="plano.destaque"
                  [class.hover:to-rose-600]="plano.destaque"
                  [class.text-white]="plano.destaque"
                  [class.shadow-lg]="plano.destaque"
                  [class.shadow-rose-200]="plano.destaque"
                  [class.bg-slate-900]="!plano.destaque"
                  [class.hover:bg-slate-800]="!plano.destaque"
                  [class.text-white]="!plano.destaque"
                  class="w-full min-h-[48px] px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2">
                  <span>{{ plano.ctaTexto }}</span>
                  <span>→</span>
                </a>
                <span class="block text-center text-[11px] text-slate-400 mt-2">
                  🎁 Inclui 7 dias de teste grátis • Ativação imediata
                </span>
              </div>

            </div>
          }

        </div>

        <!-- ========================================================================= -->
        <!-- FAIXA DE GARANTIA & MULTI-NICHO -->
        <!-- ========================================================================= -->
        <div class="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="space-y-1 text-center md:text-left">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">
              🛡️ Adaptação Automática para 13 Setores
            </span>
            <h3 class="text-base sm:text-lg font-extrabold text-slate-900">
              Clínicas de Estética, Salões, Barbearias, Consultórios Médicos, Odontologia, Spas e mais
            </h3>
            <p class="text-xs sm:text-sm text-slate-500">
              Ao criar sua conta, o sistema configura automaticamente os serviços, nomenclaturas e horários do seu nicho em menos de 30 segundos.
            </p>
          </div>
          <a
            routerLink="/parceiro/cadastro-lojista"
            class="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm whitespace-nowrap transition-all shadow-sm flex items-center justify-center gap-2 shrink-0">
            <span>Criar Minha Plataforma Grátis</span>
            <span>↗</span>
          </a>
        </div>

      </div>
    </div>
  `
})
export class PlanosComponent {
  cicloSelecionado = signal<CicloFaturacao>('MENSAL');

  readonly planos: PlanoConfig[] = [
    {
      id: 'STARTER',
      nome: 'Studio / Starter',
      subtitulo: 'Ideal para profissionais autônomos e studios compactos',
      destaque: false,
      precoMensal: 89.90,
      precoSemestralTotal: 485.00,
      precoSemestralMensalEq: 80.83,
      poupancaSemestral: 54.40,
      precoAnualTotal: 899.00,
      precoAnualMensalEq: 74.91,
      poupancaAnual: 179.80,
      ctaTexto: 'Começar no Studio / Starter',
      funcionalidades: [
        'Domínio / Subdomínio próprio',
        'Suporte via WhatsApp',
        'Até 2 profissionais na agenda',
        'Link de Agendamento Online 24h (PWA)',
        'Cálculo automático de horários livres',
        'Prontuário e Histórico de Anamnese',
        'Prevenção transacional de conflitos'
      ]
    },
    {
      id: 'PRO',
      nome: 'Clínica Pro',
      subtitulo: 'Para clínicas e empresas que buscam zerar faltas e escalar',
      destaque: true,
      etiquetaDestaque: 'Mais Popular / Melhor Relação Custo-Benefício',
      precoMensal: 99.90,
      precoSemestralTotal: 539.00,
      precoSemestralMensalEq: 89.83,
      poupancaSemestral: 60.40,
      precoAnualTotal: 999.00,
      precoAnualMensalEq: 83.25,
      poupancaAnual: 199.80,
      ctaTexto: 'Testar o Clínica Pro Grátis',
      beneficiosBaseTexto: 'Tudo do Plano Studio +',
      funcionalidades: [
        'Domínio / Subdomínio próprio',
        'Suporte via WhatsApp',
        'Até 6 profissionais na agenda',
        'Lembretes automáticos via WhatsApp (confirmação e alerta 24h antes)',
        'Personalização completa com o logótipo da clínica',
        'Dashboard executivo de métricas e taxa de No-Show'
      ]
    },
    {
      id: 'VIP',
      nome: 'VIP / Multisalas',
      subtitulo: 'Para clínicas de grande porte, franquias e operações multisalas',
      destaque: false,
      precoMensal: 119.90,
      precoSemestralTotal: 647.00,
      precoSemestralMensalEq: 107.83,
      poupancaSemestral: 72.40,
      precoAnualTotal: 1199.00,
      precoAnualMensalEq: 99.91,
      poupancaAnual: 239.80,
      ctaTexto: 'Começar no VIP / Multisalas',
      beneficiosBaseTexto: 'Tudo do Plano Clínica Pro +',
      funcionalidades: [
        'Domínio / Subdomínio próprio',
        'Suporte prioritário via WhatsApp',
        'Profissionais e salas ilimitadas',
        'Campanhas de retorno no WhatsApp (reativação de clientes inativos)',
        'Gestão avançada de múltiplos acessos e comissões'
      ]
    }
  ];

  selecionarCiclo(ciclo: CicloFaturacao): void {
    this.cicloSelecionado.set(ciclo);
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
