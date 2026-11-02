import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { formatarTelefoneBR } from '../../shared/pipes/telefone.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-nude-200 shadow-xl shadow-nude-200/50">
        
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-champagne-400 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-rose-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h2 class="font-serif text-2xl font-bold text-stone-900">Cadastro de Cliente</h2>
          <p class="text-xs text-stone-500 mt-1">Crie sua conta para agendar e acompanhar suas sessões</p>
        </div>

        @if (erro()) {
          <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-5">
            {{ erro() }}
          </div>
        }

        <form (ngSubmit)="cadastrar()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Nome Completo:</label>
            <input 
              type="text" 
              [(ngModel)]="nome" 
              name="nome"
              required
              placeholder="Ex: Amanda Ferreira" 
              class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
          </div>

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
            <label class="block text-xs font-semibold text-stone-700 mb-1">WhatsApp (com DDD):</label>
            <div class="relative">
              <input 
                type="tel" 
                [ngModel]="whatsapp" 
                (ngModelChange)="onWhatsappChange($event)"
                name="whatsapp"
                required
                maxlength="15"
                placeholder="(11) 98765-4321" 
                class="w-full p-3 rounded-xl border border-nude-300 text-xs font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400">
                BR +55
              </span>
            </div>
            <span class="text-[10px] text-stone-400 mt-0.5 block">Máscara automática: (DD) 9XXXX-XXXX</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-stone-700 mb-1">Crie uma Senha:</label>
            <input 
              type="password" 
              [(ngModel)]="senha" 
              name="senha"
              required
              minlength="6"
              placeholder="Mínimo 6 caracteres" 
              class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
          </div>

          <button 
            type="submit" 
            [disabled]="carregando()"
            class="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 mt-2">
            @if (carregando()) {
              <span>Criando conta...</span>
            } @else {
              <span>Finalizar Cadastro</span>
            }
          </button>
        </form>

        <p class="text-center text-xs text-stone-500 mt-6">
          Já possui conta? 
          <a routerLink="/login" class="text-rose-600 font-bold hover:underline">Faça login</a>
        </p>

      </div>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  nome = '';
  email = '';
  whatsapp = '';
  senha = '';
  carregando = signal<boolean>(false);
  erro = signal<string | null>(null);

  onWhatsappChange(valor: string): void {
    this.whatsapp = formatarTelefoneBR(valor);
  }

  cadastrar(): void {
    if (!this.nome || !this.email || !this.whatsapp || !this.senha) return;

    const apenasDigitos = this.whatsapp.replace(/\D/g, '');
    if (apenasDigitos.length < 10) {
      this.erro.set('Por favor, informe um número de WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.auth.registrar({
      nome: this.nome,
      email: this.email,
      telefoneWhatsApp: apenasDigitos,
      senha: this.senha
    }).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.detail || 'Erro ao realizar cadastro. Tente outro e-mail.');
      }
    });
  }
}
