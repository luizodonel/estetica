import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AssinaturaStatusResponse } from '../../../core/models';

@Component({
  selector: 'app-admin-assinatura',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-4xl mx-auto space-y-6">

        <!-- Top Navigation / Back -->
        <div class="flex items-center justify-between">
          <a routerLink="/admin/gestao" class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <span>←</span> Voltar para Cadastros & Gestão
          </a>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            💎 Assinatura Lojista Whitelabel
          </span>
        </div>

        <!-- Header Card -->
        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span class="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Ciclo Mensal de 30 Dias
              </span>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Minha Assinatura & Renovação
              </h1>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Acompanhe o status do plano de <strong class="text-slate-800">{{ dados()?.nomeEmpresa || tenantService.nomeEmpresa() }}</strong>
              </p>
            </div>

            <!-- Botão Atualizar -->
            <button
              (click)="carregarStatus()"
              [disabled]="carregando()"
              class="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50">
              <span [class.animate-spin]="carregando()">🔄</span> Atualizar Status
            </button>
          </div>

          <!-- Loading State -->
          @if (carregando() && !dados()) {
            <div class="py-16 text-center">
              <div class="inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-xs text-stone-400 mt-3 font-medium">Consultando status da sua assinatura...</p>
            </div>
          }

          <!-- Empty / Error State -->
          @if (!carregando() && !dados()) {
            <div class="py-16 text-center space-y-4">
              <div class="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-2xl mx-auto">
                💳
              </div>
              <div>
                <h3 class="font-serif text-lg font-bold text-stone-800">Não foi possível carregar os dados da assinatura</h3>
                <p class="text-xs text-stone-500 max-w-sm mx-auto mt-1">Verifique sua conexão ou clique no botão abaixo para tentar novamente.</p>
              </div>
              <button
                type="button"
                (click)="carregarStatus()"
                class="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-sm">
                🔄 Tentar Novamente
              </button>
            </div>
          }

          <!-- Data Content -->
          @if (dados(); as sub) {

            <!-- Grid de Indicadores -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">

              <!-- Indicador 1: Status -->
              <div class="p-5 rounded-2xl bg-stone-50/80 border border-nude-200">
                <span class="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Status do Plano</span>
                <div class="mt-2 flex items-center gap-2">
                  @if (sub.status === 'ATIVA') {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Ativa & Em Dia
                    </span>
                  } @else if (sub.status === 'VENCENDO') {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                      <span class="w-2 h-2 rounded-full bg-amber-500"></span> Renovação Disponível
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <span class="w-2 h-2 rounded-full bg-rose-500"></span> Assinatura Vencida
                    </span>
                  }
                </div>
                <p class="text-[11px] text-stone-500 mt-2">
                  {{ sub.status === 'ATIVA' ? 'Todos os recursos operando perfeitamente.' : (sub.status === 'VENCENDO' ? 'Renove com antecedência sem perder dias.' : 'Acesso suspenso por vencimento.') }}
                </p>
              </div>

              <!-- Indicador 2: Vencimento -->
              <div class="p-5 rounded-2xl bg-stone-50/80 border border-nude-200">
                <span class="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Próximo Vencimento</span>
                <div class="mt-1">
                  <span class="font-serif text-xl font-bold text-stone-900">
                    {{ formatarData(sub.dataVencimento) }}
                  </span>
                </div>
                <p class="text-[11px] mt-1" [class.text-rose-600]="sub.vencida" [class.text-amber-600]="sub.status === 'VENCENDO'" [class.text-stone-500]="sub.status === 'ATIVA'">
                  @if (sub.vencida) {
                    Venceu há {{ (sub.diasRestantes || 0) * -1 }} dia(s)
                  } @else if (sub.diasRestantes === 0) {
                    Vence hoje!
                  } @else {
                    Faltam <strong>{{ sub.diasRestantes ?? 0 }} dia(s)</strong> para vencer
                  }
                </p>
              </div>

              <!-- Indicador 3: Mensalidade -->
              <div class="p-5 rounded-2xl bg-stone-50/80 border border-nude-200">
                <span class="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Valor da Mensalidade</span>
                <div class="mt-1">
                  <span class="font-serif text-xl font-bold text-stone-900">
                    R$ {{ (sub.valorMensalidade || 149.9).toFixed(2).replace('.', ',') }}
                  </span>
                  <span class="text-[11px] text-stone-400 font-normal"> / 30 dias</span>
                </div>
                <p class="text-[11px] text-stone-500 mt-1">
                  Sem taxa de adesão extra ou fidelidade.
                </p>
              </div>
            </div>

            <!-- REGRA CLARA: NÃO-PERDA DE DIAS -->
            <div class="mt-6 p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start gap-3 text-xs text-stone-700">
              <span class="text-rose-500 text-base leading-none">🛡️</span>
              <div>
                <strong class="text-rose-900">Regra de Renovação Antecipada:</strong>
                Se você efetuar o pagamento antes dos 30 dias vencerem (por exemplo, faltando 4 dias para acabar), 
                <strong>esses 4 dias restantes continuam válidos e serão somados integralmente</strong> aos novos 30 dias contratados!
              </div>
            </div>

            <!-- ========================================================================= -->
            <!-- CASO 1: AINDA FALTAM MAIS DE 5 DIAS (NÃO PRECISA RENOVAR AGORA) -->
            <!-- ========================================================================= -->
            @if (!sub.podeRenovar) {
              <div class="mt-8 p-8 rounded-3xl bg-white border border-emerald-100 shadow-sm text-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  ✓
                </div>
                <div>
                  <h3 class="font-serif text-xl font-bold text-stone-900">
                    Sua assinatura está em dia!
                  </h3>
                  <p class="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1">
                    Você ainda possui <strong>{{ sub.diasRestantes ?? 0 }} dias</strong> de acesso garantido. 
                    A geração do Pix de renovação será liberada automaticamente aqui nesta aba quando faltarem <strong>5 dias</strong> para o vencimento.
                  </p>
                </div>

                <div class="pt-2">
                  <a routerLink="/admin/dashboard" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-colors shadow">
                    Ir para o Dashboard
                  </a>
                </div>
              </div>
            }

            <!-- ========================================================================= -->
            <!-- CASO 2: FALTAM <= 5 DIAS OU VENCIDA -> PIX GERADO AUTOMATICAMENTE -->
            <!-- ========================================================================= -->
            @if (sub.podeRenovar) {

              <!-- Se o pagamento acabou de ser aprovado -->
              @if (pagamentoAprovado()) {
                <div class="mt-8 p-8 rounded-3xl bg-emerald-50/70 border border-emerald-200 text-center space-y-4 animate-scale-up">
                  <div class="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-4xl mx-auto shadow-inner">
                    🎉
                  </div>
                  <div>
                    <h2 class="font-serif text-2xl font-bold text-stone-900">
                      Pagamento Aprovado com Sucesso!
                    </h2>
                    <p class="text-sm text-emerald-800 max-w-lg mx-auto mt-2">
                      Sua assinatura foi renovada por mais 30 dias. Os dias anteriores restantes foram preservados.
                    </p>
                    <p class="text-xs text-stone-500 mt-1">
                      Novo Vencimento: <strong class="text-stone-900">{{ formatarData(novoVencimento()) }}</strong>
                    </p>
                  </div>

                  <div class="pt-4 flex items-center justify-center gap-3">
                    <a routerLink="/admin/dashboard" class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-md">
                      Acessar Dashboard →
                    </a>
                  </div>
                </div>
              } @else {

                <!-- Bloco de Pagamento Pix -->
                <div class="mt-8 p-6 sm:p-8 rounded-3xl bg-white border border-rose-200 shadow-md space-y-6">

                  <!-- Header do Pix -->
                  <div class="text-center space-y-2">
                    @if (sub.vencida) {
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        🚨 Vencida — Regularize para Reativar
                      </div>
                    } @else {
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        ⏳ Vence em {{ sub.diasRestantes ?? 0 }} dia(s) — Renove Sem Perder Dias
                      </div>
                    }

                    <h2 class="font-serif text-2xl font-bold text-stone-900">
                      Pagar Renovação Mensal via Pix
                    </h2>
                    <p class="text-xs text-stone-500 max-w-lg mx-auto">
                      O Pix de <strong>R$ {{ (sub.valorMensalidade || 149.9).toFixed(2).replace('.', ',') }}</strong> foi gerado automaticamente. 
                      Assim que o banco confirmar o pagamento, sua assinatura será renovada instantaneamente.
                    </p>
                  </div>

                  <!-- QR Code e Copia e Cola -->
                  <div class="flex flex-col md:flex-row items-center justify-center gap-8 py-4">

                    <!-- Imagem do QR Code -->
                    <div class="flex flex-col items-center">
                      <div class="p-3 bg-white rounded-2xl border-2 border-nude-300 shadow-sm">
                        @if (sub.pixQrCodeBase64) {
                          <img
                            [src]="'data:image/png;base64,' + sub.pixQrCodeBase64"
                            alt="QR Code Pix Renovação"
                            class="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                        } @else {
                          <div class="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-stone-400 text-xs">
                            <span class="animate-spin text-2xl">🔄</span>
                            <span class="mt-2">Carregando QR Code...</span>
                          </div>
                        }
                      </div>
                      <span class="text-[11px] text-stone-400 mt-2">Aponte a câmera do seu banco</span>
                    </div>

                    <!-- Código Copia e Cola & Status -->
                    <div class="w-full md:w-1/2 space-y-4">
                      <div>
                        <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                          Pix Copia e Cola:
                        </label>
                        <div class="flex items-center gap-2">
                          <input
                            type="text"
                            readonly
                            [value]="sub.pixCopiaCola || 'Gerando código Pix...'"
                            class="w-full px-3.5 py-2.5 rounded-xl border border-nude-300 bg-stone-50 text-xs font-mono text-stone-600 truncate focus:outline-none select-all" />
                          <button
                            type="button"
                            (click)="copiarPix(sub.pixCopiaCola)"
                            [disabled]="!sub.pixCopiaCola"
                            class="px-4 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shrink-0 shadow-sm flex items-center gap-1.5">
                            @if (copiado()) {
                              <span>✓ Copiado!</span>
                            } @else {
                              <span>📋 Copiar</span>
                            }
                          </button>
                        </div>
                      </div>

                      <!-- Status em Tempo Real -->
                      <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
                        <div class="text-xs text-amber-900">
                          <span class="font-bold block">Aguardando confirmação do Pix...</span>
                          <span class="text-[11px] text-amber-800">Nosso sistema verifica automaticamente a cada 3 segundos. Não precisa enviar comprovante.</span>
                        </div>
                      </div>

                      <!-- Botão Recriar Pix se expirou -->
                      <div class="pt-1 flex items-center justify-between text-xs text-stone-400">
                        <span>O código expira em 30 minutos</span>
                        <button
                          type="button"
                          (click)="gerarNovoPix()"
                          class="text-rose-600 hover:text-rose-700 font-semibold underline">
                          Gerar Novo Código Pix
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              }

            }

          }

        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-scale-up {
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class AdminAssinaturaComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  tenantService = inject(TenantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  carregando = signal(false);
  copiado = signal(false);
  dados = signal<AssinaturaStatusResponse | null>(null);
  pagamentoAprovado = signal(false);
  novoVencimento = signal<string | null>(null);

  private intervalPolling: any = null;

  ngOnInit(): void {
    this.carregarStatus();
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  carregarStatus(): void {
    this.carregando.set(true);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;

    this.api.obterStatusAssinatura(slug).subscribe({
      next: (res) => {
        this.dados.set(res);
        this.carregando.set(false);

        // Se puder renovar e tiver paymentId, inicia o polling automático
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

  gerarNovoPix(): void {
    this.carregando.set(true);
    const slug = this.route.snapshot.queryParamMap.get('slug') || this.tenantService.tenant()?.slug || undefined;

    this.api.forcarGerarPixRenovacao(slug).subscribe({
      next: (res) => {
        this.dados.set(res);
        this.carregando.set(false);
        if (res.paymentId) {
          this.iniciarPolling(res.paymentId);
        }
      },
      error: (err) => {
        console.error('Erro ao gerar novo Pix:', err);
        this.carregando.set(false);
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
            // Atualiza o vencimento novo nos dados
            if (res.tenant?.dataVencimento) {
              this.novoVencimento.set(res.tenant.dataVencimento);
            }
            // Recarrega dados completos
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

