import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { SetorService } from '../../core/services/setor.service';
import { Categoria, Procedimento, Profissional, SlotDisponivel } from '../../core/models';

interface DiaCarrossel {
  dataStr: string;
  diaSemana: string;
  diaMes: string;
  mes: string;
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#f8fafc] text-stone-800 flex flex-col">
      
      <!-- ========================================================================= -->
      <!-- TOP BANNER (ADMIN ONLY) -->
      <!-- ========================================================================= -->
      @if (authService.isAdmin()) {
        <div class="bg-stone-900 text-white text-xs px-4 py-2 flex items-center justify-between z-30">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-semibold">Modo de VisualizaÃ§Ã£o do CatÃ¡logo & Agendamento do Estabelecimento</span>
          </div>
          <div class="flex items-center gap-3">
            <a routerLink="/admin/gestao" class="text-stone-300 hover:text-white underline">Painel de GestÃ£o</a>
            <button (click)="abrirModalBanner()" class="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] font-semibold border border-stone-700">
              âœï¸ Editar Banner
            </button>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- CORPO PRINCIPAL RESPONSIVO (DESKTOP: 3 COLUNAS, TABLET: 2 COLUNAS, MOBILE: 1 COLUNA) -->
      <!-- ========================================================================= -->
      <div class="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-screen">
        
        <!-- --------------------------------------------------------------------- -->
        <!-- COLUNA 1: SIDEBAR LATERAL ESQUERDA (DESKTOP >= 1024px) -->
        <!-- --------------------------------------------------------------------- -->
        <aside class="hidden lg:flex flex-col w-72 xl:w-80 bg-white border-r border-slate-200 p-6 shrink-0 sticky top-0 h-screen overflow-y-auto">
          
          <!-- Logo & Nome da Empresa -->
          <div class="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div class="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-sm overflow-hidden mb-3">
              @if (tenantService.logoUrl()) {
                <img [src]="tenantService.logoUrl()" [alt]="tenantService.nomeEmpresa()" class="w-full h-full object-contain" />
              } @else {
                <div class="text-3xl text-rose-500">ðŸŒ¸</div>
              }
            </div>
            
            <h1 class="font-serif text-lg xl:text-xl font-bold text-stone-900 leading-snug">
              {{ tenantService.nomeEmpresa() }}
            </h1>
            <span class="text-[10px] uppercase font-bold tracking-wider text-rose-600 mt-1">
              {{ setorService.config().label }}
            </span>
          </div>

          <!-- InformaÃ§Ãµes de EndereÃ§o & HorÃ¡rio -->
          <div class="py-5 border-b border-slate-100 space-y-3 text-xs text-stone-600">
            <div class="flex items-start gap-2.5">
              <span class="text-stone-400 text-sm shrink-0">ðŸ“</span>
              <span class="leading-relaxed">
                {{ enderecoLoja() }}
              </span>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="text-stone-400 text-sm shrink-0">ðŸ•’</span>
              <div>
                <span class="block text-stone-700 font-semibold">HorÃ¡rio de funcionamento</span>
                <span class="text-[11px] text-stone-500">09:00 Ã s 19:00</span>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Aberto agora
              </span>
            </div>
          </div>

          <!-- Menu Vertical de Categorias (Desktop) -->
          <div class="pt-5 flex-1">
            <span class="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-3 px-2">
              Categorias
            </span>

            <nav class="space-y-1">
              <button
                type="button"
                (click)="filtrarCategoria(null)"
                [class.bg-[#1e293b]]="categoriaSelecionada() === null"
                [class.text-white]="categoriaSelecionada() === null"
                [class.shadow-sm]="categoriaSelecionada() === null"
                [class.text-stone-600]="categoriaSelecionada() !== null"
                [class.hover:bg-slate-100]="categoriaSelecionada() !== null"
                class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left">
                <span class="text-sm">ðŸ§­</span>
                <span>Todos os ServiÃ§os</span>
              </button>

              @for (cat of categorias(); track cat.id) {
                <button
                  type="button"
                  (click)="filtrarCategoria(cat.id)"
                  [class.bg-[#1e293b]]="categoriaSelecionada() === cat.id"
                  [class.text-white]="categoriaSelecionada() === cat.id"
                  [class.shadow-sm]="categoriaSelecionada() === cat.id"
                  [class.text-stone-600]="categoriaSelecionada() !== cat.id"
                  [class.hover:bg-slate-100]="categoriaSelecionada() !== cat.id"
                  class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left">
                  <span class="text-sm">{{ cat.icone || 'âœ¨' }}</span>
                  <span class="truncate">{{ cat.nome }}</span>
                </button>
              }
            </nav>
          </div>

        </aside>

        <!-- --------------------------------------------------------------------- -->
        <!-- COLUNA 2: CONTEÃšDO CENTRAL (CATÃLOGO DE SERVIÃ‡OS) -->
        <!-- --------------------------------------------------------------------- -->
        <main class="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          <!-- HEADER COMPACTO PARA TABLET & MOBILE (< 1024px) -->
          <div class="lg:hidden mb-5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                @if (tenantService.logoUrl()) {
                  <img [src]="tenantService.logoUrl()" [alt]="tenantService.nomeEmpresa()" class="w-full h-full object-contain" />
                } @else {
                  <div class="text-2xl text-rose-500">ðŸŒ¸</div>
                }
              </div>
              <div>
                <h1 class="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  {{ tenantService.nomeEmpresa() }}
                </h1>
                <p class="text-[11px] text-stone-500 truncate max-w-[200px] sm:max-w-xs mt-0.5">
                  {{ enderecoLoja() }}
                </p>
              </div>
            </div>

            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Aberto
            </span>
          </div>

          <!-- BARRA DE BUSCA -->
          <div class="relative mb-6">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              [(ngModel)]="termoBusca"
              placeholder="Buscar serviÃ§o por nome ou descriÃ§Ã£o..."
              class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent shadow-sm" />
          </div>

          <!-- PÃLULAS DE CATEGORIAS (TABLET & MOBILE) -->
          <div class="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            <button
              type="button"
              (click)="filtrarCategoria(null)"
              [class.bg-[#1e293b]]="categoriaSelecionada() === null"
              [class.text-white]="categoriaSelecionada() === null"
              [class.bg-white]="categoriaSelecionada() !== null"
              [class.text-stone-700]="categoriaSelecionada() !== null"
              class="px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 whitespace-nowrap shadow-sm transition-all">
              Todos
            </button>
            @for (cat of categorias(); track cat.id) {
              <button
                type="button"
                (click)="filtrarCategoria(cat.id)"
                [class.bg-[#1e293b]]="categoriaSelecionada() === cat.id"
                [class.text-white]="categoriaSelecionada() === cat.id"
                [class.bg-white]="categoriaSelecionada() !== cat.id"
                [class.text-stone-700]="categoriaSelecionada() !== cat.id"
                class="px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5">
                <span>{{ cat.icone || 'âœ¨' }}</span>
                <span>{{ cat.nome }}</span>
              </button>
            }
          </div>

          <!-- LISTAGEM DE SERVIÃ‡OS / PROCEDIMENTOS -->
          @if (carregando()) {
            <div class="space-y-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-32"></div>
              }
            </div>
          } @else if (procedimentosFiltrados().length === 0) {
            <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <span class="text-3xl">ðŸ”</span>
              <h3 class="font-serif font-bold text-base text-stone-800">Nenhum serviÃ§o encontrado</h3>
              <p class="text-xs text-stone-500">Tente buscar por outro termo ou selecione outra categoria.</p>
            </div>
          } @else {
            
            <!-- Grid Responsivo: Lista Horizontal no Desktop e Grid no Tablet -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-4">
              @for (proc of procedimentosFiltrados(); track proc.id) {
                <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center group">
                  
                  <!-- Foto e Textos -->
                  <div class="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <div class="w-24 sm:w-32 h-24 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 relative">
                      <img
                        [src]="formatarUrl(proc.imagemUrl) || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600'"
                        [alt]="proc.titulo"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-semibold text-stone-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          â±ï¸ {{ proc.duracaoMinutos }} min
                        </span>
                        @if (proc.categoriaNome) {
                          <span class="text-[10px] font-medium text-stone-400">
                            â€¢ {{ proc.categoriaNome }}
                          </span>
                        }
                      </div>

                      <h3 class="font-serif font-bold text-sm sm:text-base text-stone-900 group-hover:text-rose-600 transition-colors leading-snug">
                        {{ proc.titulo }}
                      </h3>

                      <p class="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {{ proc.descricao || 'ServiÃ§o especializado com profissionais certificados e produtos de primeira linha.' }}
                      </p>

                      <div class="mt-2 sm:hidden flex items-center justify-between">
                        <span class="text-sm font-bold text-stone-900">
                          {{ proc.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                        </span>
                        <button
                          type="button"
                          (click)="alternarServico(proc)"
                          [class.bg-emerald-600]="isServicoSelecionado(proc.id)"
                          [class.text-white]="isServicoSelecionado(proc.id)"
                          [class.bg-slate-100]="!isServicoSelecionado(proc.id)"
                          [class.text-stone-800]="!isServicoSelecionado(proc.id)"
                          class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                          {{ isServicoSelecionado(proc.id) ? 'âœ“ Adicionado' : '+ Adicionar' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- PreÃ§o e BotÃ£o Adicionar (Desktop / Tablet) -->
                  <div class="hidden sm:flex flex-col items-end gap-2 shrink-0 pl-2">
                    <span class="font-serif font-bold text-base sm:text-lg text-stone-900">
                      {{ proc.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </span>

                    <button
                      type="button"
                      (click)="alternarServico(proc)"
                      [class.bg-emerald-600]="isServicoSelecionado(proc.id)"
                      [class.text-white]="isServicoSelecionado(proc.id)"
                      [class.bg-slate-100]="!isServicoSelecionado(proc.id)"
                      [class.hover:bg-slate-200]="!isServicoSelecionado(proc.id)"
                      [class.text-stone-800]="!isServicoSelecionado(proc.id)"
                      class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                      @if (isServicoSelecionado(proc.id)) {
                        <span>âœ“ Adicionado</span>
                      } @else {
                        <span>+ Adicionar</span>
                      }
                    </button>
                  </div>

                </div>
              }
            </div>
          }

        </main>

        <!-- --------------------------------------------------------------------- -->
        <!-- COLUNA 3: PAINEL "SEU AGENDAMENTO" (DESKTOP & TABLET >= 768px) -->
        <!-- --------------------------------------------------------------------- -->
        <aside class="hidden md:flex flex-col w-84 xl:w-96 bg-white border-l border-slate-200 p-6 shrink-0 sticky top-0 h-screen overflow-y-auto">
          <ng-container *ngTemplateOutlet="painelAgendamentoConteudo"></ng-container>
        </aside>

      </div>

      <!-- ========================================================================= -->
      <!-- MOBILE BOTTOM STICKY BAR (< 768px) -->
      <!-- ========================================================================= -->
      @if (servicosSelecionados().length > 0) {
        <div class="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl z-40 flex items-center justify-between gap-3">
          <div>
            <span class="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">Total</span>
            <div class="flex items-baseline gap-1.5">
              <span class="font-serif text-base font-bold text-stone-900">
                {{ totalPreco() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </span>
              <span class="text-[10px] text-stone-500">({{ servicosSelecionados().length }} serviÃ§o{{ servicosSelecionados().length > 1 ? 's' : '' }})</span>
            </div>
          </div>

          <button
            type="button"
            (click)="gavetaMobileAberta.set(true)"
            class="px-6 py-3 rounded-2xl bg-[#2d7a58] hover:bg-[#236347] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2">
            <span>Continuar</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- DRAWER / MODAL MOBILE DO AGENDAMENTO (< 768px) -->
      <!-- ========================================================================= -->
      @if (gavetaMobileAberta()) {
        <div class="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-slate-200 animate-slide-up">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 class="font-serif font-bold text-lg text-stone-900">Seu Agendamento</h2>
              <button (click)="gavetaMobileAberta.set(false)" class="text-stone-400 hover:text-stone-700 p-2 text-lg font-bold">âœ•</button>
            </div>

            <ng-container *ngTemplateOutlet="painelAgendamentoConteudo"></ng-container>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- TEMPLATE REUTILIZÃVEL: PAINEL SEU AGENDAMENTO -->
      <!-- ========================================================================= -->
      <ng-template #painelAgendamentoConteudo>
        <div class="space-y-6">
          
          <!-- TÃ­tulo do Painel -->
          <div class="hidden md:flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 class="font-serif font-bold text-lg text-stone-900">Seu Agendamento</h2>
            @if (servicosSelecionados().length > 0) {
              <button (click)="limparServicos()" class="text-[11px] text-stone-400 hover:text-rose-600 transition-colors">
                Limpar
              </button>
            }
          </div>

          <!-- ServiÃ§os Selecionados -->
          @if (servicosSelecionados().length === 0) {
            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <span class="text-2xl">ðŸ’†</span>
              <p class="text-xs text-stone-600 font-semibold">Nenhum serviÃ§o selecionado</p>
              <p class="text-[11px] text-stone-400">Clique em "+ Adicionar" nos serviÃ§os do catÃ¡logo ao lado para agendar seu horÃ¡rio.</p>
            </div>
          } @else {
            <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              @for (item of servicosSelecionados(); track item.id) {
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2.5">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img
                      [src]="formatarUrl(item.imagemUrl) || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=200'"
                      class="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div class="min-w-0">
                      <span class="text-xs font-semibold text-stone-800 block truncate">{{ item.titulo }}</span>
                      <span class="text-[10px] text-stone-400">â±ï¸ {{ item.duracaoMinutos }} min</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-xs font-bold text-stone-900">{{ item.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                    <button (click)="removerServico(item.id)" class="text-stone-400 hover:text-rose-600 p-1 text-xs">âœ•</button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- SELEÃ‡ÃƒO DE PROFISSIONAL -->
          @if (servicosSelecionados().length > 0) {
            <div>
              <span class="text-xs font-bold text-stone-900 block mb-2.5">
                Selecione o Profissional
              </span>

              <div class="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                
                <!-- Qualquer Profissional -->
                <button
                  type="button"
                  (click)="selecionarProfissional(null)"
                  [class.border-[#1e293b]]="profissionalSelecionado() === null"
                  [class.bg-slate-100]="profissionalSelecionado() === null"
                  class="flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-2xl border-2 border-transparent transition-all">
                  <div class="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-stone-600 text-lg shadow-sm">
                    ðŸ‘¤
                  </div>
                  <span class="text-[10px] font-medium text-stone-600 text-center max-w-[64px] leading-tight">
                    Qualquer Profissional
                  </span>
                </button>

                <!-- Profissionais Habilitados -->
                @for (prof of profissionais(); track prof.id) {
                  <button
                    type="button"
                    (click)="selecionarProfissional(prof)"
                    [class.border-[#1e293b]]="profissionalSelecionado()?.id === prof.id"
                    [class.bg-slate-50]="profissionalSelecionado()?.id === prof.id"
                    class="flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-2xl border-2 border-transparent transition-all">
                    <img
                      [src]="formatarUrl(prof.fotoUrl) || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'"
                      [alt]="prof.nome"
                      class="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm" />
                    <span class="text-[10px] font-medium text-stone-700 text-center max-w-[64px] truncate leading-tight">
                      {{ prof.nome.split(' ')[0] }}
                    </span>
                  </button>
                }
              </div>
            </div>

            <!-- SELEÃ‡ÃƒO DE DATAS -->
            <div>
              <span class="text-xs font-bold text-stone-900 block mb-2.5">
                Datas
              </span>

              <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                @for (dia of diasCarrossel(); track dia.dataStr) {
                  <button
                    type="button"
                    (click)="selecionarData(dia.dataStr)"
                    [class.bg-[#1e293b]]="dataSelecionada() === dia.dataStr"
                    [class.text-white]="dataSelecionada() === dia.dataStr"
                    [class.bg-white]="dataSelecionada() !== dia.dataStr"
                    [class.text-stone-700]="dataSelecionada() !== dia.dataStr"
                    class="flex flex-col items-center justify-center min-w-[50px] py-2 px-1.5 rounded-xl border border-slate-200 shadow-sm transition-all shrink-0">
                    <span class="text-[10px] uppercase font-bold tracking-wider opacity-70">{{ dia.diaSemana }}</span>
                    <span class="text-sm font-extrabold mt-0.5">{{ dia.diaMes }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- SELEÃ‡ÃƒO DE HORÃRIOS -->
            <div>
              <span class="text-xs font-bold text-stone-900 block mb-2">
                HorÃ¡rios DisponÃ­veis
              </span>

              @if (carregandoSlots()) {
                <div class="py-6 text-center text-xs text-stone-400">
                  <div class="inline-block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-1"></div>
                  <p>Buscando horÃ¡rios disponÃ­veis...</p>
                </div>
              } @else if (slots().length === 0) {
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-stone-500">
                  Sem horÃ¡rios livres nesta data. Selecione outro dia acima.
                </div>
              } @else {
                
                <!-- ManhÃ£ -->
                @if (slotsManha().length > 0) {
                  <div class="mb-3">
                    <span class="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">ManhÃ£</span>
                    <div class="grid grid-cols-4 gap-1.5">
                      @for (slot of slotsManha(); track slot.horarioInicio) {
                        <button
                          type="button"
                          (click)="selecionarSlot(slot)"
                          [class.bg-[#1e293b]]="slotSelecionado()?.horarioInicio === slot.horarioInicio"
                          [class.text-white]="slotSelecionado()?.horarioInicio === slot.horarioInicio"
                          [class.bg-slate-100]="slotSelecionado()?.horarioInicio !== slot.horarioInicio"
                          [class.text-stone-700]="slotSelecionado()?.horarioInicio !== slot.horarioInicio"
                          class="py-1.5 rounded-lg text-xs font-semibold text-center hover:bg-slate-200 transition-all">
                          {{ formatarHora(slot.horarioInicio) }}
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Tarde -->
                @if (slotsTarde().length > 0) {
                  <div>
                    <span class="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">Tarde</span>
                    <div class="grid grid-cols-4 gap-1.5">
                      @for (slot of slotsTarde(); track slot.horarioInicio) {
                        <button
                          type="button"
                          (click)="selecionarSlot(slot)"
                          [class.bg-[#1e293b]]="slotSelecionado()?.horarioInicio === slot.horarioInicio"
                          [class.text-white]="slotSelecionado()?.horarioInicio === slot.horarioInicio"
                          [class.bg-slate-100]="slotSelecionado()?.horarioInicio !== slot.horarioInicio"
                          [class.text-stone-700]="slotSelecionado()?.horarioInicio !== slot.horarioInicio"
                          class="py-1.5 rounded-lg text-xs font-semibold text-center hover:bg-slate-200 transition-all">
                          {{ formatarHora(slot.horarioInicio) }}
                        </button>
                      }
                    </div>
                  </div>
                }

              }
            </div>

            <!-- TOTAL E BOTÃƒO CONFIRMAR -->
            <div class="pt-4 border-t border-slate-100 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-stone-500 font-medium">Total:</span>
                <span class="font-serif text-xl font-bold text-stone-900">
                  {{ totalPreco() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </span>
              </div>

              @if (erroAgendamento()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {{ erroAgendamento() }}
                </div>
              }

              <button
                type="button"
                (click)="finalizarAgendamento()"
                [disabled]="!slotSelecionado() || salvando()"
                class="w-full py-3.5 rounded-2xl bg-[#2d7a58] hover:bg-[#236347] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                @if (salvando()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Confirmando...</span>
                } @else {
                  <span>Confirmar Agendamento</span>
                }
              </button>

              <p class="text-[10px] text-stone-400 text-center">
                Sem cobranÃ§a antecipada obrigatÃ³ria â€¢ Pagamento no local
              </p>
            </div>

          }

        </div>
      </ng-template>

      <!-- ========================================================================= -->
      <!-- MODAL DE IDENTIFICAÃ‡ÃƒO RÃPIDA DO CLIENTE (SE NÃƒO ESTIVER LOGADO) -->
      <!-- ========================================================================= -->
      @if (modalIdentificacaoAberta()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span class="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">ConfirmaÃ§Ã£o RÃ¡pida</span>
                <h3 class="font-serif font-bold text-xl text-stone-900">Quase lÃ¡! Quem vai agendar?</h3>
              </div>
              <button (click)="modalIdentificacaoAberta.set(false)" class="text-stone-400 hover:text-stone-700 p-2 text-lg font-bold">âœ•</button>
            </div>

            <p class="text-xs text-stone-500">
              Informe seu nome e WhatsApp para enviarmos a confirmaÃ§Ã£o e lembretes da sua sessÃ£o.
            </p>

            @if (erroClienteRapido()) {
              <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {{ erroClienteRapido() }}
              </div>
            }

            <form (ngSubmit)="confirmarComClienteRapido()" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  [(ngModel)]="nomeRapido"
                  name="nomeRapido"
                  required
                  placeholder="Ex: Ana Clara Souza"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Seu WhatsApp *</label>
                <input
                  type="tel"
                  [(ngModel)]="whatsappRapido"
                  name="whatsappRapido"
                  required
                  placeholder="(61) 99999-9999"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">E-mail (opcional)</label>
                <input
                  type="email"
                  [(ngModel)]="emailRapido"
                  name="emailRapido"
                  placeholder="seuemail@exemplo.com"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50" />
              </div>

              <div class="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="modalIdentificacaoAberta.set(false)"
                  class="px-4 py-2.5 rounded-xl border border-slate-200 text-stone-600 text-xs font-semibold hover:bg-slate-50">
                  Voltar
                </button>
                <button
                  type="submit"
                  [disabled]="salvando() || !nomeRapido || !whatsappRapido"
                  class="px-5 py-2.5 rounded-xl bg-[#2d7a58] hover:bg-[#236347] text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-2">
                  <span>{{ salvando() ? 'Confirmando...' : 'Finalizar Agendamento' }}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL DE SUCESSO DO AGENDAMENTO -->
      <!-- ========================================================================= -->
      @if (agendamentoConcluido()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-up">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              âœ“
            </div>
            
            <h3 class="font-serif font-bold text-2xl text-stone-900">
              Agendamento Confirmado!
            </h3>
            
            <p class="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              Seu horÃ¡rio em <strong>{{ tenantService.nomeEmpresa() }}</strong> foi reservado com sucesso para o dia 
              <strong>{{ formatarDataBR(dataSelecionada()) }}</strong> Ã s 
              <strong>{{ formatarHora(slotSelecionado()?.horarioInicio || '') }}</strong>.
            </p>

            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-stone-700">
              <span class="block text-[11px] text-stone-400">Total reservado</span>
              <span class="font-serif text-lg font-bold text-emerald-800">
                {{ totalPreco() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </span>
            </div>

            <div class="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                (click)="fecharModalSucesso()"
                class="w-full py-3 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-colors shadow">
                Novo Agendamento
              </button>
              @if (authService.isAuthenticated()) {
                <a
                  routerLink="/meus-agendamentos"
                  class="w-full py-3 rounded-xl border border-slate-200 text-stone-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center">
                  Ver Meus Agendamentos
                </a>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL DE EDIÃ‡ÃƒO DE BANNER (ADMIN) -->
      @if (modalBannerAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <span class="text-[10px] uppercase font-bold text-rose-600 tracking-wider">PersonalizaÃ§Ã£o da Loja</span>
                <h3 class="font-serif font-bold text-xl text-stone-900">Editar InformaÃ§Ãµes de ApresentaÃ§Ã£o</h3>
              </div>
              <button (click)="fecharModalBanner()" class="text-stone-400 hover:text-stone-600 p-2 font-bold text-lg">âœ•</button>
            </div>

            <form (ngSubmit)="salvarBanner()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">TÃ­tulo de Destaque *:</label>
                <input 
                  type="text" 
                  [(ngModel)]="editBannerTitulo" 
                  name="editBannerTitulo" 
                  required
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-400 bg-slate-50 font-serif" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">SubtÃ­tulo / DescriÃ§Ã£o:</label>
                <textarea 
                  [(ngModel)]="editBannerSubtitulo" 
                  name="editBannerSubtitulo" 
                  rows="3"
                  class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-400 bg-slate-50"></textarea>
              </div>

              <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" (click)="fecharModalBanner()" class="px-4 py-2.5 rounded-xl border border-slate-300 text-stone-600 font-semibold text-xs">Cancelar</button>
                <button type="submit" [disabled]="salvandoBanner() || !editBannerTitulo" class="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-xs shadow-md">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class CatalogoComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  authService = inject(AuthService);
  tenantService = inject(TenantService);
  setorService = inject(SetorService);

  // Dados do CatÃ¡logo
  categorias = signal<Categoria[]>([]);
  procedimentos = signal<Procedimento[]>([]);
  profissionais = signal<Profissional[]>([]);
  categoriaSelecionada = signal<number | null>(null);
  termoBusca = '';
  carregando = signal<boolean>(true);

  // Agendamento em Tempo Real
  servicosSelecionados = signal<Procedimento[]>([]);
  profissionalSelecionado = signal<Profissional | null>(null);
  dataSelecionada = signal<string>(this.obterDataLocal());
  diasCarrossel = signal<DiaCarrossel[]>([]);
  slots = signal<SlotDisponivel[]>([]);
  slotSelecionado = signal<SlotDisponivel | null>(null);
  carregandoSlots = signal<boolean>(false);
  salvando = signal<boolean>(false);
  erroAgendamento = signal<string | null>(null);

  // Mobile Drawer
  gavetaMobileAberta = signal<boolean>(false);

  // Cliente RÃ¡pido (para quem nÃ£o estÃ¡ logado)
  modalIdentificacaoAberta = signal<boolean>(false);
  nomeRapido = '';
  whatsappRapido = '';
  emailRapido = '';
  erroClienteRapido = signal<string | null>(null);
  agendamentoConcluido = signal<boolean>(false);

  // Banner Personalizado
  modalBannerAberto = signal<boolean>(false);
  salvandoBanner = signal<boolean>(false);
  editBannerTitulo = '';
  editBannerSubtitulo = '';

  // CÃ¡lculos Reativos
  procedimentosFiltrados = computed(() => {
    let lista = this.procedimentos();
    const catId = this.categoriaSelecionada();
    if (catId !== null) {
      lista = lista.filter(p => p.categoriaId === catId);
    }
    const busca = this.termoBusca.toLowerCase().trim();
    if (busca) {
      lista = lista.filter(p =>
        p.titulo.toLowerCase().includes(busca) ||
        (p.descricao && p.descricao.toLowerCase().includes(busca)) ||
        (p.categoriaNome && p.categoriaNome.toLowerCase().includes(busca))
      );
    }
    return lista;
  });

  totalPreco = computed(() => {
    return this.servicosSelecionados().reduce((acc, p) => acc + (p.preco || 0), 0);
  });

  totalMinutos = computed(() => {
    return this.servicosSelecionados().reduce((acc, p) => acc + (p.duracaoMinutos || 0), 0);
  });

  slotsManha = computed(() => {
    return this.slots().filter(s => {
      const hora = parseInt(s.horarioInicio.substring(0, 2), 10);
      return hora < 12;
    });
  });

  slotsTarde = computed(() => {
    return this.slots().filter(s => {
      const hora = parseInt(s.horarioInicio.substring(0, 2), 10);
      return hora >= 12;
    });
  });

  enderecoLoja = computed(() => {
    const t = this.tenantService.tenant();
    if (t?.telefoneWhatsApp) {
      return `WhatsApp: ${t.telefoneWhatsApp}`;
    }
    return 'Atendimento com horÃ¡rio marcado no local';
  });

  ngOnInit(): void {
    this.gerarDiasCarrossel();
    this.carregarDadosDoLink();
  }

  obterDataLocal(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  gerarDiasCarrossel(): void {
    const dias: DiaCarrossel[] = [];
    const hoje = new Date();
    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(hoje.getDate() + i);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      dias.push({
        dataStr: `${ano}-${mes}-${dia}`,
        diaSemana: nomesDias[d.getDay()],
        diaMes: dia,
        mes: mes
      });
    }
    this.diasCarrossel.set(dias);
    if (dias.length > 0) {
      this.dataSelecionada.set(dias[0].dataStr);
    }
  }

  carregarDadosDoLink(): void {
    const slug = this.tenantService.obterSlugAtual();
    this.carregando.set(true);

    this.api.getCategorias(undefined, slug).subscribe({
      next: (cats) => {
        const vistas = new Set<string>();
        const unicas: Categoria[] = [];
        for (const c of (cats || [])) {
          const chave = (c.nome || '').trim().toLowerCase();
          if (chave && !vistas.has(chave)) {
            vistas.add(chave);
            unicas.push(c);
          }
        }
        this.categorias.set(unicas);
      },
      error: () => {}
    });

    this.api.getProcedimentos(undefined, slug).subscribe({
      next: (procs) => {
        this.procedimentos.set(procs);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });

    this.api.getProfissionais().subscribe({
      next: (profs) => this.profissionais.set(profs),
      error: () => {}
    });
  }

  filtrarCategoria(catId: number | null): void {
    this.categoriaSelecionada.set(catId);
  }

  isServicoSelecionado(procId: number): boolean {
    return this.servicosSelecionados().some(p => p.id === procId);
  }

  alternarServico(proc: Procedimento): void {
    if (this.isServicoSelecionado(proc.id)) {
      this.removerServico(proc.id);
    } else {
      this.adicionarServico(proc);
    }
  }

  adicionarServico(proc: Procedimento): void {
    const sel = this.servicosSelecionados();
    if (!sel.some(p => p.id === proc.id)) {
      this.servicosSelecionados.set([...sel, proc]);
      this.carregarSlots();
    }
  }

  removerServico(procId: number): void {
    const sel = this.servicosSelecionados().filter(p => p.id !== procId);
    this.servicosSelecionados.set(sel);
    if (sel.length === 0) {
      this.slotSelecionado.set(null);
      this.slots.set([]);
    } else {
      this.carregarSlots();
    }
  }

  limparServicos(): void {
    this.servicosSelecionados.set([]);
    this.slotSelecionado.set(null);
    this.slots.set([]);
  }

  selecionarProfissional(prof: Profissional | null): void {
    this.profissionalSelecionado.set(prof);
    this.carregarSlots();
  }

  selecionarData(dataStr: string): void {
    this.dataSelecionada.set(dataStr);
    this.carregarSlots();
  }

  selecionarSlot(slot: SlotDisponivel): void {
    this.slotSelecionado.set(slot);
  }

  carregarSlots(): void {
    const sel = this.servicosSelecionados();
    if (sel.length === 0) return;

    const procPrincipal = sel[0];
    const profId = this.profissionalSelecionado()?.id;
    this.carregandoSlots.set(true);

    this.api.getSlotsDisponiveis(procPrincipal.id, this.dataSelecionada(), profId).subscribe({
      next: (res) => {
        this.slots.set(res.slots || []);
        this.carregandoSlots.set(false);
        // Se o slot atual nÃ£o estiver na nova lista, desseleciona
        if (this.slotSelecionado() && !res.slots?.some(s => s.horarioInicio === this.slotSelecionado()?.horarioInicio)) {
          this.slotSelecionado.set(null);
        }
      },
      error: () => {
        this.slots.set([]);
        this.carregandoSlots.set(false);
      }
    });
  }

  formatarHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5);
  }

  formatarDataBR(dataStr: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  }

  formatarUrl(url?: string): string {
    return this.api.formatarUrlImagem(url);
  }

  finalizarAgendamento(): void {
    const proc = this.servicosSelecionados()[0];
    const slot = this.slotSelecionado();
    if (!proc || !slot) return;

    if (!this.authService.isAdminOrProfissional()) {
      // Cliente se identifica diretamente com Nome e WhatsApp sem precisar de login
      this.modalIdentificacaoAberta.set(true);
      return;
    }

    this.executarCriacaoAgendamento();
  }

  confirmarComClienteRapido(): void {
    if (!this.nomeRapido.trim() || !this.whatsappRapido.trim()) {
      this.erroClienteRapido.set('Por favor, informe seu Nome e WhatsApp.');
      return;
    }
    const proc = this.servicosSelecionados()[0];
    const slot = this.slotSelecionado();
    if (!proc || !slot) return;

    this.salvando.set(true);
    this.erroClienteRapido.set(null);

    const slug = this.tenantService.obterSlugAtual();
    const telLimpo = this.whatsappRapido.replaceAll(/[^0-9]/g, '');

    const horaInicioLimpa = slot.horarioInicio.length === 5 ? slot.horarioInicio + ':00' : slot.horarioInicio;
    const dataHoraInicio = `${this.dataSelecionada()}T${horaInicioLimpa}`;

    let obs = '';
    if (this.servicosSelecionados().length > 1) {
      obs = 'Combo: ' + this.servicosSelecionados().map(s => s.titulo).join(' + ');
    }

    this.api.criarAgendamento({
      clienteNome: this.nomeRapido.trim(),
      clienteTelefone: telLimpo,
      clienteEmail: this.emailRapido ? this.emailRapido.trim() : undefined,
      slug: slug,
      procedimentoId: proc.id,
      profissionalId: slot.profissionalId,
      dataHoraInicio: dataHoraInicio,
      observacoesCliente: obs || undefined
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalIdentificacaoAberta.set(false);
        this.gavetaMobileAberta.set(false);
        this.agendamentoConcluido.set(true);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erroClienteRapido.set(err?.error?.detail || err?.error?.message || 'Erro ao processar agendamento.');
      }
    });
  }

  private executarCriacaoAgendamento(): void {
    const proc = this.servicosSelecionados()[0];
    const slot = this.slotSelecionado();
    if (!proc || !slot) return;

    this.salvando.set(true);
    this.erroAgendamento.set(null);

    const horaInicioLimpa = slot.horarioInicio.length === 5 ? slot.horarioInicio + ':00' : slot.horarioInicio;
    const dataHoraInicio = `${this.dataSelecionada()}T${horaInicioLimpa}`;

    // Monta observaÃ§Ã£o com todos os serviÃ§os caso mais de um tenha sido selecionado
    let obs = '';
    if (this.servicosSelecionados().length > 1) {
      obs = 'Combo: ' + this.servicosSelecionados().map(s => s.titulo).join(' + ');
    }

    this.api.criarAgendamento({
      procedimentoId: proc.id,
      profissionalId: slot.profissionalId,
      dataHoraInicio: dataHoraInicio,
      observacoesCliente: obs || undefined
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.gavetaMobileAberta.set(false);
        this.agendamentoConcluido.set(true);
      },
      error: (err) => {
        this.salvando.set(false);
        const detalhe = err?.error?.detail || err?.error?.detalheTecnico || 'Erro ao confirmar agendamento. Este horÃ¡rio pode ter sido reservado.';
        this.erroAgendamento.set(detalhe);
      }
    });
  }

  fecharModalSucesso(): void {
    this.agendamentoConcluido.set(false);
    this.limparServicos();
  }

  abrirModalBanner(): void {
    this.editBannerTitulo = this.tenantService.nomeEmpresa();
    this.editBannerSubtitulo = '';
    this.modalBannerAberto.set(true);
  }

  fecharModalBanner(): void {
    this.modalBannerAberto.set(false);
  }

  salvarBanner(): void {
    this.salvandoBanner.set(true);
    this.api.atualizarBanner({
      bannerTag: 'âœ¨ Cuidado & Alta Tecnologia',
      bannerTitulo: this.editBannerTitulo,
      bannerSubtitulo: this.editBannerSubtitulo,
      bannerBotaoTexto: 'Agendar'
    }).subscribe({
      next: () => {
        this.salvandoBanner.set(false);
        this.fecharModalBanner();
      },
      error: () => this.salvandoBanner.set(false)
    });
  }
}
