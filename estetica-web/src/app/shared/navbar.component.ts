import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TenantService } from '../core/services/tenant.service';
import { SetorService } from '../core/services/setor.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
              {{ tenantService.tenant() ? (setorService.config().label + ' ' + setorService.icone()) : 'Agendoou' }}
            </span>
          </div>
        </a>

        <!-- 2. Lado Direito: Links do Cliente + Perfil do Usuário -->
        <div class="flex items-center gap-3 sm:gap-4 shrink-0">
          
          <!-- Links de Agendamento do Cliente (ou Links Comerciais do SaaS no domínio principal) -->
          <div class="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            @if (!tenantService.isDominioMaster()) {
              <a 
                routerLink="/catalogo" 
                routerLinkActive="bg-slate-900 text-white font-semibold shadow-sm" 
                class="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap">
                {{ setorService.termoServicos() }}
              </a>

              @if (authService.isAuthenticated() && !authService.isAdminOrProfissional()) {
                <a 
                  routerLink="/meus-agendamentos" 
                  routerLinkActive="bg-slate-900 text-white font-semibold shadow-sm" 
                  class="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap">
                  Meus Agendamentos
                </a>
              }
            } @else {
              <a 
                routerLink="/planos" 
                routerLinkActive="bg-slate-900 text-white font-bold shadow-sm" 
                class="px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap font-bold">
                Planos & Preços
              </a>
              <a 
                routerLink="/parceiro/cadastro-lojista" 
                routerLinkActive="bg-rose-600 text-white font-bold shadow-sm" 
                class="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-all whitespace-nowrap font-bold">
                Criar Minha Plataforma (7 Dias Grátis)
              </a>
            }
          </div>

          <!-- Perfil do Usuário Autenticado (Em qualquer domínio, aparece APENAS quando o Admin/Especialista está autenticado; se não estiver autenticado no subdomínio do cliente, fica 100% oculto para o cliente externo!) -->
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

              <!-- Botão Alterar Senha -->
              <button 
                type="button"
                (click)="abrirModalSenha()"
                title="Alterar Minha Senha"
                class="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-colors ml-0.5 text-xs font-semibold flex items-center gap-1">
                <span>🔑</span>
                <span class="hidden xl:inline text-[11px]">Senha</span>
              </button>

              <!-- Botão Sair -->
              <button 
                (click)="logout()"
                title="Sair do Sistema"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>

            <!-- Botão Menu Mobile (aparece em telas < sm para Admin/Especialista logado) -->
            @if (authService.isAdminOrProfissional()) {
              <button 
                (click)="menuMobileAberto.set(!menuMobileAberto())"
                class="sm:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            }
          }

        </div>

      </div>

      <!-- LINHA 2: Barra Dedicada de Gestão Operacional (Exclusiva para Administradores e Especialistas autenticados no seu subdomínio) -->
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

            <!-- Botão de Acesso Rápido ao Catálogo e Agendamento (Apenas nos subdomínios dos lojistas) -->
            @if (!tenantService.isDominioMaster()) {
              <a 
                routerLink="/catalogo" 
                class="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 hidden sm:flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap">
                <span class="hidden lg:inline">Agendar Horários</span>
                <span class="lg:hidden">Agendar</span>
                <span>↗</span>
              </a>
            }

          </div>
        </div>
      }

      <!-- Dropdown Mobile / Drawer (aparece se acionado no smartphone) -->
      @if (menuMobileAberto() && authService.isAdminOrProfissional()) {
        <div class="sm:hidden border-t border-slate-200 bg-white p-4 space-y-3 animate-fade-in shadow-lg">
          @if (!tenantService.isDominioMaster()) {
            <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Atendimento</div>
            <div class="grid grid-cols-1 gap-2 text-xs font-semibold">
              <a routerLink="/catalogo" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center justify-between">
                <span>📅 Agendar Horários / Catálogo</span>
                <span>↗</span>
              </a>
            </div>
          }

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
            @if (authService.isAdmin()) {
              <a routerLink="/admin/gestao" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
                <span>⚙️</span> Cadastros
              </a>
              <a routerLink="/admin/assinatura" (click)="menuMobileAberto.set(false)" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5">
                <span>💳</span> Assinatura
              </a>
            }
            <button type="button" (click)="menuMobileAberto.set(false); abrirModalSenha()" class="p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-1.5 text-left">
              <span>🔑</span> Alterar Senha
            </button>
          </div>
        </div>
      }

      <!-- Modal Alterar Senha do Especialista / Administrador -->
      @if (modalSenhaAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Segurança da Conta</span>
                <h3 class="font-bold text-lg text-slate-900">Alterar Minha Senha</h3>
              </div>
              <button type="button" (click)="modalSenhaAberto.set(false)" class="text-slate-400 hover:text-slate-700 p-1.5 font-bold">✕</button>
            </div>

            @if (erroSenha()) {
              <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {{ erroSenha() }}
              </div>
            }

            @if (sucessoSenha()) {
              <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {{ sucessoSenha() }}
              </div>
            }

            <form (ngSubmit)="salvarNovaSenha()" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nova Senha (mínimo 6 caracteres) *</label>
                <input
                  type="password"
                  [(ngModel)]="novaSenhaInput"
                  name="novaSenhaInput"
                  required
                  minlength="6"
                  placeholder="Digite sua nova senha"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Confirmar Nova Senha *</label>
                <input
                  type="password"
                  [(ngModel)]="confirmarSenhaInput"
                  name="confirmarSenhaInput"
                  required
                  minlength="6"
                  placeholder="Repita a nova senha"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div class="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  (click)="modalSenhaAberto.set(false)"
                  class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="salvandoSenha() || !novaSenhaInput || novaSenhaInput.length < 6"
                  class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm disabled:opacity-50">
                  {{ salvandoSenha() ? 'Salvando...' : 'Salvar Senha' }}
                </button>
              </div>
            </form>
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
  modalSenhaAberto = signal<boolean>(false);
  salvandoSenha = signal<boolean>(false);
  erroSenha = signal<string | null>(null);
  sucessoSenha = signal<string | null>(null);
  novaSenhaInput = '';
  confirmarSenhaInput = '';

  abrirModalSenha(): void {
    this.novaSenhaInput = '';
    this.confirmarSenhaInput = '';
    this.erroSenha.set(null);
    this.sucessoSenha.set(null);
    this.modalSenhaAberto.set(true);
  }

  salvarNovaSenha(): void {
    if (!this.novaSenhaInput || this.novaSenhaInput.trim().length < 6) {
      this.erroSenha.set('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (this.novaSenhaInput !== this.confirmarSenhaInput) {
      this.erroSenha.set('As senhas não coincidem.');
      return;
    }

    this.salvandoSenha.set(true);
    this.erroSenha.set(null);
    this.authService.alterarSenha(this.novaSenhaInput.trim()).subscribe({
      next: () => {
        this.salvandoSenha.set(false);
        this.sucessoSenha.set('✓ Senha atualizada com sucesso!');
        setTimeout(() => {
          this.modalSenhaAberto.set(false);
        }, 1000);
      },
      error: (err) => {
        this.salvandoSenha.set(false);
        this.erroSenha.set(err?.error?.detail || err?.error?.message || 'Erro ao atualizar senha.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
