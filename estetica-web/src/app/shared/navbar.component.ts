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
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all shadow-sm">
      
      <!-- LINHA 1: Header Principal (Marca + Links de Atendimento + Perfil) -->
      <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        
        <!-- 1. Logo e Marca da Empresa (Whitelabel Dinâmico) -->
        <a routerLink="/" class="flex items-center gap-3 group min-w-0 max-w-[280px] sm:max-w-[400px] lg:max-w-[550px]">
          @if (tenantService.logoUrl()) {
            <div class="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-white group-hover:scale-105 transition-transform shrink-0">
              <img [src]="tenantService.logoUrl()!" [alt]="tenantService.nomeEmpresa()" class="w-full h-full object-contain p-1" />
            </div>
          } @else {
            <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
              <span class="text-base font-bold">✨</span>
            </div>
          }
          <div class="min-w-0 flex-1">
            <span 
              class="font-bold text-base sm:text-lg lg:text-xl tracking-tight text-slate-900 block leading-tight truncate" 
              [title]="tenantService.nomeEmpresa()">
              {{ tenantService.nomeEmpresa() }}
            </span>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-600 mt-0.5 truncate">
              {{ tenantService.tenant() ? (setorService.config().label + ' ' + setorService.icone()) : 'Agendar.' }}
            </span>
          </div>
        </a>

        <!-- 2. Lado Direito: Links do Cliente + Perfil do Usuário -->
        <div class="flex items-center gap-3 sm:gap-4 shrink-0">
          
          <!-- Links de Agendamento do Cliente -->
          <div class="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <a 
              routerLink="/catalogo" 
              routerLinkActive="bg-slate-900 text-white font-semibold shadow-sm" 
              class="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap">
              {{ setorService.termoServicos() }}
            </a>

            <a 
              routerLink="/agendar" 
              routerLinkActive="bg-slate-900 text-white font-semibold shadow-sm" 
              class="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap">
              {{ setorService.termoAgendar() }}
            </a>

            @if (authService.isAuthenticated() && !authService.isAdminOrProfissional()) {
              <a 
                routerLink="/meus-agendamentos" 
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-sm" 
                class="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap">
                Meus Agendamentos
              </a>
            }
          </div>

          <!-- Perfil do Usuário Autenticado -->
          @if (authService.isAuthenticated()) {
            <div class="flex items-center gap-2.5 bg-slate-50 p-1.5 pr-3 rounded-2xl border border-slate-200 shadow-sm">
              <!-- Avatar circular com as iniciais -->
              <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {{ authService.currentUser()?.nome?.substring(0, 2)?.toUpperCase() }}
              </div>

              <!-- Dados do usuário -->
              <div class="text-left hidden md:block max-w-[120px] lg:max-w-[160px]">
                <span class="block text-xs font-bold text-slate-900 leading-tight truncate">
                  {{ authService.currentUser()?.nome?.split(' ')?.[0] }}
                </span>
                <span class="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded uppercase tracking-wider truncate">
                  {{ authService.currentUser()?.role === 'ROLE_ADMIN' ? 'Administrador' : (authService.currentUser()?.role === 'ROLE_PROFISSIONAL' ? 'Especialista' : 'Cliente VIP') }}
                </span>
              </div>

              <!-- Botão Sair -->
              <button 
                (click)="logout()"
                title="Sair do Sistema"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors ml-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-2">
              <a routerLink="/login" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                <span>🔒</span>
                <span>Acesso da Equipe</span>
              </a>
            </div>
          }

          <!-- Botão Menu Mobile (aparece em telas < sm) -->
          @if (authService.isAdminOrProfissional()) {
            <button 
              (click)="menuMobileAberto.set(!menuMobileAberto())"
              class="sm:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          }

        </div>

      </div>

      <!-- LINHA 2: Barra Dedicada de Gestão Operacional (Exclusiva para Administradores e Especialistas) -->
      @if (authService.isAdminOrProfissional()) {
        <div class="bg-slate-50/80 border-t border-slate-200 py-1.5 px-4 sm:px-6 lg:px-8">
          <div class="max-w-[1440px] mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 mr-2 select-none shrink-0 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Gestão
              </span>

              <a 
                routerLink="/admin/dashboard" 
                routerLinkActive="bg-slate-900 text-white font-bold shadow-sm" 
                title="Painel Geral & Faturamento"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📊</span>
                <span>Dashboard</span>
              </a>

              <a 
                routerLink="/admin/agenda" 
                routerLinkActive="bg-slate-900 text-white font-bold shadow-sm" 
                title="Agenda Completa"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📅</span>
                <span>Agenda</span>
              </a>

              <a 
                routerLink="/admin/prontuarios" 
                routerLinkActive="bg-slate-900 text-white font-bold shadow-sm" 
                [title]="setorService.termoProntuario()"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📋</span>
                <span>{{ setorService.termoProntuario() }}</span>
              </a>

              <a 
                routerLink="/admin/relatorios" 
                routerLinkActive="bg-slate-900 text-white font-bold shadow-sm" 
                title="Relatórios & Comissões"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                <span>📈</span>
                <span>Relatórios</span>
              </a>

              @if (authService.isAdmin()) {
                <a 
                  routerLink="/admin/gestao" 
                  routerLinkActive="bg-slate-900 text-white font-bold shadow-sm" 
                  title="Configurações e Cadastros"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent">
                  <span>⚙️</span>
                  <span>Cadastros & Gestão</span>
                </a>

                <a 
                  routerLink="/admin/assinatura" 
                  routerLinkActive="bg-slate-900 text-white font-bold shadow-sm" 
                  title="Minha Assinatura & Renovação"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent relative">
                  <span>💳</span>
                  <span>Assinatura</span>
                  @if (tenantService.assinaturaProximaDoVencimento()) {
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5"></span>
                  }
                </a>
              }
            </div>

            <!-- Botão de Acesso Rápido ao Catálogo Público -->
            <a 
              routerLink="/catalogo" 
              class="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 hidden sm:flex items-center gap-1.5 transition-all shadow-sm">
              <span>Ver Página Pública</span>
              <span>↗</span>
            </a>

          </div>
        </div>
      }

      <!-- Dropdown Mobile / Drawer (aparece se acionado no smartphone) -->
      @if (menuMobileAberto() && authService.isAdminOrProfissional()) {
        <div class="sm:hidden border-t border-slate-200 bg-white p-4 space-y-3 animate-fade-in shadow-lg">
          <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Atendimento</div>
          <div class="grid grid-cols-2 gap-2 text-xs font-semibold">
            <a routerLink="/catalogo" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white truncate">{{ setorService.termoServicos() }}</a>
            <a routerLink="/agendar" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white truncate">{{ setorService.termoAgendar() }}</a>
          </div>

          <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-2">Módulo de Gestão</div>
          <div class="grid grid-cols-2 gap-2 text-xs font-semibold">
            <a routerLink="/admin/dashboard" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
              <span>📊</span> Dashboard
            </a>
            <a routerLink="/admin/agenda" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
              <span>📅</span> Agenda
            </a>
            <a routerLink="/admin/prontuarios" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
              <span>📋</span> <span class="truncate">{{ setorService.termoProntuario() }}</span>
            </a>
            <a routerLink="/admin/relatorios" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
              <span>📈</span> Relatórios
            </a>
            <a routerLink="/admin/gestao" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
              <span>⚙️</span> Cadastros
            </a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin/assinatura" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
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
