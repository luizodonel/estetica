import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
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
        <div class="max-w-2xl relative z-10">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-3">
            ✨ Cuidado & Alta Tecnologia
          </span>
          <h1 class="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
            Realce sua melhor versão com tratamentos exclusivos.
          </h1>
          <p class="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            Protocolos personalizados, equipamentos de última geração e especialistas dedicados ao seu bem-estar e autoestima.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a routerLink="/agendar" class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-all shadow-md hover:shadow-lg">
              Agendamento Online
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Filtros por Categoria -->
      <div class="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        <button 
          (click)="filtrarCategoria(null)"
          [class.bg-stone-900]="categoriaSelecionada() === null"
          [class.text-white]="categoriaSelecionada() === null"
          [class.bg-white]="categoriaSelecionada() !== null"
          [class.text-stone-700]="categoriaSelecionada() !== null"
          class="px-4 py-2 rounded-2xl text-xs font-semibold border border-nude-200 whitespace-nowrap shadow-sm hover:border-stone-400 transition-all">
          Todos os Procedimentos
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
                  [src]="proc.imagemUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600'" 
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

  categorias = signal<Categoria[]>([]);
  procedimentos = signal<Procedimento[]>([]);
  categoriaSelecionada = signal<number | null>(null);
  carregando = signal<boolean>(true);

  ngOnInit(): void {
    this.carregarCategorias();
    this.carregarProcedimentos();
  }

  carregarCategorias(): void {
    this.api.getCategorias().subscribe({
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
}

