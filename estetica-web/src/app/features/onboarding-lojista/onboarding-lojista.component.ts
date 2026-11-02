import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { PhoneMaskDirective } from '../../shared/directives/phone-mask.directive';
import { TenantPublicDTO } from '../../core/models';

@Component({
  selector: 'app-onboarding-lojista',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PhoneMaskDirective],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-champagne-50/40 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      
      <div class="max-w-2xl mx-auto w-full">
        
        <!-- Header da Página Privada -->
        <div class="text-center mb-8">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-3">
            ✨ Programa de Parceiros Exclusivo
          </span>
          <h1 class="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Crie sua Clínica de Estética Online
          </h1>
          <p class="mt-2 text-xs sm:text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
            Configure sua marca, escolha seu link personalizado e defina as cores do seu sistema em poucos passos.
          </p>
        </div>

        <!-- Indicador de Passos -->
        <div class="flex items-center justify-between max-w-md mx-auto mb-8 relative">
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-nude-200 -z-10"></div>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 transition-all duration-500 -z-10"
               [style.width]="passoAtual() === 1 ? '0%' : (passoAtual() === 2 ? '50%' : '100%')"></div>

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
            <span class="text-[10px] font-semibold text-stone-600">Suas Cores</span>
          </div>

          <!-- Passo 3 -->
          <div class="flex flex-col items-center gap-1">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm"
                 [class.bg-rose-600]="passoAtual() >= 3"
                 [class.text-white]="passoAtual() >= 3"
                 [class.bg-white]="passoAtual() < 3"
                 [class.border-2]="passoAtual() < 3"
                 [class.border-nude-300]="passoAtual() < 3">
              3
            </div>
            <span class="text-[10px] font-semibold text-stone-600">Acesso Admin</span>
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
                  <p class="text-xs text-stone-500">Defina o nome da sua clínica e o endereço web exclusivo que seus clientes irão acessar.</p>
                </div>

                <!-- Nome da Empresa -->
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                    Nome Comercial da Empresa / Clínica *
                  </label>
                  <input
                    type="text"
                    formControlName="nomeEmpresa"
                    (input)="aoDigitarNomeEmpresa()"
                    placeholder="Ex: Espaço VIP Estética Avançada"
                    class="w-full text-sm px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>

                <!-- Link Personalizado / Subdomínio -->
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                    Seu Link Personalizado Exclusivo *
                  </label>
                  <div class="flex items-center rounded-2xl border border-nude-300 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-rose-400">
                    <span class="px-3.5 py-3 text-xs font-semibold text-stone-500 bg-stone-100 border-r border-nude-200 select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      formControlName="slug"
                      (input)="aoDigitarSlug()"
                      placeholder="minhaloja"
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
                          class="px-3 py-1.5 rounded-xl border border-nude-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-all">
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
                    (click)="avancarParaPasso2()"
                    [disabled]="formLojista.get('nomeEmpresa')?.invalid || formLojista.get('slug')?.invalid || slugDisponivel() === false"
                    class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 disabled:opacity-40 transition-all shadow-md">
                    Próximo: Escolher Cores →
                  </button>
                </div>
              </div>
            }

            <!-- ========================================================================= -->
            <!-- PASSO 2: ESCOLHA DAS 2 CORES (WHITELABEL) -->
            <!-- ========================================================================= -->
            @if (passoAtual() === 2) {
              <div class="space-y-6 animate-fade-in">
                <div>
                  <h2 class="font-serif text-xl font-bold text-stone-900 mb-1">Personalização de Cores</h2>
                  <p class="text-xs text-stone-500">Escolha as 2 cores oficiais que representarão a sua marca em todo o sistema.</p>
                </div>

                <!-- Sugestões de Paletas Prontas Elegantes -->
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Paletas Sugeridas para Estética</span>
                  <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      (click)="aplicarPaleta('#e11d48', '#f43f5e')"
                      class="p-2.5 rounded-xl border border-nude-200 text-left hover:border-stone-400 transition-all">
                      <div class="flex items-center gap-1.5 mb-1">
                        <span class="w-3.5 h-3.5 rounded-full bg-[#e11d48]"></span>
                        <span class="w-3.5 h-3.5 rounded-full bg-[#f43f5e]"></span>
                      </div>
                      <span class="text-[10px] font-semibold text-stone-700 block truncate">Rosé Clean</span>
                    </button>

                    <button
                      type="button"
                      (click)="aplicarPaleta('#b45309', '#d97706')"
                      class="p-2.5 rounded-xl border border-nude-200 text-left hover:border-stone-400 transition-all">
                      <div class="flex items-center gap-1.5 mb-1">
                        <span class="w-3.5 h-3.5 rounded-full bg-[#b45309]"></span>
                        <span class="w-3.5 h-3.5 rounded-full bg-[#d97706]"></span>
                      </div>
                      <span class="text-[10px] font-semibold text-stone-700 block truncate">Gold Luxury</span>
                    </button>

                    <button
                      type="button"
                      (click)="aplicarPaleta('#0f766e', '#14b8a6')"
                      class="p-2.5 rounded-xl border border-nude-200 text-left hover:border-stone-400 transition-all">
                      <div class="flex items-center gap-1.5 mb-1">
                        <span class="w-3.5 h-3.5 rounded-full bg-[#0f766e]"></span>
                        <span class="w-3.5 h-3.5 rounded-full bg-[#14b8a6]"></span>
                      </div>
                      <span class="text-[10px] font-semibold text-stone-700 block truncate">Esmeralda Spa</span>
                    </button>

                    <button
                      type="button"
                      (click)="aplicarPaleta('#7c3aed', '#a855f7')"
                      class="p-2.5 rounded-xl border border-nude-200 text-left hover:border-stone-400 transition-all">
                      <div class="flex items-center gap-1.5 mb-1">
                        <span class="w-3.5 h-3.5 rounded-full bg-[#7c3aed]"></span>
                        <span class="w-3.5 h-3.5 rounded-full bg-[#a855f7]"></span>
                      </div>
                      <span class="text-[10px] font-semibold text-stone-700 block truncate">Lavanda VIP</span>
                    </button>

                    <button
                      type="button"
                      (click)="aplicarPaleta('#1e293b', '#334155')"
                      class="p-2.5 rounded-xl border border-nude-200 text-left hover:border-stone-400 transition-all">
                      <div class="flex items-center gap-1.5 mb-1">
                        <span class="w-3.5 h-3.5 rounded-full bg-[#1e293b]"></span>
                        <span class="w-3.5 h-3.5 rounded-full bg-[#334155]"></span>
                      </div>
                      <span class="text-[10px] font-semibold text-stone-700 block truncate">Noir Minimal</span>
                    </button>
                  </div>
                </div>

                <!-- Seletores de Cores Hexadecimal -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="p-4 rounded-2xl border border-nude-200 bg-stone-50">
                    <label class="block text-xs font-semibold text-stone-700 mb-2">Cor Primária (Principal)</label>
                    <div class="flex items-center gap-3">
                      <input
                        type="color"
                        formControlName="corPrimaria"
                        class="w-12 h-12 rounded-xl border border-nude-300 p-1 cursor-pointer bg-white" />
                      <div>
                        <span class="font-mono font-bold text-xs text-stone-800 uppercase block">
                          {{ formLojista.get('corPrimaria')?.value }}
                        </span>
                        <span class="text-[10px] text-stone-400">Botões, destaques e cabeçalho</span>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 rounded-2xl border border-nude-200 bg-stone-50">
                    <label class="block text-xs font-semibold text-stone-700 mb-2">Cor Secundária (Destaque)</label>
                    <div class="flex items-center gap-3">
                      <input
                        type="color"
                        formControlName="corSecundaria"
                        class="w-12 h-12 rounded-xl border border-nude-300 p-1 cursor-pointer bg-white" />
                      <div>
                        <span class="font-mono font-bold text-xs text-stone-800 uppercase block">
                          {{ formLojista.get('corSecundaria')?.value }}
                        </span>
                        <span class="text-[10px] text-stone-400">Gradientes, ícones e badges</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mini Mockup de Demonstração em Tempo Real -->
                <div class="p-5 rounded-3xl border border-nude-200 bg-white shadow-sm space-y-3">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Prévia em Tempo Real do Seu Sistema</span>
                  
                  <!-- Barra simulada da sua loja -->
                  <div class="p-3 rounded-2xl border border-nude-200 flex items-center justify-between bg-white shadow-sm">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                           [style.background]="'linear-gradient(135deg, ' + formLojista.get('corPrimaria')?.value + ', ' + formLojista.get('corSecundaria')?.value + ')'">
                        @if (formLojista.get('logoUrl')?.value) {
                          <img [src]="formLojista.get('logoUrl')?.value" class="w-full h-full object-contain p-1" />
                        } @else {
                          ★
                        }
                      </div>
                      <div>
                        <span class="font-serif font-bold text-xs text-stone-900 block leading-tight">
                          {{ formLojista.get('nomeEmpresa')?.value || 'Sua Clínica' }}
                        </span>
                        <span class="text-[9px] uppercase tracking-wider text-stone-400 font-semibold">Portal Oficial</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl text-white font-semibold text-[11px] shadow-sm"
                      [style.backgroundColor]="formLojista.get('corPrimaria')?.value">
                      Agendar Consulta
                    </button>
                  </div>
                </div>

                <div class="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    (click)="passoAtual.set(1)"
                    class="px-5 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    (click)="passoAtual.set(3)"
                    class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-md">
                    Próximo: Dados de Acesso →
                  </button>
                </div>
              </div>
            }

            <!-- ========================================================================= -->
            <!-- PASSO 3: DADOS DE ACESSO DO ADMINISTRADOR -->
            <!-- ========================================================================= -->
            @if (passoAtual() === 3) {
              <div class="space-y-6 animate-fade-in">
                <div>
                  <h2 class="font-serif text-xl font-bold text-stone-900 mb-1">Seus Dados de Acesso</h2>
                  <p class="text-xs text-stone-500">Crie sua conta de administrador da clínica para gerenciar sua agenda e clientes.</p>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">Seu Nome Completo *</label>
                  <input
                    type="text"
                    formControlName="nomeResponsavel"
                    placeholder="Ex: Dra. Mariana Costa"
                    class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1.5">E-mail de Login *</label>
                    <input
                      type="email"
                      formControlName="email"
                      placeholder="mariana@clinica.com"
                      class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1.5">WhatsApp com DDD *</label>
                    <input
                      type="text"
                      appPhoneMask
                      formControlName="telefoneWhatsApp"
                      placeholder="(11) 99999-8888"
                      class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">Crie uma Senha Forte *</label>
                  <input
                    type="password"
                    formControlName="senha"
                    placeholder="Mínimo de 6 caracteres"
                    class="w-full text-xs px-4 py-3 rounded-2xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>

                <!-- Resumo dos Dados Escolhidos -->
                <div class="p-4 rounded-2xl bg-stone-50 border border-nude-200 text-xs text-stone-600 space-y-1">
                  <div><strong>Empresa:</strong> {{ formLojista.get('nomeEmpresa')?.value }}</div>
                  <div><strong>Link que será ativado:</strong> <span class="text-rose-600 font-mono font-bold">https://{{ formLojista.get('slug')?.value }}.logistadigital.com.br/</span></div>
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
                    (click)="passoAtual.set(2)"
                    class="px-5 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    [disabled]="formLojista.invalid || salvando()"
                    class="px-7 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-xs shadow-lg shadow-rose-200 disabled:opacity-40 transition-all">
                    {{ salvando() ? 'Criando Sua Loja...' : '🚀 Finalizar e Criar Minha Loja' }}
                  </button>
                </div>
              </div>
            }

            <!-- ========================================================================= -->
            <!-- PASSO 4: SUCESSO & ATIVAÇÃO CONCLUÍDA -->
            <!-- ========================================================================= -->
            @if (passoAtual() === 4 && tenantCriado()) {
              <div class="text-center py-6 space-y-6 animate-scale-up">
                <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  🎉
                </div>

                <div>
                  <h2 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                    Parabéns! Sua Clínica Está Pronta!
                  </h2>
                  <p class="text-xs sm:text-sm text-stone-500 mt-2 max-w-md mx-auto">
                    Seu sistema personalizado foi gerado com a sua logo e paleta de cores exclusivas.
                  </p>
                </div>

                <!-- Box do Link Exclusivo -->
                <div class="p-5 rounded-3xl bg-stone-50 border-2 border-dashed border-rose-300 max-w-lg mx-auto">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                    Seu Link Personalizado Oficial:
                  </span>
                  <a
                    [href]="tenantCriado()!.linkPersonalizado"
                    target="_blank"
                    class="font-mono text-sm sm:text-base font-bold text-rose-600 hover:underline break-all block">
                    {{ tenantCriado()!.linkPersonalizado }}
                  </a>
                  <button
                    type="button"
                    (click)="copiarLink()"
                    class="mt-3 px-4 py-2 rounded-xl bg-white border border-nude-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-all shadow-sm">
                    {{ linkCopiado() ? '✓ Link Copiado!' : '📋 Copiar Link da Minha Loja' }}
                  </button>
                </div>

                <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    routerLink="/admin/dashboard"
                    class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-md">
                    Ir Para o Meu Painel da Clínica →
                  </a>
                </div>
              </div>
            }

          </form>

        </div>

      </div>

    </div>
  `
})
export class OnboardingLojistaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
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

  formLojista!: FormGroup;

  ngOnInit(): void {
    this.iniciarFormulario();
  }

  private iniciarFormulario(): void {
    this.formLojista = this.fb.group({
      nomeEmpresa: ['', [Validators.required, Validators.minLength(3)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      logoUrl: [''],
      corPrimaria: ['#e11d48', Validators.required],
      corSecundaria: ['#f43f5e', Validators.required],
      nomeResponsavel: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefoneWhatsApp: ['', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(6)]]
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

    // Pré-visualização instantânea via Data URL para UX veloz
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.formLojista.patchValue({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);

    // Envio seguro ao backend para persistência oficial
    this.api.uploadImagem(file).subscribe({
      next: (res) => {
        if (res && res.url) {
          this.formLojista.patchValue({ logoUrl: res.url });
        }
        this.fazendoUploadLogo.set(false);
      },
      error: (err) => {
        // Fallback: se o backend falhar por algum motivo de rede, o dataUrl gerado continua ativo
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

  aplicarPaleta(corPrimaria: string, corSecundaria: string): void {
    this.formLojista.patchValue({ corPrimaria, corSecundaria });
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

        // Salva a sessão do novo lojista e aplica as cores
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
          this.authService.currentUser.set(res.usuario);
        }
        this.tenantService.setTenantManual(res.tenant);

        this.passoAtual.set(4);
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err.error?.detail || err.error?.message || 'Erro ao realizar cadastro do lojista.');
      }
    });
  }

  copiarLink(): void {
    const link = this.tenantCriado()?.linkPersonalizado;
    if (link && navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.linkCopiado.set(true);
        setTimeout(() => this.linkCopiado.set(false), 3000);
      });
    }
  }
}

