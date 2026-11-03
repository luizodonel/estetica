import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SetorService } from '../../core/services/setor.service';
import { PhoneMaskDirective } from '../../shared/directives/phone-mask.directive';

interface PixPendenteInfo {
  paymentId?: string;
  pixCopiaCola?: string;
  pixQrCodeBase64?: string;
  valor: number;
  mensagem: string;
}

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

        <!-- Card Especial com QR Code do PIX Pendente -->
        @if (pixPendente()) {
          <div class="p-4 rounded-3xl bg-rose-50/90 border-2 border-rose-300 text-stone-800 text-xs mb-6 shadow-md animate-scale-up text-center space-y-3">
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] uppercase tracking-wider">
                💳 Ativação PIX • R$ {{ pixPendente()!.valor.toFixed(2).replace('.', ',') }}
              </span>
              <button (click)="fecharPixPendente()" class="text-stone-400 hover:text-stone-700 font-bold text-sm">✕</button>
            </div>

            <p class="text-xs text-rose-900 font-medium leading-relaxed">
              {{ pixPendente()!.mensagem }}
            </p>

            <!-- Imagem QR Code PIX -->
            @if (pixPendente()!.pixQrCodeBase64) {
              <div class="p-3 bg-white rounded-2xl border border-nude-200 inline-block shadow-inner">
                <img
                  [src]="'data:image/png;base64,' + pixPendente()!.pixQrCodeBase64"
                  alt="QR Code PIX"
                  class="w-48 h-48 object-contain rounded-xl mx-auto" />
                <span class="text-[10px] text-stone-400 block mt-1.5">Abra o app do seu banco e aponte a câmera</span>
              </div>
            }

            <!-- Campo PIX Copia e Cola -->
            @if (pixPendente()!.pixCopiaCola) {
              <div class="text-left space-y-1">
                <label class="block text-[11px] font-semibold text-stone-700">PIX Copia e Cola:</label>
                <div class="flex items-center gap-1.5">
                  <input
                    type="text"
                    readonly
                    [value]="pixPendente()!.pixCopiaCola"
                    class="w-full text-[10px] font-mono p-2.5 rounded-xl border border-nude-300 bg-white select-all focus:outline-none" />
                  <button
                    type="button"
                    (click)="copiarPix()"
                    class="px-3 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-[11px] whitespace-nowrap shadow-sm transition-all">
                    {{ pixCopiado() ? '✓ Copiado!' : 'Copiar' }}
                  </button>
                </div>
              </div>
            }

            <!-- Status de Verificação Automática -->
            <div class="flex items-center justify-center gap-2 text-[11px] font-medium text-amber-800 bg-amber-100/60 py-2 px-3 rounded-xl">
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>Aguardando pagamento... Verificando a cada 3s</span>
            </div>

            <button
              type="button"
              (click)="verificarPagamentoManual()"
              class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5">
              <span>🔄 Já realizei o pagamento • Liberar Acesso</span>
            </button>
          </div>
        }

        @if (erro() && !pixPendente()) {
          <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-5 flex items-center justify-between animate-fade-in">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{{ erro() }}</span>
            </div>
            <button (click)="erro.set(null)" class="text-rose-700 hover:text-rose-900 font-bold ml-2">✕</button>
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
                {{ setorService.termoClientes() }}: digite seu WhatsApp. {{ setorService.termoProfissionais() }} e Administradores: login de usuário ou e-mail.
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
              💡 <strong>Já possui cadastro?</strong> Se o administrador cadastrou você como especialista ou cliente, informe seu WhatsApp abaixo para definir sua senha de acesso.
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
          Ainda não possui cadastro? 
          <a routerLink="/registrar" class="text-rose-600 font-bold hover:underline">Cadastre-se online</a>
        </p>

      </div>
    </div>
  `
})
export class LoginComponent implements OnDestroy {
  public setorService = inject(SetorService);
  private auth = inject(AuthService);
  private api = inject(ApiService);
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

  // PIX Pendente Signals
  pixPendente = signal<PixPendenteInfo | null>(null);
  pixCopiado = signal<boolean>(false);
  private pollingTimer: any = null;

  ngOnDestroy(): void {
    this.limparPolling();
  }

  limparPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  extrairLinkDaMensagem(msg: string): string | null {
    if (!msg) return null;
    const match = msg.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  }

  extrairMensagemSemLink(msg: string): string {
    if (!msg) return '';
    return msg;
  }

  setModo(novoModo: 'login' | 'primeiro-acesso'): void {
    this.modo.set(novoModo);
    this.erro.set(null);
    this.mensagemSucesso.set(null);
    this.pixPendente.set(null);
    this.limparPolling();
  }

  fecharPixPendente(): void {
    this.pixPendente.set(null);
    this.limparPolling();
  }

  entrar(): void {
    if (!this.loginIdentificador || !this.senha) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.mensagemSucesso.set(null);
    this.pixPendente.set(null);
    this.limparPolling();

    this.auth.login({
      login: this.loginIdentificador,
      senha: this.senha,
      host: typeof window !== 'undefined' ? window.location.host : '',
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    }).subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.redirecionarAposAuth(res.role);
      },
      error: (err) => {
        this.carregando.set(false);
        const errData = err?.error;
        const msg = errData?.detail || errData?.message || (typeof errData === 'string' ? errData : null);

        // Se for pendência de pagamento PIX (com dados retornados pelo backend)
        if (err.status === 402 || errData?.pixQrCodeBase64 || errData?.pixCopiaCola || (msg && msg.includes('PIX de ativação'))) {
          this.pixPendente.set({
            paymentId: errData?.paymentId,
            pixQrCodeBase64: errData?.pixQrCodeBase64,
            pixCopiaCola: errData?.pixCopiaCola,
            valor: errData?.valor || 149.90,
            mensagem: msg || 'O seu acesso está aguardando a confirmação do pagamento PIX de ativação (R$ 149,90).'
          });

          if (errData?.paymentId) {
            this.iniciarPollingPagamento(errData.paymentId);
          }
          return;
        }

        if (msg && msg.toLowerCase().includes('primeiro acesso')) {
          this.telefonePrimeiroAcesso = this.loginIdentificador;
          this.setModo('primeiro-acesso');
          this.erro.set(msg);
        } else if (msg && (msg.includes('não pertence') || msg.includes('Credenciais') || msg.includes('Bad credentials') || msg.includes('não encontrado') || msg.includes('inválid') || msg.includes('pertence'))) {
          this.erro.set('Login ou usuário inválido.');
        } else {
          this.erro.set(msg || 'Login ou usuário inválido.');
        }
      }
    });
  }

  iniciarPollingPagamento(paymentId: string): void {
    this.limparPolling();
    this.pollingTimer = setInterval(() => {
      this.consultarStatus(paymentId, false);
    }, 3000);
  }

  verificarPagamentoManual(): void {
    const id = this.pixPendente()?.paymentId;
    if (id) {
      this.consultarStatus(id, true);
    } else {
      // Tenta reenviar o login
      this.entrar();
    }
  }

  private consultarStatus(paymentId: string, manual: boolean): void {
    this.api.consultarStatusPagamento(paymentId).subscribe({
      next: (res) => {
        if (res.pago || res.status === 'approved') {
          this.limparPolling();
          this.pixPendente.set(null);
          this.mensagemSucesso.set('🎉 Pagamento PIX aprovado com sucesso! Acesso liberado!');

          if (res.token) {
            localStorage.setItem('auth_token', res.token);
            if (res.usuario) {
              this.auth.currentUser.set(res.usuario);
            }
          }

          setTimeout(() => {
            this.redirecionarAposAuth(res.usuario?.role);
          }, 1200);
        } else if (manual) {
          alert('O pagamento ainda não foi identificado pelo banco. Por favor, aguarde alguns instantes enquanto o PIX é processado.');
        }
      },
      error: () => {
        if (manual) {
          this.entrar();
        }
      }
    });
  }

  copiarPix(): void {
    const pix = this.pixPendente()?.pixCopiaCola;
    if (pix && navigator.clipboard) {
      navigator.clipboard.writeText(pix).then(() => {
        this.pixCopiado.set(true);
        setTimeout(() => this.pixCopiado.set(false), 3000);
      });
    }
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
