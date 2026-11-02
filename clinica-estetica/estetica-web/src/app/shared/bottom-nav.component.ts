import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-nude-200 px-4 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div class="flex items-center justify-around">
        
        <!-- Catálogo -->
        <a routerLink="/catalogo" routerLinkActive="text-rose-500 font-semibold" [routerLinkActiveOptions]="{exact: false}" class="flex flex-col items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
          </svg>
          <span>Serviços</span>
        </a>

        <!-- Botão Principal Central de Agendar -->
        <a routerLink="/agendar" class="flex flex-col items-center -mt-5 group">
          <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <span class="text-[10px] font-bold text-rose-600 mt-1">Agendar</span>
        </a>

        <!-- Meus Agendamentos -->
        @if (authService.isAuthenticated()) {
          <a routerLink="/meus-agendamentos" routerLinkActive="text-rose-500 font-semibold" class="flex flex-col items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>Minha Agenda</span>
          </a>

          @if (authService.isAdminOrProfissional()) {
            <a routerLink="/admin/agenda" routerLinkActive="text-rose-500 font-semibold" class="flex flex-col items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span>Painel</span>
            </a>
          }
        } @else {
          <a routerLink="/login" routerLinkActive="text-rose-500 font-semibold" class="flex flex-col items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>Entrar</span>
          </a>
        }

      </div>
    </nav>
  `
})
export class BottomNavComponent {
  authService = inject(AuthService);
}

