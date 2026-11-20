import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TenantService } from '../core/services/tenant.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (tenantService.isDominioMaster()) {
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)] font-sans">
        <div class="flex items-center justify-around">
          <a routerLink="/planos" routerLinkActive="text-rose-600 font-bold" class="flex flex-col items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Planos</span>
          </a>

          <a routerLink="/parceiro/cadastro-lojista" routerLinkActive="text-rose-600 font-bold" class="flex flex-col items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Testar Grátis</span>
          </a>

          @if (authService.isAuthenticated() && authService.isAdminOrProfissional()) {
            <a routerLink="/admin/agenda" routerLinkActive="text-slate-900 font-bold" class="flex flex-col items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span>Painel</span>
            </a>
          } @else {
            <a routerLink="/login" routerLinkActive="text-slate-900 font-bold" class="flex flex-col items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>Entrar</span>
            </a>
          }
        </div>
      </nav>
    }
  `
})
export class BottomNavComponent {
  authService = inject(AuthService);
  tenantService = inject(TenantService);
}

