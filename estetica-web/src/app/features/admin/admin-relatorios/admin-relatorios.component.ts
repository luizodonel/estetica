import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  RelatorioGeralResponse,
  RelatorioEspecialista,
  RelatorioEspecialistaItem,
  Profissional
} from '../../../core/models';

@Component({
  selector: 'app-admin-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto space-y-6">

        <!-- Navegação Superior -->
        <div class="flex items-center justify-between">
          <a routerLink="/admin/dashboard" class="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors">
            <span>←</span> Voltar para o Painel
          </a>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            📊 Gestão Financeira & Operacional
          </span>
        </div>

        <!-- Cabeçalho Principal -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-nude-200">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span class="text-[11px] font-bold tracking-widest text-rose-600 uppercase block mb-1">
                Relatórios Gerenciais
              </span>
              <h1 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Relatório de Especialistas & Faturamento
              </h1>
              <p class="text-xs sm:text-sm text-stone-500 mt-1">
                Consulte o faturamento, procedimentos realizados, dias e horários de cada especialista ou de toda a equipe.
              </p>
            </div>

            <!-- Botões de Ação / Exportação Geral -->
            <div class="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                (click)="carregarRelatorio()"
                [disabled]="carregando()"
                class="px-4 py-2.5 rounded-xl border border-nude-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-2 transition-all">
                <span [class.animate-spin]="carregando()">🔄</span> Atualizar
              </button>

              <button
                type="button"
                (click)="exportarPdfGeral()"
                [disabled]="carregando() || !relatorio()?.especialistas?.length"
                class="px-5 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50">
                <span>📄</span> Gerar PDF Geral
              </button>
            </div>
          </div>

          <!-- Barra de Filtros -->
          <div class="mt-6 pt-6 border-t border-nude-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <!-- Filtro: Especialista -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1.5">Especialista:</label>
              <select
                [(ngModel)]="filtroProfissionalId"
                (change)="carregarRelatorio()"
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 bg-stone-50 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option [ngValue]="null">Todos os Especialistas (Geral)</option>
                @for (prof of profissionais(); track prof.id) {
                  <option [ngValue]="prof.id">{{ prof.nome }} ({{ prof.especialidade }})</option>
                }
              </select>
            </div>

            <!-- Filtro: Data Início -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1.5">Data Início:</label>
              <input
                type="date"
                [(ngModel)]="filtroDataInicio"
                (change)="carregarRelatorio()"
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 bg-stone-50 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400" />
            </div>

            <!-- Filtro: Data Fim -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1.5">Data Fim:</label>
              <input
                type="date"
                [(ngModel)]="filtroDataFim"
                (change)="carregarRelatorio()"
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 bg-stone-50 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400" />
            </div>

            <!-- Filtro Rápido de Períodos -->
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1.5">Atalho de Período:</label>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  (click)="definirPeriodo('hoje')"
                  class="px-2.5 py-1.5 rounded-lg border border-nude-300 text-[11px] font-semibold text-stone-600 hover:bg-stone-50">
                  Hoje
                </button>
                <button
                  type="button"
                  (click)="definirPeriodo('mes')"
                  class="px-2.5 py-1.5 rounded-lg border border-nude-300 text-[11px] font-semibold text-stone-600 hover:bg-stone-50">
                  Este Mês
                </button>
                <button
                  type="button"
                  (click)="definirPeriodo('30d')"
                  class="px-2.5 py-1.5 rounded-lg border border-nude-300 text-[11px] font-semibold text-stone-600 hover:bg-stone-50">
                  Últimos 30d
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Loading State -->
        @if (carregando()) {
          <div class="py-16 text-center">
            <div class="inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs text-stone-400 mt-3 font-medium">Processando métricas e relatórios...</p>
          </div>
        }

        <!-- Conteúdo do Relatório -->
        @if (!carregando() && relatorio(); as rel) {

          <!-- Cards de Métricas Gerais -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-gradient-to-br from-rose-50 to-champagne-50 rounded-3xl p-5 border border-rose-200 shadow-sm">
              <span class="text-[10px] uppercase tracking-wider font-bold text-rose-700 block mb-1">Faturamento Geral</span>
              <span class="text-xl sm:text-2xl font-serif font-black text-rose-900 block">
                {{ rel.totalFaturadoGeral | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </span>
              <span class="text-[11px] text-stone-500 mt-0.5 block">Período selecionado</span>
            </div>

            <div class="bg-white rounded-3xl p-5 border border-nude-200 shadow-sm">
              <span class="text-[10px] uppercase tracking-wider font-bold text-stone-400 block mb-1">Total de Atendimentos</span>
              <span class="text-xl sm:text-2xl font-serif font-black text-stone-900 block">
                {{ rel.totalAtendimentosGeral }}
              </span>
              <span class="text-[11px] text-stone-500 mt-0.5 block">Sessões realizadas</span>
            </div>

            <div class="bg-white rounded-3xl p-5 border border-nude-200 shadow-sm">
              <span class="text-[10px] uppercase tracking-wider font-bold text-stone-400 block mb-1">Ticket Médio</span>
              <span class="text-xl sm:text-2xl font-serif font-black text-emerald-700 block">
                {{ rel.ticketMedioGeral | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </span>
              <span class="text-[11px] text-stone-500 mt-0.5 block">Por atendimento</span>
            </div>

            <div class="bg-white rounded-3xl p-5 border border-nude-200 shadow-sm">
              <span class="text-[10px] uppercase tracking-wider font-bold text-stone-400 block mb-1">Especialistas</span>
              <span class="text-xl sm:text-2xl font-serif font-black text-stone-900 block">
                {{ rel.especialistas.length }}
              </span>
              <span class="text-[11px] text-stone-500 mt-0.5 block">No relatório</span>
            </div>

          </div>

          <!-- Listagem por Especialista -->
          <div class="space-y-6">
            @for (esp of rel.especialistas; track esp.profissionalId) {
              <div class="bg-white rounded-3xl border border-nude-200 shadow-sm overflow-hidden">
                
                <!-- Cabeçalho do Especialista -->
                <div class="p-5 sm:p-6 bg-stone-50/70 border-b border-nude-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl overflow-hidden bg-rose-50 border-2 flex items-center justify-center font-bold text-rose-700 text-sm shadow-sm shrink-0"
                         [style.borderColor]="esp.corIdentificacao || '#e11d48'">
                      @if (esp.fotoUrl) {
                        <img [src]="obterFotoUrl(esp.fotoUrl)" [alt]="esp.profissionalNome" class="w-full h-full object-cover" />
                      } @else {
                        {{ esp.profissionalNome.substring(0, 2).toUpperCase() }}
                      }
                    </div>

                    <div>
                      <h3 class="font-serif text-lg font-bold text-stone-900">{{ esp.profissionalNome }}</h3>
                      <p class="text-xs text-stone-500">{{ esp.especialidade }}</p>
                    </div>
                  </div>

                  <!-- Resumo Financeiro do Especialista & Botão PDF Individual -->
                  <div class="flex flex-wrap items-center gap-4">
                    <div class="text-left sm:text-right">
                      <span class="text-[10px] uppercase font-bold text-stone-400 block">Faturamento</span>
                      <span class="text-base font-serif font-bold text-emerald-700">
                        {{ esp.totalFaturado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                      </span>
                    </div>

                    <div class="text-left sm:text-right border-l border-nude-200 pl-4">
                      <span class="text-[10px] uppercase font-bold text-stone-400 block">Sessões</span>
                      <span class="text-sm font-bold text-stone-800">
                        {{ esp.totalAtendimentos }}
                      </span>
                    </div>

                    <div class="text-left sm:text-right border-l border-nude-200 pl-4">
                      <span class="text-[10px] uppercase font-bold text-stone-400 block">Ticket Médio</span>
                      <span class="text-sm font-bold text-stone-800">
                        {{ esp.ticketMedio | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                      </span>
                    </div>

                    <!-- Botão de PDF Individual -->
                    <button
                      type="button"
                      (click)="exportarPdfIndividual(esp)"
                      class="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm">
                      <span>📄</span> PDF Individual
                    </button>
                  </div>
                </div>

                <!-- Tabela de Atendimentos Detalhados -->
                @if (esp.atendimentos.length === 0) {
                  <div class="py-8 text-center text-xs text-stone-400 font-medium">
                    Nenhum atendimento registrado para este especialista no período selecionado.
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr class="border-b border-nude-200 bg-stone-50/40 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          <th class="py-3 px-4">Data & Horário</th>
                          <th class="py-3 px-4">Cliente</th>
                          <th class="py-3 px-4">Procedimento Realizado</th>
                          <th class="py-3 px-4 text-center">Duração</th>
                          <th class="py-3 px-4 text-center">Status</th>
                          <th class="py-3 px-4 text-right">Valor Cobrado</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-nude-100">
                        @for (item of esp.atendimentos; track item.agendamentoId) {
                          <tr class="hover:bg-stone-50/60 transition-colors">
                            <!-- Data e Horário -->
                            <td class="py-3 px-4 whitespace-nowrap">
                              <span class="font-bold text-stone-800 block">
                                {{ formatarData(item.dataHoraInicio) }}
                              </span>
                              <span class="text-[11px] text-stone-400 font-mono">
                                {{ formatarHora(item.dataHoraInicio) }} - {{ formatarHora(item.dataHoraFim) }}
                              </span>
                            </td>

                            <!-- Cliente -->
                            <td class="py-3 px-4 whitespace-nowrap">
                              <span class="font-semibold text-stone-800 block">{{ item.clienteNome }}</span>
                              @if (item.clienteWhatsApp) {
                                <span class="text-[11px] text-stone-400">{{ formatarTelefone(item.clienteWhatsApp) }}</span>
                              }
                            </td>

                            <!-- Procedimento -->
                            <td class="py-3 px-4">
                              <span class="font-medium text-stone-800 block">{{ item.procedimentoTitulo }}</span>
                              <span class="text-[10px] text-stone-400 uppercase tracking-wider">{{ item.categoriaNome }}</span>
                            </td>

                            <!-- Duração -->
                            <td class="py-3 px-4 text-center whitespace-nowrap text-stone-600">
                              {{ item.duracaoMinutos }} min
                            </td>

                            <!-- Status -->
                            <td class="py-3 px-4 text-center whitespace-nowrap">
                              <span [class]="obterBadgeClass(item.status)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {{ item.status }}
                              </span>
                            </td>

                            <!-- Valor Cobrado -->
                            <td class="py-3 px-4 text-right whitespace-nowrap font-bold text-stone-900">
                              {{ item.valorCobrado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                            </td>
                          </tr>
                        }
                      </tbody>
                      <!-- Rodapé do Especialista -->
                      <tfoot>
                        <tr class="bg-stone-50/90 font-bold border-t border-nude-200 text-stone-800">
                          <td colspan="5" class="py-3 px-4 text-right uppercase text-[10px] text-stone-500">
                            Subtotal {{ esp.profissionalNome }}:
                          </td>
                          <td class="py-3 px-4 text-right text-emerald-700 font-bold text-sm">
                            {{ esp.totalFaturado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                }

              </div>
            }
          </div>

        }

      </div>
    </div>
  `
})
export class AdminRelatoriosComponent implements OnInit {
  private api = inject(ApiService);
  tenantService = inject(TenantService);
  authService = inject(AuthService);

  carregando = signal<boolean>(true);
  relatorio = signal<RelatorioGeralResponse | null>(null);
  profissionais = signal<Profissional[]>([]);

  filtroProfissionalId: number | null = null;
  filtroDataInicio: string = '';
  filtroDataFim: string = '';

  ngOnInit(): void {
    this.definirPeriodo('mes');
    this.carregarProfissionais();
    this.carregarRelatorio();
  }

  definirPeriodo(tipo: 'hoje' | 'mes' | '30d'): void {
    const hoje = new Date();
    const formatar = (d: Date) => d.toISOString().substring(0, 10);

    if (tipo === 'hoje') {
      this.filtroDataInicio = formatar(hoje);
      this.filtroDataFim = formatar(hoje);
    } else if (tipo === 'mes') {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      this.filtroDataInicio = formatar(primeiroDia);
      this.filtroDataFim = formatar(hoje);
    } else if (tipo === '30d') {
      const data30d = new Date();
      data30d.setDate(hoje.getDate() - 30);
      this.filtroDataInicio = formatar(data30d);
      this.filtroDataFim = formatar(hoje);
    }
  }

  carregarProfissionais(): void {
    this.api.getProfissionais().subscribe({
      next: (dados) => this.profissionais.set(dados),
      error: (err) => console.error('Erro ao carregar especialistas:', err)
    });
  }

  carregarRelatorio(): void {
    this.carregando.set(true);
    this.api.getRelatorioEspecialistas({
      dataInicio: this.filtroDataInicio,
      dataFim: this.filtroDataFim,
      profissionalId: this.filtroProfissionalId
    }).subscribe({
      next: (dados) => {
        this.relatorio.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar relatório:', err);
        this.carregando.set(false);
      }
    });
  }

  obterFotoUrl(url?: string): string {
    return this.api.formatarUrlImagem(url);
  }

  formatarData(dataStr: string): string {
    if (!dataStr) return '—';
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  }

  formatarHora(dataStr: string): string {
    if (!dataStr || dataStr.length < 16) return '—';
    return dataStr.substring(11, 16);
  }

  formatarTelefone(tel?: string): string {
    if (!tel) return '';
    const d = tel.replace(/\D/g, '');
    if (d.length === 11) return `(${d.substring(0, 2)}) ${d.substring(2, 7)}-${d.substring(7)}`;
    if (d.length === 10) return `(${d.substring(0, 2)}) ${d.substring(2, 6)}-${d.substring(6)}`;
    return tel;
  }

  obterBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMADO':
      case 'CONCLUIDO':
        return 'bg-emerald-100 text-emerald-800';
      case 'PENDENTE':
        return 'bg-amber-100 text-amber-800';
      case 'CANCELADO':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  }

  // =========================================================================
  // GERAÇÃO E IMPRESSÃO DE PDF (GERAL E INDIVIDUAL)
  // =========================================================================
  exportarPdfGeral(): void {
    const dados = this.relatorio();
    if (!dados || !dados.especialistas.length) return;
    this.gerarJanelaImpressaoPdf(dados, null);
  }

  exportarPdfIndividual(esp: RelatorioEspecialista): void {
    const dados = this.relatorio();
    if (!dados) return;
    this.gerarJanelaImpressaoPdf(dados, esp);
  }

  private gerarJanelaImpressaoPdf(dados: RelatorioGeralResponse, espEspecifico: RelatorioEspecialista | null): void {
    const nomeEmpresa = dados.nomeEmpresa || this.tenantService.nomeEmpresa() || 'Estabelecimento';
    const especialistas = espEspecifico ? [espEspecifico] : dados.especialistas;
    const tituloRelatorio = espEspecifico
      ? `Relatório Individual de Atendimentos — ${espEspecifico.profissionalNome}`
      : 'Relatório Consolidado de Atendimentos & Faturamento';

    const periodoFormatado = `De ${this.formatarData(dados.dataInicio)} até ${this.formatarData(dados.dataFim)}`;
    const emissao = new Date().toLocaleString('pt-BR');

    let totalGeral = 0;
    let qtdGeral = 0;

    let tabelaHtml = '';

    for (const esp of especialistas) {
      totalGeral += esp.totalFaturado;
      qtdGeral += esp.totalAtendimentos;

      tabelaHtml += `
        <div style="margin-top: 24px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f5f5f4; padding: 10px 14px; border-left: 4px solid #e11d48; margin-bottom: 6px;">
            <div>
              <strong style="font-size: 14px; color: #1c1917;">${esp.profissionalNome}</strong>
              <span style="font-size: 12px; color: #78716c; margin-left: 8px;">(${esp.especialidade})</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: #78716c;">Atendimentos: <strong>${esp.totalAtendimentos}</strong> | Total: <strong style="color: #047857; font-size: 14px;">R$ ${esp.totalFaturado.toFixed(2).replace('.', ',')}</strong></span>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;">
            <thead>
              <tr style="background-color: #fafaf9; border-bottom: 1px solid #e7e5e4; color: #78716c; text-transform: uppercase;">
                <th style="padding: 6px 8px; text-align: left;">Data / Hora</th>
                <th style="padding: 6px 8px; text-align: left;">Cliente</th>
                <th style="padding: 6px 8px; text-align: left;">WhatsApp</th>
                <th style="padding: 6px 8px; text-align: left;">Procedimento</th>
                <th style="padding: 6px 8px; text-align: center;">Duração</th>
                <th style="padding: 6px 8px; text-align: center;">Status</th>
                <th style="padding: 6px 8px; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${esp.atendimentos.map(item => `
                <tr style="border-bottom: 1px solid #f5f5f4;">
                  <td style="padding: 6px 8px; font-weight: bold; color: #292524;">${this.formatarData(item.dataHoraInicio)} <span style="font-weight: normal; color: #78716c;">${this.formatarHora(item.dataHoraInicio)}</span></td>
                  <td style="padding: 6px 8px; color: #1c1917;">${item.clienteNome}</td>
                  <td style="padding: 6px 8px; color: #78716c;">${this.formatarTelefone(item.clienteWhatsApp)}</td>
                  <td style="padding: 6px 8px; color: #1c1917;">${item.procedimentoTitulo}</td>
                  <td style="padding: 6px 8px; text-align: center; color: #78716c;">${item.duracaoMinutos}m</td>
                  <td style="padding: 6px 8px; text-align: center;"><span style="background: #f5f5f4; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">${item.status}</span></td>
                  <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #1c1917;">R$ ${item.valorCobrado.toFixed(2).replace('.', ',')}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #fafaf9; font-weight: bold; border-top: 1px solid #e7e5e4;">
                <td colspan="6" style="padding: 6px 8px; text-align: right; color: #78716c;">Subtotal de ${esp.profissionalNome}:</td>
                <td style="padding: 6px 8px; text-align: right; color: #047857; font-size: 12px;">R$ ${esp.totalFaturado.toFixed(2).replace('.', ',')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }

    const htmlImpressao = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>${tituloRelatorio} - ${nomeEmpresa}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1c1917; margin: 0; padding: 0; background: #fff; }
          .header { border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          .empresa { font-size: 20px; font-weight: bold; color: #1c1917; }
          .titulo { font-size: 14px; font-weight: bold; color: #e11d48; margin-top: 4px; }
          .meta { font-size: 10px; color: #78716c; text-align: right; }
          .resumo-geral { display: flex; gap: 12px; margin-bottom: 16px; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 14px; }
          .resumo-card { flex: 1; }
          .resumo-label { font-size: 9px; text-transform: uppercase; color: #78716c; font-weight: bold; }
          .resumo-valor { font-size: 15px; font-weight: bold; color: #1c1917; margin-top: 2px; }
          .footer { margin-top: 30px; border-top: 1px solid #e7e5e4; padding-top: 8px; font-size: 9px; color: #a8a29e; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="empresa">${nomeEmpresa}</div>
            <div class="titulo">${tituloRelatorio}</div>
          </div>
          <div class="meta">
            <div><strong>Período:</strong> ${periodoFormatado}</div>
            <div><strong>Emissão:</strong> ${emissao}</div>
          </div>
        </div>

        <div class="resumo-geral">
          <div class="resumo-card">
            <div class="resumo-label">Faturamento Total</div>
            <div class="resumo-valor" style="color: #047857;">R$ ${totalGeral.toFixed(2).replace('.', ',')}</div>
          </div>
          <div class="resumo-card">
            <div class="resumo-label">Total de Atendimentos</div>
            <div class="resumo-valor">${qtdGeral}</div>
          </div>
          <div class="resumo-card">
            <div class="resumo-label">Especialistas</div>
            <div class="resumo-valor">${especialistas.length}</div>
          </div>
        </div>

        ${tabelaHtml}

        <div class="footer">
          <span>${nomeEmpresa} • Sistema de Agendamentos & Gestão</span>
          <span>Página gerada em ${emissao}</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const janela = window.open('', '_blank', 'width=900,height=750');
    if (janela) {
      janela.document.open();
      janela.document.write(htmlImpressao);
      janela.document.close();
    }
  }
}
