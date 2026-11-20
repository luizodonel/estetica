import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AssinaturaStatusResponse } from '../../../core/models';
import { CicloFaturacao, PlanoConfig, PlanoId } from '../../planos/planos.component';

@Component({
  selector: 'app-admin-assinatura',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-6xl mx-auto space-y-8">

        <!-- Top Navigation / Back -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <a routerLink="/admin/dashboard" class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <span>←</span> Voltar para o Dashboard
          </a>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-sm">
            💎 Gestão de Plano & Assinatura Agendoou
          </span>
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
                </p>
              </div>

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
        <!-- 2. MATRIZ DE PLANOS (STUDIO R$ 89,90 | CLÍNICA PRO R$ 99,90 | VIP R$ 119,90) -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">

          @for (plano of planos; track plano.id) {
            <div
              (click)="selecionarPlano(plano.id)"
              [class.border-2]="plano.destaque || planoSelecionado() === plano.id"
              [class.border-rose-500]="plano.destaque"
              [class.border-slate-900]="!plano.destaque && planoSelecionado() === plano.id"
              [class.shadow-lg]="plano.destaque || planoSelecionado() === plano.id"
              [class.border]="!plano.destaque && planoSelecionado() !== plano.id"
              [class.border-slate-200]="!plano.destaque && planoSelecionado() !== plano.id"
              [class.md:col-span-2]="plano.id === 'VIP'"
              [class.lg:col-span-1]="plano.id === 'VIP'"
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
                  @if (cicloSelecionado() === 'SEMESTRAL') {
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
                     [class.bg-rose-50/50]="plano.destaque"
                     [class.border-rose-100]="plano.destaque"
                     [class.bg-slate-50]="!plano.destaque"
                     [class.border-slate-200/70]="!plano.destaque">

                  @if (cicloSelecionado() === 'MENSAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">{{ formatarMoeda(plano.precoMensal) }}</span>
                      <span class="text-xs font-semibold text-slate-500">/mês</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">Faturação mensal via PIX</p>
                  }

                  @if (cicloSelecionado() === 'SEMESTRAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">{{ formatarMoeda(plano.precoSemestralMensalEq) }}</span>
                      <span class="text-xs font-semibold text-slate-500">/mês*</span>
                    </div>
                    <p class="text-[11px] text-slate-700 font-semibold mt-0.5">
                      R$ {{ formatarMoeda(plano.precoSemestralTotal) }}/semestre
                      <span class="text-emerald-700 font-bold">(Poupa R$ {{ formatarMoeda(plano.poupancaSemestral) }})</span>
                    </p>
                  }

                  @if (cicloSelecionado() === 'ANUAL') {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-500">R$</span>
                      <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">{{ formatarMoeda(plano.precoAnualMensalEq) }}</span>
                      <span class="text-xs font-semibold text-slate-500">/mês*</span>
                    </div>
                    <p class="text-[11px] text-slate-700 font-semibold mt-0.5">
                      R$ {{ formatarMoeda(plano.precoAnualTotal) }}/ano
                      <span class="text-rose-600 font-bold">(Poupa R$ {{ formatarMoeda(plano.poupancaAnual) }})</span>
                    </p>
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
                  (click)="gerarPixParaPlano(plano.id); $event.stopPropagation()"
                  [disabled]="carregando()"
                  [class.bg-rose-600]="plano.destaque"
                  [class.hover:bg-rose-700]="plano.destaque"
                  [class.text-white]="plano.destaque || planoSelecionado() === plano.id"
                  [class.bg-slate-900]="!plano.destaque && planoSelecionado() === plano.id"
                  [class.bg-slate-100]="!plano.destaque && planoSelecionado() !== plano.id"
                  [class.text-slate-800]="!plano.destaque && planoSelecionado() !== plano.id"
                  [class.hover:bg-slate-200]="!plano.destaque && planoSelecionado() !== plano.id"
                  class="w-full min-h-[42px] py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                  <span>⚡ Pagar com PIX: R$ {{ formatarMoeda(obterTotalPlano(plano)) }}</span>
                </button>

                <button
                  type="button"
                  (click)="pagarComCartao(plano.id); $event.stopPropagation()"
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
  planoSelecionado = signal<PlanoId>('PRO');

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
      ctaTexto: 'Escolher Studio / Starter',
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
      subtitulo: 'Foco de vendas • Melhor custo-benefício',
      destaque: true,
      etiquetaDestaque: 'Mais Popular / Melhor Relação Custo-Benefício',
      precoMensal: 99.90,
      precoSemestralTotal: 539.00,
      precoSemestralMensalEq: 89.83,
      poupancaSemestral: 60.40,
      precoAnualTotal: 999.00,
      precoAnualMensalEq: 83.25,
      poupancaAnual: 199.80,
      ctaTexto: 'Escolher Clínica Pro',
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
      subtitulo: 'Para clínicas maiores e operações multisalas',
      destaque: false,
      precoMensal: 119.90,
      precoSemestralTotal: 647.00,
      precoSemestralMensalEq: 107.83,
      poupancaSemestral: 72.40,
      precoAnualTotal: 1199.00,
      precoAnualMensalEq: 99.91,
      poupancaAnual: 239.80,
      ctaTexto: 'Escolher VIP / Multisalas',
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

  planoSelecionadoObj = computed(() => {
    return this.planos.find(p => p.id === this.planoSelecionado()) || this.planos[1];
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

  selecionarCiclo(ciclo: CicloFaturacao): void {
    this.cicloSelecionado.set(ciclo);
  }

  selecionarPlano(plano: PlanoId): void {
    this.planoSelecionado.set(plano);
  }

  obterTotalPlano(plano: PlanoConfig): number {
    const c = this.cicloSelecionado();
    if (c === 'SEMESTRAL') return plano.precoSemestralTotal;
    if (c === 'ANUAL') return plano.precoAnualTotal;
    return plano.precoMensal;
  }

  formatarMoeda(valor: number): string {
    return (valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  carregarStatus(): void {
    this.carregando.set(true);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;

    this.api.obterStatusAssinatura(slug).subscribe({
      next: (res) => {
        this.dados.set(res);
        this.carregando.set(false);
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

  gerarPixParaPlano(planoId: PlanoId): void {
    this.planoSelecionado.set(planoId);
    this.carregando.set(true);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;

    this.api.forcarGerarPixRenovacao(slug, planoId, this.cicloSelecionado()).subscribe({
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
      }
    });
  }

  pagarComCartao(planoId: PlanoId): void {
    this.planoSelecionado.set(planoId);
    this.gerandoCartao.set(true);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;

    this.api.gerarCheckoutCartaoAssinatura(slug, planoId, this.cicloSelecionado()).subscribe({
      next: (res) => {
        this.gerandoCartao.set(false);
        if (res && res.checkoutUrl && typeof window !== 'undefined') {
          window.location.href = res.checkoutUrl;
        }
      },
      error: (err) => {
        console.error('Erro ao iniciar checkout por Cartão de Crédito:', err);
        this.gerandoCartao.set(false);
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
