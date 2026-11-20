import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { SetorService } from '../../core/services/setor.service';
import { PhoneMaskDirective } from '../../shared/directives/phone-mask.directive';
import { TenantPublicDTO, SetorAtuacao } from '../../core/models';

@Component({
  selector: 'app-onboarding-lojista',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PhoneMaskDirective],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-champagne-50/40 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      
      <div class="max-w-2xl mx-auto w-full">
        
        <!-- Header da Página Privada -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 text-white text-xs font-semibold mb-3 shadow-sm">
            <span class="font-serif font-black text-sm text-rose-400">Agendoou</span>
            <span class="text-stone-500">•</span>
            <span class="text-[11px] font-normal text-stone-300">Plataforma Multi-Nicho para Empresas & Autônomos</span>
          </div>
          <h1 class="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Crie sua Plataforma no Agendoou
          </h1>
          <p class="mt-2 text-xs sm:text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
            Selecione seu setor de atuação, personalize sua marca e tenha um link exclusivo com inteligência sob medida para o seu nicho.
          </p>
        </div>

        <!-- Indicador de Passos -->
        <div class="flex items-center justify-between max-w-lg mx-auto mb-8 relative">
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-nude-200 -z-10"></div>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 transition-all duration-500 -z-10"
               [style.width]="passoAtual() === 1 ? '0%' : (passoAtual() === 2 ? '33%' : (passoAtual() === 3 ? '66%' : '100%'))"></div>

          <!-- Passo 1 -->
          <div class="flex flex-col items-center gap-1">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm"
                 [class.bg-rose-600]="passoAtual() >= 1"
                 [class.text-white]="passoAtual() >= 1"
                 [class.bg-white]="passoAtual() < 1"
                 [class.border-2]="passoAtual() < 1">
              1
            </div>
            <span class="text-[10px] font-semibold text-stone-600">Sua Marca</span>
          </div>

          <!-- Passo 2 -->
          <div class="flex flex-col items-center gap-1">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm"
                 [class.bg-rose-600]="passoAtual() >= 2"
                 [class.text-white]="passoAtual() >= 2"
                 [class.bg-white]="passoAtual() < 2"
                 [class.border-2]="passoAtual() < 2"
                 [class.border-nude-300]="passoAtual() < 2">
              2
            </div>
            <span class="text-[10px] font-semibold text-stone-600">Acesso Admin</span>
          </div>

          <!-- Passo 3 -->
          <div class="flex flex-col items-center gap-1">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm"
                 [class.bg-emerald-600]="passoAtual() >= 3"
                 [class.text-white]="passoAtual() >= 3"
                 [class.bg-white]="passoAtual() < 3"
                 [class.border-2]="passoAtual() < 3"
                 [class.border-nude-300]="passoAtual() < 3">
              3
            </div>
            <span class="text-[10px] font-semibold text-stone-600">Pronto!</span>
          </div>
        </div>

        <!-- Card Principal do Formulário -->
        <div class="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-nude-200">
          
          <form [formGroup]="formLojista" (ngSubmit)="salvarLojista()">

            <!-- ========================================================================= -->
            <!-- PASSO 1: IDENTIDADE DA LOJA / SUBDOMÍNIO -->
            <!-- ========================================================================= -->
            @if (passoAtual() === 1) {
              <div class="space-y-6 animate-fade-in">
                <div>
                  <h2 class="font-serif text-xl font-bold text-stone-900 mb-1">Identidade da sua Empresa</h2>
                  <p class="text-xs text-stone-500">Defina o nome do seu estabelecimento e o endereço web exclusivo que seus clientes irão acessar.</p>
                </div>

                <!-- Nome da Empresa -->
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                    Nome do Estabelecimento / Espaço *
                  </label>
                  <input
                    type="text"
                    formControlName="nomeEmpresa"
                    (input)="aoDigitarNomeEmpresa()"
                    placeholder="Ex: Studio Bella, Espaço Vip, Barbearia Nobre"
                    class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>

                <!-- Setor de Atuação (13 Nichos do Agendar.) -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="block text-xs font-semibold text-stone-700">
                      Setor de Atuação do seu Negócio *
                    </label>
                    <span class="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      {{ setorSelecionadoConfig().categoriaGeral }}
                    </span>
                  </div>

                  <div class="relative">
                    <select
                      formControlName="setor"
                      class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50 font-medium appearance-none cursor-pointer">
                      @for (s of setorService.listaSetores; track s.id) {
                        <option [value]="s.id">
                          {{ s.icone }} {{ s.label }} ({{ s.categoriaGeral }})
                        </option>
                      }
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400 text-xs">
                      ▼
                    </div>
                  </div>

                  <!-- Card com Resumo de Personalização do Setor -->
                  <div class="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-rose-50/60 to-stone-50 border border-rose-100 text-xs space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-stone-800 flex items-center gap-1.5">
                        <span class="text-base">{{ setorSelecionadoConfig().icone }}</span>
                        <span>{{ setorSelecionadoConfig().label }}</span>
                      </span>
                      <span class="text-[10px] text-stone-400 font-medium">Personalização Automática</span>
                    </div>
                    <p class="text-[11px] text-stone-500 leading-relaxed">
                      {{ setorSelecionadoConfig().descricao }}
                    </p>
                    <div class="grid grid-cols-3 gap-2 pt-1.5 border-t border-rose-100/70 text-[11px]">
                      <div>
                        <span class="text-stone-400 block text-[9px] uppercase font-bold">Cliente:</span>
                        <strong class="text-stone-700">{{ setorSelecionadoConfig().termoCliente }}</strong>
                      </div>
                      <div>
                        <span class="text-stone-400 block text-[9px] uppercase font-bold">Serviço:</span>
                        <strong class="text-stone-700 truncate block">{{ setorSelecionadoConfig().termoServico }}</strong>
                      </div>
                      <div>
                        <span class="text-stone-400 block text-[9px] uppercase font-bold">Botão:</span>
                        <strong class="text-rose-600 truncate block">{{ setorSelecionadoConfig().termoAgendar }}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Link Personalizado / Subdomínio -->
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                    Endereço Web Exclusivo (Link da sua Loja) *
                  </label>
                  <div class="flex items-center rounded-2xl border border-nude-300 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-rose-400 focus-within:border-transparent">
                    <span class="px-3.5 py-3 text-xs font-semibold text-stone-400 bg-stone-100 border-r border-nude-200 select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      formControlName="slug"
                      (input)="aoDigitarSlug()"
                      placeholder="belavida"
                      class="flex-1 px-3 py-3 text-xs sm:text-sm font-mono font-bold text-rose-600 bg-transparent focus:outline-none lowercase" />
                    <span class="px-3.5 py-3 text-xs font-semibold text-stone-500 bg-stone-100 border-l border-nude-200 select-none">
                      .logistadigital.com.br
                    </span>
                  </div>

                  <!-- Feedback de Disponibilidade do Link -->
                  <div class="mt-2 text-xs flex items-center gap-1.5">
                    @if (verificandoSlug()) {
                      <span class="text-stone-400">Verificando disponibilidade do link...</span>
                    } @else if (slugDisponivel() === true) {
                      <span class="text-emerald-700 font-semibold flex items-center gap-1">
                        ✓ Link disponível e pronto para uso!
                      </span>
                    } @else if (slugDisponivel() === false) {
                      <span class="text-rose-600 font-semibold flex items-center gap-1">
                        ✕ Este link já está em uso por outro parceiro. Escolha outro.
                      </span>
                    }
                  </div>
                </div>

                <!-- Logotipo da Loja (Upload de Imagem) -->
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                    Logomarca da sua Empresa (Upload de Foto)
                  </label>

                  @if (!formLojista.get('logoUrl')?.value) {
                    <div
                      (click)="fileInputLogo.click()"
                      class="border-2 border-dashed border-nude-300 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
                      <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        📁
                      </div>
                      <div>
                        <span class="text-xs font-semibold text-stone-800 block">Clique para fazer upload da sua Logomarca</span>
                        <span class="text-[11px] text-stone-400">Formatos aceitos: PNG, JPG, WEBP ou SVG</span>
                      </div>
                      @if (fazendoUploadLogo()) {
                        <span class="text-xs font-bold text-rose-600 animate-pulse">Enviando imagem... aguarde</span>
                      }
                      @if (erroUploadLogo()) {
                        <span class="text-xs text-rose-600 font-semibold mt-1">{{ erroUploadLogo() }}</span>
                      }
                    </div>
                  } @else {
                    <div class="p-4 rounded-2xl bg-stone-50 border border-nude-200 flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <div class="w-16 h-16 rounded-xl overflow-hidden border border-nude-300 bg-white flex items-center justify-center p-1 shadow-sm">
                          <img [src]="obterPreviewUrl(formLojista.get('logoUrl')?.value)" alt="Preview da Logo" class="max-h-full max-w-full object-contain" />
                        </div>
                        <div>
                          <span class="text-xs font-semibold text-stone-800 block">Logo carregada com sucesso</span>
                          <span class="text-[11px] text-emerald-600 font-medium">✓ Personalização aplicada</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="fileInputLogo.click()"
                          class="px-3 py-1.5 rounded-xl border border-nude-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all">
                          Trocar Foto
                        </button>
                        <button
                          type="button"
                          (click)="removerLogo()"
                          class="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all">
                          Remover
                        </button>
                      </div>
                    </div>
                  }

                  <input #fileInputLogo type="file" accept="image/*" (change)="aoSelecionarArquivoLogo($event)" class="hidden" />
                </div>

                <div class="pt-4 flex justify-end">
                  <button
                    type="button"
                    (click)="passoAtual.set(2)"
                    [disabled]="!formLojista.get('nomeEmpresa')?.value || !formLojista.get('slug')?.value || slugDisponivel() === false"
                    class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-md disabled:opacity-40">
                    Próximo: Dados de Acesso →
                  </button>
                </div>
              </div>
            }

            <!-- ========================================================================= -->
            <!-- PASSO 2: DADOS DE ACESSO DO ADMINISTRADOR -->
            <!-- ========================================================================= -->
            @if (passoAtual() === 2) {
              <div class="space-y-5 animate-fade-in">
                <div>
                  <h2 class="font-serif text-xl font-bold text-stone-900 mb-1">Seus Dados de Acesso</h2>
                  <p class="text-xs text-stone-500">Crie sua conta de administrador para gerenciar sua agenda, equipe e clientes.</p>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">Seu Nome Completo *</label>
                  <input
                    type="text"
                    formControlName="nomeResponsavel"
                    placeholder="Ex: Mariana Costa"
                    class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>

                <!-- Campo Livre: Usuário de Login do Administrador -->
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                    Usuário / Login de Acesso do Administrador (Campo Livre) *
                  </label>
                  <input
                    type="text"
                    formControlName="usuarioLogin"
                    placeholder="Ex: admin, luiz, gestor"
                    class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                  <span class="text-[11px] text-stone-400 mt-1 block">
                    Defina seu nome de usuário preferido para login (letras ou números, sem espaços).
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1.5">E-mail *</label>
                    <input
                      type="email"
                      formControlName="email"
                      placeholder="contato@seunegocio.com"
                      class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1.5">WhatsApp com DDD *</label>
                    <input
                      type="text"
                      appPhoneMask
                      formControlName="telefoneWhatsApp"
                      placeholder="(61) 98226-1155"
                      class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                  </div>
                </div>

                <!-- Campo de Senha do Administrador -->
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">Senha de Acesso do Administrador *</label>
                  <input
                    type="password"
                    formControlName="senha"
                    placeholder="Mínimo de 6 caracteres"
                    class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>

                <!-- Resumo dos Dados Escolhidos -->
                <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-stone-700 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span><strong>Empresa:</strong> {{ formLojista.get('nomeEmpresa')?.value }}</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      🎁 7 Dias Grátis • Sem Cartão
                    </span>
                  </div>
                  <div><strong>Link exclusivo:</strong> <span class="text-rose-600 font-mono font-bold">https://{{ formLojista.get('slug')?.value }}.logistadigital.com.br/</span></div>
                  <div><strong>Usuário Administrador:</strong> <span class="font-semibold text-stone-800">{{ formLojista.get('usuarioLogin')?.value || 'Não definido' }}</span></div>
                  <div class="text-[11px] text-emerald-800 pt-1">
                    ✓ Seu catálogo completo e agenda serão liberados na hora! Após os 7 dias de teste grátis, planos a partir de <strong>R$ 89,90/mês via PIX</strong> (ou com desconto no Semestral e Anual).
                  </div>
                </div>

                <!-- Mensagem de Erro de Envio -->
                @if (mensagemErro()) {
                  <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {{ mensagemErro() }}
                  </div>
                }

                <div class="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    (click)="passoAtual.set(1)"
                    class="px-5 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    [disabled]="formLojista.invalid || salvando()"
                    class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-200 disabled:opacity-40 transition-all flex items-center gap-2">
                    @if (salvando()) {
                      <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Preparando sua Plataforma...</span>
                    } @else {
                      <span>🚀 Criar Minha Plataforma & Iniciar 7 Dias Grátis</span>
                    }
                  </button>
                </div>
              </div>
            }

            <!-- ========================================================================= -->
            <!-- PASSO 3: PLATAFORMA ATIVADA COM TESTE GRÁTIS (ACESSO IMEDIATO AO PAINEL) -->
            <!-- ========================================================================= -->
            @if (passoAtual() === 3) {
              <div class="space-y-6 animate-scale-up text-center">

                @if (pagamentoAprovado()) {
                  <!-- Plataforma Liberada com Trial Grátis Imediato -->
                  <div class="py-2 space-y-6 animate-scale-up">
                    <div class="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-emerald-100">
                      🎉
                    </div>

                    <div>
                      <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                        ✓ Plataforma Criada • 7 Dias de Teste Grátis Ativos!
                      </span>
                      <h2 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                        Parabéns! {{ formLojista.get('nomeEmpresa')?.value }} Está no Ar!
                      </h2>
                      <p class="text-xs sm:text-sm text-stone-500 mt-2 max-w-lg mx-auto leading-relaxed">
                        Já pré-configuramos o catálogo completo de <strong>{{ setorSelecionadoConfig().label }}</strong> e sua agenda de atendimento para você testar agora mesmo com seus clientes!
                      </p>
                    </div>

                    <!-- Box dos Links Exclusivos (Público vs. Login da Equipe) -->
                    <div class="p-5 rounded-3xl bg-stone-50 border-2 border-dashed border-rose-300 max-w-lg mx-auto space-y-4 text-left">
                      <div>
                        <span class="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">
                          📲 1. Link de Agendamento para seus Clientes (Bio do Instagram & WhatsApp):
                        </span>
                        <a
                          [href]="tenantCriado()?.linkPersonalizado || ('https://' + formLojista.get('slug')?.value + '.logistadigital.com.br/')"
                          target="_blank"
                          class="font-mono text-sm font-bold text-rose-600 hover:underline break-all block mt-0.5">
                          {{ tenantCriado()?.linkPersonalizado || ('https://' + formLojista.get('slug')?.value + '.logistadigital.com.br/') }}
                        </a>
                      </div>

                      <div class="pt-3 border-t border-rose-200/60">
                        <span class="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">
                          🔒 2. Link Exclusivo de Login (Administrador & Especialistas):
                        </span>
                        <a
                          [href]="'https://' + formLojista.get('slug')?.value + '.logistadigital.com.br/login'"
                          target="_blank"
                          class="font-mono text-sm font-bold text-stone-900 hover:underline break-all block mt-0.5">
                          https://{{ formLojista.get('slug')?.value }}.logistadigital.com.br/login
                        </a>
                      </div>

                      <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          (click)="copiarLink()"
                          class="px-4 py-2 rounded-xl bg-white border border-nude-300 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-all shadow-sm">
                          {{ linkCopiado() ? '✓ Link Copiado!' : '📋 Copiar Link da Minha Agenda' }}
                        </button>
                      </div>
                    </div>

                    <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        [href]="'https://' + formLojista.get('slug')?.value + '.logistadigital.com.br/login'"
                        class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2">
                        <span>Acessar Meu Painel Exclusivo ({{ formLojista.get('slug')?.value }}) →</span>
                      </a>
                    </div>
                  </div>
                }

              </div>
            }

          </form>

        </div>

      </div>

    </div>
  `
})
export class OnboardingLojistaComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  setorService = inject(SetorService);
  private router = inject(Router);

  passoAtual = signal<number>(1);
  salvando = signal<boolean>(false);
  verificandoSlug = signal<boolean>(false);
  slugDisponivel = signal<boolean | null>(null);
  mensagemErro = signal<string | null>(null);
  linkCopiado = signal<boolean>(false);
  tenantCriado = signal<TenantPublicDTO | null>(null);
  fazendoUploadLogo = signal<boolean>(false);
  erroUploadLogo = signal<string | null>(null);

  setorSelecionado = signal<SetorAtuacao>('CLINICA_ESTETICA');
  setorSelecionadoConfig = computed(() => {
    return this.setorService.obterConfig(this.setorSelecionado());
  });

  // PIX Mercado Pago Signals
  pixPaymentId = signal<string | null>(null);
  pixQrCodeBase64 = signal<string | null>(null);
  pixCopiaCola = signal<string | null>(null);
  pixValor = signal<number>(149.90);
  pixCopiado = signal<boolean>(false);
  pagamentoAprovado = signal<boolean>(false);
  verificandoPagamento = signal<boolean>(false);

  private pollingTimer: any = null;

  formLojista!: FormGroup;

  ngOnInit(): void {
    this.iniciarFormulario();
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
  }

  private iniciarFormulario(): void {
    this.formLojista = this.fb.group({
      nomeEmpresa: ['', [Validators.required, Validators.minLength(3)]],
      setor: ['CLINICA_ESTETICA', Validators.required],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      logoUrl: [''],
      corPrimaria: ['#e11d48', Validators.required],
      corSecundaria: ['#f43f5e', Validators.required],
      nomeResponsavel: ['', [Validators.required, Validators.minLength(3)]],
      usuarioLogin: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefoneWhatsApp: ['', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.formLojista.get('setor')?.valueChanges.subscribe((val) => {
      if (val) this.setorSelecionado.set(val);
    });
  }

  aoDigitarNomeEmpresa(): void {
    const nome = this.formLojista.get('nomeEmpresa')?.value || '';
    if (!this.formLojista.get('slug')?.dirty) {
      const slugSugerido = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      this.formLojista.patchValue({ slug: slugSugerido }, { emitEvent: false });
      if (slugSugerido.length >= 3) {
        this.verificarSlugDisponivel(slugSugerido);
      }
    }
  }

  aoDigitarSlug(): void {
    const slug = (this.formLojista.get('slug')?.value || '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    this.formLojista.patchValue({ slug }, { emitEvent: false });
    if (slug.length >= 3) {
      this.verificarSlugDisponivel(slug);
    } else {
      this.slugDisponivel.set(null);
    }
  }

  verificarSlugDisponivel(slug: string): void {
    this.verificandoSlug.set(true);
    this.api.verificarDisponibilidadeSlug(slug).subscribe({
      next: (res) => {
        this.slugDisponivel.set(res.disponivel);
        this.verificandoSlug.set(false);
      },
      error: () => {
        this.slugDisponivel.set(true);
        this.verificandoSlug.set(false);
      }
    });
  }

  avancarParaPasso2(): void {
    if (this.slugDisponivel() === false) return;
    this.passoAtual.set(2);
  }

  aoSelecionarArquivoLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 15 * 1024 * 1024) {
      this.erroUploadLogo.set('O arquivo selecionado deve ter no máximo 15MB.');
      return;
    }

    this.fazendoUploadLogo.set(true);
    this.erroUploadLogo.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.formLojista.patchValue({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);

    this.api.uploadImagem(file).subscribe({
      next: (res) => {
        if (res && res.url) {
          this.formLojista.patchValue({ logoUrl: res.url });
        }
        this.fazendoUploadLogo.set(false);
      },
      error: (err) => {
        this.fazendoUploadLogo.set(false);
        console.warn('Upload de imagem via API utilizou fallback local Base64:', err);
      }
    });
  }

  removerLogo(): void {
    this.formLojista.patchValue({ logoUrl: '' });
    this.erroUploadLogo.set(null);
  }

  obterPreviewUrl(url?: string): string {
    return this.api.formatarUrlImagem(url);
  }

  salvarLojista(): void {
    if (this.formLojista.invalid) return;

    this.salvando.set(true);
    this.mensagemErro.set(null);

    const dados = this.formLojista.value;

    this.api.cadastrarLojista(dados).subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.tenantCriado.set(res.tenant);

        // Armazena dados do PIX caso existam
        this.pixPaymentId.set(res.paymentId || null);
        this.pixCopiaCola.set(res.pixCopiaCola || null);
        this.pixQrCodeBase64.set(res.pixQrCodeBase64 || null);
        if (res.valor) {
          this.pixValor.set(res.valor);
        }

        // Aplica cores e dados do novo tenant no tema
        if (res.tenant) {
          this.tenantService.setTenantManual(res.tenant);
        }

        // Se estiver em localhost, salva a sessão localmente; em produção (agendoou.logistadigital.com.br),
        // o lojista recebe seu link exclusivo (https://slug.logistadigital.com.br/login) e loga exclusivamente no próprio subdomínio!
        if (res.token) {
          this.pagamentoAprovado.set(true);
          if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            this.authService.salvarSessaoDireta(
              res.token,
              res.usuario ? { ...res.usuario, setor: res.tenant?.setor || dados.setor } : null,
              res.tenant?.slug || dados.slug,
              res.tenant?.nomeEmpresa || dados.nomeEmpresa,
              res.tenant?.logoUrl || dados.logoUrl
            );
          }
        }

        // Avança para o Passo 3 (Confirmação & Acesso Imediato)
        this.passoAtual.set(3);

        // Inicia checagem automática apenas se estiver aguardando pagamento PIX sem token
        if (!res.token && res.paymentId) {
          this.iniciarPollingPagamento(res.paymentId);
        }
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err.error?.detail || err.error?.message || 'Erro ao realizar cadastro do lojista.');
      }
    });
  }

  iniciarPollingPagamento(paymentId: string): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    this.verificandoPagamento.set(true);

    this.pollingTimer = setInterval(() => {
      this.checarStatusPagamento(paymentId, false);
    }, 3000);
  }

  checarStatusManual(): void {
    const id = this.pixPaymentId();
    if (id) {
      this.checarStatusPagamento(id, true);
    }
  }

  checarStatusPagamento(paymentId: string, manual: boolean): void {
    this.api.consultarStatusPagamento(paymentId).subscribe({
      next: (res) => {
        if (res.pago || res.status === 'approved') {
          if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
          }
          this.verificandoPagamento.set(false);
          this.pagamentoAprovado.set(true);

          // Salva sessão autenticada com o token liberado pelo backend
          if (res.token) {
            this.authService.salvarSessaoDireta(
              res.token,
              res.usuario,
              res.slug || res.tenant?.slug,
              res.tenant?.nomeEmpresa,
              res.tenant?.logoUrl
            );
          }
          if (res.tenant) {
            this.tenantCriado.set(res.tenant);
            this.tenantService.setTenantManual(res.tenant);
          }
        } else if (manual) {
          alert('O pagamento ainda consta como pendente no banco. Por favor, aguarde alguns instantes enquanto o PIX é processado.');
        }
      },
      error: (err) => {
        console.warn('Erro ao consultar status do pagamento:', err);
      }
    });
  }

  copiarPix(): void {
    const pix = this.pixCopiaCola();
    if (pix && navigator.clipboard) {
      navigator.clipboard.writeText(pix).then(() => {
        this.pixCopiado.set(true);
        setTimeout(() => this.pixCopiado.set(false), 3000);
      });
    }
  }

  copiarLink(): void {
    const link = this.tenantCriado()?.linkPersonalizado || ('https://' + this.formLojista.get('slug')?.value + '.logistadigital.com.br/');
    if (link && navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.linkCopiado.set(true);
        setTimeout(() => this.linkCopiado.set(false), 3000);
      });
    }
  }
}
