import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AssinaturaStatusResponse, BeneficioAtivo, PlanoAssinatura, ValidarCupomResponse } from '../../../core/models';
import { CicloFaturacao, PlanoId } from '../../planos/planos.component';

const PLANOS_PADRAO_ADMIN: PlanoAssinatura[] = [
  {
    codigo: 'STARTER',
    nome: 'Studio / Starter',
    subtitulo: 'Ideal para profissionais autônomos e studios compactos',
    destaque: false,
    ctaTexto: 'Escolher Studio / Starter',
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
    subtitulo: 'Foco de vendas • Melhor custo-benefício',
    destaque: true,
    etiquetaDestaque: 'Mais Popular / Melhor Relação Custo-Benefício',
    beneficiosBaseTexto: 'Tudo do Plano Studio +',
    ctaTexto: 'Escolher Clínica Pro',
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
    subtitulo: 'Para clínicas maiores e operações multisalas',
    destaque: false,
    beneficiosBaseTexto: 'Tudo do Plano Clínica Pro +',
    ctaTexto: 'Escolher VIP / Multisalas',
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

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function mesesDoCiclo(ciclo?: string | null): number {
  if (ciclo === 'ANUAL') return 12;
  if (ciclo === 'SEMESTRAL') return 6;
  return 1;
}

@Component({
  selector: 'app-admin-assinatura',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-6xl mx-auto space-y-8">

        <!-- Top Navigation / Back -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <a routerLink="/admin/dashboard" class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <span>←</span> Voltar para o Dashboard
          </a>
          <div class="flex items-center gap-2">
            <a
              routerLink="/admin/suporte"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              💬 Suporte / Dúvidas
            </a>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-sm">
              💎 Gestão de Plano & Assinatura Agendoou
            </span>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- CARD DE STATUS ATUAL DA ASSINATURA -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span class="text-[11px] font-bold tracking-wider text-rose-600 uppercase">
                Sua Conta & Licenciamento
              </span>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Planos & Renovação de Assinatura
              </h1>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Estabelecimento: <strong class="text-slate-800">{{ dados()?.nomeEmpresa || tenantService.nomeEmpresa() }}</strong>
              </p>
            </div>

            <button
              type="button"
              (click)="carregarStatus()"
              [disabled]="carregando()"
              class="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50">
              <span [class.animate-spin]="carregando()">🔄</span> Atualizar Status
            </button>
          </div>

          @if (dados(); as sub) {
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

              <!-- Indicador 1: Status -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Status Atual</span>
                <div class="mt-2">
                  @if (sub.status === 'ATIVA') {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Ativa & Em Dia
                    </span>
                  } @else if (sub.status === 'TRIAL') {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Teste Grátis ({{ sub.diasRestantes ?? 7 }} dias)
                    </span>
                  } @else if (sub.status === 'VENCENDO') {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Renovação Disponível
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <span class="w-2 h-2 rounded-full bg-rose-500"></span> Assinatura Vencida
                    </span>
                  }
                </div>
              </div>

              <!-- Indicador 2: Próximo Vencimento -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Válido Até</span>
                <div class="mt-1 text-lg font-extrabold text-slate-900">
                  {{ formatarData(sub.dataVencimento) }}
                </div>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  @if (sub.vencida) {
                    <span class="text-rose-600 font-semibold">Vencida há {{ (sub.diasRestantes || 0) * -1 }} dia(s)</span>
                  } @else {
                    Restam <strong>{{ sub.diasRestantes ?? 0 }} dia(s)</strong> (acumulativos ao renovar)
                  }
                </p>
              </div>

              <!-- Indicador 3: Plano Selecionado -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Plano Selecionado</span>
                <div class="mt-1 text-lg font-extrabold text-slate-900">
                  {{ planoSelecionadoObj().nome }} ({{ labelCicloAtual() }})
                </div>
                <p class="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  R$ {{ formatarMoeda(valorTotalSelecionado()) }} via PIX ou Cartão de Crédito
                  @if (cupomAplicaNoCard(planoSelecionadoObj().codigo) && cupomAplicado(); as c) {
                    <span class="block text-emerald-700 font-bold mt-0.5">
                      🎟️ Cupom {{ c.codigo }} aplicado • Desconto por {{ c.duracaoMeses }} {{ c.duracaoMeses === 1 ? 'mês' : 'meses' }}
                    </span>
                  } @else if (beneficioAplicaNoCard(planoSelecionadoObj().codigo) && sub.beneficioAtivo; as ben) {
                    <span class="block text-emerald-700 font-bold mt-0.5">
                      🔒 Desconto garantido ({{ ben.mesesRestantes }}/{{ ben.mesesTotais }} meses restantes)
                    </span>
                  } @else if (temPromocaoNoCiclo(planoSelecionadoObj())) {
                    <span class="block text-rose-600 font-bold mt-0.5">
                      🔥 Promoção de {{ formatarPct(obterDescontoPctCiclo(planoSelecionadoObj())) }} • Desconto de R$ {{ formatarMoeda(obterDescontoValorCiclo(planoSelecionadoObj())) }}
                      @if (planoSelecionadoObj().descricaoDuracaoPromocao) {
                        <span> • {{ planoSelecionadoObj().descricaoDuracaoPromocao }}</span>
                      }
                    </span>
                  }
                </p>
              </div>

            </div>

            <!-- Banner de Benefício Promocional Travado na Conta -->
            @if (sub.beneficioAtivo; as ben) {
              @if (ben.mesesRestantes > 0) {
                <div class="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <span class="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      🔒 Benefício Promocional Garantido ({{ ben.origem === 'CUPOM' ? 'Cupom' : 'Campanha' }})
                    </span>
                    <p class="text-xs sm:text-sm font-extrabold text-emerald-950">
                      {{ ben.descricao || ben.codigo || 'Condição especial ativa na sua assinatura' }}
                    </p>
                    <p class="text-[11px] text-emerald-800">
                      Mesmo se a campanha for encerrada, seu desconto segue garantido para o plano <strong>{{ ben.planoCodigo }}</strong> ({{ ben.ciclo }}). Após o término dos meses restantes, a renovação volta ao valor normal do plano.
                    </p>
                  </div>
                  <div class="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-center shrink-0">
                    <span class="text-[10px] font-bold uppercase text-emerald-700 block">Meses Garantidos</span>
                    <strong class="text-lg font-extrabold text-emerald-900">
                      Restam {{ ben.mesesRestantes }} de {{ ben.mesesTotais }}
                    </strong>
                  </div>
                </div>
              }
            }
          }
        </div>

        <!-- ========================================================================= -->
        <!-- BANNER GLOBAL DE PROMOÇÃO ATIVA -->
        <!-- ========================================================================= -->
        @if (bannerPromocao(); as promo) {
          <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-3 text-center sm:text-left">
              <span class="text-2xl shrink-0">🔥</span>
              <div>
                <p class="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                  Promoção Ativa para Assinatura: até {{ formatarPct(promo.maiorPct) }} OFF!
                </p>
                @if (promo.mensagem) {
                  <p class="text-xs text-rose-50 font-medium mt-0.5">{{ promo.mensagem }}</p>
                }
              </div>
            </div>
            <span class="px-3.5 py-1.5 rounded-full bg-white/20 text-xs font-extrabold whitespace-nowrap">
              Desconto de até R$ {{ formatarMoeda(promo.maiorDescontoValor) }}
            </span>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- CUPOM DE DESCONTO -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-3">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                🎟️ Possui um Cupom de Desconto?
              </span>
              <h3 class="text-sm sm:text-base font-extrabold text-slate-900">
                Digite seu código promocional para aplicar na renovação ou contratação
              </h3>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Cupons têm valor e quantidade de participantes definidos pelo administrador (não cumulativos com outras promoções).
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                [ngModel]="cupomInput()"
                (ngModelChange)="cupomInput.set(($event || '').toUpperCase().trim())"
                (keyup.enter)="aplicarCupom()"
                placeholder="Ex: BLACK40"
                maxlength="40"
                class="flex-1 md:w-52 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-extrabold uppercase tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                (click)="aplicarCupom()"
                [disabled]="validandoCupom() || !cupomInput()"
                class="min-h-[40px] px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50">
                {{ validandoCupom() ? 'Validando...' : 'Aplicar Cupom' }}
              </button>
              @if (cupomAplicado()?.valido) {
                <button
                  type="button"
                  (click)="removerCupom()"
                  class="min-h-[40px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer">
                  Remover
                </button>
              }
            </div>
          </div>

          @if (erroCupom()) {
            <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              ⚠️ {{ erroCupom() }}
            </div>
          }

          @if (cupomAplicado(); as cup) {
            @if (cup.valido) {
              <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong class="font-extrabold">✓ Cupom {{ cup.codigo }} ativo!</strong>
                  <span class="ml-1.5">{{ cup.descricao || 'Desconto especial aplicado sobre o valor padrão.' }}</span>
                  <span class="block text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Duração garantida: {{ cup.duracaoMeses }} {{ cup.duracaoMeses === 1 ? 'mês' : 'meses' }}
                    @if (cup.limiteUsos && cup.usosRestantes !== null && cup.usosRestantes !== undefined) {
                      • Restam {{ cup.usosRestantes }} de {{ cup.limiteUsos }} cupons participantes
                    }
                  </span>
                </div>
                <span class="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[11px]">
                  Economia de R$ {{ formatarMoeda(cup.valorDescontoAplicado || 0) }} no ciclo atual
                </span>
              </div>
            }
          }

          @if (erroCheckout()) {
            <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              ⚠️ {{ erroCheckout() }}
            </div>
          }
        </div>

        <!-- ========================================================================= -->
        <!-- 1. SELETOR DE CICLO DE FATURAÇÃO (MENSAL | SEMESTRAL | ANUAL) -->
        <!-- ========================================================================= -->
        <div class="text-center space-y-3">
          <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">
            Escolha o Plano e a Periodicidade Ideal
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Ao ativar ou renovar antecipadamente, <strong>os seus dias atuais restantes são preservados e somados</strong> integralmente ao novo período contratado.
          </p>

          <div class="pt-2 flex flex-col items-center justify-center">
            <div
              role="tablist"
              aria-label="Seletor de ciclo de faturação"
              class="inline-grid grid-cols-3 p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/70 shadow-inner w-full max-w-md">

              <button
                type="button"
                (click)="selecionarCiclo('MENSAL')"
                [class.bg-white]="cicloSelecionado() === 'MENSAL'"
                [class.text-slate-900]="cicloSelecionado() === 'MENSAL'"
                [class.shadow-sm]="cicloSelecionado() === 'MENSAL'"
                [class.text-slate-600]="cicloSelecionado() !== 'MENSAL'"
                class="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center">
                <span>Mensal</span>
                <span class="text-[10px] font-medium text-slate-400 hidden sm:inline">Preço base</span>
              </button>

              <button
                type="button"
                (click)="selecionarCiclo('SEMESTRAL')"
                [class.bg-white]="cicloSelecionado() === 'SEMESTRAL'"
                [class.text-slate-900]="cicloSelecionado() === 'SEMESTRAL'"
                [class.shadow-sm]="cicloSelecionado() === 'SEMESTRAL'"
                [class.text-slate-600]="cicloSelecionado() !== 'SEMESTRAL'"
                class="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center">
                <span>Semestral</span>
                <span class="text-[10px] font-extrabold text-emerald-600">-10% OFF</span>
              </button>

              <button
                type="button"
                (click)="selecionarCiclo('ANUAL')"
                [class.bg-slate-900]="cicloSelecionado() === 'ANUAL'"
                [class.text-white]="cicloSelecionado() === 'ANUAL'"
                [class.shadow-md]="cicloSelecionado() === 'ANUAL'"
                [class.text-slate-700]="cicloSelecionado() !== 'ANUAL'"
                class="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center">
                <span>Anual</span>
                <span
                  class="text-[10px] font-extrabold"
                  [class.text-amber-300]="cicloSelecionado() === 'ANUAL'"
                  [class.text-rose-600]="cicloSelecionado() !== 'ANUAL'">
                  2 Meses Grátis
                </span>
              </button>

            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 2. MATRIZ DE PLANOS DINÂMICA -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">

          @for (plano of planos(); track plano.codigo) {
            <div
              (click)="selecionarPlano(plano.codigo)"
              [class.border-2]="plano.destaque || planoSelecionado() === plano.codigo || temPromocaoNoCiclo(plano) || cupomAplicaNoCard(plano.codigo)"
              [class.border-emerald-600]="cupomAplicaNoCard(plano.codigo) || beneficioAplicaNoCard(plano.codigo)"
              [class.border-rose-500]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && (plano.destaque || temPromocaoNoCiclo(plano))"
              [class.border-slate-900]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && !plano.destaque && !temPromocaoNoCiclo(plano) && planoSelecionado() === plano.codigo"
              [class.shadow-lg]="plano.destaque || planoSelecionado() === plano.codigo"
              [class.border]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && !plano.destaque && !temPromocaoNoCiclo(plano) && planoSelecionado() !== plano.codigo"
              [class.border-slate-200]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && !plano.destaque && !temPromocaoNoCiclo(plano) && planoSelecionado() !== plano.codigo"
              [class.md:col-span-2]="plano.codigo === 'VIP'"
              [class.lg:col-span-1]="plano.codigo === 'VIP'"
              class="bg-white rounded-2xl p-6 flex flex-col justify-between relative transition-all cursor-pointer hover:shadow-md">

              @if (plano.destaque && plano.etiquetaDestaque) {
                <div class="-mt-9 mb-3 flex justify-center">
                  <span class="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                    ★ {{ plano.etiquetaDestaque }}
                  </span>
                </div>
              }

              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 class="text-lg font-extrabold text-slate-900">{{ plano.nome }}</h3>
                    <p class="text-xs text-slate-500">{{ plano.subtitulo }}</p>
                  </div>
                  @if (cupomAplicaNoCard(plano.codigo) && cupomAplicado(); as cup) {
                    <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold shrink-0">
                      🎟️ {{ cup.codigo }}
                    </span>
                  } @else if (beneficioAplicaNoCard(plano.codigo)) {
                    <span class="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-extrabold shrink-0">
                      🔒 Garantido
                    </span>
                  } @else if (temPromocaoNoCiclo(plano)) {
                    <span class="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold shrink-0 animate-pulse">
                      🔥 Promoção {{ formatarPct(obterDescontoPctCiclo(plano)) }} OFF
                    </span>
                  } @else if (cicloSelecionado() === 'SEMESTRAL') {
                    <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold shrink-0">
                      -10% OFF
                    </span>
                  } @else if (cicloSelecionado() === 'ANUAL') {
                    <span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold shrink-0">
                      2 Meses Grátis
                    </span>
                  }
                </div>

                <!-- Valores Calculados por Ciclo -->
                <div class="my-4 p-3.5 rounded-xl border"
                     [class.bg-emerald-50/70]="cupomAplicaNoCard(plano.codigo) || beneficioAplicaNoCard(plano.codigo)"
                     [class.border-emerald-200]="cupomAplicaNoCard(plano.codigo) || beneficioAplicaNoCard(plano.codigo)"
                     [class.bg-rose-50/50]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && (plano.destaque || temPromocaoNoCiclo(plano))"
                     [class.border-rose-200]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && (plano.destaque || temPromocaoNoCiclo(plano))"
                     [class.bg-slate-50]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && !plano.destaque && !temPromocaoNoCiclo(plano)"
                     [class.border-slate-200/70]="!cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo) && !plano.destaque && !temPromocaoNoCiclo(plano)">

                  @if (cupomAplicaNoCard(plano.codigo) || beneficioAplicaNoCard(plano.codigo) || temPromocaoNoCiclo(plano)) {
                    @if (obterOriginalCiclo(plano) > obterTotalPlano(plano)) {
                      <p class="text-[11px] text-slate-500 mb-0.5">
                        De <span class="line-through font-semibold">R$ {{ formatarMoeda(obterOriginalCiclo(plano)) }}</span>
                      </p>
                    }
                  }

                  @if (cicloSelecionado() === 'MENSAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">{{ formatarMoeda(obterTotalPlano(plano)) }}</span>
                      <span class="text-xs font-semibold text-slate-500">/mês</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">Faturação mensal via PIX ou Cartão</p>
                  }

                  @if (cicloSelecionado() === 'SEMESTRAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">{{ formatarMoeda(obterTotalPlano(plano) / 6) }}</span>
                      <span class="text-xs font-semibold text-slate-500">/mês*</span>
                    </div>
                    <p class="text-[11px] text-slate-700 font-semibold mt-0.5">
                      R$ {{ formatarMoeda(obterTotalPlano(plano)) }}/semestre
                      @if (plano.poupancaSemestral > 0 && !cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo)) {
                        <span class="text-emerald-700 font-bold">(Poupa R$ {{ formatarMoeda(plano.poupancaSemestral) }})</span>
                      }
                    </p>
                  }

                  @if (cicloSelecionado() === 'ANUAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">{{ formatarMoeda(obterTotalPlano(plano) / 12) }}</span>
                      <span class="text-xs font-semibold text-slate-500">/mês*</span>
                    </div>
                    <p class="text-[11px] text-slate-700 font-semibold mt-0.5">
                      R$ {{ formatarMoeda(obterTotalPlano(plano)) }}/ano
                      @if (plano.poupancaAnual > 0 && !cupomAplicaNoCard(plano.codigo) && !beneficioAplicaNoCard(plano.codigo)) {
                        <span class="text-rose-600 font-bold">(Poupa R$ {{ formatarMoeda(plano.poupancaAnual) }})</span>
                      }
                    </p>
                  }

                  @if (cupomAplicaNoCard(plano.codigo) && cupomAplicado(); as cup) {
                    <div class="mt-2.5 p-2 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold shadow-sm space-y-0.5">
                      <span class="block">
                        🎟️ Cupom {{ cup.codigo }} • Desconto de R$ {{ formatarMoeda(obterOriginalCiclo(plano) - obterTotalPlano(plano)) }}
                      </span>
                      <span class="block text-[10px] font-bold text-emerald-100">
                        ✓ Válido por {{ cup.duracaoMeses }} {{ cup.duracaoMeses === 1 ? 'mês' : 'meses' }} (valor garantido ao ativar)
                      </span>
                    </div>
                  } @else if (beneficioAplicaNoCard(plano.codigo) && dados()?.beneficioAtivo; as ben) {
                    <div class="mt-2.5 p-2 rounded-lg bg-emerald-700 text-white text-[11px] font-extrabold shadow-sm space-y-0.5">
                      <span class="block">
                        🔒 Seu Desconto Travado • Restam {{ ben.mesesRestantes }} de {{ ben.mesesTotais }} {{ ben.mesesTotais === 1 ? 'mês' : 'meses' }}
                      </span>
                      <span class="block text-[10px] font-bold text-emerald-100">
                        ✓ Benefício garantido para sua loja mesmo se a campanha encerrar
                      </span>
                    </div>
                  } @else if (temPromocaoNoCiclo(plano)) {
                    <div class="mt-2.5 p-2 rounded-lg bg-rose-600 text-white text-[11px] font-extrabold shadow-sm space-y-0.5">
                      <span class="block">
                        🔥 Promoção de {{ formatarPct(obterDescontoPctCiclo(plano)) }} • Desconto de R$ {{ formatarMoeda(obterDescontoValorCiclo(plano)) }}
                      </span>
                      @if (plano.tipoPromocao === 'RECORRENTE_12_MESES') {
                        <span class="block text-[10px] font-bold text-amber-200">
                          @if (cicloSelecionado() === 'MENSAL') {
                            ✓ Válido em todos os meses durante 12 meses (Economia de R$ {{ formatarMoeda(obterDescontoValorCiclo(plano) * 12) }}/ano)
                          } @else {
                            ✓ Desconto válido por 12 meses
                          }
                        </span>
                      } @else if (plano.tipoPromocao === 'SOMENTE_ANUAL') {
                        <span class="block text-[10px] font-bold text-amber-200">
                          ✓ Exclusivo no Plano Anual (12 meses)
                        </span>
                      } @else {
                        <span class="block text-[10px] font-bold text-amber-200">
                          ✓ Válido somente no 1º mês (depois R$ {{ formatarMoeda(obterOriginalCiclo(plano)) }}/mês)
                        </span>
                      }
                      @if (plano.promocaoVagasRestantes !== null && plano.promocaoVagasRestantes !== undefined && plano.promocaoLimiteUsos) {
                        <span class="block text-[10px] font-extrabold text-white bg-black/20 px-2 py-0.5 rounded w-fit mt-0.5">
                          🎟️ Restam {{ plano.promocaoVagasRestantes }} de {{ plano.promocaoLimiteUsos }} vagas promocionais
                        </span>
                      }
                      @if (plano.mensagemPromocao) {
                        <span class="block text-[10px] font-medium text-rose-100 mt-0.5">
                          {{ plano.mensagemPromocao }}
                        </span>
                      }
                    </div>
                  } @else if (plano.promocional && plano.tipoPromocao === 'SOMENTE_ANUAL' && cicloSelecionado() !== 'ANUAL') {
                    <button
                      type="button"
                      (click)="selecionarCiclo('ANUAL'); $event.stopPropagation()"
                      class="mt-2.5 w-full text-left p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-extrabold cursor-pointer">
                      🔥 Promoção de {{ formatarPct(plano.descontoAnualPercentual) }} disponível no Anual →
                    </button>
                  } @else if (plano.promocional && plano.tipoPromocao === 'PRIMEIRO_MES' && cicloSelecionado() !== 'MENSAL') {
                    <button
                      type="button"
                      (click)="selecionarCiclo('MENSAL'); $event.stopPropagation()"
                      class="mt-2.5 w-full text-left p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-extrabold cursor-pointer">
                      🔥 Promoção de {{ formatarPct(plano.descontoMensalPercentual) }} disponível no 1º mês →
                    </button>
                  }
                </div>

                <!-- Lista de Benefícios -->
                <div class="space-y-2 mb-5">
                  @if (plano.beneficiosBaseTexto) {
                    <span class="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                      {{ plano.beneficiosBaseTexto }}
                    </span>
                  }
                  <ul class="space-y-2 text-xs text-slate-700">
                    @for (item of plano.funcionalidades; track item) {
                      <li class="flex items-start gap-2 leading-snug">
                        <span class="text-emerald-600 font-extrabold">✓</span>
                        <span>{{ item }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>

              <div class="space-y-2">
                <button
                  type="button"
                  (click)="gerarPixParaPlano(plano.codigo); $event.stopPropagation()"
                  [disabled]="carregando()"
                  [class.bg-rose-600]="plano.destaque"
                  [class.hover:bg-rose-700]="plano.destaque"
                  [class.text-white]="plano.destaque || planoSelecionado() === plano.codigo"
                  [class.bg-slate-900]="!plano.destaque && planoSelecionado() === plano.codigo"
                  [class.bg-slate-100]="!plano.destaque && planoSelecionado() !== plano.codigo"
                  [class.text-slate-800]="!plano.destaque && planoSelecionado() !== plano.codigo"
                  [class.hover:bg-slate-200]="!plano.destaque && planoSelecionado() !== plano.codigo"
                  class="w-full min-h-[42px] py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                  <span>⚡ Pagar com PIX: R$ {{ formatarMoeda(obterTotalPlano(plano)) }}</span>
                </button>

                <button
                  type="button"
                  (click)="pagarComCartao(plano.codigo); $event.stopPropagation()"
                  [disabled]="carregando() || gerandoCartao()"
                  class="w-full min-h-[42px] py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer disabled:opacity-50">
                  <span>💳 Pagar com Cartão de Crédito</span>
                </button>
              </div>

            </div>
          }

        </div>

        <!-- ========================================================================= -->
        <!-- 3. BLOCO DE PAGAMENTO PIX MERCADO PAGO -->
        <!-- ========================================================================= -->
        @if (dados(); as sub) {
          @if (pagamentoAprovado()) {
            <div class="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-scale-up">
              <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto">
                🎉
              </div>
              <h2 class="text-2xl font-extrabold text-slate-900">
                Pagamento Aprovado com Sucesso!
              </h2>
              <p class="text-sm text-emerald-800 max-w-lg mx-auto">
                Sua assinatura foi atualizada e todos os dias anteriores restantes foram somados.
              </p>
              <p class="text-xs text-slate-600">
                Novo Vencimento: <strong class="text-slate-900">{{ formatarData(novoVencimento() || sub.dataVencimento) }}</strong>
              </p>
            </div>
          } @else if (sub.pixQrCodeBase64 || sub.pixCopiaCola) {
            <div id="box-pix-checkout" class="p-6 sm:p-8 rounded-2xl bg-white border-2 border-rose-200 shadow-md space-y-6">
              <div class="text-center space-y-1.5">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  ⚡ Checkout PIX Instantâneo • Mercado Pago
                </span>
                <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {{ planoSelecionadoObj().nome }} — Ciclo {{ labelCicloAtual() }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500">
                  Valor do PIX gerado: <strong class="text-slate-900">R$ {{ formatarMoeda(sub.valorMensalidade || valorTotalSelecionado()) }}</strong>. A liberação ocorre automaticamente em segundos após o pagamento.
                </p>
              </div>

              <div class="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
                <!-- QR Code -->
                <div class="flex flex-col items-center">
                  <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    @if (sub.pixQrCodeBase64) {
                      <img
                        [src]="'data:image/png;base64,' + sub.pixQrCodeBase64"
                        alt="QR Code Pix"
                        class="w-48 h-48 sm:w-52 sm:h-52 object-contain" />
                    }
                  </div>
                  <span class="text-[11px] text-slate-400 mt-2">Escaneie no aplicativo do seu banco</span>
                </div>

                <!-- Copia e Cola -->
                <div class="w-full md:w-1/2 space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">
                      Código PIX Copia e Cola:
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        readonly
                        [value]="sub.pixCopiaCola || ''"
                        class="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono text-slate-700 truncate focus:outline-none select-all" />
                      <button
                        type="button"
                        (click)="copiarPix(sub.pixCopiaCola)"
                        class="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shrink-0 shadow-sm">
                        {{ copiado() ? '✓ Copiado!' : '📋 Copiar' }}
                      </button>
                    </div>
                  </div>

                  <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-amber-500 animate-ping shrink-0"></div>
                    <div class="text-xs text-amber-900">
                      <span class="font-bold block">Aguardando confirmação automática...</span>
                      <span class="text-[11px] text-amber-800">Verificamos o pagamento a cada 3 segundos.</span>
                    </div>
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span class="text-xs text-slate-500">Prefere parcelar ou pagar no crédito?</span>
                    <button
                      type="button"
                      (click)="pagarComCartao(planoSelecionado())"
                      [disabled]="gerandoCartao()"
                      class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50">
                      💳 {{ gerandoCartao() ? 'Abrindo Checkout...' : 'Pagar com Cartão de Crédito' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        }

      </div>
    </div>
  `
})
export class AdminAssinaturaComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  tenantService = inject(TenantService);
  private route = inject(ActivatedRoute);

  carregando = signal(false);
  gerandoCartao = signal(false);
  copiado = signal(false);
  dados = signal<AssinaturaStatusResponse | null>(null);
  pagamentoAprovado = signal(false);
  novoVencimento = signal<string | null>(null);

  cicloSelecionado = signal<CicloFaturacao>('MENSAL');
  planoSelecionado = signal<PlanoId | string>('PRO');
  planos = signal<PlanoAssinatura[]>(PLANOS_PADRAO_ADMIN);

  // Cupom de desconto
  cupomInput = signal('');
  validandoCupom = signal(false);
  cupomAplicado = signal<ValidarCupomResponse | null>(null);
  erroCupom = signal<string | null>(null);
  erroCheckout = signal<string | null>(null);

  private usuarioAlterouSelecao = false;

  bannerPromocao = computed(() => {
    let maiorPct = 0;
    let maiorDescontoValor = 0;
    let mensagem: string | null = null;
    for (const p of this.planos()) {
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

  planoSelecionadoObj = computed(() => {
    const lista = this.planos();
    return lista.find(p => p.codigo === this.planoSelecionado()) || lista[1] || lista[0];
  });

  valorTotalSelecionado = computed(() => {
    return this.obterTotalPlano(this.planoSelecionadoObj());
  });

  labelCicloAtual = computed(() => {
    const c = this.cicloSelecionado();
    return c === 'SEMESTRAL' ? 'Semestral' : (c === 'ANUAL' ? 'Anual' : 'Mensal');
  });

  private intervalPolling: any = null;

  ngOnInit(): void {
    this.carregarPlanos();

    const paymentIdRetorno = this.route.snapshot.queryParamMap.get('payment_id') || this.route.snapshot.queryParamMap.get('collection_id');
    if (paymentIdRetorno) {
      this.api.consultarStatusPagamento(paymentIdRetorno).subscribe({
        next: (res) => {
          if (res.pago || res.status === 'approved') {
            this.pagamentoAprovado.set(true);
            if (res.tenant?.dataVencimento) {
              this.novoVencimento.set(res.tenant.dataVencimento);
            }
          }
          this.carregarStatus();
        },
        error: () => this.carregarStatus()
      });
    } else {
      this.carregarStatus();
    }
  }

  ngOnDestroy(): void {
    this.pararPolling();
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
    this.usuarioAlterouSelecao = true;
    this.cicloSelecionado.set(ciclo);
    if (this.cupomAplicado()?.codigo) {
      this.validarCupomNoServidor(this.cupomAplicado()!.codigo!, this.planoSelecionado(), ciclo);
    }
  }

  selecionarPlano(plano: string): void {
    this.usuarioAlterouSelecao = true;
    this.planoSelecionado.set(plano);
    if (this.cupomAplicado()?.codigo) {
      this.validarCupomNoServidor(this.cupomAplicado()!.codigo!, plano, this.cicloSelecionado());
    }
  }

  aplicarCupom(): void {
    const code = this.cupomInput().trim().toUpperCase();
    if (!code) {
      this.erroCupom.set('Digite o código do cupom.');
      return;
    }
    this.validarCupomNoServidor(code, this.planoSelecionado(), this.cicloSelecionado());
  }

  removerCupom(): void {
    this.cupomAplicado.set(null);
    this.erroCupom.set(null);
    this.erroCheckout.set(null);
    this.cupomInput.set('');
  }

  private validarCupomNoServidor(codigo: string, plano: string, ciclo: CicloFaturacao): void {
    this.validandoCupom.set(true);
    this.erroCupom.set(null);
    this.erroCheckout.set(null);

    this.api.validarCupom(codigo, plano, ciclo).subscribe({
      next: (res) => {
        this.validandoCupom.set(false);
        if (res.valido) {
          this.cupomAplicado.set(res);
          this.cupomInput.set(res.codigo || codigo);
        } else {
          this.cupomAplicado.set(null);
          this.erroCupom.set(res.mensagem || 'Cupom inválido ou expirado.');
        }
      },
      error: (err) => {
        this.validandoCupom.set(false);
        this.cupomAplicado.set(null);
        this.erroCupom.set(err?.error?.message || err?.error?.error || 'Não foi possível validar o cupom.');
      }
    });
  }

  cupomAplicaNoCard(planoCodigo: string): boolean {
    const c = this.cupomAplicado();
    if (!c || !c.valido) return false;
    const pAp = (c.planoAplicavel || 'TODOS').toUpperCase();
    const cAp = (c.cicloAplicavel || 'TODOS').toUpperCase();
    return (pAp === 'TODOS' || pAp === planoCodigo.toUpperCase())
      && (cAp === 'TODOS' || cAp === this.cicloSelecionado());
  }

  beneficioAplicaNoCard(planoCodigo: string): boolean {
    if (this.cupomAplicaNoCard(planoCodigo)) return false;
    const ben = this.dados()?.beneficioAtivo;
    if (!ben || !ben.mesesRestantes || ben.mesesRestantes <= 0) return false;
    return !ben.planoCodigo || ben.planoCodigo.toUpperCase() === planoCodigo.toUpperCase();
  }

  private calcularValorBeneficioNoCard(ben: BeneficioAtivo, plano: PlanoAssinatura): number | null {
    const cicloAtual = this.cicloSelecionado();
    const mesesAlvo = mesesDoCiclo(cicloAtual);
    if (ben.ciclo && ben.ciclo.toUpperCase() === cicloAtual && ben.mesesRestantes >= mesesAlvo && ben.valorPromocional && ben.valorPromocional > 0) {
      return Number(ben.valorPromocional);
    }
    const origAlvo = this.obterOriginalCiclo(plano);
    if (!ben.valorOriginal || !ben.valorPromocional) return null;
    const mesesBase = Math.max(1, mesesDoCiclo(ben.ciclo));
    const descPorMes = Math.max(0, Number(ben.valorOriginal) - Number(ben.valorPromocional)) / mesesBase;
    const mesesCobertos = Math.min(ben.mesesRestantes, mesesAlvo);
    return Math.max(1, round2(origAlvo - descPorMes * mesesCobertos));
  }

  private calcularValorCupomNoCard(cup: ValidarCupomResponse, plano: PlanoAssinatura): number {
    if (cup.planoAplicavel && cup.planoAplicavel !== 'TODOS' && cup.valorFinal) {
      return Number(cup.valorFinal);
    }
    if (plano.codigo.toUpperCase() === this.planoSelecionado().toUpperCase() && cup.valorFinal) {
      return Number(cup.valorFinal);
    }
    const orig = this.obterOriginalCiclo(plano);
    const mesesCiclo = mesesDoCiclo(this.cicloSelecionado());
    const duracao = Math.max(1, Number(cup.duracaoMeses || 1));
    const cobertos = Math.min(mesesCiclo, duracao);
    const valDesc = Number(cup.valorDesconto || 0);
    const desconto = cup.tipoDesconto === 'VALOR_FIXO'
      ? round2(valDesc * cobertos)
      : round2(orig * (valDesc / 100) * (cobertos / mesesCiclo));
    return Math.max(1, round2(orig - desconto));
  }

  obterTotalPlano(plano: PlanoAssinatura): number {
    const cup = this.cupomAplicado();
    if (cup && cup.valido && this.cupomAplicaNoCard(plano.codigo)) {
      return this.calcularValorCupomNoCard(cup, plano);
    }
    const ben = this.dados()?.beneficioAtivo;
    if (ben && this.beneficioAplicaNoCard(plano.codigo)) {
      const vBen = this.calcularValorBeneficioNoCard(ben, plano);
      if (vBen !== null) return vBen;
    }
    const c = this.cicloSelecionado();
    if (c === 'SEMESTRAL') return Number(plano.precoSemestralFinal || 0);
    if (c === 'ANUAL') return Number(plano.precoAnualFinal || 0);
    return Number(plano.precoMensalFinal || 0);
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

  carregarStatus(): void {
    this.carregando.set(true);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;

    this.api.obterStatusAssinatura(slug).subscribe({
      next: (res) => {
        this.dados.set(res);
        this.carregando.set(false);
        if (!this.usuarioAlterouSelecao && res.beneficioAtivo && res.beneficioAtivo.mesesRestantes > 0) {
          if (res.beneficioAtivo.planoCodigo) {
            this.planoSelecionado.set(res.beneficioAtivo.planoCodigo);
          }
          if (res.beneficioAtivo.ciclo === 'MENSAL' || res.beneficioAtivo.ciclo === 'SEMESTRAL' || res.beneficioAtivo.ciclo === 'ANUAL') {
            this.cicloSelecionado.set(res.beneficioAtivo.ciclo as CicloFaturacao);
          }
        }
        if (res.podeRenovar && res.paymentId && !this.pagamentoAprovado()) {
          this.iniciarPolling(res.paymentId);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar status da assinatura:', err);
        this.carregando.set(false);
      }
    });
  }

  gerarPixParaPlano(planoId: string): void {
    this.usuarioAlterouSelecao = true;
    this.planoSelecionado.set(planoId);
    this.carregando.set(true);
    this.erroCheckout.set(null);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;
    const codigoCupom = this.cupomAplicaNoCard(planoId) ? (this.cupomAplicado()?.codigo || undefined) : undefined;

    this.api.forcarGerarPixRenovacao(slug, planoId, this.cicloSelecionado(), codigoCupom).subscribe({
      next: (res) => {
        this.dados.set(res);
        this.carregando.set(false);
        if (res.paymentId) {
          this.iniciarPolling(res.paymentId);
        }
        if (typeof document !== 'undefined') {
          setTimeout(() => {
            document.getElementById('box-pix-checkout')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      },
      error: (err) => {
        console.error('Erro ao gerar Pix do plano:', err);
        this.carregando.set(false);
        this.erroCheckout.set(err?.error?.message || err?.error?.detail || err?.error?.error || 'Não foi possível gerar o PIX para este plano/cupom.');
      }
    });
  }

  pagarComCartao(planoId: string): void {
    this.usuarioAlterouSelecao = true;
    this.planoSelecionado.set(planoId);
    this.gerandoCartao.set(true);
    this.erroCheckout.set(null);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;
    const codigoCupom = this.cupomAplicaNoCard(planoId) ? (this.cupomAplicado()?.codigo || undefined) : undefined;

    this.api.gerarCheckoutCartaoAssinatura(slug, planoId, this.cicloSelecionado(), codigoCupom).subscribe({
      next: (res) => {
        this.gerandoCartao.set(false);
        if (res && res.checkoutUrl && typeof window !== 'undefined') {
          window.location.href = res.checkoutUrl;
        }
      },
      error: (err) => {
        console.error('Erro ao iniciar checkout por Cartão de Crédito:', err);
        this.gerandoCartao.set(false);
        this.erroCheckout.set(err?.error?.message || err?.error?.detail || err?.error?.error || 'Não foi possível iniciar o checkout com cartão.');
      }
    });
  }

  copiarPix(codigo?: string): void {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 3000);
    });
  }

  formatarData(dataStr?: string | null): string {
    if (!dataStr) return '—';
    try {
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) return dataStr;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dataStr;
    }
  }

  private iniciarPolling(paymentId: string): void {
    this.pararPolling();
    this.intervalPolling = setInterval(() => {
      this.api.consultarStatusPagamento(paymentId).subscribe({
        next: (res) => {
          if (res.pago || res.status === 'approved') {
            this.pagamentoAprovado.set(true);
            this.pararPolling();
            if (res.tenant?.dataVencimento) {
              this.novoVencimento.set(res.tenant.dataVencimento);
            }
            setTimeout(() => this.carregarStatus(), 1500);
          }
        },
        error: (err) => console.warn('Polling status pagamento:', err)
      });
    }, 3000);
  }

  private pararPolling(): void {
    if (this.intervalPolling) {
      clearInterval(this.intervalPolling);
      this.intervalPolling = null;
    }
  }
}
