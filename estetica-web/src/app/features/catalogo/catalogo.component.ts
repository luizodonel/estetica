import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SetorService } from '../../core/services/setor.service';
import { Categoria, Procedimento } from '../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      
      <!-- Hero Banner Elegante -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-nude-100 via-rose-50 to-champagne-100 p-8 sm:p-12 border border-nude-200 mb-8 shadow-sm">
        
        @if (authService.isAdmin()) {
          <button 
            type="button"
            (click)="abrirModalBanner()" 
            class="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-800 text-xs font-semibold shadow-sm border border-nude-200 backdrop-blur-sm transition-all hover:scale-105">
            <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            <span>Editar Banner</span>
          </button>
        }

        <div class="max-w-2xl relative z-10">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-3">
            {{ bannerTag() }}
          </span>
          <h1 class="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
            {{ bannerTitulo() }}
          </h1>
          <p class="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            {{ bannerSubtitulo() }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a routerLink="/agendar" class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-all shadow-md hover:shadow-lg">
              {{ bannerBotaoTexto() }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Modal de Edição de Banner para o Lojista -->
      @if (modalBannerAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-nude-200">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-nude-100">
              <div>
                <span class="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Personalização da Loja</span>
                <h3 class="font-serif font-bold text-xl text-stone-900">Editar Banner Principal</h3>
              </div>
              <button (click)="fecharModalBanner()" class="text-stone-400 hover:text-stone-600 p-2 font-bold text-lg">✕</button>
            </div>

            @if (sucessoBanner()) {
              <div class="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {{ sucessoBanner() }}
              </div>
            }

            <form (ngSubmit)="salvarBanner()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Tag / Selo Superior (ex: Promoção, Novidade):</label>
                <input 
                  type="text" 
                  [(ngModel)]="editBannerTag" 
                  name="editBannerTag" 
                  placeholder="✨ Cuidado & Alta Tecnologia ou 🔥 PROMOÇÃO" 
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-stone-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Título de Destaque *:</label>
                <input 
                  type="text" 
                  [(ngModel)]="editBannerTitulo" 
                  name="editBannerTitulo" 
                  required
                  placeholder="Realce sua melhor versão com tratamentos exclusivos." 
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-stone-50 font-serif" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Subtítulo / Descrição da Oferta:</label>
                <textarea 
                  [(ngModel)]="editBannerSubtitulo" 
                  name="editBannerSubtitulo" 
                  rows="3"
                  placeholder="Descreva aqui o recado especial para seus pacientes..." 
                  class="w-full text-xs px-3.5 py-2 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-stone-50 leading-relaxed"></textarea>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Texto do Botão de Ação:</label>
                <input 
                  type="text" 
                  [(ngModel)]="editBannerBotaoTexto" 
                  name="editBannerBotaoTexto" 
                  placeholder="Agendamento Online" 
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-stone-50" />
              </div>

              <div class="pt-4 border-t border-nude-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  (click)="fecharModalBanner()" 
                  class="px-4 py-2.5 rounded-xl border border-nude-300 text-stone-600 font-semibold text-xs hover:bg-stone-50">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  [disabled]="salvandoBanner() || !editBannerTitulo" 
                  class="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md disabled:opacity-50 flex items-center gap-2">
                  <span>{{ salvandoBanner() ? 'Salvando...' : 'Salvar Alterações' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Filtros por Categoria -->
      <div class="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        <button 
          (click)="filtrarCategoria(null)"
          [class.bg-stone-900]="categoriaSelecionada() === null"
          [class.text-white]="categoriaSelecionada() === null"
          [class.bg-white]="categoriaSelecionada() !== null"
          [class.text-stone-700]="categoriaSelecionada() !== null"
          class="px-4 py-2 rounded-2xl text-xs font-semibold border border-nude-200 whitespace-nowrap shadow-sm hover:border-stone-400 transition-all">
          Todos os {{ setorService.termoServicos() }}
        </button>

        @for (cat of categorias(); track cat.id) {
          <button 
            (click)="filtrarCategoria(cat.id)"
            [class.bg-stone-900]="categoriaSelecionada() === cat.id"
            [class.text-white]="categoriaSelecionada() === cat.id"
            [class.bg-white]="categoriaSelecionada() !== cat.id"
            [class.text-stone-700]="categoriaSelecionada() !== cat.id"
            class="px-4 py-2 rounded-2xl text-xs font-semibold border border-nude-200 whitespace-nowrap shadow-sm hover:border-stone-400 transition-all">
            {{ cat.nome }}
          </button>
        }

        @if (authService.isAdmin()) {
          <a routerLink="/admin/gestao" [queryParams]="{tab: 'procedimentos'}" class="ml-auto px-4 py-2 rounded-2xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center gap-1.5 whitespace-nowrap transition-all">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>+ Cadastrar Procedimento</span>
          </a>
        }
      </div>

      <!-- Grid de Procedimentos -->
      @if (carregando()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white rounded-3xl p-4 border border-nude-200 animate-pulse h-80"></div>
          }
        </div>
      } @else if (procedimentos().length === 0) {
        <div class="text-center py-16 bg-white rounded-3xl border border-nude-200 p-8">
          <p class="text-stone-500 text-sm">Nenhum procedimento encontrado nesta categoria.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (proc of procedimentos(); track proc.id) {
            <div class="bg-white rounded-3xl overflow-hidden border border-nude-200 hover:border-rose-200 hover:shadow-xl transition-all duration-300 flex flex-col group">
              
              <!-- Imagem com badge de categoria -->
              <div class="relative h-48 overflow-hidden bg-nude-100">
                <img 
                  [src]="formatarUrl(proc.imagemUrl) || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600'" 
                  [alt]="proc.titulo"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <span class="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-stone-900 text-[11px] font-semibold tracking-wide shadow-sm">
                  {{ proc.categoriaNome }}
                </span>
                <span class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {{ proc.duracaoMinutos }} min
                </span>
              </div>

              <!-- Informações do Card -->
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="font-serif text-lg font-bold text-stone-900 group-hover:text-rose-600 transition-colors leading-snug">
                    {{ proc.titulo }}
                  </h3>
                  <p class="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                    {{ proc.descricao }}
                  </p>
                </div>

                <div class="mt-5 pt-4 border-t border-nude-100 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] uppercase tracking-wider text-nude-500 font-semibold block">Valor por sessão</span>
                    <span class="text-lg font-bold text-stone-900">
                      {{ proc.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </span>
                  </div>

                  <button 
                    (click)="agendarProcedimento(proc.id)"
                    class="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-500 hover:text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm">
                    <span>Agendar</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          }
        </div>
      }

    </div>
  `
})
export class CatalogoComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  authService = inject(AuthService);
  setorService = inject(SetorService);

  categorias = signal<Categoria[]>([]);
  procedimentos = signal<Procedimento[]>([]);
  categoriaSelecionada = signal<number | null>(null);
  carregando = signal<boolean>(true);

  // Banner Personalizável
  bannerTag = signal<string>('✨ Cuidado & Alta Tecnologia');
  bannerTitulo = signal<string>('Realce sua melhor versão com tratamentos exclusivos.');
  bannerSubtitulo = signal<string>('Protocolos personalizados, equipamentos de última geração e especialistas dedicados ao seu bem-estar e autoestima.');
  bannerBotaoTexto = signal<string>('Agendamento Online');

  modalBannerAberto = signal<boolean>(false);
  salvandoBanner = signal<boolean>(false);
  sucessoBanner = signal<string | null>(null);

  editBannerTag = '';
  editBannerTitulo = '';
  editBannerSubtitulo = '';
  editBannerBotaoTexto = '';

  ngOnInit(): void {
    this.carregarCategorias();
    this.carregarProcedimentos();
    this.carregarBannerTenant();
  }

  carregarBannerTenant(): void {
    this.api.getMeuTenant().subscribe({
      next: (t) => {
        if (t.bannerTag) this.bannerTag.set(t.bannerTag);
        if (t.bannerTitulo) this.bannerTitulo.set(t.bannerTitulo);
        if (t.bannerSubtitulo) this.bannerSubtitulo.set(t.bannerSubtitulo);
        if (t.bannerBotaoTexto) this.bannerBotaoTexto.set(t.bannerBotaoTexto);
      },
      error: () => {}
    });
  }

  abrirModalBanner(): void {
    this.editBannerTag = this.bannerTag();
    this.editBannerTitulo = this.bannerTitulo();
    this.editBannerSubtitulo = this.bannerSubtitulo();
    this.editBannerBotaoTexto = this.bannerBotaoTexto();
    this.sucessoBanner.set(null);
    this.modalBannerAberto.set(true);
  }

  fecharModalBanner(): void {
    this.modalBannerAberto.set(false);
  }

  salvarBanner(): void {
    if (!this.editBannerTitulo) return;
    this.salvandoBanner.set(true);
    this.api.atualizarBanner({
      bannerTag: this.editBannerTag,
      bannerTitulo: this.editBannerTitulo,
      bannerSubtitulo: this.editBannerSubtitulo,
      bannerBotaoTexto: this.editBannerBotaoTexto
    }).subscribe({
      next: (t) => {
        this.salvandoBanner.set(false);
        this.bannerTag.set(t.bannerTag || this.editBannerTag);
        this.bannerTitulo.set(t.bannerTitulo || this.editBannerTitulo);
        this.bannerSubtitulo.set(t.bannerSubtitulo || this.editBannerSubtitulo);
        this.bannerBotaoTexto.set(t.bannerBotaoTexto || this.editBannerBotaoTexto);
        this.sucessoBanner.set('Banner atualizado com sucesso!');
        setTimeout(() => this.fecharModalBanner(), 800);
      },
      error: () => {
        this.salvandoBanner.set(false);
        alert('Erro ao salvar personalização do banner.');
      }
    });
  }

  carregarCategorias(): void {
    const s = this.setorService.setorAtual();
    this.api.getCategorias(s).subscribe({
      next: (dados) => this.categorias.set(dados),
      error: (err) => console.error(err)
    });
  }

  carregarProcedimentos(catId?: number | null): void {
    this.carregando.set(true);
    this.api.getProcedimentos(catId || undefined).subscribe({
      next: (dados) => {
        this.procedimentos.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.carregando.set(false);
      }
    });
  }

  filtrarCategoria(catId: number | null): void {
    this.categoriaSelecionada.set(catId);
    this.carregarProcedimentos(catId);
  }

  agendarProcedimento(procedimentoId: number): void {
    this.router.navigate(['/agendar'], { queryParams: { procedimentoId } });
  }

  formatarUrl(url?: string): string {
    return this.api.formatarUrlImagem(url);
  }
}

