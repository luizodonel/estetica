import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { TenantService } from '../../../core/services/tenant.service';
import { InstagramStatusResponse, PostSocial } from '../../../core/models';

@Component({
  selector: 'app-admin-redes-sociais',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <!-- Cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-50 to-amber-50 border border-fuchsia-200 text-fuchsia-700 text-xs font-semibold mb-2">
            <span>📸</span> Integração Oficial Meta / Instagram
          </span>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Publicação no Instagram
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Conecte a conta profissional do seu estabelecimento para publicar fotos e banners no Feed ou nos Stories com 1 clique.
          </p>
        </div>

        <button
          type="button"
          (click)="carregarStatus()"
          [disabled]="carregando()"
          class="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-sm disabled:opacity-50">
          {{ carregando() ? 'Atualizando...' : '↻ Atualizar Status' }}
        </button>
      </div>

      <!-- Mensagem de feedback -->
      @if (mensagemSucesso()) {
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start justify-between gap-3 shadow-sm">
          <div class="flex items-start gap-2.5">
            <span class="text-base">✅</span>
            <p class="font-medium">{{ mensagemSucesso() }}</p>
          </div>
          <button type="button" (click)="mensagemSucesso.set(null)" class="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      }

      @if (mensagemErro()) {
        <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3 shadow-sm">
          <div class="flex items-start gap-2.5">
            <span class="text-base">⚠️</span>
            <p class="font-medium">{{ mensagemErro() }}</p>
          </div>
          <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      }

      <!-- Card 1: Status da Conexão Instagram -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        @if (carregando() && !status()) {
          <div class="py-8 text-center text-sm text-slate-500">Carregando configuração do Instagram...</div>
        } @else {
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              @if (status()?.conectado && status()?.igProfilePictureUrl) {
                <img
                  [src]="status()!.igProfilePictureUrl!"
                  [alt]="status()?.igUsername || 'Instagram'"
                  class="w-16 h-16 rounded-2xl object-cover ring-2 ring-fuchsia-500/30 shadow-sm" />
              } @else {
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-fuchsia-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-sm">
                  📸
                </div>
              }

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-lg font-bold text-slate-900">
                    @if (status()?.conectado) {
                      &#64;{{ status()?.igUsername }}
                    } @else {
                      Conta do Instagram não conectada
                    }
                  </h2>

                  @if (status()?.conectado) {
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      ● Conectado
                    </span>
                  } @else if (status()?.appConfigurado) {
                    <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      Pronto para conectar
                    </span>
                  } @else {
                    <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                      Aguardando Meta App ID/Secret
                    </span>
                  }
                </div>

                @if (status()?.conectado) {
                  <p class="text-xs text-slate-500 mt-1">
                    {{ status()?.igName || 'Conta Profissional' }}
                    @if (status()?.igAccountType) { • {{ status()?.igAccountType }} }
                    @if (status()?.tokenExpiraEm) {
                      • Token válido até {{ formatarData(status()!.tokenExpiraEm!) }}
                    }
                  </p>
                } @else {
                  <p class="text-xs text-slate-500 mt-1">
                    Requer conta Instagram Profissional (Business ou Creator) vinculada via login oficial da Meta.
                  </p>
                }
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              @if (status()?.conectado) {
                <button
                  type="button"
                  (click)="conectarInstagram()"
                  [disabled]="conectando()"
                  class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all">
                  Reconectar
                </button>
                <button
                  type="button"
                  (click)="desconectarInstagram()"
                  [disabled]="desconectando()"
                  class="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all disabled:opacity-50">
                  {{ desconectando() ? 'Desconectando...' : 'Desconectar' }}
                </button>
              } @else {
                <button
                  type="button"
                  (click)="conectarInstagram()"
                  [disabled]="!status()?.appConfigurado || conectando()"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-500 hover:from-fuchsia-700 hover:to-rose-600 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {{ conectando() ? 'Redirecionando...' : 'Conectar Instagram Oficial' }}
                </button>
              }
            </div>
          </div>

          <!-- Painel de orientações quando META_APP_ID / META_APP_SECRET ainda não foram configurados -->
          @if (status() && !status()!.appConfigurado) {
            <div class="mt-6 p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs text-amber-950">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <p class="font-bold text-sm">⚙️ Configuração pendente no Meta for Developers &amp; Servidor</p>
                <span class="px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-semibold">App Review Checklist</span>
              </div>
              <p class="text-amber-900 leading-relaxed">
                Para ativar o botão <strong>Conectar Instagram Oficial</strong>, crie seu App no
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener" class="underline font-semibold">Meta for Developers</a>,
                adicione o produto <strong>Instagram</strong> e configure as variáveis de ambiente
                <code class="px-1.5 py-0.5 rounded bg-amber-100 font-mono">META_APP_ID</code> e
                <code class="px-1.5 py-0.5 rounded bg-amber-100 font-mono">META_APP_SECRET</code> no Coolify.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                <div class="p-3 rounded-xl bg-white/80 border border-amber-200/70">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Redirect URI OAuth</span>
                  <div class="flex items-center justify-between gap-2 mt-1">
                    <code class="text-[11px] font-mono text-slate-800 truncate">{{ redirectUriExibicao() }}</code>
                    <button type="button" (click)="copiarTexto(redirectUriExibicao())" class="text-[11px] font-semibold text-fuchsia-700 hover:underline shrink-0">Copiar</button>
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-white/80 border border-amber-200/70">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Callback Desautorização</span>
                  <div class="flex items-center justify-between gap-2 mt-1">
                    <code class="text-[11px] font-mono text-slate-800 truncate">https://estetica.logistadigital.com.br/api/v1/redes-sociais/instagram/deauthorize</code>
                    <button type="button" (click)="copiarTexto('https://estetica.logistadigital.com.br/api/v1/redes-sociais/instagram/deauthorize')" class="text-[11px] font-semibold text-fuchsia-700 hover:underline shrink-0">Copiar</button>
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-white/80 border border-amber-200/70">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Callback Exclusão de Dados</span>
                  <div class="flex items-center justify-between gap-2 mt-1">
                    <code class="text-[11px] font-mono text-slate-800 truncate">https://estetica.logistadigital.com.br/api/v1/redes-sociais/instagram/data-deletion</code>
                    <button type="button" (click)="copiarTexto('https://estetica.logistadigital.com.br/api/v1/redes-sociais/instagram/data-deletion')" class="text-[11px] font-semibold text-fuchsia-700 hover:underline shrink-0">Copiar</button>
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-white/80 border border-amber-200/70">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Páginas Legais Públicas (Já ativas)</span>
                  <div class="flex flex-wrap gap-3 mt-1 text-[11px] font-semibold">
                    <a routerLink="/privacidade" class="text-fuchsia-700 hover:underline">/privacidade</a>
                    <a routerLink="/termos-de-uso" class="text-fuchsia-700 hover:underline">/termos-de-uso</a>
                    <a routerLink="/exclusao-de-dados" class="text-fuchsia-700 hover:underline">/exclusao-de-dados</a>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Card 2: Publicador de Banners e Fotos -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Formulário -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Criar Publicação</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Envie seu banner ou foto promocional para publicar automaticamente no Instagram conectado.
            </p>
          </div>

          <!-- Seletor Feed vs Stories -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Formato da Publicação</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                (click)="tipoMidia.set('STORIES')"
                [class]="tipoMidia() === 'STORIES'
                  ? 'p-3.5 rounded-2xl border-2 border-fuchsia-600 bg-fuchsia-50/70 text-left transition-all'
                  : 'p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-all'">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-900">📱 Stories (9:16)</span>
                  @if (tipoMidia() === 'STORIES') {
                    <span class="w-2.5 h-2.5 rounded-full bg-fuchsia-600"></span>
                  }
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Ideal para banners verticais de 24h</p>
              </button>

              <button
                type="button"
                (click)="tipoMidia.set('FEED')"
                [class]="tipoMidia() === 'FEED'
                  ? 'p-3.5 rounded-2xl border-2 border-fuchsia-600 bg-fuchsia-50/70 text-left transition-all'
                  : 'p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-all'">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-900">🖼️ Feed (Postagem)</span>
                  @if (tipoMidia() === 'FEED') {
                    <span class="w-2.5 h-2.5 rounded-full bg-fuchsia-600"></span>
                  }
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Publicação fixa no perfil com legenda</p>
              </button>
            </div>
          </div>

          <!-- Upload ou URL da Imagem -->
          <div class="space-y-3">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Banner ou Foto *</label>

            <label class="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 hover:border-fuchsia-400 rounded-2xl p-5 cursor-pointer bg-slate-50/60 hover:bg-fuchsia-50/20 transition-all">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                (change)="aoSelecionarArquivo($event)"
                [disabled]="enviandoImagem()" />
              <span class="text-2xl mb-1">{{ enviandoImagem() ? '⏳' : '⬆️' }}</span>
              <span class="text-xs font-bold text-slate-700">
                {{ enviandoImagem() ? 'Enviando imagem para o servidor...' : 'Clique para enviar um banner (JPG, PNG ou WebP)' }}
              </span>
              <span class="text-[11px] text-slate-400 mt-0.5">
                Conversão automática para JPEG no padrão exigido pela API da Meta
              </span>
            </label>

            <div>
              <span class="block text-[11px] font-semibold text-slate-500 mb-1">Ou informe a URL pública da imagem:</span>
              <input
                type="url"
                [ngModel]="imagemUrl()"
                (ngModelChange)="imagemUrl.set($event)"
                placeholder="https://estetica.logistadigital.com.br/uploads/banner.jpg"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none" />
            </div>
          </div>

          <!-- Legenda -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Legenda {{ tipoMidia() === 'STORIES' ? '(Opcional — apenas registro interno)' : '' }}
              </label>
              <span class="text-[11px] text-slate-400">{{ legenda().length }} / 2200</span>
            </div>
            <textarea
              rows="4"
              maxlength="2200"
              [ngModel]="legenda()"
              (ngModelChange)="legenda.set($event)"
              placeholder="Agende seu horário online pelo nosso link exclusivo! ✨📅"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none resize-none"></textarea>
            @if (tipoMidia() === 'STORIES') {
              <p class="text-[11px] text-slate-400 mt-1">
                Nota da Meta API: Stories exibem apenas a arte/banner (a legenda fica salva somente no seu histórico).
              </p>
            }
          </div>

          <!-- Botão Publicar -->
          <div class="pt-2">
            <button
              type="button"
              (click)="publicar()"
              [disabled]="!podePublicar()"
              class="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              @if (publicando()) {
                <span>Publicando no Instagram...</span>
              } @else if (!status()?.conectado) {
                <span>Conecte sua conta do Instagram acima para publicar</span>
              } @else {
                <span>🚀 Publicar Agora no {{ tipoMidia() === 'STORIES' ? 'Story' : 'Feed' }}</span>
              }
            </button>
          </div>
        </div>

        <!-- Prévia em tempo real -->
        <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">Prévia Visual</span>

          @if (tipoMidia() === 'STORIES') {
            <div class="w-56 aspect-[9/16] rounded-3xl bg-slate-900 overflow-hidden relative shadow-lg border-4 border-slate-800 flex items-center justify-center">
              <div class="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-fuchsia-600 p-0.5 shrink-0">
                  <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[9px] text-white font-bold">
                    IG
                  </div>
                </div>
                <span class="text-[11px] font-semibold text-white drop-shadow truncate">
                  {{ status()?.igUsername ? '@' + status()!.igUsername : tenantService.nomeEmpresa() }}
                </span>
              </div>

              @if (previewImagemUrl()) {
                <img [src]="previewImagemUrl()!" alt="Prévia Story" class="w-full h-full object-cover" />
              } @else {
                <div class="text-center px-6 text-slate-400 text-xs space-y-1">
                  <div class="text-3xl">📱</div>
                  <p>Selecione um banner vertical (1080×1920) para visualizar</p>
                </div>
              }
            </div>
          } @else {
            <div class="w-full max-w-xs rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div class="px-3.5 py-2.5 flex items-center gap-2 border-b border-slate-100">
                <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-fuchsia-600 flex items-center justify-center text-white text-[10px] font-bold">
                  IG
                </div>
                <span class="text-xs font-bold text-slate-900 truncate">
                  {{ status()?.igUsername ? '@' + status()!.igUsername : tenantService.nomeEmpresa() }}
                </span>
              </div>

              <div class="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                @if (previewImagemUrl()) {
                  <img [src]="previewImagemUrl()!" alt="Prévia Feed" class="w-full h-full object-cover" />
                } @else {
                  <div class="text-center px-6 text-slate-400 text-xs space-y-1">
                    <div class="text-3xl">🖼️</div>
                    <p>Selecione uma imagem para prévia do Feed</p>
                  </div>
                }
              </div>

              <div class="p-3.5 text-xs text-slate-700 space-y-1">
                <p class="line-clamp-3">
                  <span class="font-bold text-slate-900 mr-1">
                    {{ status()?.igUsername ? '@' + status()!.igUsername : tenantService.nomeEmpresa() }}
                  </span>
                  {{ legenda() || 'Sua legenda aparecerá aqui...' }}
                </p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Card 3: Histórico de Publicações -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-900">Histórico de Publicações</h2>
          <span class="text-xs text-slate-400">{{ status()?.historicoPosts?.length || 0 }} registro(s)</span>
        </div>

        @if (!status()?.historicoPosts?.length) {
          <div class="py-10 text-center text-sm text-slate-400">
            Nenhuma publicação realizada pelo painel ainda.
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (post of status()!.historicoPosts; track post.id) {
              <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5 min-w-0">
                  <img
                    [src]="apiService.formatarUrlImagem(post.imagemUrl) || post.imagemUrl"
                    alt="Post"
                    class="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" />
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {{ post.tipoMidia }}
                      </span>
                      <span [class]="badgeStatus(post.status)">
                        {{ post.status }}
                      </span>
                      <span class="text-[11px] text-slate-400">
                        {{ formatarData(post.publicadoEm || post.criadoEm) }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-700 mt-1 truncate">
                      {{ post.legenda || '(Sem legenda)' }}
                    </p>
                    @if (post.mensagemErro) {
                      <p class="text-[11px] text-rose-600 mt-0.5">{{ post.mensagemErro }}</p>
                    }
                  </div>
                </div>

                @if (post.permalink) {
                  <a
                    [href]="post.permalink"
                    target="_blank"
                    rel="noopener"
                    class="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold shrink-0 transition-all">
                    Ver no Instagram ↗
                  </a>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class AdminRedesSociaisComponent implements OnInit {
  apiService = inject(ApiService);
  tenantService = inject(TenantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  status = signal<InstagramStatusResponse | null>(null);
  carregando = signal<boolean>(false);
  conectando = signal<boolean>(false);
  desconectando = signal<boolean>(false);
  enviandoImagem = signal<boolean>(false);
  publicando = signal<boolean>(false);

  mensagemSucesso = signal<string | null>(null);
  mensagemErro = signal<string | null>(null);

  tipoMidia = signal<'FEED' | 'STORIES'>('STORIES');
  imagemUrl = signal<string>('');
  legenda = signal<string>('');

  ngOnInit(): void {
    const igParam = this.route.snapshot.queryParamMap.get('instagram');
    const msgParam = this.route.snapshot.queryParamMap.get('msg');

    if (igParam === 'conectado') {
      this.mensagemSucesso.set('Conta do Instagram conectada com sucesso!');
      this.router.navigate([], { replaceUrl: true, queryParams: {} });
    } else if (igParam === 'erro') {
      this.mensagemErro.set(msgParam || 'Não foi possível concluir a conexão com o Instagram.');
      this.router.navigate([], { replaceUrl: true, queryParams: {} });
    }

    this.carregarStatus();
  }

  carregarStatus(): void {
    this.carregando.set(true);
    this.apiService.getInstagramStatus().subscribe({
      next: (res) => {
        this.status.set(res);
        this.carregando.set(false);
      },
      error: (err) => {
        this.carregando.set(false);
        this.mensagemErro.set(err?.error?.message || 'Erro ao carregar o status da integração com o Instagram.');
      }
    });
  }

  conectarInstagram(): void {
    this.mensagemErro.set(null);
    this.conectando.set(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    this.apiService.getInstagramAuthUrl(origin).subscribe({
      next: (res) => {
        window.location.href = res.authUrl;
      },
      error: (err) => {
        this.conectando.set(false);
        this.mensagemErro.set(err?.error?.message || 'Não foi possível iniciar o login oficial do Instagram.');
      }
    });
  }

  desconectarInstagram(): void {
    this.desconectando.set(true);
    this.mensagemErro.set(null);
    this.apiService.desconectarInstagram().subscribe({
      next: () => {
        this.desconectando.set(false);
        this.mensagemSucesso.set('Instagram desconectado com sucesso.');
        this.carregarStatus();
      },
      error: (err) => {
        this.desconectando.set(false);
        this.mensagemErro.set(err?.error?.message || 'Erro ao desconectar a conta do Instagram.');
      }
    });
  }

  aoSelecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.enviandoImagem.set(true);
    this.mensagemErro.set(null);

    this.apiService.uploadImagem(file).subscribe({
      next: (res) => {
        this.imagemUrl.set(res.url);
        this.enviandoImagem.set(false);
      },
      error: (err) => {
        this.enviandoImagem.set(false);
        this.mensagemErro.set(err?.error?.message || 'Falha ao enviar a imagem.');
      }
    });
  }

  podePublicar(): boolean {
    return Boolean(
      this.status()?.conectado &&
      this.imagemUrl().trim().length > 0 &&
      !this.enviandoImagem() &&
      !this.publicando()
    );
  }

  publicar(): void {
    if (!this.podePublicar()) return;

    this.publicando.set(true);
    this.mensagemErro.set(null);
    this.mensagemSucesso.set(null);

    this.apiService.publicarNoInstagram({
      imagemUrl: this.imagemUrl().trim(),
      legenda: this.legenda().trim() || undefined,
      tipoMidia: this.tipoMidia()
    }).subscribe({
      next: (post: PostSocial) => {
        this.publicando.set(false);
        if (post.status === 'PUBLICADO') {
          this.mensagemSucesso.set(
            `Publicado com sucesso no ${post.tipoMidia === 'STORIES' ? 'Story' : 'Feed'} do Instagram!`
          );
          this.imagemUrl.set('');
          this.legenda.set('');
        } else {
          this.mensagemErro.set(post.mensagemErro || 'A Meta retornou erro ao publicar esta mídia.');
        }
        this.carregarStatus();
      },
      error: (err) => {
        this.publicando.set(false);
        this.mensagemErro.set(err?.error?.message || 'Erro ao publicar no Instagram.');
        this.carregarStatus();
      }
    });
  }

  previewImagemUrl(): string | null {
    const raw = this.imagemUrl().trim();
    if (!raw) return null;
    return this.apiService.formatarUrlImagem(raw) || raw;
  }

  redirectUriExibicao(): string {
    return this.status()?.redirectUriConfigurada || 'https://estetica.logistadigital.com.br/api/v1/redes-sociais/instagram/callback';
  }

  copiarTexto(valor: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(valor);
      this.mensagemSucesso.set('URL copiada para a área de transferência!');
    }
  }

  formatarData(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  badgeStatus(status: string): string {
    if (status === 'PUBLICADO') {
      return 'px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold';
    }
    if (status === 'ERRO') {
      return 'px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold';
    }
    return 'px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold';
  }
}
