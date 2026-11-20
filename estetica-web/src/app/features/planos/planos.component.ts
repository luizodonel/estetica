import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PlanoAssinatura, SuporteChamado } from '../../core/models';
import { PhoneMaskDirective } from '../../shared/directives/phone-mask.directive';
import { formatarTelefoneBR } from '../../shared/pipes/telefone.pipe';

export type CicloFaturacao = 'MENSAL' | 'SEMESTRAL' | 'ANUAL';
export type PlanoId = 'STARTER' | 'PRO' | 'VIP';
export type PlanoConfig = PlanoAssinatura;

const PLANOS_PADRAO: PlanoAssinatura[] = [
  {
    codigo: 'STARTER',
    nome: 'Studio / Starter',
    subtitulo: 'Ideal para profissionais autônomos e studios compactos',
    destaque: false,
    ctaTexto: 'Começar no Studio / Starter',
    funcionalidades: [
      'Domínio / Subdomínio próprio',
      'Suporte via WhatsApp',
      'Até 2 profissionais na agenda',
      'Link de Agendamento Online 24h (PWA)',
      'Cálculo automático de horários livres',
      'Prontuário e Histórico de Anamnese',
      'Prevenção transacional de conflitos'
    ],
    precoMensalOriginal: 89.90,
    precoMensalFinal: 89.90,
    descontoMensalValor: 0,
    descontoMensalPercentual: 0,
    precoSemestralOriginal: 485.00,
    precoSemestralFinal: 485.00,
    precoSemestralMensalEq: 80.83,
    poupancaSemestral: 54.40,
    descontoSemestralValor: 0,
    descontoSemestralPercentual: 0,
    precoAnualOriginal: 899.00,
    precoAnualFinal: 899.00,
    precoAnualMensalEq: 74.91,
    poupancaAnual: 179.80,
    descontoAnualValor: 0,
    descontoAnualPercentual: 0,
    promocional: false,
    percentualDesconto: 0,
    mensagemPromocao: null
  },
  {
    codigo: 'PRO',
    nome: 'Clínica Pro',
    subtitulo: 'Para clínicas e empresas que buscam zerar faltas e escalar',
    destaque: true,
    etiquetaDestaque: 'Mais Popular / Melhor Relação Custo-Benefício',
    beneficiosBaseTexto: 'Tudo do Plano Studio +',
    ctaTexto: 'Testar o Clínica Pro Grátis',
    funcionalidades: [
      'Domínio / Subdomínio próprio',
      'Suporte via WhatsApp',
      'Até 6 profissionais na agenda',
      'Lembretes automáticos via WhatsApp (confirmação e alerta 24h antes)',
      'Personalização completa com o logótipo da clínica',
      'Dashboard executivo de métricas e taxa de No-Show'
    ],
    precoMensalOriginal: 99.90,
    precoMensalFinal: 99.90,
    descontoMensalValor: 0,
    descontoMensalPercentual: 0,
    precoSemestralOriginal: 539.00,
    precoSemestralFinal: 539.00,
    precoSemestralMensalEq: 89.83,
    poupancaSemestral: 60.40,
    descontoSemestralValor: 0,
    descontoSemestralPercentual: 0,
    precoAnualOriginal: 999.00,
    precoAnualFinal: 999.00,
    precoAnualMensalEq: 83.25,
    poupancaAnual: 199.80,
    descontoAnualValor: 0,
    descontoAnualPercentual: 0,
    promocional: false,
    percentualDesconto: 0,
    mensagemPromocao: null
  },
  {
    codigo: 'VIP',
    nome: 'VIP / Multisalas',
    subtitulo: 'Para clínicas de grande porte, franquias e operações multisalas',
    destaque: false,
    beneficiosBaseTexto: 'Tudo do Plano Clínica Pro +',
    ctaTexto: 'Começar no VIP / Multisalas',
    funcionalidades: [
      'Domínio / Subdomínio próprio',
      'Suporte prioritário via WhatsApp',
      'Profissionais e salas ilimitadas',
      'Campanhas de retorno no WhatsApp (reativação de clientes inativos)',
      'Gestão avançada de múltiplos acessos e comissões'
    ],
    precoMensalOriginal: 119.90,
    precoMensalFinal: 119.90,
    descontoMensalValor: 0,
    descontoMensalPercentual: 0,
    precoSemestralOriginal: 647.00,
    precoSemestralFinal: 647.00,
    precoSemestralMensalEq: 107.83,
    poupancaSemestral: 72.40,
    descontoSemestralValor: 0,
    descontoSemestralPercentual: 0,
    precoAnualOriginal: 1199.00,
    precoAnualFinal: 1199.00,
    precoAnualMensalEq: 99.91,
    poupancaAnual: 239.80,
    descontoAnualValor: 0,
    descontoAnualPercentual: 0,
    promocional: false,
    percentualDesconto: 0,
    mensagemPromocao: null
  }
];

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PhoneMaskDirective],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-7xl mx-auto">

        <!-- ========================================================================= -->
        <!-- CABEÇALHO & PROPOSTA DE VALOR -->
        <!-- ========================================================================= -->
        <div class="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div class="mb-5 flex justify-center">
            <img
              src="/logo-agendoou.png"
              alt="Agendoou — Agendou, vendeu, lucrou. Sua empresa no piloto automático."
              class="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" />
          </div>

          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Agendou, vendeu, lucrou • Sua empresa no piloto automático</span>
          </div>

          <h1 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Planos transparentes que crescem com o seu negócio
          </h1>

          <p class="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Elimine as faltas (No-Show) com lembretes no WhatsApp, tenha seu próprio link de agendamento 24h e gerencie sua equipe sem burocracia. <strong>Comece hoje com 7 dias de teste grátis.</strong>
          </p>

          <!-- Botão único de Suporte & Dúvidas direto no WhatsApp -->
          <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              (click)="abrirModalSuporte()"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-900 text-slate-800 font-bold text-xs shadow-sm transition-all cursor-pointer">
              <span>💬</span>
              <span>Suporte & Dúvidas (Resposta no WhatsApp)</span>
            </button>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- BANNER GLOBAL DE PROMOÇÃO ATIVA -->
        <!-- ========================================================================= -->
        @if (bannerPromocao(); as promo) {
          <div class="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-3 text-center sm:text-left">
              <span class="text-2xl sm:text-3xl shrink-0">🔥</span>
              <div>
                <p class="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                  Promoção Ativa: até {{ formatarPct(promo.maiorPct) }} de desconto nos planos!
                </p>
                @if (promo.mensagem) {
                  <p class="text-xs text-rose-50 font-medium mt-0.5">{{ promo.mensagem }}</p>
                }
              </div>
            </div>
            <span class="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur text-xs font-extrabold whitespace-nowrap">
              Economia de até R$ {{ formatarMoeda(promo.maiorDescontoValor) }}
            </span>
          </div>
        }

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
                ✓ Economia ativada em todos os planos semestrais!
              </span>
            } @else {
              <span class="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                🔥 Maior Economia: Você ganha desconto extra no ciclo anual!
              </span>
            }
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 2. MATRIZ DE PLANOS (GRID RESPONSIVO: 1 COL MOBILE | 2-3 TABLET | 3 DESKTOP) -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">

          @for (plano of planos(); track plano.codigo) {
            <div
              [class.border-2]="plano.destaque || temPromocaoNoCiclo(plano)"
              [class.border-rose-500]="plano.destaque || (!plano.destaque && temPromocaoNoCiclo(plano))"
              [class.shadow-xl]="plano.destaque"
              [class.shadow-rose-100]="plano.destaque"
              [class.lg:-translate-y-2]="plano.destaque"
              [class.border]="!plano.destaque && !temPromocaoNoCiclo(plano)"
              [class.border-slate-200]="!plano.destaque && !temPromocaoNoCiclo(plano)"
              [class.shadow-sm]="!plano.destaque"
              [class.md:col-span-2]="plano.codigo === 'VIP'"
              [class.lg:col-span-1]="plano.codigo === 'VIP'"
              class="bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-200 hover:shadow-md">

              <!-- Etiqueta Superior (Plano Clínica Pro em Destaque) -->
              @if (plano.destaque && plano.etiquetaDestaque) {
                <div class="-mt-10 sm:-mt-11 mb-4 flex justify-center">
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

                  <!-- Pill de Economia ou Promoção -->
                  @if (temPromocaoNoCiclo(plano)) {
                    <span class="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-extrabold shrink-0 shadow-sm animate-pulse">
                      🔥 Promoção {{ formatarPct(obterDescontoPctCiclo(plano)) }} OFF
                    </span>
                  } @else if (cicloSelecionado() === 'SEMESTRAL') {
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
                     [class.bg-rose-50/60]="plano.destaque || temPromocaoNoCiclo(plano)"
                     [class.border-rose-200]="plano.destaque || temPromocaoNoCiclo(plano)"
                     [class.bg-slate-50]="!plano.destaque && !temPromocaoNoCiclo(plano)"
                     [class.border-slate-200/70]="!plano.destaque && !temPromocaoNoCiclo(plano)">

                  @if (temPromocaoNoCiclo(plano)) {
                    <div class="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span>De <span class="line-through font-semibold">R$ {{ formatarMoeda(obterOriginalCiclo(plano)) }}</span></span>
                    </div>
                  }

                  @if (cicloSelecionado() === 'MENSAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {{ formatarMoeda(plano.precoMensalFinal) }}
                      </span>
                      <span class="text-xs font-semibold text-slate-500">/mês</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-1">
                      Cobrança mensal via PIX ou Cartão • Sem fidelidade
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
                        Total: R$ {{ formatarMoeda(plano.precoSemestralFinal) }}/semestre
                      </span>
                      @if (plano.poupancaSemestral > 0) {
                        <span class="font-bold text-emerald-700">
                          Poupança de R$ {{ formatarMoeda(plano.poupancaSemestral) }}
                        </span>
                      }
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
                        Total: R$ {{ formatarMoeda(plano.precoAnualFinal) }}/ano
                      </span>
                      @if (plano.poupancaAnual > 0) {
                        <span class="font-bold text-rose-600">
                          Poupança de R$ {{ formatarMoeda(plano.poupancaAnual) }}
                        </span>
                      }
                    </div>
                  }

                  <!-- Mensagem Explícita de Promoção e Valor do Desconto -->
                  @if (temPromocaoNoCiclo(plano)) {
                    <div class="mt-3 p-2.5 rounded-lg bg-rose-600 text-white text-[11px] font-extrabold flex flex-col gap-0.5 shadow-sm">
                      <span>
                        🔥 Promoção de {{ formatarPct(obterDescontoPctCiclo(plano)) }} • Desconto de R$ {{ formatarMoeda(obterDescontoValorCiclo(plano)) }}
                      </span>
                      @if (plano.mensagemPromocao) {
                        <span class="text-[10px] font-semibold text-rose-100">
                          {{ plano.mensagemPromocao }}
                        </span>
                      }
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
                  [queryParams]="{ plano: plano.codigo, ciclo: cicloSelecionado() }"
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
                  <span>{{ plano.ctaTexto || ('Começar no ' + plano.nome) }}</span>
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

        <!-- ========================================================================= -->
        <!-- CENTRAL DEDICADA DE SUPORTE & DÚVIDAS (ENVIO DIRETO -> WHATSAPP) -->
        <!-- ========================================================================= -->
        <div class="mt-6 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="space-y-1 text-center md:text-left">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">
              💬 Atendimento Direto Agendoou
            </span>
            <h3 class="text-lg sm:text-xl font-extrabold">
              Ficou com alguma dúvida sobre os planos, pagamento ou funcionamento?
            </h3>
            <p class="text-xs sm:text-sm text-slate-300">
              Envie sua dúvida agora mesmo — nossa equipe analisa e responde diretamente no seu WhatsApp.
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              (click)="abrirModalSuporte()"
              class="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all cursor-pointer">
              ✉️ Tirar Dúvida pelo WhatsApp
            </button>
          </div>
        </div>

      </div>

      <!-- Botão Flutuante de Suporte & Dúvidas -->
      <button
        type="button"
        (click)="abrirModalSuporte()"
        class="fixed bottom-5 right-5 z-40 px-4 py-3 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xl border border-slate-700 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer">
        <span class="text-base">💬</span>
        <span>Suporte & Dúvidas</span>
      </button>

      <!-- ========================================================================= -->
      <!-- MODAL DE ENVIO DE DÚVIDA PARA VISITANTES (RESPOSTA DIRETA NO WHATSAPP) -->
      <!-- ========================================================================= -->
      @if (modalSuporteAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <!-- Cabeçalho Modal -->
            <div class="px-6 py-4 bg-slate-950 text-white flex items-center justify-between gap-3 shrink-0">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Atendimento Comercial & Suporte Agendoou
                </span>
                <h3 class="text-lg font-extrabold">Enviar Dúvida (Resposta via WhatsApp)</h3>
              </div>
              <button
                type="button"
                (click)="fecharModalSuporte()"
                class="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <!-- Corpo Scrollável -->
            <div class="p-6 overflow-y-auto flex-1 space-y-4">
              @if (erroSuporte()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {{ erroSuporte() }}
                </div>
              }

              @if (chamadoEnviado(); as ch) {
                <div class="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mx-auto">
                    ✓
                  </div>
                  <span class="inline-block px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold">
                    Protocolo {{ ch.protocolo }}
                  </span>
                  <h4 class="text-base font-extrabold text-slate-900">
                    Dúvida enviada com sucesso!
                  </h4>
                  <p class="text-xs text-emerald-900 leading-relaxed">
                    Nossa equipe já recebeu sua mensagem e enviará a resposta diretamente para o WhatsApp
                    <strong>{{ formatarTelefone(ch.whatsapp) }}</strong>.
                  </p>
                  <div class="pt-3 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      (click)="novaDuvidaVisitante()"
                      class="px-4 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-100 cursor-pointer">
                      Enviar outra dúvida
                    </button>
                    <button
                      type="button"
                      (click)="fecharModalSuporte()"
                      class="px-5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer">
                      Fechar
                    </button>
                  </div>
                </div>
              } @else {
                <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs">
                  Preencha seus dados abaixo. Caso ainda não seja lojista cadastrado, você receberá o retorno da nossa equipe diretamente no seu <strong>WhatsApp</strong>.
                </div>

                <form (ngSubmit)="enviarDuvida()" class="space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">Seu Nome *</label>
                      <input
                        type="text"
                        [(ngModel)]="formDuvida.nome"
                        name="supNome"
                        required
                        maxlength="100"
                        placeholder="Ex: Maria Silva"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">WhatsApp com DDD *</label>
                      <input
                        type="tel"
                        appPhoneMask
                        [(ngModel)]="formDuvida.whatsapp"
                        (input)="aoDigitarWhatsapp($event)"
                        name="supWhatsApp"
                        required
                        maxlength="15"
                        inputmode="numeric"
                        placeholder="(11) 99999-8888"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">E-mail (opcional)</label>
                      <input
                        type="email"
                        [(ngModel)]="formDuvida.email"
                        name="supEmail"
                        maxlength="140"
                        placeholder="seu@email.com"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">Empresa / Clínica (opcional)</label>
                      <input
                        type="text"
                        [(ngModel)]="formDuvida.nomeEmpresa"
                        name="supEmpresa"
                        maxlength="120"
                        placeholder="Nome do seu negócio"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                      <select
                        [(ngModel)]="formDuvida.categoria"
                        name="supCategoria"
                        class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
                        <option value="PLANOS">Planos & Promoções</option>
                        <option value="DUVIDA">Dúvida Geral</option>
                        <option value="PAGAMENTO">Pagamento PIX/Cartão</option>
                        <option value="SUPORTE">Suporte Técnico</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block text-xs font-bold text-slate-700 mb-1">Assunto *</label>
                      <input
                        type="text"
                        [(ngModel)]="formDuvida.assunto"
                        name="supAssunto"
                        required
                        maxlength="120"
                        placeholder="Ex: Dúvida sobre o plano Clínica Pro"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="block text-xs font-bold text-slate-700">Escreva sua dúvida ou mensagem *</label>
                      <span class="text-[10px] text-slate-400">{{ formDuvida.mensagem.length }}/1500</span>
                    </div>
                    <textarea
                      rows="4"
                      [(ngModel)]="formDuvida.mensagem"
                      name="supMensagem"
                      required
                      maxlength="1500"
                      placeholder="Conte como podemos ajudar você..."
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"></textarea>
                  </div>

                  <div class="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      (click)="fecharModalSuporte()"
                      class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer">
                      Fechar
                    </button>
                    <button
                      type="submit"
                      [disabled]="enviandoDuvida()"
                      class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50">
                      {{ enviandoDuvida() ? 'Enviando...' : 'Enviar Dúvida' }}
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PlanosComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  cicloSelecionado = signal<CicloFaturacao>('MENSAL');
  planos = signal<PlanoAssinatura[]>(PLANOS_PADRAO);

  modalSuporteAberto = signal<boolean>(false);
  enviandoDuvida = signal<boolean>(false);
  erroSuporte = signal<string | null>(null);
  chamadoEnviado = signal<SuporteChamado | null>(null);

  formDuvida = {
    nome: '',
    whatsapp: '',
    email: '',
    nomeEmpresa: '',
    categoria: 'PLANOS',
    assunto: '',
    mensagem: ''
  };

  bannerPromocao = computed(() => {
    const lista = this.planos();
    let maiorPct = 0;
    let maiorDescontoValor = 0;
    let mensagem: string | null = null;
    for (const p of lista) {
      if (this.temPromocaoNoCiclo(p)) {
        const pct = this.obterDescontoPctCiclo(p);
        const val = this.obterDescontoValorCiclo(p);
        if (pct > maiorPct) maiorPct = pct;
        if (val > maiorDescontoValor) maiorDescontoValor = val;
        if (!mensagem && p.mensagemPromocao) mensagem = p.mensagemPromocao;
      }
    }
    return maiorPct > 0 ? { maiorPct, maiorDescontoValor, mensagem } : null;
  });

  ngOnInit(): void {
    this.carregarPlanos();

    this.route.queryParams.subscribe(params => {
      if (params['suporte'] === '1') {
        this.abrirModalSuporte();
      }
    });
  }

  carregarPlanos(): void {
    this.api.getPlanosPublicos().subscribe({
      next: (lista) => {
        if (Array.isArray(lista) && lista.length > 0) {
          this.planos.set(lista);
        }
      },
      error: () => {}
    });
  }

  selecionarCiclo(ciclo: CicloFaturacao): void {
    this.cicloSelecionado.set(ciclo);
  }

  temPromocaoNoCiclo(plano: PlanoAssinatura): boolean {
    return plano.promocional && this.obterDescontoValorCiclo(plano) > 0;
  }

  obterOriginalCiclo(plano: PlanoAssinatura): number {
    const c = this.cicloSelecionado();
    if (c === 'SEMESTRAL') return Number(plano.precoSemestralOriginal || 0);
    if (c === 'ANUAL') return Number(plano.precoAnualOriginal || 0);
    return Number(plano.precoMensalOriginal || 0);
  }

  obterDescontoValorCiclo(plano: PlanoAssinatura): number {
    const c = this.cicloSelecionado();
    if (c === 'SEMESTRAL') return Number(plano.descontoSemestralValor || 0);
    if (c === 'ANUAL') return Number(plano.descontoAnualValor || 0);
    return Number(plano.descontoMensalValor || 0);
  }

  obterDescontoPctCiclo(plano: PlanoAssinatura): number {
    const c = this.cicloSelecionado();
    if (c === 'SEMESTRAL') return Number(plano.descontoSemestralPercentual || 0);
    if (c === 'ANUAL') return Number(plano.descontoAnualPercentual || 0);
    return Number(plano.descontoMensalPercentual || 0);
  }

  formatarMoeda(valor: number): string {
    return Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatarPct(pct: number): string {
    const n = Math.round((Number(pct || 0) + Number.EPSILON) * 10) / 10;
    return `${Number.isInteger(n) ? n : n.toFixed(1).replace('.', ',')}%`;
  }

  formatarTelefone(tel: string | null | undefined): string {
    return formatarTelefoneBR(tel);
  }

  aoDigitarWhatsapp(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatado = formatarTelefoneBR(input.value);
    input.value = formatado;
    this.formDuvida.whatsapp = formatado;
  }

  abrirModalSuporte(): void {
    this.erroSuporte.set(null);
    this.modalSuporteAberto.set(true);
  }

  fecharModalSuporte(): void {
    this.modalSuporteAberto.set(false);
  }

  novaDuvidaVisitante(): void {
    this.chamadoEnviado.set(null);
    this.erroSuporte.set(null);
    this.formDuvida.assunto = '';
    this.formDuvida.mensagem = '';
  }

  enviarDuvida(): void {
    const nome = this.formDuvida.nome.trim();
    const digits = this.formDuvida.whatsapp.replace(/\D/g, '');
    const email = this.formDuvida.email.trim();
    const assunto = this.formDuvida.assunto.trim();
    const mensagem = this.formDuvida.mensagem.trim();

    if (nome.length < 2) {
      this.erroSuporte.set('Informe seu nome completo (mínimo 2 caracteres).');
      return;
    }
    if (digits.length < 10 || digits.length > 11 || new Set(digits.split('')).size <= 1) {
      this.erroSuporte.set('Informe um WhatsApp válido com DDD, ex: (11) 99999-8888.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.erroSuporte.set('Informe um e-mail válido ou deixe o campo em branco.');
      return;
    }
    if (assunto.length < 3) {
      this.erroSuporte.set('Informe o assunto da sua dúvida (mínimo 3 caracteres).');
      return;
    }
    if (mensagem.length < 5) {
      this.erroSuporte.set('Descreva sua dúvida com pelo menos 5 caracteres.');
      return;
    }

    this.enviandoDuvida.set(true);
    this.erroSuporte.set(null);

    this.api.criarChamadoSuporte({
      nome,
      whatsapp: digits,
      email: email || undefined,
      nomeEmpresa: this.formDuvida.nomeEmpresa.trim() || undefined,
      categoria: this.formDuvida.categoria,
      assunto,
      mensagem,
      origem: 'PLANOS'
    }).subscribe({
      next: (ch) => {
        this.enviandoDuvida.set(false);
        this.chamadoEnviado.set(ch);
      },
      error: (err) => {
        this.enviandoDuvida.set(false);
        this.erroSuporte.set(err?.error?.detail || err?.error?.message || 'Erro ao enviar dúvida. Tente novamente.');
      }
    });
  }
}
