import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SetorService } from '../../../core/services/setor.service';
import { TenantService } from '../../../core/services/tenant.service';
import { DashboardResumo, AssinaturaStatusResponse } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 font-sans">
      
      <!-- Cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            {{ resumo()?.isAdmin ? 'Gestão Operacional' : ('Meu Painel de ' + setorService.termoProfissional()) }}
          </span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ resumo()?.isAdmin ? 'Painel Geral & Faturamento' : 'Meus Atendimentos & Faturamento' }}
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            {{ resumo()?.isAdmin ? ('Métricas e faturamento de ' + setorService.termoProfissionais() + ' em tempo real.') : 'Consulte seus agendamentos e faturamento das suas sessões realizadas.' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (resumo()?.isAdmin) {
            <a routerLink="/admin/gestao" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm">
              ⚙️ Cadastros & Gestão
            </a>
            <a routerLink="/admin/relatorios" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm">
              📈 Relatórios & PDF
            </a>
          }
          <a routerLink="/admin/agenda" class="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm">
            Ver Agenda Completa →
          </a>
        </div>
      </div>

      <!-- Card de Captação: Link Exclusivo de Agendamento da Clínica (Para Bio do Instagram & WhatsApp) -->
      @if (resumo()?.isAdmin) {
        <div class="mb-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                📲 Captação de Clientes 24h
              </span>
              @if (assinatura()?.status === 'TRIAL') {
                <span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                  🎁 Teste Grátis: {{ assinatura()?.diasRestantes ?? 7 }} dias restantes
                </span>
              }
            </div>
            <h3 class="text-sm sm:text-base font-bold text-white">
              Coloque seu Link de Agendamento na Bio do Instagram e no WhatsApp
            </h3>
            <p class="text-xs text-slate-300 font-mono break-all">
              {{ obterLinkPublico() }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="copiarLinkPublico()"
              class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5">
              <span>{{ linkCopiado() ? '✓ Link Copiado!' : '📋 Copiar Meu Link' }}</span>
            </button>
            <a
              [href]="obterLinkPublico()"
              target="_blank"
              class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all">
              Abrir Minha Loja ↗
            </a>
          </div>
        </div>
      }

      <!-- Alerta de Vencimento / Renovação da Assinatura Mensal (para Administrador) -->
      @if (resumo()?.isAdmin && assinatura()?.podeRenovar) {
        <div class="mb-6 p-4 rounded-2xl border transition-all"
             [class.bg-rose-50]="assinatura()?.vencida"
             [class.border-rose-200]="assinatura()?.vencida"
             [class.bg-emerald-50]="assinatura()?.status === 'TRIAL' && !assinatura()?.vencida"
             [class.border-emerald-200]="assinatura()?.status === 'TRIAL' && !assinatura()?.vencida"
             [class.bg-amber-50]="assinatura()?.status !== 'TRIAL' && !assinatura()?.vencida"
             [class.border-amber-200]="assinatura()?.status !== 'TRIAL' && !assinatura()?.vencida">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ assinatura()?.vencida ? '🚨' : (assinatura()?.status === 'TRIAL' ? '🎁' : '⏳') }}</span>
              <div>
                <strong class="text-xs"
                        [class.text-rose-900]="assinatura()?.vencida"
                        [class.text-emerald-900]="assinatura()?.status === 'TRIAL' && !assinatura()?.vencida"
                        [class.text-amber-900]="assinatura()?.status !== 'TRIAL' && !assinatura()?.vencida">
                  {{ assinatura()?.vencida 
                      ? 'Período de Teste / Assinatura Vencida!' 
                      : (assinatura()?.status === 'TRIAL' 
                          ? 'Período de Teste Grátis Ativo (' + (assinatura()?.diasRestantes ?? 7) + ' dia(s) restantes)' 
                          : 'Renovação da Assinatura Disponível (Vence em ' + (assinatura()?.diasRestantes ?? 0) + ' dia(s))') }}
                </strong>
                <p class="text-[11px]"
                   [class.text-rose-700]="assinatura()?.vencida"
                   [class.text-emerald-800]="assinatura()?.status === 'TRIAL' && !assinatura()?.vencida"
                   [class.text-amber-800]="assinatura()?.status !== 'TRIAL' && !assinatura()?.vencida">
                  {{ assinatura()?.vencida 
                      ? 'Efetue o pagamento Pix para regularizar e restabelecer o acesso completo.' 
                      : 'Ative ou renove antecipadamente via Pix sem perder os dias restantes. Os dias atuais serão somados aos novos 30 dias!' }}
                </p>
              </div>
            </div>
            <a routerLink="/admin/assinatura"
               class="px-4 py-2 rounded-xl text-xs font-semibold text-white whitespace-nowrap transition-all shadow-sm shrink-0"
               [class.bg-rose-600]="assinatura()?.vencida"
               [class.hover:bg-rose-700]="assinatura()?.vencida"
               [class.bg-emerald-600]="assinatura()?.status === 'TRIAL' && !assinatura()?.vencida"
               [class.hover:bg-emerald-700]="assinatura()?.status === 'TRIAL' && !assinatura()?.vencida"
               [class.bg-amber-600]="assinatura()?.status !== 'TRIAL' && !assinatura()?.vencida"
               [class.hover:bg-amber-700]="assinatura()?.status !== 'TRIAL' && !assinatura()?.vencida">
              {{ assinatura()?.status === 'TRIAL' ? 'Ativar Plano via Pix →' : 'Renovar via Pix →' }}
            </a>
          </div>
        </div>
      }

      <!-- Cards de Métricas do Dia -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <!-- Card 1: Total Hoje -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
            {{ resumo()?.isAdmin ? 'Agendamentos Totais Hoje' : 'Meus Atendimentos Hoje' }}
          </span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-black text-slate-900">{{ resumo()?.agendamentosHoje || 0 }}</span>
            <span class="text-xs text-slate-400 font-medium">sessões</span>
          </div>
        </div>

        <!-- Card 2: Confirmados -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 block mb-1">Confirmados / Concluídos</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-black text-emerald-600">{{ resumo()?.agendamentosConfirmadosHoje || 0 }}</span>
            <span class="text-xs text-emerald-600 font-medium">garantidos</span>
          </div>
        </div>

        <!-- Card 3: Pendentes -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-amber-600 block mb-1">Aguardando Confirmação</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-black text-amber-600">{{ resumo()?.agendamentosPendentesHoje || 0 }}</span>
            <span class="text-xs text-amber-600 font-medium">pendentes</span>
          </div>
        </div>

        <!-- Card 4: Faturamento -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-slate-700 block mb-1">
            {{ resumo()?.isAdmin ? 'Faturamento Total' : 'Meu Faturamento Hoje' }}
          </span>
          <div class="flex items-baseline gap-2">
            <span class="text-xl sm:text-2xl font-black text-emerald-700">
              {{ (resumo()?.faturamentoEstimadoHoje || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
            </span>
          </div>
        </div>

      </div>

      <!-- SEÇÃO EXCLUSIVA DO ADMINISTRADOR: FATURAMENTO POR ESPECIALISTA -->
      @if (resumo()?.isAdmin && resumo()?.faturamentoPorEspecialista?.length) {
        <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Acesso Restrito ao Administrador</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">
                Faturamento Discriminado por {{ setorService.termoProfissional() }}
              </h2>
            </div>
            <span class="text-xs text-slate-400">Total de {{ resumo()?.faturamentoPorEspecialista?.length }} {{ setorService.termoProfissionais() }} ativos</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (esp of resumo()?.faturamentoPorEspecialista; track esp.profissionalId) {
              <div class="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between bg-slate-50/50">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm">
                    @if (esp.fotoUrl) {
                      <img [src]="obterFotoUrl(esp.fotoUrl)" [alt]="esp.profissionalNome" class="w-full h-full object-cover" />
                    } @else {
                      <span class="font-bold text-sm text-slate-700">{{ esp.profissionalNome.substring(0, 2).toUpperCase() }}</span>
                    }
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="font-bold text-slate-900 text-sm truncate">{{ esp.profissionalNome }}</h4>
                    <p class="text-[11px] text-slate-500 truncate">{{ esp.especialidade }}</p>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span class="text-xs text-slate-500">{{ esp.totalAtendimentos }} sessões hoje</span>
                  <div class="text-right">
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Faturamento</span>
                    <span class="text-sm font-bold text-emerald-700">
                      {{ esp.totalFaturado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Próximos Atendimentos Programados -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900 mb-4">
          {{ resumo()?.isAdmin ? 'Próximos Atendimentos' : 'Minhas Próximas Sessões' }}
        </h2>

        @if (carregando()) {
          <div class="py-12 text-center text-slate-400 text-xs animate-pulse">Carregando métricas...</div>
        } @else if (!resumo()?.proximosAtendimentos?.length) {
          <p class="text-xs text-slate-400 py-6 text-center">Nenhum agendamento programado para as próximas horas ou dias.</p>
        } @else {
          <div class="space-y-3">
            @for (item of resumo()?.proximosAtendimentos; track item.id) {
              <div class="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all">
                <div class="flex items-center gap-3">
                  <div class="min-w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex flex-col items-center justify-center font-bold px-2 py-1">
                    <span class="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{{ formatarDataResumo(item.dataHoraInicio) }}</span>
                    <span class="text-xs text-slate-900 font-extrabold">{{ item.dataHoraInicio.substring(11, 16) }}</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-sm">{{ item.clienteNome }}</h4>
                    <p class="text-[11px] text-slate-500">{{ item.procedimentoTitulo }} com {{ item.profissionalNome }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold text-slate-900">
                    {{ item.valorCobrado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </span>
                  <a routerLink="/admin/agenda" class="text-xs font-semibold text-slate-900 hover:underline">
                    Gerenciar na Agenda →
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
  setorService = inject(SetorService);
  tenantService = inject(TenantService);

  resumo = signal<DashboardResumo | null>(null);
  assinatura = signal<AssinaturaStatusResponse | null>(null);
  carregando = signal<boolean>(true);
  linkCopiado = signal<boolean>(false);

  obterLinkPublico(): string {
    const link = this.tenantService.tenant()?.linkPersonalizado;
    if (link) return link;
    const slug = this.tenantService.obterSlugAtual();
    if (slug && slug !== 'agendoou' && slug !== 'estetica') {
      return `https://${slug}.sistemaagendou.com.br/`;
    }
    return typeof window !== 'undefined' ? `${window.location.origin}/catalogo` : 'https://sistemaagendou.com.br/';
  }

  copiarLinkPublico(): void {
    const link = this.obterLinkPublico();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.linkCopiado.set(true);
        setTimeout(() => this.linkCopiado.set(false), 3000);
      });
    }
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.getDashboardResumo().subscribe({
      next: (dados) => {
        this.resumo.set(dados);
        this.carregando.set(false);
        if (dados?.isAdmin) {
          this.api.obterStatusAssinatura().subscribe({
            next: (ass) => this.assinatura.set(ass),
            error: (err) => console.warn('Status assinatura:', err)
          });
        }
      },
      error: (err) => {
        console.error(err);
        this.carregando.set(false);
      }
    });
  }

  obterFotoUrl(url?: string): string {
    return this.api.formatarUrlImagem(url);
  }

  formatarDataResumo(dataStr: string): string {
    if (!dataStr) return '';
    try {
      const data = new Date(dataStr);
      const hoje = new Date();
      const amanha = new Date();
      amanha.setDate(hoje.getDate() + 1);

      if (data.toDateString() === hoje.toDateString()) return 'Hoje';
      if (data.toDateString() === amanha.toDateString()) return 'Amanhã';

      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes}`;
    } catch {
      return '';
    }
  }
}
