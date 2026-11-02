import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PhoneMaskDirective } from '../../shared/directives/phone-mask.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PhoneMaskDirective],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-nude-200 shadow-xl shadow-nude-200/50">
        
        <div class="text-center mb-6">
          <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-rose-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-rose-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 class="font-serif text-2xl font-bold text-stone-900">
            {{ modo() === 'login' ? 'Acessar Plataforma' : 'Primeiro Acesso' }}
          </h2>
          <p class="text-xs text-stone-500 mt-1">
            {{ modo() === 'login' 
              ? 'Acesse seu painel com seu usuário, WhatsApp ou e-mail' 
              : 'Cadastre sua senha de acesso com seu número de WhatsApp' }}
          </p>
        </div>

        <!-- Alternador entre Login e Primeiro Acesso -->
        <div class="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl mb-6 text-xs font-semibold">
          <button
            type="button"
            (click)="setModo('login')"
            [class.bg-white]="modo() === 'login'"
            [class.text-stone-900]="modo() === 'login'"
            [class.shadow-sm]="modo() === 'login'"
            [class.text-stone-500]="modo() !== 'login'"
            class="py-2.5 rounded-xl transition-all">
            Já Tenho Senha
          </button>
          <button
            type="button"
            (click)="setModo('primeiro-acesso')"
            [class.bg-white]="modo() === 'primeiro-acesso'"
            [class.text-stone-900]="modo() === 'primeiro-acesso'"
            [class.shadow-sm]="modo() === 'primeiro-acesso'"
            [class.text-stone-500]="modo() !== 'primeiro-acesso'"
            class="py-2.5 rounded-xl transition-all">
            Primeiro Acesso
          </button>
        </div>

        <!-- Mensagens de Feedback -->
        @if (mensagemSucesso()) {
          <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-5 flex items-center justify-between">
            <span>{{ mensagemSucesso() }}</span>
            <button (click)="mensagemSucesso.set(null)" class="text-emerald-700 font-bold ml-2">✕</button>
          </div>
        }

        @if (erro()) {
          <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-5 flex items-center justify-between">
            <span>{{ erro() }}</span>
            <button (click)="erro.set(null)" class="text-rose-700 font-bold ml-2">✕</button>
          </div>
        }

        <!-- ================= FORMULÁRIO 1: LOGIN TRADICIONAL ================= -->
        @if (modo() === 'login') {
          <form (ngSubmit)="entrar()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Usuário, WhatsApp ou E-mail:</label>
              <input 
                type="text" 
                [(ngModel)]="loginIdentificador" 
                name="loginIdentificador"
                required
                placeholder="Seu usuário, (61) 98226-1155 ou e-mail" 
                class="w-full p-3 rounded-xl border border-nude-300 text-xs font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none" />
              <span class="text-[11px] text-stone-400 mt-1 block">
                Clientes: digite seu WhatsApp. Especialistas e Administradores: login de usuário ou e-mail.
              </span>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-stone-700">Sua Senha:</label>
                <button type="button" (click)="setModo('primeiro-acesso')" class="text-[11px] text-rose-600 font-semibold hover:underline">
                  Primeiro acesso?
                </button>
              </div>
              <input 
                type="password" 
                [(ngModel)]="senha" 
                name="senha"
                required
                placeholder="••••••••" 
                class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
            </div>

            <button 
              type="submit" 
              [disabled]="carregando() || !loginIdentificador || !senha"
              class="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 mt-2">
              {{ carregando() ? 'Entrando...' : 'Entrar no Sistema' }}
            </button>
          </form>
        }

        <!-- ================= FORMULÁRIO 2: PRIMEIRO ACESSO ================= -->
        @if (modo() === 'primeiro-acesso') {
          <form (ngSubmit)="confirmarPrimeiroAcesso()" class="space-y-4">
            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              💡 <strong>Cadastrado pela clínica?</strong> Se o administrador cadastrou você como especialista ou paciente, informe seu WhatsApp abaixo para definir sua senha de acesso.
            </div>

            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Seu WhatsApp Cadastrado:</label>
              <input 
                type="text" 
                appPhoneMask
                [(ngModel)]="telefonePrimeiroAcesso" 
                name="telefonePrimeiroAcesso"
                required
                placeholder="(61) 98226-1155 ou 61982261155" 
                class="w-full p-3 rounded-xl border border-nude-300 text-xs font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Crie sua Senha de Acesso (Mínimo 6 dígitos):</label>
              <input 
                type="password" 
                [(ngModel)]="novaSenha" 
                name="novaSenha"
                required
                minlength="6"
                placeholder="Defina uma senha segura" 
                class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Confirme sua Senha:</label>
              <input 
                type="password" 
                [(ngModel)]="confirmarSenha" 
                name="confirmarSenha"
                required
                minlength="6"
                placeholder="Repita sua senha" 
                class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
            </div>

            <button 
              type="submit" 
              [disabled]="carregando() || !telefonePrimeiroAcesso || !novaSenha || novaSenha.length < 6"
              class="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-xs transition-all shadow-md shadow-rose-200 disabled:opacity-50 mt-2">
              {{ carregando() ? 'Ativando...' : 'Cadastrar Senha & Entrar' }}
            </button>
          </form>
        }

        <p class="text-center text-xs text-stone-500 mt-6">
          Ainda não possui cadastro na clínica? 
          <a routerLink="/registrar" class="text-rose-600 font-bold hover:underline">Cadastre-se online</a>
        </p>

      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modo = signal<'login' | 'primeiro-acesso'>('login');
  loginIdentificador = '';
  senha = '';

  telefonePrimeiroAcesso = '';
  novaSenha = '';
  confirmarSenha = '';

  carregando = signal<boolean>(false);
  erro = signal<string | null>(null);
  mensagemSucesso = signal<string | null>(null);

  setModo(novoModo: 'login' | 'primeiro-acesso'): void {
    this.modo.set(novoModo);
    this.erro.set(null);
    this.mensagemSucesso.set(null);
  }

  entrar(): void {
    if (!this.loginIdentificador || !this.senha) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.mensagemSucesso.set(null);

    this.auth.login({ login: this.loginIdentificador, senha: this.senha }).subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.redirecionarAposAuth(res.role);
      },
      error: (err) => {
        this.carregando.set(false);
        const msg = err?.error?.message || err?.error?.detail;
        if (msg && msg.toLowerCase().includes('primeiro acesso')) {
          this.telefonePrimeiroAcesso = this.loginIdentificador;
          this.setModo('primeiro-acesso');
          this.erro.set(msg);
        } else {
          this.erro.set(msg || 'WhatsApp ou senha incorretos. Verifique suas credenciais.');
        }
      }
    });
  }

  confirmarPrimeiroAcesso(): void {
    if (!this.telefonePrimeiroAcesso || !this.novaSenha) return;

    if (this.novaSenha.length < 6) {
      this.erro.set('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.erro.set('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);
    this.mensagemSucesso.set(null);

    this.auth.primeiroAcesso({
      telefoneWhatsApp: this.telefonePrimeiroAcesso,
      novaSenha: this.novaSenha
    }).subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.mensagemSucesso.set('Senha cadastrada com sucesso! Bem-vinda(o).');
        setTimeout(() => this.redirecionarAposAuth(res.role), 500);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.message || 'Falha ao cadastrar senha. Verifique o número de WhatsApp informado.');
      }
    });
  }

  private redirecionarAposAuth(role?: string): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    if (role === 'ROLE_ADMIN' || role === 'ROLE_PROFISSIONAL') {
      this.router.navigateByUrl('/admin/dashboard');
    } else {
      this.router.navigateByUrl('/catalogo');
    }
  }
}
