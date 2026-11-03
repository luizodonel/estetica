import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TenantService } from '../core/services/tenant.service';
import { SetorService } from '../core/services/setor.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white/90 backdrop-blur-md border-b border-nude-200 sticky top-0 z-40 transition-all shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
      <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 sm:gap-4">
        
        <!-- 1. Logo e Marca da Empresa (Dinâmica por Lojista / Whitelabel) -->
        <a routerLink="/" class="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0 max-w-[200px] sm:max-w-[240px] lg:max-w-[260px] xl:max-w-[320px]">
          @if (tenantService.logoUrl()) {
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border border-nude-200 shadow-sm flex items-center justify-center bg-white group-hover:scale-105 transition-transform shrink-0">
              <img [src]="tenantService.logoUrl()!" [alt]="tenantService.nomeEmpresa()" class="w-full h-full object-contain p-1" />
            </div>
          } @else {
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
            </div>
          }
          <div class="min-w-0 flex-1">
            <span 
              class="font-serif text-base sm:text-lg xl:text-xl font-bold tracking-tight text-stone-900 block leading-tight truncate" 
              [title]="tenantService.nomeEmpresa()">
              {{ tenantService.nomeEmpresa() }}
            </span>
            <span class="text-[9px] uppercase tracking-widest text-nude-500 font-semibold block mt-0.5 truncate">
              {{ tenantService.tenant() ? (setorService.config().label + ' ' + setorService.icone()) : 'Agendar.' }}
            </span>
          </div>
        </a>

        <!-- 2. Navegação Central Organizada -->
        <nav class="hidden lg:flex items-center gap-3 xl:gap-5 min-w-0">
          
          <!-- Links de Atendimento / Cliente -->
          <div class="flex items-center gap-1 text-xs font-semibold text-stone-600 shrink-0">
            <a 
              routerLink="/catalogo" 
              routerLinkActive="text-rose-600 bg-rose-50" 
              class="px-2.5 py-1.5 rounded-xl hover:text-stone-900 hover:bg-stone-50 transition-all whitespace-nowrap">
              {{ setorService.termoServicos() }}
            </a>

            <a 
              routerLink="/agendar" 
              routerLinkActive="text-rose-600 bg-rose-50" 
              class="px-2.5 py-1.5 rounded-xl hover:text-stone-900 hover:bg-stone-50 transition-all whitespace-nowrap">
              {{ setorService.termoAgendar() }}
            </a>

            @if (authService.isAuthenticated() && !authService.isAdminOrProfissional()) {
              <a 
                routerLink="/meus-agendamentos" 
                routerLinkActive="text-rose-600 bg-rose-50" 
                class="px-2.5 py-1.5 rounded-xl hover:text-stone-900 hover:bg-stone-50 transition-all whitespace-nowrap">
                Meus Agendamentos
              </a>
            }
          </div>

          <!-- Módulo Administrativo / Gestão Operacional (Segmentado em Pílula Moderna) -->
          @if (authService.isAdminOrProfissional()) {
            <div class="h-5 w-px bg-nude-300 shrink-0"></div>

            <div class="bg-stone-100/90 p-1 rounded-2xl border border-nude-200 flex items-center gap-0.5 shadow-inner shrink-0">
              <span class="text-[9px] uppercase font-bold tracking-wider text-stone-400 px-1.5 select-none hidden 2xl:inline">
                Gestão
              </span>

              <a 
                routerLink="/admin/dashboard" 
                routerLinkActive="bg-white text-stone-900 shadow-sm" 
                title="Painel Geral & Faturamento"
                class="px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 transition-all whitespace-nowrap flex items-center gap-1">
                <span>📊</span>
                <span class="hidden xl:inline">Dashboard</span>
              </a>

              <a 
                routerLink="/admin/agenda" 
                routerLinkActive="bg-white text-stone-900 shadow-sm" 
                title="Agenda Completa"
                class="px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 transition-all whitespace-nowrap flex items-center gap-1">
                <span>📅</span>
                <span class="hidden xl:inline">Agenda</span>
              </a>

              <a 
                routerLink="/admin/prontuarios" 
                routerLinkActive="bg-white text-stone-900 shadow-sm" 
                [title]="setorService.termoProntuario()"
                class="px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 transition-all whitespace-nowrap flex items-center gap-1">
                <span>📋</span>
                <span class="hidden xl:inline">{{ setorService.termoProntuarioCurto() }}</span>
              </a>

              <a 
                routerLink="/admin/relatorios" 
                routerLinkActive="bg-white text-stone-900 shadow-sm" 
                title="Relatórios & Comissões"
                class="px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 transition-all whitespace-nowrap flex items-center gap-1">
                <span>📈</span>
                <span class="hidden xl:inline">Relatórios</span>
              </a>

              @if (authService.isAdmin()) {
                <a 
                  routerLink="/admin/gestao" 
                  routerLinkActive="bg-white text-rose-600 shadow-sm font-bold" 
                  title="Configurações e Cadastros"
                  class="px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-600 transition-all whitespace-nowrap flex items-center gap-1">
                  <span>⚙️</span>
                  <span class="hidden xl:inline">Cadastros</span>
                </a>

                <a 
                  routerLink="/admin/assinatura" 
                  routerLinkActive="bg-white text-rose-600 shadow-sm font-bold" 
                  title="Minha Assinatura & Renovação"
                  class="px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-600 transition-all whitespace-nowrap flex items-center gap-1 relative">
                  <span>💳</span>
                  <span class="hidden xl:inline">Assinatura</span>
                  @if (tenantService.tenant()?.diasRestantes !== undefined && tenantService.tenant()!.diasRestantes! <= 5) {
                    <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5"></span>
                  }
                </a>
              }
            </div>
          }

        </nav>

        <!-- 3. Ações do Usuário / Perfil e Logout -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          @if (authService.isAuthenticated()) {
            <div class="flex items-center gap-2 sm:gap-2.5 bg-stone-50/80 p-1 sm:p-1.5 pr-2 sm:pr-3 rounded-2xl border border-nude-200">
              <!-- Avatar circular com as iniciais -->
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-stone-800 to-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {{ authService.currentUser()?.nome?.substring(0, 2)?.toUpperCase() }}
              </div>

              <!-- Dados do usuário -->
              <div class="text-left hidden md:block max-w-[100px] xl:max-w-[130px]">
                <span class="block text-xs font-bold text-stone-900 leading-tight truncate">
                  {{ authService.currentUser()?.nome?.split(' ')?.[0] }}
                </span>
                <span class="block text-[10px] font-semibold text-rose-600 uppercase tracking-wider truncate">
                  {{ authService.currentUser()?.role === 'ROLE_ADMIN' ? 'Administrador' : (authService.currentUser()?.role === 'ROLE_PROFISSIONAL' ? 'Especialista' : 'Cliente VIP') }}
                </span>
              </div>

              <!-- Botão Sair -->
              <button 
                (click)="logout()"
                title="Sair do Sistema"
                class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-2">
              <a routerLink="/login" class="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3.5 py-2 rounded-xl hover:bg-stone-100 transition-colors">
                Entrar
              </a>
              <a routerLink="/registrar" class="text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap">
                Criar Conta
              </a>
            </div>
          }

          <!-- Botão Menu Mobile (aparece em telas < lg) -->
          @if (authService.isAdminOrProfissional()) {
            <button 
              (click)="menuMobileAberto.set(!menuMobileAberto())"
              class="lg:hidden p-2 rounded-xl border border-nude-200 text-stone-600 hover:bg-stone-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          }
        </div>

      </div>

      <!-- Dropdown Mobile / Tablet para Menus de Gestão (aparece se acionado) -->
      @if (menuMobileAberto() && authService.isAdminOrProfissional()) {
        <div class="lg:hidden border-t border-nude-200 bg-white p-4 space-y-3 animate-fade-in shadow-lg">
          <div class="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Atendimento</div>
          <div class="grid grid-cols-2 gap-2 text-xs font-semibold">
            <a routerLink="/catalogo" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 truncate">{{ setorService.termoServicos() }}</a>
            <a routerLink="/agendar" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 truncate">{{ setorService.termoAgendar() }}</a>
          </div>

          <div class="text-[10px] uppercase font-bold text-stone-400 tracking-wider pt-2">Módulo de Gestão</div>
          <div class="grid grid-cols-2 gap-2 text-xs font-semibold">
            <a routerLink="/admin/dashboard" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5">
              <span>📊</span> Dashboard
            </a>
            <a routerLink="/admin/agenda" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5">
              <span>📅</span> Agenda
            </a>
            <a routerLink="/admin/prontuarios" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5">
              <span>📋</span> <span class="truncate">{{ setorService.termoProntuario() }}</span>
            </a>
            <a routerLink="/admin/relatorios" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5">
              <span>📈</span> Relatórios
            </a>
            <a routerLink="/admin/gestao" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5">
              <span>⚙️</span> Cadastros
            </a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin/assinatura" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5">
                <span>💳</span> Assinatura
              </a>
            }
          </div>
        </div>
      }
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  tenantService = inject(TenantService);
  setorService = inject(SetorService);
  private router = inject(Router);

  menuMobileAberto = signal<boolean>(false);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
