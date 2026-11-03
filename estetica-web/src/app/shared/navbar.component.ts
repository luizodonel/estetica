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
    <header class="bg-white/95 backdrop-blur-md border-b border-nude-200 sticky top-0 z-40 transition-all shadow-sm">
      
      <!-- LINHA 1: Header Principal (Marca + Links de Atendimento + Perfil) -->
      <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        
        <!-- 1. Logo e Marca da Empresa (Whitelabel Dinâmico) -->
        <a routerLink="/" class="flex items-center gap-3 group min-w-0 max-w-[280px] sm:max-w-[400px] lg:max-w-[550px]">
          @if (tenantService.logoUrl()) {
            <div class="w-10 h-10 rounded-2xl overflow-hidden border border-nude-200 shadow-sm flex items-center justify-center bg-white group-hover:scale-105 transition-transform shrink-0">
              <img [src]="tenantService.logoUrl()!" [alt]="tenantService.nomeEmpresa()" class="w-full h-full object-contain p-1" />
            </div>
          } @else {
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
            </div>
          }
          <div class="min-w-0 flex-1">
            <span 
              class="font-serif text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-stone-900 block leading-tight truncate" 
              [title]="tenantService.nomeEmpresa()">
              {{ tenantService.nomeEmpresa() }}
            </span>
            <span class="text-[9px] uppercase tracking-widest text-nude-500 font-semibold block mt-0.5 truncate">
              {{ tenantService.tenant() ? (setorService.config().label + ' ' + setorService.icone()) : 'Agendar.' }}
            </span>
          </div>
        </a>

        <!-- 2. Lado Direito: Links do Cliente + Perfil do Usuário -->
        <div class="flex items-center gap-3 sm:gap-4 shrink-0">
          
          <!-- Links de Agendamento do Cliente -->
          <div class="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-stone-600">
            <a 
              routerLink="/catalogo" 
              routerLinkActive="text-rose-600 bg-rose-50" 
              class="px-3 py-2 rounded-xl hover:text-stone-900 hover:bg-stone-50 transition-all whitespace-nowrap">
              {{ setorService.termoServicos() }}
            </a>

            <a 
              routerLink="/agendar" 
              routerLinkActive="text-rose-600 bg-rose-50" 
              class="px-3 py-2 rounded-xl hover:text-stone-900 hover:bg-stone-50 transition-all whitespace-nowrap">
              {{ setorService.termoAgendar() }}
            </a>

            @if (authService.isAuthenticated() && !authService.isAdminOrProfissional()) {
              <a 
                routerLink="/meus-agendamentos" 
                routerLinkActive="text-rose-600 bg-rose-50" 
                class="px-3 py-2 rounded-xl hover:text-stone-900 hover:bg-stone-50 transition-all whitespace-nowrap">
                Meus Agendamentos
              </a>
            }
          </div>

          <!-- Perfil do Usuário Autenticado -->
          @if (authService.isAuthenticated()) {
            <div class="flex items-center gap-2.5 bg-stone-50 p-1.5 pr-3 rounded-2xl border border-nude-200 shadow-sm">
              <!-- Avatar circular com as iniciais -->
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-stone-800 to-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {{ authService.currentUser()?.nome?.substring(0, 2)?.toUpperCase() }}
              </div>

              <!-- Dados do usuário -->
              <div class="text-left hidden md:block max-w-[120px] lg:max-w-[160px]">
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
                class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1">
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

          <!-- Botão Menu Mobile (aparece em telas < sm) -->
          @if (authService.isAdminOrProfissional()) {
            <button 
              (click)="menuMobileAberto.set(!menuMobileAberto())"
              class="sm:hidden p-2 rounded-xl border border-nude-200 text-stone-600 hover:bg-stone-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          }

        </div>

      </div>

      <!-- LINHA 2: Barra Dedicada de Gestão Operacional (Exclusiva para Administradores e Especialistas) -->
      @if (authService.isAdminOrProfissional()) {
        <div class="bg-stone-50/90 border-t border-nude-200 py-1.5 px-4 sm:px-6 lg:px-8">
          <div class="max-w-[1440px] mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
              <span class="text-[10px] uppercase font-bold tracking-wider text-stone-400 mr-2 select-none shrink-0 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Gestão
              </span>

              <a 
                routerLink="/admin/dashboard" 
                routerLinkActive="bg-white text-stone-900 shadow-sm font-bold border-nude-300" 
                title="Painel Geral & Faturamento"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white/80 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📊</span>
                <span>Dashboard</span>
              </a>

              <a 
                routerLink="/admin/agenda" 
                routerLinkActive="bg-white text-stone-900 shadow-sm font-bold border-nude-300" 
                title="Agenda Completa"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white/80 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📅</span>
                <span>Agenda</span>
              </a>

              <a 
                routerLink="/admin/prontuarios" 
                routerLinkActive="bg-white text-stone-900 shadow-sm font-bold border-nude-300" 
                [title]="setorService.termoProntuario()"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white/80 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📋</span>
                <span>{{ setorService.termoProntuario() }}</span>
              </a>

              <a 
                routerLink="/admin/relatorios" 
                routerLinkActive="bg-white text-stone-900 shadow-sm font-bold border-nude-300" 
                title="Relatórios & Comissões"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white/80 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📈</span>
                <span>Relatórios</span>
              </a>

              @if (authService.isAdmin()) {
                <a 
                  routerLink="/admin/gestao" 
                  routerLinkActive="bg-white text-rose-600 shadow-sm font-bold border-rose-200" 
                  title="Configurações e Cadastros"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-600 hover:bg-white/80 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                  <span>⚙️</span>
                  <span>Cadastros & Gestão</span>
                </a>

                <a 
                  routerLink="/admin/assinatura" 
                  routerLinkActive="bg-white text-rose-600 shadow-sm font-bold border-rose-200" 
                  title="Minha Assinatura & Renovação"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-600 hover:bg-white/80 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent relative">
                  <span>💳</span>
                  <span>Assinatura</span>
                  @if (tenantService.tenant()?.diasRestantes !== undefined && tenantService.tenant()!.diasRestantes! <= 5) {
                    <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5"></span>
                  }
                </a>
              }
            </div>

            <!-- Botão de Acesso Rápido ao Catálogo Público -->
            <a 
              routerLink="/catalogo" 
              class="text-[11px] font-semibold text-stone-500 hover:text-stone-900 shrink-0 hidden sm:flex items-center gap-1 hover:underline">
              <span>Ver Página Pública</span>
              <span>↗</span>
            </a>

          </div>
        </div>
      }

      <!-- Dropdown Mobile / Drawer (aparece se acionado no smartphone) -->
      @if (menuMobileAberto() && authService.isAdminOrProfissional()) {
        <div class="sm:hidden border-t border-nude-200 bg-white p-4 space-y-3 animate-fade-in shadow-lg">
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
