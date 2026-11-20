import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { SuporteChamado } from '../../../core/models';
import { PhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';
import { formatarTelefoneBR } from '../../../shared/pipes/telefone.pipe';

@Component({
  selector: 'app-admin-suporte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PhoneMaskDirective],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 font-sans">

      <!-- Cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Módulo Administrativo • Central do Lojista
          </span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Suporte & Dúvidas
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Converse diretamente com a equipe Agendoou.
            <strong class="text-emerald-700">🔒 Atendimento Privado: somente sua conta visualiza e responde a estas conversas.</strong>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="carregarMeusChamados()"
            [disabled]="carregando()"
            class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm cursor-pointer disabled:opacity-50">
            <span [class.animate-spin]="carregando()" class="inline-block">🔄</span> Atualizar
          </button>
          <button
            type="button"
            (click)="abrirNovaDuvida()"
            class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer">
            + Nova Dúvida
          </button>
          <a routerLink="/admin/dashboard" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm">
            ← Voltar ao Painel
          </a>
        </div>
      </div>

      @if (erro()) {
        <div class="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{{ erro() }}</span>
          <button type="button" (click)="erro.set(null)" class="font-bold ml-3">✕</button>
        </div>
      }

      @if (sucesso()) {
        <div class="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{{ sucesso() }}</span>
          <button type="button" (click)="sucesso.set(null)" class="font-bold ml-3">✕</button>
        </div>
      }

      <!-- Layout Mestre-Detalhe -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        <!-- Coluna Esquerda: Lista de Conversas do Lojista -->
        <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[520px]">
          <div class="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <h2 class="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Minhas Conversas ({{ chamados().length }})
            </h2>
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              🔒 Exclusivo da sua loja
            </span>
          </div>

          <div class="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[560px]">
            @if (carregando() && chamados().length === 0) {
              <div class="p-10 text-center text-xs text-slate-400">Carregando suas conversas...</div>
            } @else if (chamados().length === 0) {
              <div class="p-10 text-center space-y-3">
                <p class="text-xs font-semibold text-slate-600">Você ainda não enviou nenhuma dúvida pelo painel.</p>
                <button
                  type="button"
                  (click)="abrirNovaDuvida()"
                  class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer">
                  Enviar Primeira Dúvida
                </button>
              </div>
            } @else {
              @for (ch of chamados(); track ch.id) {
                <button
                  type="button"
                  (click)="selecionarChamado(ch)"
                  [class.bg-emerald-50/70]="!modoNovaDuvida() && chamadoSelecionado()?.id === ch.id"
                  [class.border-l-4]="!modoNovaDuvida() && chamadoSelecionado()?.id === ch.id"
                  [class.border-emerald-500]="!modoNovaDuvida() && chamadoSelecionado()?.id === ch.id"
                  class="w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-[10px] font-mono font-bold text-slate-400">{{ ch.protocolo }}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          [class.bg-amber-100]="ch.status === 'ABERTO'"
                          [class.text-amber-800]="ch.status === 'ABERTO'"
                          [class.bg-emerald-100]="ch.status === 'RESPONDIDO'"
                          [class.text-emerald-800]="ch.status === 'RESPONDIDO'"
                          [class.bg-slate-200]="ch.status === 'ENCERRADO'"
                          [class.text-slate-700]="ch.status === 'ENCERRADO'">
                      {{ labelStatus(ch.status) }}
                    </span>
                  </div>
                  <p class="text-xs font-extrabold text-slate-900 truncate">{{ ch.assunto }}</p>
                  @if (ch.mensagens.length > 0) {
                    <p class="text-[11px] text-slate-500 truncate mt-1">
                      {{ ch.mensagens[ch.mensagens.length - 1].remetente === 'SUPORTE' ? 'Suporte: ' : 'Você: ' }}
                      {{ ch.mensagens[ch.mensagens.length - 1].mensagem }}
                    </p>
                  }
                  <div class="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{{ ch.categoria }}</span>
                    <span>{{ formatarDataHora(ch.atualizadoEm) }}</span>
                  </div>
                </button>
              }
            }
          </div>
        </div>

        <!-- Coluna Direita: Formulário de Nova Dúvida ou Chat Privado -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[520px]">
          @if (modoNovaDuvida() || (!chamadoSelecionado() && !carregando())) {
            <div class="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Novo Atendimento</span>
                <h2 class="text-base font-extrabold text-slate-900">Enviar Nova Dúvida ao Suporte</h2>
              </div>
              @if (chamados().length > 0 && modoNovaDuvida()) {
                <button
                  type="button"
                  (click)="cancelarNovaDuvida()"
                  class="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer">
                  Voltar à conversa
                </button>
              }
            </div>

            <form (ngSubmit)="enviarNovaDuvida()" class="p-5 sm:p-6 space-y-4 flex-1">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Seu Nome *</label>
                  <input
                    type="text"
                    [(ngModel)]="formDuvida.nome"
                    name="lojNome"
                    required
                    maxlength="100"
                    placeholder="Seu nome completo"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">WhatsApp com DDD *</label>
                  <input
                    type="tel"
                    appPhoneMask
                    [(ngModel)]="formDuvida.whatsapp"
                    (input)="aoDigitarWhatsapp($event)"
                    name="lojWa"
                    required
                    maxlength="15"
                    inputmode="numeric"
                    placeholder="(11) 99999-8888"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    [(ngModel)]="formDuvida.email"
                    name="lojEmail"
                    maxlength="140"
                    placeholder="seu@email.com"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Estabelecimento</label>
                  <input
                    type="text"
                    [(ngModel)]="formDuvida.nomeEmpresa"
                    name="lojEmpresa"
                    maxlength="120"
                    placeholder="Nome da empresa"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    [(ngModel)]="formDuvida.categoria"
                    name="lojCat"
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
                    <option value="SUPORTE">Suporte Técnico</option>
                    <option value="DUVIDA">Dúvida Geral</option>
                    <option value="PLANOS">Planos & Assinatura</option>
                    <option value="PAGAMENTO">Pagamento PIX/Cartão</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-bold text-slate-700 mb-1">Assunto *</label>
                  <input
                    type="text"
                    [(ngModel)]="formDuvida.assunto"
                    name="lojAssunto"
                    required
                    maxlength="120"
                    placeholder="Ex: Dúvida sobre agendamentos ou assinatura"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-slate-700">Mensagem *</label>
                  <span class="text-[10px] text-slate-400">{{ formDuvida.mensagem.length }}/1500</span>
                </div>
                <textarea
                  rows="4"
                  [(ngModel)]="formDuvida.mensagem"
                  name="lojMsg"
                  required
                  maxlength="1500"
                  placeholder="Descreva sua dúvida ou solicitação para nossa equipe..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"></textarea>
              </div>

              <div class="pt-2 flex justify-end">
                <button
                  type="submit"
                  [disabled]="enviando()"
                  class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50">
                  {{ enviando() ? 'Enviando...' : 'Enviar para o Suporte' }}
                </button>
              </div>
            </form>
          } @else if (chamadoSelecionado(); as ch) {
            <!-- Cabeçalho da Conversa Selecionada -->
            <div class="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                    {{ ch.protocolo }}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        [class.bg-amber-100]="ch.status === 'ABERTO'"
                        [class.text-amber-800]="ch.status === 'ABERTO'"
                        [class.bg-emerald-100]="ch.status === 'RESPONDIDO'"
                        [class.text-emerald-800]="ch.status === 'RESPONDIDO'"
                        [class.bg-slate-200]="ch.status === 'ENCERRADO'"
                        [class.text-slate-700]="ch.status === 'ENCERRADO'">
                    {{ labelStatus(ch.status) }}
                  </span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">{{ ch.categoria }}</span>
                </div>
                <h3 class="text-base font-extrabold text-slate-900 mt-1">{{ ch.assunto }}</h3>
              </div>

              <span class="text-[11px] text-slate-500">
                WhatsApp: <strong>{{ formatarTelefone(ch.whatsapp) }}</strong>
              </span>
            </div>

            <!-- Timeline de Mensagens -->
            <div class="flex-1 p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[380px] bg-slate-50/40">
              @for (m of ch.mensagens; track m.id) {
                <div class="flex" [class.justify-end]="m.remetente === 'CLIENTE'" [class.justify-start]="m.remetente === 'SUPORTE'">
                  <div
                    class="max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-sm"
                    [class.bg-slate-900]="m.remetente === 'CLIENTE'"
                    [class.text-white]="m.remetente === 'CLIENTE'"
                    [class.bg-emerald-50]="m.remetente === 'SUPORTE'"
                    [class.border]="m.remetente === 'SUPORTE'"
                    [class.border-emerald-200]="m.remetente === 'SUPORTE'"
                    [class.text-slate-900]="m.remetente === 'SUPORTE'">
                    <div class="flex items-center justify-between gap-4 mb-1">
                      <span class="text-[10px] font-bold"
                            [class.text-emerald-300]="m.remetente === 'CLIENTE'"
                            [class.text-emerald-700]="m.remetente === 'SUPORTE'">
                        {{ m.remetente === 'SUPORTE' ? (m.autorNome || 'Suporte Agendoou') : 'Você' }}
                      </span>
                      <span class="text-[10px] opacity-70">{{ formatarDataHora(m.criadoEm) }}</span>
                    </div>
                    <p class="whitespace-pre-line leading-relaxed">{{ m.mensagem }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Réplica do Lojista -->
            @if (ch.status !== 'ENCERRADO') {
              <div class="p-4 border-t border-slate-200 bg-white space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-slate-400 font-semibold">Responder nesta conversa privada</span>
                  <span class="text-[10px] text-slate-400">{{ novaReplica.length }}/1500</span>
                </div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="novaReplica"
                    name="novaReplica"
                    maxlength="1500"
                    (keyup.enter)="enviarReplica()"
                    placeholder="Escreva sua mensagem para o suporte..."
                    class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  <button
                    type="button"
                    (click)="enviarReplica()"
                    [disabled]="enviando() || !novaReplica.trim()"
                    class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50">
                    {{ enviando() ? 'Enviando...' : 'Enviar' }}
                  </button>
                </div>
              </div>
            } @else {
              <div class="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500 font-semibold">
                Este atendimento foi encerrado. Caso precise, clique em "+ Nova Dúvida" acima.
              </div>
            }
          }
        </div>

      </div>
    </div>
  `
})
export class AdminSuporteComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);

  chamados = signal<SuporteChamado[]>([]);
  chamadoSelecionado = signal<SuporteChamado | null>(null);
  modoNovaDuvida = signal<boolean>(false);

  carregando = signal<boolean>(false);
  enviando = signal<boolean>(false);
  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);

  novaReplica = '';

  formDuvida = {
    nome: '',
    whatsapp: '',
    email: '',
    nomeEmpresa: '',
    categoria: 'SUPORTE',
    assunto: '',
    mensagem: ''
  };

  private pollTimer: any = null;

  ngOnInit(): void {
    this.preencherDadosIniciais();
    this.carregarMeusChamados();
    this.pollTimer = setInterval(() => this.carregarMeusChamados(true), 10000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private preencherDadosIniciais(): void {
    const u = this.authService.currentUser();
    const tenant = this.tenantService.tenant();
    this.formDuvida.nome = u?.nome || '';
    this.formDuvida.whatsapp = formatarTelefoneBR(u?.telefoneWhatsApp || tenant?.telefoneWhatsApp || '');
    this.formDuvida.email = (u?.email && !u.email.endsWith('@cliente.local')) ? u.email : '';
    this.formDuvida.nomeEmpresa = this.tenantService.nomeEmpresa() || tenant?.nomeEmpresa || '';
  }

  carregarMeusChamados(silencioso = false): void {
    if (!silencioso) this.carregando.set(true);
    this.api.getMeusChamadosSuporte().subscribe({
      next: (lista) => {
        this.chamados.set(lista);
        this.carregando.set(false);
        const atual = this.chamadoSelecionado();
        if (atual) {
          const atualizado = lista.find(c => c.id === atual.id);
          if (atualizado) this.chamadoSelecionado.set(atualizado);
        } else if (lista.length > 0 && !this.modoNovaDuvida()) {
          this.chamadoSelecionado.set(lista[0]);
        }
      },
      error: (err) => {
        this.carregando.set(false);
        if (!silencioso) {
          this.erro.set(err?.error?.detail || err?.error?.message || 'Erro ao carregar suas mensagens de suporte.');
        }
      }
    });
  }

  abrirNovaDuvida(): void {
    this.erro.set(null);
    this.sucesso.set(null);
    this.modoNovaDuvida.set(true);
  }

  cancelarNovaDuvida(): void {
    this.erro.set(null);
    this.modoNovaDuvida.set(false);
  }

  selecionarChamado(ch: SuporteChamado): void {
    this.erro.set(null);
    this.modoNovaDuvida.set(false);
    this.chamadoSelecionado.set(ch);
  }

  aoDigitarWhatsapp(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatado = formatarTelefoneBR(input.value);
    input.value = formatado;
    this.formDuvida.whatsapp = formatado;
  }

  enviarNovaDuvida(): void {
    const nome = this.formDuvida.nome.trim();
    const digits = this.formDuvida.whatsapp.replace(/\D/g, '');
    const email = this.formDuvida.email.trim();
    const assunto = this.formDuvida.assunto.trim();
    const mensagem = this.formDuvida.mensagem.trim();

    if (nome.length < 2) {
      this.erro.set('Informe seu nome completo (mínimo 2 caracteres).');
      return;
    }
    if (digits.length < 10 || digits.length > 11 || new Set(digits.split('')).size <= 1) {
      this.erro.set('Informe um WhatsApp válido com DDD, ex: (11) 99999-8888.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.erro.set('Informe um e-mail válido ou deixe o campo em branco.');
      return;
    }
    if (assunto.length < 3) {
      this.erro.set('Informe o assunto da sua dúvida (mínimo 3 caracteres).');
      return;
    }
    if (mensagem.length < 5) {
      this.erro.set('Descreva sua dúvida com pelo menos 5 caracteres.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    this.api.criarChamadoSuporte({
      nome,
      whatsapp: digits,
      email: email || undefined,
      nomeEmpresa: this.formDuvida.nomeEmpresa.trim() || undefined,
      categoria: this.formDuvida.categoria,
      assunto,
      mensagem,
      origem: 'PAINEL_LOJISTA'
    }).subscribe({
      next: (ch) => {
        this.enviando.set(false);
        this.formDuvida.assunto = '';
        this.formDuvida.mensagem = '';
        this.modoNovaDuvida.set(false);
        this.chamadoSelecionado.set(ch);
        this.sucesso.set(`✓ Dúvida registrada sob o protocolo ${ch.protocolo}! Nossa equipe responderá por aqui e no seu WhatsApp.`);
        this.carregarMeusChamados(true);
      },
      error: (err) => {
        this.enviando.set(false);
        this.erro.set(err?.error?.detail || err?.error?.message || 'Erro ao enviar dúvida.');
      }
    });
  }

  enviarReplica(): void {
    const ch = this.chamadoSelecionado();
    const texto = this.novaReplica.trim();
    if (!ch || !texto) return;

    this.enviando.set(true);
    this.erro.set(null);

    this.api.enviarMensagemMeuChamado(ch.id, texto).subscribe({
      next: (atualizado) => {
        this.enviando.set(false);
        this.novaReplica = '';
        this.chamadoSelecionado.set(atualizado);
        this.chamados.update(lista => lista.map(item => item.id === atualizado.id ? atualizado : item));
      },
      error: (err) => {
        this.enviando.set(false);
        this.erro.set(err?.error?.detail || err?.error?.message || 'Erro ao enviar mensagem.');
      }
    });
  }

  formatarTelefone(tel: string | null | undefined): string {
    return formatarTelefoneBR(tel);
  }

  labelStatus(st: string): string {
    if (st === 'RESPONDIDO') return 'Respondido';
    if (st === 'ENCERRADO') return 'Encerrado';
    return 'Aguardando';
  }

  formatarDataHora(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
