import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-nude-200 shadow-xl shadow-nude-200/50">
        
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-champagne-400 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-rose-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
          </div>
          <h2 class="font-serif text-2xl font-bold text-stone-900">Bem-vinda de volta</h2>
          <p class="text-xs text-stone-500 mt-1">Acesse sua conta para gerenciar seus agendamentos</p>
        </div>

        @if (erro()) {
          <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-5">
            {{ erro() }}
          </div>
        }

        <form (ngSubmit)="entrar()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">E-mail:</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email"
              required
              placeholder="seu@email.com" 
              class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Senha:</label>
            <input 
              type="password" 
              [(ngModel)]="senha" 
              name="senha"
              required
              placeholder="••••••••" 
              class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
          </div>

          <!-- Credenciais de Teste Rápidas -->
          <div class="p-3 rounded-xl bg-nude-50 border border-nude-200 text-[11px] text-stone-500 space-y-1">
            <span class="font-bold text-stone-700 block">Acessos de demonstração:</span>
            <div class="flex justify-between items-center">
              <span>Admin: admin&#64;clinicaestetica.com / admin123</span>
              <button type="button" (click)="preencher('admin@clinicaestetica.com', 'admin123')" class="text-rose-600 font-bold hover:underline">Usar</button>
            </div>
            <div class="flex justify-between items-center">
              <span>Cliente: cliente&#64;exemplo.com / cliente123</span>
              <button type="button" (click)="preencher('cliente@exemplo.com', 'cliente123')" class="text-rose-600 font-bold hover:underline">Usar</button>
            </div>
          </div>

          <button 
            type="submit" 
            [disabled]="carregando()"
            class="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 mt-2">
            @if (carregando()) {
              <span>Entrando...</span>
            } @else {
              <span>Entrar no Sistema</span>
            }
          </button>
        </form>

        <p class="text-center text-xs text-stone-500 mt-6">
          Ainda não tem conta? 
          <a routerLink="/registrar" class="text-rose-600 font-bold hover:underline">Cadastre-se</a>
        </p>

      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  senha = '';
  carregando = signal<boolean>(false);
  erro = signal<string | null>(null);

  preencher(e: string, s: string): void {
    this.email = e;
    this.senha = s;
  }

  entrar(): void {
    if (!this.email || !this.senha) return;
    this.carregando.set(true);
    this.erro.set(null);

    this.auth.login({ email: this.email, senha: this.senha }).subscribe({
      next: () => {
        this.carregando.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/catalogo';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('E-mail ou senha incorretos. Verifique suas credenciais.');
      }
    });
  }
}

