import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Procedimento, Profissional, Usuario, Categoria } from '../../../core/models';
import { PhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';
import { TelefonePipe } from '../../../shared/pipes/telefone.pipe';
import { ModalTravaAgendaComponent } from '../../../shared/components/modal-trava-agenda.component';

import { TenantService } from '../../../core/services/tenant.service';
type TabTipo = 'procedimentos' | 'profissionais' | 'clientes' | 'identidade';

@Component({
  selector: 'app-admin-gestao',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PhoneMaskDirective, TelefonePipe, ModalTravaAgendaComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      
      <!-- Cabeçalho Principal -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-rose-600 block mb-1">
            Módulo Administrativo
          </span>
          <h1 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Cadastros & Gestão da Clínica
          </h1>
          <p class="text-xs text-stone-500 mt-1">Gerencie os procedimentos oferecidos, equipe de especialistas e ficha de clientes.</p>
        </div>

        <div class="flex items-center gap-2">
          <a routerLink="/admin/dashboard" class="px-4 py-2 rounded-xl bg-white border border-nude-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-all shadow-sm">
            ← Voltar ao Painel
          </a>
        </div>
      </div>

      <!-- Navegação por Abas -->
      <div class="flex items-center gap-2 border-b border-nude-200 pb-3 mb-6 overflow-x-auto">
        <button
          (click)="abaAtiva.set('procedimentos')"
          [class.bg-rose-500]="abaAtiva() === 'procedimentos'"
          [class.text-white]="abaAtiva() === 'procedimentos'"
          [class.shadow-md]="abaAtiva() === 'procedimentos'"
          [class.bg-white]="abaAtiva() !== 'procedimentos'"
          [class.text-stone-700]="abaAtiva() !== 'procedimentos'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-nude-200">
          <span>💎 Procedimentos & Serviços</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class.bg-rose-700]="abaAtiva() === 'procedimentos'" [class.bg-nude-100]="abaAtiva() !== 'procedimentos'">
            {{ procedimentos().length }}
          </span>
        </button>

        <button
          (click)="abaAtiva.set('profissionais')"
          [class.bg-rose-500]="abaAtiva() === 'profissionais'"
          [class.text-white]="abaAtiva() === 'profissionais'"
          [class.shadow-md]="abaAtiva() === 'profissionais'"
          [class.bg-white]="abaAtiva() !== 'profissionais'"
          [class.text-stone-700]="abaAtiva() !== 'profissionais'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-nude-200">
          <span>👩‍⚕️ Especialistas</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class.bg-rose-700]="abaAtiva() === 'profissionais'" [class.bg-nude-100]="abaAtiva() !== 'profissionais'">
            {{ profissionais().length }}
          </span>
        </button>

        <button
          (click)="abaAtiva.set('clientes')"
          [class.bg-rose-500]="abaAtiva() === 'clientes'"
          [class.text-white]="abaAtiva() === 'clientes'"
          [class.shadow-md]="abaAtiva() === 'clientes'"
          [class.bg-white]="abaAtiva() !== 'clientes'"
          [class.text-stone-700]="abaAtiva() !== 'clientes'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-nude-200">
          <span>👤 Pacientes & Clientes</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class.bg-rose-700]="abaAtiva() === 'clientes'" [class.bg-nude-100]="abaAtiva() !== 'clientes'">
            {{ clientes().length }}
          </span>
        </button>

        <button
          (click)="abaAtiva.set('identidade')"
          [class.bg-rose-500]="abaAtiva() === 'identidade'"
          [class.text-white]="abaAtiva() === 'identidade'"
          [class.shadow-md]="abaAtiva() === 'identidade'"
          [class.bg-white]="abaAtiva() !== 'identidade'"
          [class.text-stone-700]="abaAtiva() !== 'identidade'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-nude-200">
          <span>🖼️ Logotipo & Dados</span>
        </button>

        <a
          routerLink="/admin/assinatura"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-sm">
          <span>💳 Minha Assinatura & Renovação</span>
        </a>
      </div>

      <!-- Feedback de Sucesso ou Erro -->
      @if (mensagemSucesso()) {
        <div class="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>{{ mensagemSucesso() }}</span>
          </div>
          <button (click)="mensagemSucesso.set(null)" class="text-emerald-600 hover:text-emerald-800 font-bold">✕</button>
        </div>
      }

      @if (mensagemErro()) {
        <div class="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-fade-in">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{{ mensagemErro() }}</span>
          </div>
          <button (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold">✕</button>
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- ABA 4: IDENTIDADE VISUAL & CORES DA CLÍNICA -->
      <!-- ========================================================================================= -->
      @if (abaAtiva() === 'identidade') {
        <div class="space-y-6 max-w-4xl animate-fade-in">
          <div class="bg-white p-6 sm:p-8 rounded-3xl border border-nude-200 shadow-sm space-y-6">
            <div>
              <span class="text-xs font-semibold uppercase tracking-widest text-rose-600 block mb-1">
                Personalização Visual Whitelabel
              </span>
              <h2 class="font-serif text-2xl font-bold text-stone-900">
                Logotipo da Clínica & Dados Cadastrais
              </h2>
              <p class="text-xs text-stone-500 mt-1">
                Altere a logomarca e o nome de exibição da sua clínica a qualquer momento.
              </p>
            </div>

            <form [formGroup]="formIdentidade" (ngSubmit)="salvarIdentidadeVisual()" class="space-y-6">
              
              <!-- Nome e WhatsApp da Clínica -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">Nome da Clínica / Estética *</label>
                  <input
                    type="text"
                    formControlName="nomeEmpresa"
                    placeholder="Ex: Clínica L'Élégance"
                    class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">WhatsApp Principal de Contato</label>
                  <input
                    type="text"
                    appPhoneMask
                    formControlName="telefoneWhatsApp"
                    placeholder="(61) 98226-1155"
                    class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>
              </div>

              <!-- Upload de Logomarca Oficial -->
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                  Logomarca Oficial da Clínica (Exibida no topo e cabeçalho)
                </label>

                @if (!formIdentidade.get('logoUrl')?.value) {
                  <div
                    (click)="fileInputLogoClinica.click()"
                    class="border-2 border-dashed border-nude-300 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
                    <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      📁
                    </div>
                    <div>
                      <span class="text-xs font-semibold text-stone-800 block">Clique para enviar a Logomarca da clínica</span>
                      <span class="text-[10px] text-stone-400">Formatos aceitos: PNG, JPG, WEBP ou SVG (até 15MB)</span>
                    </div>
                    @if (fazendoUploadLogo()) {
                      <span class="text-xs font-bold text-rose-600 animate-pulse">Enviando imagem... aguarde</span>
                    }
                  </div>
                } @else {
                  <div class="p-4 rounded-2xl bg-stone-50 border border-nude-200 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <div class="w-16 h-16 rounded-xl overflow-hidden border border-nude-300 bg-white flex items-center justify-center p-1.5 shadow-sm">
                        <img [src]="obterImagemUrl(formIdentidade.get('logoUrl')?.value)" alt="Logomarca" class="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <span class="text-xs font-semibold text-stone-800 block">Logomarca ativa</span>
                        <span class="text-[10px] text-emerald-600 font-medium">✓ Exibida em todas as páginas</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="fileInputLogoClinica.click()"
                        class="px-3 py-1.5 rounded-xl border border-nude-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all">
                        Trocar Logo
                      </button>
                      <button
                        type="button"
                        (click)="removerLogoClinica()"
                        class="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all">
                        Remover
                      </button>
                    </div>
                  </div>
                }

                <input #fileInputLogoClinica type="file" accept="image/*" (change)="aoSelecionarLogoClinica($event)" class="hidden" />
              </div>

              <!-- Prévia em Tempo Real -->
                <div class="p-5 rounded-3xl border border-nude-200 bg-stone-50/60 space-y-3">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Prévia da Barra do Seu Sistema</span>
                  <div class="p-3.5 rounded-2xl border border-nude-200 flex items-center justify-between bg-white shadow-sm">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gradient-to-tr from-rose-500 to-rose-600">
                        @if (formIdentidade.get('logoUrl')?.value) {
                          <img [src]="obterImagemUrl(formIdentidade.get('logoUrl')?.value)" class="w-full h-full object-contain p-1" />
                        } @else {
                          ★
                        }
                      </div>
                      <div>
                        <span class="font-serif font-bold text-xs text-stone-900 block leading-tight">
                          {{ formIdentidade.get('nomeEmpresa')?.value || 'Sua Clínica' }}
                        </span>
                        <span class="text-[9px] uppercase tracking-wider text-stone-400 font-semibold">Portal Oficial</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-sm bg-rose-600">
                      Agendar Consulta
                    </button>
                  </div>
                </div>

              <div class="pt-2 flex justify-end">
                <button
                  type="submit"
                  [disabled]="salvandoIdentidade() || formIdentidade.invalid"
                  class="px-7 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
                  @if (salvandoIdentidade()) {
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Salvando Alterações...</span>
                  } @else {
                    <span>💾 Salvar Alterações</span>
                  }
                </button>
              </div>

            </form>
          </div>
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- ABA 1: GESTÃO DE PROCEDIMENTOS -->
      <!-- ========================================================================================= -->
      @if (abaAtiva() === 'procedimentos') {
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-nude-200 shadow-sm">
            <div class="flex-1 max-w-sm">
              <input
                type="text"
                [value]="buscaProcedimento()"
                (input)="buscaProcedimento.set($any($event.target).value)"
                placeholder="Buscar por nome do procedimento..."
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-stone-50" />
            </div>
            <button
              (click)="abrirModalProcedimento()"
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-200 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              <span>+ Novo Procedimento</span>
            </button>
          </div>

          @if (carregando()) {
            <div class="py-16 text-center text-xs text-stone-400">Carregando catálogo de procedimentos...</div>
          } @else if (procedimentosFiltrados().length === 0) {
            <div class="py-16 text-center text-xs text-stone-400">Nenhum procedimento encontrado.</div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (proc of procedimentosFiltrados(); track proc.id) {
                <div class="bg-white rounded-3xl border border-nude-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <!-- Imagem do Procedimento -->
                    <div class="h-44 w-full bg-nude-100 relative overflow-hidden">
                      <img
                        [src]="obterImagemUrl(proc.imagemUrl) || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'"
                        [alt]="proc.titulo"
                        class="w-full h-full object-cover" />
                      <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-stone-800 shadow-sm">
                        {{ proc.categoriaNome }}
                      </span>
                      <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm"
                            [class.bg-emerald-500]="proc.ativo"
                            [class.text-white]="proc.ativo"
                            [class.bg-stone-400]="!proc.ativo"
                            [class.text-white]="!proc.ativo">
                        {{ proc.ativo ? 'Ativo' : 'Inativo' }}
                      </span>
                    </div>

                    <div class="p-5">
                      <h3 class="font-serif font-bold text-base text-stone-900 leading-tight mb-1">{{ proc.titulo }}</h3>
                      <p class="text-xs text-stone-500 line-clamp-2 mb-4 leading-relaxed">{{ proc.descricao || 'Sem descrição cadastrada.' }}</p>

                      <div class="flex items-center justify-between text-xs pt-3 border-t border-nude-100">
                        <span class="flex items-center gap-1 text-stone-500 font-medium">
                          <svg class="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {{ proc.duracaoMinutos }} min
                        </span>
                        <span class="font-serif font-bold text-stone-900 text-sm">
                          {{ proc.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Botões de Ação -->
                  <div class="p-4 bg-stone-50/70 border-t border-nude-100 flex items-center justify-end gap-2">
                    <button
                      (click)="alternarStatusProcedimento(proc)"
                      [title]="proc.ativo ? 'Desativar procedimento' : 'Ativar procedimento'"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-colors">
                      {{ proc.ativo ? 'Desativar' : 'Ativar' }}
                    </button>
                    <button
                      (click)="abrirModalProcedimento(proc)"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                      Editar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- ABA 2: GESTÃO DE PROFISSIONAIS / ESPECIALISTAS -->
      <!-- ========================================================================================= -->
      @if (abaAtiva() === 'profissionais') {
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-nude-200 shadow-sm">
            <div class="flex-1 max-w-sm">
              <input
                type="text"
                [value]="buscaProfissional()"
                (input)="buscaProfissional.set($any($event.target).value)"
                placeholder="Buscar por nome ou especialidade..."
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-stone-50" />
            </div>
            <button
              (click)="abrirModalProfissional()"
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-200 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              <span>+ Novo Especialista</span>
            </button>
          </div>

          @if (carregando()) {
            <div class="py-16 text-center text-xs text-stone-400">Carregando especialistas...</div>
          } @else if (profissionaisFiltrados().length === 0) {
            <div class="py-16 text-center text-xs text-stone-400">Nenhum especialista cadastrado.</div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (prof of profissionaisFiltrados(); track prof.id) {
                <div class="bg-white rounded-3xl border border-nude-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div class="flex items-start gap-4 mb-4">
                      <div class="w-14 h-14 rounded-2xl overflow-hidden bg-rose-50 border-2 flex-shrink-0" [style.borderColor]="prof.corIdentificacao || '#e11d48'">
                        <img
                          [src]="obterImagemUrl(prof.fotoUrl) || 'https://images.unsplash.com/photo-1594824813587-0b1a03a74577?auto=format&fit=crop&w=300&q=80'"
                          [alt]="prof.nome"
                          class="w-full h-full object-cover" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <h3 class="font-serif font-bold text-base text-stone-900 truncate">{{ prof.nome }}</h3>
                          <span class="w-2.5 h-2.5 rounded-full" [class.bg-emerald-500]="prof.ativo" [class.bg-stone-300]="!prof.ativo" [title]="prof.ativo ? 'Ativo' : 'Inativo'"></span>
                        </div>
                        <p class="text-xs font-semibold text-rose-600 truncate">{{ prof.especialidade }}</p>
                      </div>
                    </div>

                    @if (prof.email || prof.telefoneWhatsApp) {
                      <div class="mb-3 text-[11px] text-stone-500 space-y-0.5 bg-stone-50 p-2.5 rounded-xl border border-nude-200">
                        @if (prof.email) {
                          <div class="truncate text-stone-600">✉ {{ prof.email }}</div>
                        }
                        @if (prof.telefoneWhatsApp) {
                          <div class="text-emerald-700 font-medium">💬 {{ prof.telefoneWhatsApp }}</div>
                        }
                      </div>
                    }

                    <p class="text-xs text-stone-500 mb-4 line-clamp-2 leading-relaxed">
                      {{ prof.bio || 'Especialista clínico credenciado.' }}
                    </p>

                    <div class="mb-4">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                        Procedimentos Habilitados ({{ prof.procedimentosIds.length || 0 }})
                      </span>
                      <div class="flex flex-wrap gap-1.5">
                        @for (procId of prof.procedimentosIds; track procId) {
                          <span class="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                            {{ getNomeProcedimento(procId) }}
                          </span>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="pt-4 border-t border-nude-100 flex items-center justify-between">
                    <button
                      (click)="alternarStatusProfissional(prof)"
                      class="text-xs font-semibold text-stone-500 hover:text-stone-800">
                      {{ prof.ativo ? 'Desativar' : 'Reativar' }}
                    </button>
                    <div class="flex items-center gap-2">
                      <button
                        (click)="abrirModalAgenda(prof.id)"
                        class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all">
                        🔒 Horários & Trava
                      </button>
                      <button
                        (click)="abrirModalProfissional(prof)"
                        class="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all">
                        Editar Dados
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- ABA 3: GESTÃO DE CLIENTES / PACIENTES -->
      <!-- ========================================================================================= -->
      @if (abaAtiva() === 'clientes') {
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-nude-200 shadow-sm">
            <div class="flex-1 max-w-sm">
              <input
                type="text"
                [value]="buscaCliente()"
                (input)="buscaCliente.set($any($event.target).value)"
                placeholder="Buscar por nome, email ou telefone..."
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-stone-50" />
            </div>
            <button
              (click)="abrirModalCliente()"
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-200 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              <span>+ Novo Paciente</span>
            </button>
          </div>

          @if (carregando()) {
            <div class="py-16 text-center text-xs text-stone-400">Carregando lista de pacientes...</div>
          } @else if (clientesFiltrados().length === 0) {
            <div class="py-16 text-center text-xs text-stone-400">Nenhum paciente cadastrado.</div>
          } @else {
            <div class="bg-white rounded-3xl border border-nude-200 overflow-hidden shadow-sm">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-stone-50 border-b border-nude-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th class="py-3.5 px-5">Paciente</th>
                      <th class="py-3.5 px-5">WhatsApp</th>
                      <th class="py-3.5 px-5">E-mail</th>
                      <th class="py-3.5 px-5">Status</th>
                      <th class="py-3.5 px-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-nude-100 text-stone-700">
                    @for (cli of clientesFiltrados(); track cli.id) {
                      <tr class="hover:bg-rose-50/40 transition-colors">
                        <td class="py-3.5 px-5 font-semibold text-stone-900 flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs uppercase">
                            {{ cli.nome.substring(0, 2) }}
                          </div>
                          <span>{{ cli.nome }}</span>
                        </td>
                        <td class="py-3.5 px-5 font-mono">
                          <a [href]="'https://wa.me/55' + cli.telefoneWhatsApp" target="_blank" class="text-emerald-700 hover:underline flex items-center gap-1">
                            <span>💬</span>
                            <span>{{ cli.telefoneWhatsApp | telefone }}</span>
                          </a>
                        </td>
                        <td class="py-3.5 px-5 text-stone-500">{{ cli.email }}</td>
                        <td class="py-3.5 px-5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                [class.bg-emerald-100]="cli.ativo !== false"
                                [class.text-emerald-800]="cli.ativo !== false"
                                [class.bg-stone-100]="cli.ativo === false"
                                [class.text-stone-600]="cli.ativo === false">
                            {{ cli.ativo !== false ? 'Ativo' : 'Inativo' }}
                          </span>
                        </td>
                        <td class="py-3.5 px-5 text-right space-x-2">
                          <a [routerLink]="['/admin/prontuarios']" class="text-stone-500 hover:text-stone-900 font-semibold" title="Abrir Prontuário">
                            Prontuário
                          </a>
                          <button (click)="abrirModalCliente(cli)" class="text-rose-600 hover:text-rose-800 font-semibold">
                            Editar
                          </button>
                          <button (click)="alternarStatusCliente(cli)" class="text-stone-400 hover:text-stone-700 font-medium">
                            {{ cli.ativo !== false ? 'Desativar' : 'Ativar' }}
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- MODAL: CADASTRAR / EDITAR PROCEDIMENTO -->
      <!-- ========================================================================================= -->
      @if (modalProcedimentoAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-nude-200 animate-scale-up my-8">
            <div class="flex items-center justify-between mb-6">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-rose-600">Catálogo de Serviços</span>
                <h3 class="font-serif font-bold text-xl text-stone-900">
                  {{ procedimentoEmEdicao() ? 'Editar Procedimento' : 'Novo Procedimento' }}
                </h3>
              </div>
              <button (click)="fecharModalProcedimento()" class="text-stone-400 hover:text-stone-600 p-2 text-xl font-bold">✕</button>
            </div>

            @if (mensagemErro()) {
              <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <span>{{ mensagemErro() }}</span>
                <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
              </div>
            }

            <form [formGroup]="formProcedimento" (ngSubmit)="salvarProcedimento()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Categoria *</label>
                <select formControlName="categoriaId" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50">
                  <option value="">-- Selecione uma Categoria --</option>
                  @for (cat of categorias(); track cat.id) {
                    <option [value]="cat.id">{{ cat.nome }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Título do Procedimento *</label>
                <input type="text" formControlName="titulo" placeholder="Ex: Limpeza de Pele Profunda com Fototerapia" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Descrição Comercial</label>
                <textarea formControlName="descricao" rows="2" placeholder="Descreva os benefícios e técnicas utilizadas..." class="w-full text-xs px-3.5 py-2 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1">Duração (Minutos) *</label>
                  <input type="number" step="10" min="10" formControlName="duracaoMinutos" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1">Valor / Preço (R$) *</label>
                  <input type="number" step="0.50" min="0" formControlName="preco" placeholder="180.00" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>
              </div>

              <!-- Upload da Imagem de Capa do Procedimento -->
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">
                  Foto / Imagem de Capa do Procedimento
                </label>

                @if (!formProcedimento.get('imagemUrl')?.value) {
                  <div
                    (click)="fileInputProcedimento.click()"
                    class="border-2 border-dashed border-nude-300 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/20 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group">
                    <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      📸
                    </div>
                    <div>
                      <span class="text-xs font-semibold text-stone-800 block">Clique para fazer upload da foto de capa</span>
                      <span class="text-[10px] text-stone-400">PNG, JPG, WEBP ou SVG (até 15MB)</span>
                    </div>
                    @if (fazendoUploadProcedimento()) {
                      <span class="text-xs font-bold text-rose-600 animate-pulse">Enviando imagem...</span>
                    }
                  </div>
                } @else {
                  <div class="p-3 rounded-2xl bg-stone-50 border border-nude-200 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-16 h-12 rounded-xl overflow-hidden border border-nude-300 bg-white shadow-sm flex items-center justify-center">
                        <img [src]="obterImagemUrl(formProcedimento.get('imagemUrl')?.value)" alt="Capa" class="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span class="text-xs font-semibold text-stone-800 block">Foto selecionada</span>
                        <span class="text-[10px] text-emerald-600 font-medium">✓ Imagem anexada com sucesso</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="fileInputProcedimento.click()"
                        class="px-2.5 py-1.5 rounded-lg border border-nude-300 bg-white text-[11px] font-semibold text-stone-700 hover:bg-stone-100">
                        Trocar Foto
                      </button>
                      <button
                        type="button"
                        (click)="removerFotoProcedimento()"
                        class="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold">
                        Remover
                      </button>
                    </div>
                  </div>
                }

                <input #fileInputProcedimento type="file" accept="image/*" (change)="aoSelecionarFotoProcedimento($event)" class="hidden" />
              </div>

              <div class="pt-4 flex items-center justify-end gap-3">
                <button type="button" (click)="fecharModalProcedimento()" class="px-4 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                  Cancelar
                </button>
                <button type="submit" [disabled]="formProcedimento.invalid || salvando()" class="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50">
                  {{ salvando() ? 'Salvando...' : 'Salvar Procedimento' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- MODAL: CADASTRAR / EDITAR PROFISSIONAL -->
      <!-- ========================================================================================= -->
      @if (modalProfissionalAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-nude-200 animate-scale-up my-8">
            <div class="flex items-center justify-between mb-6">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-rose-600">Corpo Clínico</span>
                <h3 class="font-serif font-bold text-xl text-stone-900">
                  {{ profissionalEmEdicao() ? 'Editar Especialista' : 'Novo Especialista' }}
                </h3>
              </div>
              <button (click)="fecharModalProfissional()" class="text-stone-400 hover:text-stone-600 p-2 text-xl font-bold">✕</button>
            </div>

            @if (mensagemErro()) {
              <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <span>{{ mensagemErro() }}</span>
                <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
              </div>
            }

            <form [formGroup]="formProfissional" (ngSubmit)="salvarProfissional()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Nome Completo *</label>
                <input type="text" formControlName="nome" placeholder="Dra. Juliana Mendes" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1">Usuário / Login do Especialista</label>
                  <input type="text" formControlName="login" placeholder="Ex: judite, dra.paula" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                  <span class="text-[10px] text-stone-400 mt-0.5 block">Campo livre de acesso para o especialista</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1">WhatsApp do Especialista *</label>
                  <input type="text" appPhoneMask formControlName="telefoneWhatsApp" placeholder="(11) 98888-7777" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                  <span class="text-[10px] text-stone-400 mt-0.5 block">WhatsApp com DDD</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">E-mail (opcional)</label>
                <input type="email" formControlName="email" placeholder="juliana@clinica.com" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                <span class="text-[10px] text-stone-400 mt-0.5 block">Opcional</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1">Especialidade Clínica *</label>
                  <input type="text" formControlName="especialidade" placeholder="Biomédica Esteta" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1">Cor na Agenda</label>
                  <input type="color" formControlName="corIdentificacao" class="w-full h-10 p-1 rounded-xl border border-nude-300 bg-stone-50 cursor-pointer" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Biografia Resumida</label>
                <textarea formControlName="bio" rows="2" placeholder="Especialista em tratamentos faciais e laser..." class="w-full text-xs px-3.5 py-2 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50"></textarea>
              </div>

              <!-- Upload da Foto de Perfil do Profissional -->
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">
                  Foto de Perfil do Especialista
                </label>

                @if (!formProfissional.get('fotoUrl')?.value) {
                  <div
                    (click)="fileInputProfissional.click()"
                    class="border-2 border-dashed border-nude-300 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/20 rounded-2xl p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-3 group">
                    <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      👤
                    </div>
                    <div class="text-left">
                      <span class="text-xs font-semibold text-stone-800 block">Clique para fazer upload da foto</span>
                      <span class="text-[10px] text-stone-400">JPG, PNG, WEBP (foto de rosto recomendada)</span>
                    </div>
                    @if (fazendoUploadProfissional()) {
                      <span class="text-xs font-bold text-rose-600 animate-pulse ml-auto">Enviando...</span>
                    }
                  </div>
                } @else {
                  <div class="p-3 rounded-2xl bg-stone-50 border border-nude-200 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-rose-300 bg-white shadow-sm flex items-center justify-center">
                        <img [src]="obterImagemUrl(formProfissional.get('fotoUrl')?.value)" alt="Perfil" class="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span class="text-xs font-semibold text-stone-800 block">Foto de perfil definida</span>
                        <span class="text-[10px] text-emerald-600 font-medium">✓ Exibida aos clientes no catálogo</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="fileInputProfissional.click()"
                        class="px-2.5 py-1.5 rounded-lg border border-nude-300 bg-white text-[11px] font-semibold text-stone-700 hover:bg-stone-100">
                        Trocar Foto
                      </button>
                      <button
                        type="button"
                        (click)="removerFotoProfissional()"
                        class="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold">
                        Remover
                      </button>
                    </div>
                  </div>
                }

                <input #fileInputProfissional type="file" accept="image/*" (change)="aoSelecionarFotoProfissional($event)" class="hidden" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">
                  {{ profissionalEmEdicao() ? 'Alterar Senha de Acesso (opcional)' : 'Senha de Acesso (padrão Clinica@123)' }}
                </label>
                <input type="password" formControlName="senha" placeholder="Mínimo 6 caracteres" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1.5">Procedimentos Habilitados:</label>
                <div class="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl border border-nude-200 bg-stone-50">
                  @for (proc of procedimentos(); track proc.id) {
                    <label class="flex items-center gap-2 text-xs text-stone-700 cursor-pointer hover:text-stone-900">
                      <input
                        type="checkbox"
                        [checked]="isProcedimentoSelecionado(proc.id)"
                        (change)="toggleProcedimentoProfissional(proc.id)"
                        class="rounded text-rose-600 focus:ring-rose-400" />
                      <span>{{ proc.titulo }} ({{ proc.categoriaNome }})</span>
                    </label>
                  }
                </div>
              </div>

              <div class="pt-4 flex items-center justify-end gap-3">
                <button type="button" (click)="fecharModalProfissional()" class="px-4 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                  Cancelar
                </button>
                <button type="submit" [disabled]="formProfissional.invalid || salvando()" class="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50">
                  {{ salvando() ? 'Salvando...' : 'Salvar Especialista' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- MODAL: CADASTRAR / EDITAR CLIENTE -->
      <!-- ========================================================================================= -->
      @if (modalClienteAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-nude-200 animate-scale-up my-8">
            <div class="flex items-center justify-between mb-6">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-rose-600">Base de Pacientes</span>
                <h3 class="font-serif font-bold text-xl text-stone-900">
                  {{ clienteEmEdicao() ? 'Editar Paciente' : 'Novo Paciente' }}
                </h3>
              </div>
              <button (click)="fecharModalCliente()" class="text-stone-400 hover:text-stone-600 p-2 text-xl font-bold">✕</button>
            </div>

            @if (mensagemErro()) {
              <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <span>{{ mensagemErro() }}</span>
                <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
              </div>
            }

            <form [formGroup]="formCliente" (ngSubmit)="salvarCliente()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Nome Completo do Paciente *</label>
                <input type="text" formControlName="nome" placeholder="Ex: Fernanda Alencar" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">WhatsApp com DDD (Login de Acesso) *</label>
                <input type="text" appPhoneMask formControlName="telefoneWhatsApp" placeholder="(11) 98765-4321" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
                <span class="text-[10px] text-stone-400 mt-0.5 block">Usado para o cliente entrar na plataforma</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">E-mail (opcional)</label>
                <input type="email" formControlName="email" placeholder="fernanda@exemplo.com" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">
                  {{ clienteEmEdicao() ? 'Alterar Senha (opcional)' : 'Senha de Acesso (opcional - cliente cadastrará no primeiro acesso)' }}
                </label>
                <input type="password" formControlName="senha" placeholder="Mínimo 6 caracteres" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50" />
              </div>

              <div class="pt-4 flex items-center justify-end gap-3">
                <button type="button" (click)="fecharModalCliente()" class="px-4 py-2.5 rounded-xl border border-nude-300 text-stone-600 text-xs font-semibold hover:bg-stone-50">
                  Cancelar
                </button>
                <button type="submit" [disabled]="formCliente.invalid || salvando()" class="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50">
                  {{ salvando() ? 'Salvando...' : 'Salvar Paciente' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal Travar Agenda / Horários -->
      <app-modal-trava-agenda
        [aberto]="modalAgendaAberto()"
        [profissionalIdInicial]="profissionalParaAgenda()"
        (fechar)="modalAgendaAberto.set(false)"
        (atualizado)="carregarDados()">
      </app-modal-trava-agenda>

    </div>
  `
})
export class AdminGestaoComponent implements OnInit {
  private api = inject(ApiService);
  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  abaAtiva = signal<TabTipo>('procedimentos');
  carregando = signal<boolean>(false);
  salvando = signal<boolean>(false);
  mensagemSucesso = signal<string | null>(null);
  mensagemErro = signal<string | null>(null);

  modalAgendaAberto = signal<boolean>(false);
  profissionalParaAgenda = signal<number | null>(null);

  // Dados
  categorias = signal<Categoria[]>([]);
  procedimentos = signal<Procedimento[]>([]);
  profissionais = signal<Profissional[]>([]);
  clientes = signal<Usuario[]>([]);

  // Filtros de busca
  buscaProcedimento = signal<string>('');
  buscaProfissional = signal<string>('');
  buscaCliente = signal<string>('');

  // Modais e Estados de Edição
  modalProcedimentoAberto = signal<boolean>(false);
  procedimentoEmEdicao = signal<Procedimento | null>(null);

  modalProfissionalAberto = signal<boolean>(false);
  profissionalEmEdicao = signal<Profissional | null>(null);
  procedimentosSelecionadosIds = signal<number[]>([]);

  modalClienteAberto = signal<boolean>(false);
  clienteEmEdicao = signal<Usuario | null>(null);

  fazendoUploadProcedimento = signal<boolean>(false);
  fazendoUploadProfissional = signal<boolean>(false);

  // Formulários
  formProcedimento!: FormGroup;
  formProfissional!: FormGroup;
  formCliente!: FormGroup;
  formIdentidade!: FormGroup;
  fazendoUploadLogo = signal<boolean>(false);
  salvandoIdentidade = signal<boolean>(false);
  erroUploadLogo = signal<string | null>(null);

  // Filtros calculados
  procedimentosFiltrados = computed(() => {
    const termo = this.buscaProcedimento().toLowerCase().trim();
    if (!termo) return this.procedimentos();
    return this.procedimentos().filter(p =>
      p.titulo.toLowerCase().includes(termo) ||
      (p.categoriaNome && p.categoriaNome.toLowerCase().includes(termo))
    );
  });

  profissionaisFiltrados = computed(() => {
    const termo = this.buscaProfissional().toLowerCase().trim();
    if (!termo) return this.profissionais();
    return this.profissionais().filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      (p.especialidade && p.especialidade.toLowerCase().includes(termo))
    );
  });

  clientesFiltrados = computed(() => {
    const termo = this.buscaCliente().toLowerCase().trim();
    if (!termo) return this.clientes();
    return this.clientes().filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.telefoneWhatsApp && c.telefoneWhatsApp.includes(termo))
    );
  });

  ngOnInit(): void {
    this.iniciarFormularios();
    this.carregarDados();

    // Permite abrir em uma aba específica via queryParam: /admin/gestao?tab=clientes
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['procedimentos', 'profissionais', 'clientes', 'identidade'].includes(params['tab'])) {
        this.abaAtiva.set(params['tab'] as TabTipo);
      }
    });
  }

  private iniciarFormularios(): void {
    this.formProcedimento = this.fb.group({
      categoriaId: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descricao: [''],
      duracaoMinutos: [60, [Validators.required, Validators.min(10)]],
      preco: [150, [Validators.required, Validators.min(1)]],
      imagemUrl: ['']
    });

    this.formProfissional = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      login: [''],
      email: [''],
      telefoneWhatsApp: ['', Validators.required],
      especialidade: ['', Validators.required],
      bio: [''],
      fotoUrl: [''],
      corIdentificacao: ['#f43f5e'],
      senha: ['']
    });

    this.formCliente = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      login: [''],
      email: [''],
      telefoneWhatsApp: ['', Validators.required],
      senha: ['']
    });

    this.formIdentidade = this.fb.group({
      nomeEmpresa: ['', [Validators.required, Validators.minLength(2)]],
      logoUrl: [''],
      corPrimaria: ['#e11d48', Validators.required],
      corSecundaria: ['#f43f5e', Validators.required],
      telefoneWhatsApp: ['']
    });
  }

  carregarDados(): void {
    this.carregando.set(true);

    this.api.getCategorias().subscribe({
      next: (cats) => this.categorias.set(cats)
    });

    this.api.getProcedimentosAdmin().subscribe({
      next: (procs) => this.procedimentos.set(procs),
      error: () => {
        // Fallback para getProcedimentos se o admin endpoint ainda não estiver pronto
        this.api.getProcedimentos().subscribe(p => this.procedimentos.set(p));
      }
    });

    this.api.getProfissionaisAdmin().subscribe({
      next: (profs) => this.profissionais.set(profs),
      error: () => {
        this.api.getProfissionais().subscribe(p => this.profissionais.set(p));
      }
    });

    this.api.getMeuTenant().subscribe({
      next: (t) => {
        if (t) {
          this.formIdentidade.patchValue({
            nomeEmpresa: t.nomeEmpresa || '',
            logoUrl: t.logoUrl || '',
            corPrimaria: t.corPrimaria || '#e11d48',
            corSecundaria: t.corSecundaria || '#f43f5e',
            telefoneWhatsApp: t.telefoneWhatsApp || ''
          });
        }
      }
    });

    this.api.getClientes().subscribe({
      next: (clis) => {
        this.clientes.set(clis);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });
  }

  // ===================== PROCEDIMENTOS =====================
  abrirModalProcedimento(proc?: Procedimento): void {
    if (proc) {
      this.procedimentoEmEdicao.set(proc);
      this.formProcedimento.patchValue({
        categoriaId: proc.categoriaId,
        titulo: proc.titulo,
        descricao: proc.descricao || '',
        duracaoMinutos: proc.duracaoMinutos,
        preco: proc.preco,
        imagemUrl: proc.imagemUrl || ''
      });
    } else {
      this.procedimentoEmEdicao.set(null);
      this.formProcedimento.reset({
        categoriaId: this.categorias()[0]?.id || '',
        duracaoMinutos: 60,
        preco: 150,
        imagemUrl: ''
      });
    }
    this.modalProcedimentoAberto.set(true);
  }

  fecharModalProcedimento(): void {
    this.modalProcedimentoAberto.set(false);
    this.procedimentoEmEdicao.set(null);
  }

  salvarProcedimento(): void {
    if (this.formProcedimento.invalid) return;

    this.salvando.set(true);
    const dados = this.formProcedimento.value;
    const emEdicao = this.procedimentoEmEdicao();

    const request$ = emEdicao
      ? this.api.atualizarProcedimento(emEdicao.id, dados)
      : this.api.criarProcedimento(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharModalProcedimento();
        this.mensagemSucesso.set(`Procedimento ${emEdicao ? 'atualizado' : 'cadastrado'} com sucesso!`);
        this.carregarDados();
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err.error?.detail || err.error?.message || 'Erro ao salvar procedimento.');
      }
    });
  }

  alternarStatusProcedimento(proc: Procedimento): void {
    this.api.alternarStatusProcedimento(proc.id).subscribe({
      next: () => {
        this.mensagemSucesso.set(`Status do procedimento alterado com sucesso!`);
        this.carregarDados();
      },
      error: (err) => this.mensagemErro.set('Erro ao alterar status do procedimento.')
    });
  }

  // ===================== PROFISSIONAIS =====================
  abrirModalAgenda(profId: number): void {
    this.profissionalParaAgenda.set(profId);
    this.modalAgendaAberto.set(true);
  }

  abrirModalProfissional(prof?: Profissional): void {
    if (prof) {
      this.profissionalEmEdicao.set(prof);
      this.procedimentosSelecionadosIds.set([...(prof.procedimentosIds || [])]);
      this.formProfissional.patchValue({
        nome: prof.nome,
        login: prof.login || '',
        email: prof.email || '',
        telefoneWhatsApp: prof.telefoneWhatsApp || '',
        especialidade: prof.especialidade || '',
        bio: prof.bio || '',
        fotoUrl: prof.fotoUrl || '',
        corIdentificacao: prof.corIdentificacao || '#f43f5e',
        senha: ''
      });
    } else {
      this.profissionalEmEdicao.set(null);
      this.procedimentosSelecionadosIds.set([]);
      this.formProfissional.reset({
        corIdentificacao: '#f43f5e',
        senha: ''
      });
    }
    this.modalProfissionalAberto.set(true);
  }

  fecharModalProfissional(): void {
    this.modalProfissionalAberto.set(false);
    this.profissionalEmEdicao.set(null);
    this.procedimentosSelecionadosIds.set([]);
  }

  isProcedimentoSelecionado(procId: number): boolean {
    return this.procedimentosSelecionadosIds().includes(procId);
  }

  toggleProcedimentoProfissional(procId: number): void {
    const atuais = this.procedimentosSelecionadosIds();
    if (atuais.includes(procId)) {
      this.procedimentosSelecionadosIds.set(atuais.filter(id => id !== procId));
    } else {
      this.procedimentosSelecionadosIds.set([...atuais, procId]);
    }
  }

  salvarProfissional(): void {
    if (this.formProfissional.invalid) {
      this.formProfissional.markAllAsTouched();
      const faltantes: string[] = [];
      if (this.formProfissional.get('nome')?.invalid) faltantes.push('Nome Completo');
      if (this.formProfissional.get('telefoneWhatsApp')?.invalid) faltantes.push('WhatsApp');
      if (this.formProfissional.get('especialidade')?.invalid) faltantes.push('Especialidade');
      this.mensagemErro.set('Preencha os campos obrigatórios: ' + faltantes.join(', '));
      return;
    }

    this.salvando.set(true);
    const dados = {
      ...this.formProfissional.value,
      procedimentosIds: this.procedimentosSelecionadosIds()
    };
    const emEdicao = this.profissionalEmEdicao();

    const request$ = emEdicao
      ? this.api.atualizarProfissional(emEdicao.id, dados)
      : this.api.criarProfissional(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharModalProfissional();
        this.mensagemSucesso.set(`Especialista ${emEdicao ? 'atualizado' : 'cadastrado'} com sucesso!`);
        this.carregarDados();
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err.error?.detail || err.error?.message || 'Erro ao salvar especialista.');
      }
    });
  }

  alternarStatusProfissional(prof: Profissional): void {
    this.api.alternarStatusProfissional(prof.id).subscribe({
      next: () => {
        this.mensagemSucesso.set('Status do especialista atualizado com sucesso!');
        this.carregarDados();
      },
      error: () => this.mensagemErro.set('Erro ao alterar status do especialista.')
    });
  }

  getNomeProcedimento(procId: number): string {
    const proc = this.procedimentos().find(p => p.id === procId);
    return proc ? proc.titulo : `#${procId}`;
  }

  // ===================== CLIENTES =====================
  abrirModalCliente(cli?: Usuario): void {
    if (cli) {
      this.clienteEmEdicao.set(cli);
      this.formCliente.patchValue({
        nome: cli.nome,
        email: cli.email,
        telefoneWhatsApp: cli.telefoneWhatsApp,
        senha: ''
      });
    } else {
      this.clienteEmEdicao.set(null);
      this.formCliente.reset({
        senha: ''
      });
    }
    this.modalClienteAberto.set(true);
  }

  fecharModalCliente(): void {
    this.modalClienteAberto.set(false);
    this.clienteEmEdicao.set(null);
  }

  salvarCliente(): void {
    if (this.formCliente.invalid) {
      this.formCliente.markAllAsTouched();
      const faltantes: string[] = [];
      if (this.formCliente.get('nome')?.invalid) faltantes.push('Nome Completo');
      if (this.formCliente.get('telefoneWhatsApp')?.invalid) faltantes.push('WhatsApp');
      this.mensagemErro.set('Preencha os campos obrigatórios: ' + faltantes.join(', '));
      return;
    }

    this.salvando.set(true);
    const dados = this.formCliente.value;
    const emEdicao = this.clienteEmEdicao();

    const request$ = emEdicao
      ? this.api.atualizarCliente(emEdicao.id, dados)
      : this.api.criarCliente(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharModalCliente();
        this.mensagemSucesso.set(`Paciente ${emEdicao ? 'atualizado' : 'cadastrado'} com sucesso!`);
        this.carregarDados();
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err.error?.detail || err.error?.message || 'Erro ao salvar paciente.');
      }
    });
  }

  alternarStatusCliente(cli: Usuario): void {
    this.api.alternarStatusCliente(cli.id).subscribe({
      next: () => {
        this.mensagemSucesso.set('Status do paciente alterado com sucesso!');
        this.carregarDados();
      },
      error: () => this.mensagemErro.set('Erro ao alternar status do paciente.')
    });
  }

  // ===================== UPLOAD DE FOTOS E IMAGENS =====================
  aoSelecionarFotoProcedimento(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fazendoUploadProcedimento.set(true);

    // Prévia instantânea
    const reader = new FileReader();
    reader.onload = (e) => {
      this.formProcedimento.patchValue({ imagemUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);

    this.api.uploadImagem(file).subscribe({
      next: (res) => {
        if (res && res.url) {
          this.formProcedimento.patchValue({ imagemUrl: res.url });
        }
        this.fazendoUploadProcedimento.set(false);
      },
      error: () => {
        this.fazendoUploadProcedimento.set(false);
      }
    });
  }

  removerFotoProcedimento(): void {
    this.formProcedimento.patchValue({ imagemUrl: '' });
  }

  aoSelecionarFotoProfissional(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fazendoUploadProfissional.set(true);

    // Prévia instantânea
    const reader = new FileReader();
    reader.onload = (e) => {
      this.formProfissional.patchValue({ fotoUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);

    this.api.uploadImagem(file).subscribe({
      next: (res) => {
        if (res && res.url) {
          this.formProfissional.patchValue({ fotoUrl: res.url });
        }
        this.fazendoUploadProfissional.set(false);
      },
      error: () => {
        this.fazendoUploadProfissional.set(false);
      }
    });
  }

  removerFotoProfissional(): void {
    this.formProfissional.patchValue({ fotoUrl: '' });
  }

  obterImagemUrl(url?: string): string {
    return this.api.formatarUrlImagem(url);
  }

  // ===================== IDENTIDADE VISUAL & CORES =====================
  aoSelecionarLogoClinica(event: Event): void {
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
      this.formIdentidade.patchValue({ logoUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);

    this.api.uploadImagem(file).subscribe({
      next: (res) => {
        if (res && res.url) {
          this.formIdentidade.patchValue({ logoUrl: res.url });
        }
        this.fazendoUploadLogo.set(false);
      },
      error: () => {
        this.fazendoUploadLogo.set(false);
      }
    });
  }

  removerLogoClinica(): void {
    this.formIdentidade.patchValue({ logoUrl: '' });
  }

  salvarIdentidadeVisual(): void {
    if (this.formIdentidade.invalid) {
      this.mensagemErro.set('Preencha os campos obrigatórios da clínica.');
      return;
    }

    this.salvandoIdentidade.set(true);
    this.mensagemErro.set(null);
    this.mensagemSucesso.set(null);

    const dados = this.formIdentidade.value;

    this.api.atualizarIdentidadeVisual(dados).subscribe({
      next: (res) => {
        this.salvandoIdentidade.set(false);
        this.tenantService.setTenantManual(res);
        this.mensagemSucesso.set('✓ Logotipo, cores e dados da clínica atualizados com sucesso!');
      },
      error: (err) => {
        this.salvandoIdentidade.set(false);
        this.mensagemErro.set(err.error?.detail || err.error?.message || 'Erro ao salvar identidade visual.');
      }
    });
  }
}