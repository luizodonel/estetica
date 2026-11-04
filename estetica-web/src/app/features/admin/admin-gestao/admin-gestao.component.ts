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
import { SetorService } from '../../../core/services/setor.service';
type TabTipo = 'procedimentos' | 'categorias' | 'profissionais' | 'clientes' | 'identidade';

@Component({
  selector: 'app-admin-gestao',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PhoneMaskDirective, TelefonePipe, ModalTravaAgendaComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 font-sans">
      
      <!-- Cabeçalho Principal -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Módulo Administrativo
          </span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cadastros & Configurações
          </h1>
          <p class="text-xs text-slate-500 mt-1">Gerencie os procedimentos oferecidos, equipe de especialistas e clientes.</p>
        </div>

        <div class="flex items-center gap-2">
          <a routerLink="/admin/dashboard" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm">
            ← Voltar ao Painel
          </a>
        </div>
      </div>

      <!-- Navegação por Abas -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          (click)="abaAtiva.set('procedimentos')"
          [class.bg-slate-900]="abaAtiva() === 'procedimentos'"
          [class.text-white]="abaAtiva() === 'procedimentos'"
          [class.shadow-sm]="abaAtiva() === 'procedimentos'"
          [class.bg-white]="abaAtiva() !== 'procedimentos'"
          [class.text-slate-700]="abaAtiva() !== 'procedimentos'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-slate-200">
          <span>💎 {{ setorService.termoServicos() }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class.bg-slate-700]="abaAtiva() === 'procedimentos'" [class.bg-slate-100]="abaAtiva() !== 'procedimentos'">
            {{ procedimentos().length }}
          </span>
        </button>

        <button
          (click)="abaAtiva.set('categorias')"
          [class.bg-slate-900]="abaAtiva() === 'categorias'"
          [class.text-white]="abaAtiva() === 'categorias'"
          [class.shadow-sm]="abaAtiva() === 'categorias'"
          [class.bg-white]="abaAtiva() !== 'categorias'"
          [class.text-slate-700]="abaAtiva() !== 'categorias'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-slate-200">
          <span>🏷️ Tipos & Categorias</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class.bg-slate-700]="abaAtiva() === 'categorias'" [class.bg-slate-100]="abaAtiva() !== 'categorias'">
            {{ categorias().length }}
          </span>
        </button>

        <button
          (click)="abaAtiva.set('profissionais')"
          [class.bg-slate-900]="abaAtiva() === 'profissionais'"
          [class.text-white]="abaAtiva() === 'profissionais'"
          [class.shadow-sm]="abaAtiva() === 'profissionais'"
          [class.bg-white]="abaAtiva() !== 'profissionais'"
          [class.text-slate-700]="abaAtiva() !== 'profissionais'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-slate-200">
          <span>👩‍⚕️ Especialistas</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class.bg-slate-700]="abaAtiva() === 'profissionais'" [class.bg-slate-100]="abaAtiva() !== 'profissionais'">
            {{ profissionais().length }}
          </span>
        </button>

        <button
          (click)="abaAtiva.set('clientes')"
          [class.bg-slate-900]="abaAtiva() === 'clientes'"
          [class.text-white]="abaAtiva() === 'clientes'"
          [class.shadow-sm]="abaAtiva() === 'clientes'"
          [class.bg-white]="abaAtiva() !== 'clientes'"
          [class.text-slate-700]="abaAtiva() !== 'clientes'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-slate-200">
          <span>👤 Pacientes & Clientes</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class.bg-slate-700]="abaAtiva() === 'clientes'" [class.bg-slate-100]="abaAtiva() !== 'clientes'">
            {{ clientes().length }}
          </span>
        </button>

        <button
          (click)="abaAtiva.set('identidade')"
          [class.bg-slate-900]="abaAtiva() === 'identidade'"
          [class.text-white]="abaAtiva() === 'identidade'"
          [class.shadow-sm]="abaAtiva() === 'identidade'"
          [class.bg-white]="abaAtiva() !== 'identidade'"
          [class.text-slate-700]="abaAtiva() !== 'identidade'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-slate-200">
          <span>🖼️ Logotipo & Dados</span>
        </button>

        <a
          routerLink="/admin/assinatura"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm">
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
                Logotipo & Dados do Estabelecimento
              </h2>
              <p class="text-xs text-stone-500 mt-1">
                Altere a logomarca e o nome de exibição do seu espaço a qualquer momento.
              </p>
            </div>

            <form [formGroup]="formIdentidade" (ngSubmit)="salvarIdentidadeVisual()" class="space-y-6">
              
              <!-- Nome e WhatsApp do Estabelecimento -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1.5">Nome do Estabelecimento / Espaço *</label>
                  <input
                    type="text"
                    formControlName="nomeEmpresa"
                    placeholder="Ex: Studio Bella, Espaço Vip, Barbearia Nobre"
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
                  Logomarca Oficial (Exibida no topo e cabeçalho)
                </label>

                @if (!formIdentidade.get('logoUrl')?.value) {
                  <div
                    (click)="fileInputLogoClinica.click()"
                    class="border-2 border-dashed border-nude-300 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
                    <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      📁
                    </div>
                    <div>
                      <span class="text-xs font-semibold text-stone-800 block">Clique para enviar a Logomarca</span>
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

              <!-- Setor / Segmento de Atuação -->
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1.5">
                  Setor / Nicho de Atuação do Estabelecimento
                </label>
                <div class="relative">
                  <select
                    formControlName="setor"
                    class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:ring-2 focus:ring-rose-400 bg-stone-50 font-medium appearance-none cursor-pointer">
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
                <span class="text-[11px] text-stone-400 mt-1 block">
                  Define automaticamente os termos de clientes ({{ setorService.termoCliente() }}), serviços ({{ setorService.termoServico() }}) e botões de agendamento em todo o sistema.
                </span>
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
                          {{ formIdentidade.get('nomeEmpresa')?.value || 'Seu Espaço' }}
                        </span>
                        <span class="text-[9px] uppercase tracking-wider text-stone-400 font-semibold">Portal Oficial</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-sm bg-rose-600">
                      {{ setorService.termoAgendar() }}
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
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all">
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
      <!-- ABA 2: GESTÃO DE TIPOS E CATEGORIAS DE SERVIÇOS -->
      <!-- ========================================================================================= -->
      @if (abaAtiva() === 'categorias') {
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-nude-200 shadow-sm">
            <div class="flex-1 max-w-sm">
              <input
                type="text"
                [value]="buscaCategoria()"
                (input)="buscaCategoria.set($any($event.target).value)"
                placeholder="Buscar tipo ou categoria..."
                class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-nude-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-stone-50" />
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="abrirModalCategoria()"
                class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>+ Novo Tipo / Categoria</span>
              </button>
            </div>
          </div>

          <div class="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <span class="text-xl">💡</span>
            <div class="text-xs text-amber-900 leading-relaxed">
              <strong class="font-bold">Personalização do seu Negócio:</strong> Aqui você pode editar os nomes das categorias pré-prontas do seu setor, alterar emojis/ícones, definir a ordem de exibição na página inicial e criar novos tipos de serviços específicos para seu estabelecimento.
            </div>
          </div>

          @if (carregando()) {
            <div class="py-16 text-center text-xs text-stone-400">Carregando tipos e categorias...</div>
          } @else if (categoriasFiltradas().length === 0) {
            <div class="py-16 text-center text-xs text-stone-400">
              Nenhuma categoria encontrada. Clique em "+ Novo Tipo / Categoria" para cadastrar.
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (cat of categoriasFiltradas(); track cat.id) {
                <div class="bg-white rounded-2xl border border-nude-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <!-- Imagem de Capa do Tipo / Categoria -->
                    <div class="h-36 w-full overflow-hidden relative bg-stone-100">
                      @if (cat.imagemUrl) {
                        <img [src]="obterImagemUrl(cat.imagemUrl)" [alt]="cat.nome" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      } @else {
                        <div class="w-full h-full bg-gradient-to-br from-rose-50 to-stone-100 flex items-center justify-center text-stone-300">
                          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                      }
                      <span class="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-md shadow-sm"
                            [class.bg-emerald-500/90]="cat.ativo"
                            [class.text-white]="cat.ativo"
                            [class.bg-stone-800/80]="!cat.ativo"
                            [class.text-stone-200]="!cat.ativo">
                        {{ cat.ativo ? 'Ativo' : 'Inativo' }}
                      </span>
                      <span class="absolute bottom-2 left-3 text-[10px] font-bold text-white bg-black/60 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                        Ordem #{{ cat.ordemExibicao || 0 }}
                      </span>
                    </div>

                    <div class="p-5">
                      <div>
                        <h3 class="font-serif font-bold text-base text-stone-900">{{ cat.nome }}</h3>
                        <div class="flex items-center flex-wrap gap-1.5 mt-2 mb-3">
                          <span class="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            ⏱️ {{ cat.duracaoMinutosPadrao || 45 }} min
                          </span>
                          <span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            💰 {{ (cat.precoPadrao || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                          </span>
                        </div>
                      </div>

                      <p class="text-xs text-stone-500 line-clamp-2 leading-relaxed min-h-[32px]">
                        {{ cat.descricao || 'Sem descrição cadastrada para este tipo de serviço.' }}
                      </p>
                    </div>
                  </div>

                  <div class="px-5 pb-4 pt-3 border-t border-nude-100 flex items-center justify-between">
                    <span class="text-[11px] text-stone-400">
                      ID: #{{ cat.id }}
                    </span>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="abrirModalCategoria(cat)"
                        class="px-3 py-1.5 rounded-xl border border-nude-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all">
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        (click)="excluirCategoria(cat)"
                        class="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all">
                        🗑️ Excluir
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
      <!-- ABA 3: GESTÃO DE PROFISSIONAIS / ESPECIALISTAS -->
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
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all">
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
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all">
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
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start sm:items-center">
          <form [formGroup]="formProcedimento" (ngSubmit)="salvarProcedimento()" class="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-scale-up my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden font-sans">
            
            <!-- Cabeçalho Fixo / Sticky Header -->
            <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-500">Catálogo de Serviços</span>
                <h3 class="font-extrabold text-lg sm:text-xl text-slate-900">
                  {{ procedimentoEmEdicao() ? 'Editar Procedimento' : 'Novo Procedimento' }}
                </h3>
              </div>
              <button 
                type="button"
                (click)="fecharModalProcedimento()" 
                class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-base font-bold transition-colors">
                ✕
              </button>
            </div>

            <!-- Corpo com rolagem interna -->
            <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              @if (mensagemErro()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{{ mensagemErro() }}</span>
                  <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
                </div>
              }

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Categoria / Tipo de Serviço *</label>
                  <button
                    type="button"
                    (click)="irParaGerenciarCategorias()"
                    class="text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1">
                    <span>⚙️ Gerenciar Tipos</span>
                  </button>
                </div>
                <select formControlName="categoriaId" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50">
                  <option value="">-- Selecione uma Categoria --</option>
                  @for (cat of categorias(); track cat.id) {
                    <option [value]="cat.id">{{ cat.icone ? cat.icone + ' ' : '' }}{{ cat.nome }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Título do Procedimento *</label>
                <input type="text" formControlName="titulo" placeholder="Ex: Limpeza de Pele Profunda com Fototerapia" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Descrição Comercial</label>
                <textarea formControlName="descricao" rows="2" placeholder="Descreva os benefícios e técnicas utilizadas..." class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Duração (Minutos) *</label>
                  <input type="number" step="10" min="10" formControlName="duracaoMinutos" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Valor / Preço (R$) *</label>
                  <input type="number" step="0.50" min="0" formControlName="preco" placeholder="180.00" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                </div>
              </div>

              <!-- Upload da Imagem de Capa do Procedimento -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Foto / Imagem de Capa do Procedimento
                </label>

                @if (!formProcedimento.get('imagemUrl')?.value) {
                  <div
                    (click)="fileInputProcedimento.click()"
                    class="border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100/70 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group">
                    <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      📸
                    </div>
                    <div>
                      <span class="text-xs font-semibold text-slate-800 block">Clique para fazer upload da foto de capa</span>
                      <span class="text-[10px] text-slate-400">PNG, JPG, WEBP ou SVG (até 15MB)</span>
                    </div>
                    @if (fazendoUploadProcedimento()) {
                      <span class="text-xs font-bold text-slate-700 animate-pulse">Enviando imagem...</span>
                    }
                  </div>
                } @else {
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-16 h-12 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-sm flex items-center justify-center">
                        <img [src]="obterImagemUrl(formProcedimento.get('imagemUrl')?.value)" alt="Capa" class="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span class="text-xs font-semibold text-slate-800 block">Foto selecionada</span>
                        <span class="text-[10px] text-emerald-600 font-medium">✓ Imagem anexada com sucesso</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="fileInputProcedimento.click()"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-100">
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
            </div>

            <!-- Rodapé Fixo / Sticky Footer -->
            <div class="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button 
                type="button" 
                (click)="fecharModalProcedimento()" 
                class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="formProcedimento.invalid || salvando()" 
                class="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow">
                {{ salvando() ? 'Salvando...' : 'Salvar Procedimento' }}
              </button>
            </div>

          </form>
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- MODAL: CADASTRAR / EDITAR PROFISSIONAL -->
      <!-- ========================================================================================= -->
      @if (modalProfissionalAberto()) {
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start sm:items-center">
          <form [formGroup]="formProfissional" (ngSubmit)="salvarProfissional()" class="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-scale-up my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden font-sans">
            
            <!-- Cabeçalho Fixo / Sticky Header -->
            <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-500">Corpo Clínico</span>
                <h3 class="font-extrabold text-lg sm:text-xl text-slate-900">
                  {{ profissionalEmEdicao() ? 'Editar Especialista' : 'Novo Especialista' }}
                </h3>
              </div>
              <button 
                type="button"
                (click)="fecharModalProfissional()" 
                class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-base font-bold transition-colors">
                ✕
              </button>
            </div>

            <!-- Corpo com rolagem interna -->
            <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              @if (mensagemErro()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{{ mensagemErro() }}</span>
                  <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
                </div>
              }

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input type="text" formControlName="nome" placeholder="Dra. Juliana Mendes" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Usuário / Login do Especialista</label>
                  <input type="text" formControlName="login" placeholder="Ex: judite, dra.paula" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                  <span class="text-[10px] text-slate-400 mt-0.5 block">Campo livre de acesso para o especialista</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">WhatsApp do Especialista *</label>
                  <input type="text" appPhoneMask formControlName="telefoneWhatsApp" placeholder="(11) 98888-7777" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                  <span class="text-[10px] text-slate-400 mt-0.5 block">WhatsApp com DDD</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">E-mail (opcional)</label>
                <input type="email" formControlName="email" placeholder="profissional@email.com" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                <span class="text-[10px] text-slate-400 mt-0.5 block">Opcional</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Especialidade / Profissão *</label>
                  <input type="text" formControlName="especialidade" placeholder="Ex: Cabeleireiro, Esteticista, Barbeiro..." class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Cor na Agenda</label>
                  <input type="color" formControlName="corIdentificacao" class="w-full h-10 p-1 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Biografia Resumida</label>
                <textarea formControlName="bio" rows="2" placeholder="Especialista em tratamentos faciais e laser..." class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50"></textarea>
              </div>

              <!-- Upload da Foto de Perfil do Profissional -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Foto de Perfil do Especialista
                </label>

                @if (!formProfissional.get('fotoUrl')?.value) {
                  <div
                    (click)="fileInputProfissional.click()"
                    class="border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100/70 rounded-2xl p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-3 group">
                    <div class="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                      👤
                    </div>
                    <div class="text-left">
                      <span class="text-xs font-semibold text-slate-800 block">Clique para fazer upload da foto</span>
                      <span class="text-[10px] text-slate-400">JPG, PNG, WEBP (foto de rosto recomendada)</span>
                    </div>
                    @if (fazendoUploadProfissional()) {
                      <span class="text-xs font-bold text-slate-700 animate-pulse ml-auto">Enviando...</span>
                    }
                  </div>
                } @else {
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full overflow-hidden border border-slate-300 bg-white shadow-sm flex items-center justify-center">
                        <img [src]="obterImagemUrl(formProfissional.get('fotoUrl')?.value)" alt="Perfil" class="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span class="text-xs font-semibold text-slate-800 block">Foto de perfil definida</span>
                        <span class="text-[10px] text-emerald-600 font-medium">✓ Exibida aos clientes no catálogo</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="fileInputProfissional.click()"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-100">
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
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  {{ profissionalEmEdicao() ? 'Alterar Senha de Acesso (opcional)' : 'Senha de Acesso (padrão 123456)' }}
                </label>
                <input type="password" formControlName="senha" placeholder="Mínimo 6 caracteres" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Procedimentos Habilitados:</label>
                <div class="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  @for (proc of procedimentos(); track proc.id) {
                    <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        [checked]="isProcedimentoSelecionado(proc.id)"
                        (change)="toggleProcedimentoProfissional(proc.id)"
                        class="rounded text-slate-900 focus:ring-slate-900" />
                      <span>{{ proc.titulo }} ({{ proc.categoriaNome }})</span>
                    </label>
                  }
                </div>
              </div>
            </div>

            <!-- Rodapé Fixo / Sticky Footer -->
            <div class="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button 
                type="button" 
                (click)="fecharModalProfissional()" 
                class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="formProfissional.invalid || salvando()" 
                class="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow">
                {{ salvando() ? 'Salvando...' : 'Salvar Especialista' }}
              </button>
            </div>

          </form>
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- MODAL: CADASTRAR / EDITAR CLIENTE -->
      <!-- ========================================================================================= -->
      @if (modalClienteAberto()) {
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start sm:items-center">
          <form [formGroup]="formCliente" (ngSubmit)="salvarCliente()" class="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden font-sans">
            
            <!-- Cabeçalho Fixo / Sticky Header -->
            <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-500">Base de Pacientes</span>
                <h3 class="font-extrabold text-lg sm:text-xl text-slate-900">
                  {{ clienteEmEdicao() ? 'Editar Paciente' : 'Novo Paciente' }}
                </h3>
              </div>
              <button 
                type="button"
                (click)="fecharModalCliente()" 
                class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-base font-bold transition-colors">
                ✕
              </button>
            </div>

            <!-- Corpo com rolagem interna -->
            <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              @if (mensagemErro()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{{ mensagemErro() }}</span>
                  <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
                </div>
              }

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nome Completo do Paciente *</label>
                <input type="text" formControlName="nome" placeholder="Ex: Fernanda Alencar" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">WhatsApp com DDD (Login de Acesso) *</label>
                <input type="text" appPhoneMask formControlName="telefoneWhatsApp" placeholder="(11) 98765-4321" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                <span class="text-[10px] text-slate-400 mt-0.5 block">Usado para o cliente entrar na plataforma</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">E-mail (opcional)</label>
                <input type="email" formControlName="email" placeholder="fernanda@exemplo.com" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  {{ clienteEmEdicao() ? 'Alterar Senha (opcional)' : 'Senha de Acesso (opcional - cliente cadastrará no primeiro acesso)' }}
                </label>
                <input type="password" formControlName="senha" placeholder="Mínimo 6 caracteres" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>
            </div>

            <!-- Rodapé Fixo / Sticky Footer -->
            <div class="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button 
                type="button" 
                (click)="fecharModalCliente()" 
                class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="formCliente.invalid || salvando()" 
                class="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow">
                {{ salvando() ? 'Salvando...' : 'Salvar Paciente' }}
              </button>
            </div>

          </form>
        </div>
      }

      <!-- Modal Travar Agenda / Horários -->
      <app-modal-trava-agenda
        [aberto]="modalAgendaAberto()"
        [profissionalIdInicial]="profissionalParaAgenda()"
        (fechar)="modalAgendaAberto.set(false)"
        (atualizado)="carregarDados()">
      </app-modal-trava-agenda>

      <!-- Modal Crítico de Confirmação de Mudança de Setor / Nicho -->
      @if (modalConfirmarMudancaSetor()) {
        <div class="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-rose-500 shadow-2xl animate-scale-up space-y-4">
            
            <div class="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
              ⚠️
            </div>

            <div class="text-center space-y-2.5">
              <span class="text-[10px] uppercase font-bold tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Ação Destrutiva & Irreversível
              </span>
              <h3 class="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
                Mudar Nicho de Atuação?
              </h3>
              
              <div class="bg-rose-50/90 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-900 text-left space-y-2">
                <p class="font-semibold text-xs">
                  Você está alterando o setor de <strong>{{ obterLabelSetor(tenantService.tenant()?.setor) }}</strong> para <strong>{{ obterLabelSetor(setorPendenteMudanca) }}</strong>.
                </p>
                <p class="text-[11px] text-rose-800 leading-relaxed">
                  Ao trocar de nicho, <strong>TODAS AS SUAS INFORMAÇÕES ANTERIORES SERÃO APAGADAS</strong> para reconfigurar seu sistema:
                </p>
                <ul class="list-disc list-inside text-[11px] text-rose-800 space-y-0.5">
                  <li>Todos os procedimentos e serviços cadastrados;</li>
                  <li>Todos os agendamentos e horários marcados;</li>
                  <li>Todas as fichas clínicas, anamneses e prontuários;</li>
                  <li>Bloqueios de horários na agenda.</li>
                </ul>
              </div>

              <p class="text-xs font-bold text-stone-900 leading-relaxed bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                🚨 Esta ação não pode ser desfeita e NÃO HAVERÁ COMO RECUPERAR OS DADOS DE VOLTA!
              </p>
            </div>

            <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                (click)="cancelarMudancaSetor()"
                class="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-all">
                Cancelar (Manter Dados)
              </button>
              <button
                type="button"
                (click)="confirmarMudancaSetorEEnviar()"
                class="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all">
                Sim, Mudar e Apagar Tudo
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ========================================================================================= -->
      <!-- MODAL: CADASTRAR / EDITAR TIPO OU CATEGORIA -->
      <!-- ========================================================================================= -->
      @if (modalCategoriaAberto()) {
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start sm:items-center">
          <form [formGroup]="formCategoria" (ngSubmit)="salvarCategoria()" class="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden font-sans">
            
            <!-- Cabeçalho Fixo / Sticky Header -->
            <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-slate-500">Catálogo do Estabelecimento</span>
                <h3 class="font-extrabold text-lg sm:text-xl text-slate-900">
                  {{ categoriaEmEdicao() ? 'Editar Tipo / Categoria' : 'Novo Tipo / Categoria' }}
                </h3>
              </div>
              <button 
                type="button"
                (click)="fecharModalCategoria()" 
                class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-base font-bold transition-colors">
                ✕
              </button>
            </div>

            <!-- Corpo com rolagem interna -->
            <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              @if (mensagemErro()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{{ mensagemErro() }}</span>
                  <button type="button" (click)="mensagemErro.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
                </div>
              }

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nome do Tipo / Categoria *</label>
                <input
                  type="text"
                  formControlName="nome"
                  placeholder="Ex: Corte & Barba, Lavagem Detalhada, Facial..."
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Foto / Imagem de Capa do Tipo / Categoria</label>
                @if (!formCategoria.get('imagemUrl')?.value) {
                  <div
                    (click)="fileInputFotoCategoria.click()"
                    class="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50 hover:bg-slate-100/70 flex flex-col items-center justify-center gap-2 group">
                    <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                      📷
                    </div>
                    <div>
                      <span class="text-xs font-semibold text-slate-800 block">Clique para fazer upload da foto de capa</span>
                      <span class="text-[10px] text-slate-400">PNG, JPG, WEBP ou SVG (até 15MB)</span>
                    </div>
                    @if (fazendoUploadCategoria()) {
                      <span class="text-xs font-bold text-slate-700 animate-pulse">Enviando imagem...</span>
                    }
                  </div>
                } @else {
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-16 h-12 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-sm flex items-center justify-center">
                        <img [src]="obterImagemUrl(formCategoria.get('imagemUrl')?.value)" alt="Capa" class="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span class="text-xs font-semibold text-slate-800 block">Foto selecionada</span>
                        <span class="text-[10px] text-emerald-600 font-medium">✓ Imagem anexada com sucesso</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="fileInputFotoCategoria.click()"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-100">
                        Trocar Foto
                      </button>
                      <button
                        type="button"
                        (click)="removerFotoCategoria()"
                        class="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold">
                        Remover
                      </button>
                    </div>
                  </div>
                }

                <input #fileInputFotoCategoria type="file" accept="image/*" (change)="aoSelecionarFotoCategoria($event)" class="hidden" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Descrição Comercial</label>
                <textarea
                  formControlName="descricao"
                  rows="2"
                  placeholder="Breve descrição dos serviços agrupados nesta categoria..."
                  class="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Duração Padrão (Minutos) *</label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    formControlName="duracaoMinutosPadrao"
                    placeholder="Ex: 45"
                    class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50 font-semibold" />
                  <span class="text-[10px] text-slate-400 mt-0.5 block">Tempo sugerido</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Preço / Valor Médio (R$) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    formControlName="precoPadrao"
                    placeholder="Ex: 50.00"
                    class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50 font-semibold" />
                  <span class="text-[10px] text-slate-400 mt-0.5 block">Preço base</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Ordem de Exibição *</label>
                  <input
                    type="number"
                    min="1"
                    formControlName="ordemExibicao"
                    class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50" />
                  <span class="text-[10px] text-slate-400 mt-0.5 block">1 aparece primeiro</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Disponível / Ativo</label>
                  <div class="h-10 flex items-center">
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" formControlName="ativo" class="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                      <span class="text-xs text-slate-700 font-semibold">Exibir no catálogo</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rodapé Fixo / Sticky Footer -->
            <div class="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                (click)="fecharModalCategoria()"
                class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="formCategoria.invalid || salvandoCategoria()"
                class="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow">
                {{ salvandoCategoria() ? 'Salvando...' : 'Salvar Categoria' }}
              </button>
            </div>

          </form>
        </div>
      }

    </div>
  `
})
export class AdminGestaoComponent implements OnInit {
  private api = inject(ApiService);
  public tenantService = inject(TenantService);
  setorService = inject(SetorService);
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
  buscaCategoria = signal<string>('');
  buscaProfissional = signal<string>('');
  buscaCliente = signal<string>('');

  // Modais e Estados de Edição
  modalCategoriaAberto = signal<boolean>(false);
  categoriaEmEdicao = signal<Categoria | null>(null);
  salvandoCategoria = signal<boolean>(false);

  modalProcedimentoAberto = signal<boolean>(false);
  procedimentoEmEdicao = signal<Procedimento | null>(null);

  modalProfissionalAberto = signal<boolean>(false);
  profissionalEmEdicao = signal<Profissional | null>(null);
  procedimentosSelecionadosIds = signal<number[]>([]);

  modalClienteAberto = signal<boolean>(false);
  clienteEmEdicao = signal<Usuario | null>(null);

  fazendoUploadCategoria = signal<boolean>(false);
  fazendoUploadProcedimento = signal<boolean>(false);
  fazendoUploadProfissional = signal<boolean>(false);

  // Formulários
  formCategoria!: FormGroup;
  formProcedimento!: FormGroup;
  formProfissional!: FormGroup;
  formCliente!: FormGroup;
  formIdentidade!: FormGroup;
  fazendoUploadLogo = signal<boolean>(false);
  salvandoIdentidade = signal<boolean>(false);
  erroUploadLogo = signal<string | null>(null);

  modalConfirmarMudancaSetor = signal<boolean>(false);
  setorPendenteMudanca: string | null = null;

  obterLabelSetor(setorId?: string | null): string {
    if (!setorId) return 'Clínica de Estética';
    const cfg = this.setorService.obterConfig(setorId);
    return cfg ? `${cfg.icone} ${cfg.label}` : setorId;
  }

  // Filtros calculados
  procedimentosFiltrados = computed(() => {
    const termo = this.buscaProcedimento().toLowerCase().trim();
    if (!termo) return this.procedimentos();
    return this.procedimentos().filter(p =>
      p.titulo.toLowerCase().includes(termo) ||
      (p.categoriaNome && p.categoriaNome.toLowerCase().includes(termo))
    );
  });

  categoriasFiltradas = computed(() => {
    const termo = this.buscaCategoria().toLowerCase().trim();
    if (!termo) return this.categorias();
    return this.categorias().filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      (c.descricao && c.descricao.toLowerCase().includes(termo))
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

    // Permite abrir em uma aba específica via queryParam: /admin/gestao?tab=categorias
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['procedimentos', 'categorias', 'profissionais', 'clientes', 'identidade'].includes(params['tab'])) {
        this.abaAtiva.set(params['tab'] as TabTipo);
      }
    });
  }

  private iniciarFormularios(): void {
    this.formCategoria = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      descricao: [''],
      icone: ['🏷️'],
      imagemUrl: [''],
      ordemExibicao: [1, [Validators.required, Validators.min(1)]],
      duracaoMinutosPadrao: [45, [Validators.required, Validators.min(5)]],
      precoPadrao: [50, [Validators.required, Validators.min(0)]],
      ativo: [true]
    });

    this.formProcedimento = this.fb.group({
      categoriaId: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descricao: [''],
      duracaoMinutos: [60, [Validators.required, Validators.min(10)]],
      preco: [150, [Validators.required, Validators.min(0)]],
      imagemUrl: ['']
    });

    this.formProcedimento.get('categoriaId')?.valueChanges.subscribe(catId => {
      if (catId) {
        const selCat = this.categorias().find(c => c.id == catId);
        if (selCat) {
          if (selCat.duracaoMinutosPadrao) {
            this.formProcedimento.patchValue({ duracaoMinutos: selCat.duracaoMinutosPadrao });
          }
          if (selCat.precoPadrao !== undefined && selCat.precoPadrao !== null) {
            this.formProcedimento.patchValue({ preco: selCat.precoPadrao });
          }
        }
      }
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
      setor: ['CLINICA_ESTETICA', Validators.required],
      logoUrl: [''],
      corPrimaria: ['#e11d48', Validators.required],
      corSecundaria: ['#f43f5e', Validators.required],
      telefoneWhatsApp: ['']
    });

    this.formIdentidade.get('setor')?.valueChanges.subscribe((novoS: string) => {
      if (novoS) {
        this.carregarCategorias(novoS);
      }
    });
  }

  carregarDados(): void {
    this.carregando.set(true);

    this.api.getMeuTenant().subscribe({
      next: (t) => {
        if (t) {
          this.formIdentidade.patchValue({
            nomeEmpresa: t.nomeEmpresa || '',
            setor: t.setor || 'CLINICA_ESTETICA',
            logoUrl: t.logoUrl || '',
            corPrimaria: t.corPrimaria || '#e11d48',
            corSecundaria: t.corSecundaria || '#f43f5e',
            telefoneWhatsApp: t.telefoneWhatsApp || ''
          }, { emitEvent: false });
          this.carregarCategorias(t.setor);
        } else {
          this.carregarCategorias();
        }
      },
      error: () => this.carregarCategorias()
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

    this.api.getClientes().subscribe({
      next: (clis) => {
        this.clientes.set(clis);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });
  }

  carregarCategorias(setor?: string): void {
    const s = setor || this.formIdentidade?.get('setor')?.value || this.setorService.setorAtual();
    const deduplicar = (cats: Categoria[]) => {
      const vistas = new Set<string>();
      const unicas: Categoria[] = [];
      for (const c of (cats || [])) {
        const chave = (c.nome || '').trim().toLowerCase();
        if (chave && !vistas.has(chave)) {
          vistas.add(chave);
          unicas.push(c);
        }
      }
      return unicas;
    };

    this.api.getCategoriasAdmin().subscribe({
      next: (cats) => {
        const lista = deduplicar(cats);
        this.categorias.set(lista);
        if (!this.formProcedimento?.get('categoriaId')?.value && lista.length > 0) {
          const ativa = lista.find(c => c.ativo) || lista[0];
          this.formProcedimento.patchValue({ categoriaId: ativa.id });
        }
      },
      error: () => {
        this.api.getCategorias(s).subscribe({
          next: (cats) => {
            const lista = deduplicar(cats);
            this.categorias.set(lista);
            if (!this.formProcedimento?.get('categoriaId')?.value && lista.length > 0) {
              this.formProcedimento.patchValue({ categoriaId: lista[0].id });
            }
          }
        });
      }
    });
  }

  // ===================== CATEGORIAS / TIPOS DE SERVIÇOS =====================
  abrirModalCategoria(cat?: Categoria): void {
    if (cat) {
      this.categoriaEmEdicao.set(cat);
      this.formCategoria.patchValue({
        nome: cat.nome,
        descricao: cat.descricao || '',
        icone: cat.icone || '🏷️',
        imagemUrl: cat.imagemUrl || '',
        ordemExibicao: cat.ordemExibicao ?? 1,
        duracaoMinutosPadrao: cat.duracaoMinutosPadrao ?? 45,
        precoPadrao: cat.precoPadrao ?? 50,
        ativo: cat.ativo !== false
      });
    } else {
      this.categoriaEmEdicao.set(null);
      this.formCategoria.reset({
        nome: '',
        descricao: '',
        icone: '🏷️',
        imagemUrl: '',
        ordemExibicao: (this.categorias().length + 1),
        duracaoMinutosPadrao: 45,
        precoPadrao: 50,
        ativo: true
      });
    }
    this.modalCategoriaAberto.set(true);
  }

  fecharModalCategoria(): void {
    this.modalCategoriaAberto.set(false);
    this.categoriaEmEdicao.set(null);
  }

  irParaGerenciarCategorias(): void {
    this.modalProcedimentoAberto.set(false);
    this.abaAtiva.set('categorias');
  }

  salvarCategoria(): void {
    if (this.formCategoria.invalid) return;
    this.salvandoCategoria.set(true);
    const val = this.formCategoria.value;
    const payload = {
      nome: val.nome,
      descricao: val.descricao,
      icone: val.icone,
      imagemUrl: val.imagemUrl,
      ordemExibicao: val.ordemExibicao,
      duracaoMinutosPadrao: val.duracaoMinutosPadrao,
      precoPadrao: val.precoPadrao,
      ativo: val.ativo !== false
    };

    const edicao = this.categoriaEmEdicao();
    const obs$ = edicao
      ? this.api.atualizarCategoria(edicao.id, payload)
      : this.api.criarCategoria(payload);

    obs$.subscribe({
      next: (salva) => {
        this.salvandoCategoria.set(false);
        this.mensagemSucesso.set(`Tipo / Categoria "${salva.nome}" salva com sucesso!`);
        this.fecharModalCategoria();
        this.carregarCategorias();
      },
      error: (err) => {
        this.salvandoCategoria.set(false);
        this.mensagemErro.set(err.error?.message || 'Erro ao salvar categoria.');
      }
    });
  }

  excluirCategoria(cat: Categoria): void {
    if (!confirm(`Tem certeza que deseja excluir ou inativar o tipo/categoria "${cat.nome}"?`)) {
      return;
    }
    this.api.excluirCategoria(cat.id).subscribe({
      next: () => {
        this.mensagemSucesso.set(`Tipo/Categoria "${cat.nome}" removida ou inativada com sucesso!`);
        this.carregarCategorias();
      },
      error: (err) => {
        this.mensagemErro.set(err.error?.message || 'Erro ao excluir tipo/categoria.');
      }
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
  aoSelecionarFotoCategoria(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fazendoUploadCategoria.set(true);

    // Prévia instantânea
    const reader = new FileReader();
    reader.onload = (e) => {
      this.formCategoria.patchValue({ imagemUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);

    this.api.uploadImagem(file).subscribe({
      next: (res) => {
        if (res && res.url) {
          this.formCategoria.patchValue({ imagemUrl: res.url });
        }
        this.fazendoUploadCategoria.set(false);
      },
      error: () => {
        this.fazendoUploadCategoria.set(false);
      }
    });
  }

  removerFotoCategoria(): void {
    this.formCategoria.patchValue({ imagemUrl: '' });
  }

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
      this.mensagemErro.set('Preencha os campos obrigatórios.');
      return;
    }

    const setorAtual = this.tenantService.tenant()?.setor;
    const novoSetor = this.formIdentidade.get('setor')?.value;

    if (setorAtual && novoSetor && setorAtual !== novoSetor) {
      this.setorPendenteMudanca = novoSetor;
      this.modalConfirmarMudancaSetor.set(true);
      return;
    }

    this.executarSalvamentoIdentidadeVisual();
  }

  cancelarMudancaSetor(): void {
    const setorAtual = this.tenantService.tenant()?.setor || 'CLINICA_ESTETICA';
    this.formIdentidade.patchValue({ setor: setorAtual }, { emitEvent: false });
    this.carregarCategorias(setorAtual);
    this.modalConfirmarMudancaSetor.set(false);
    this.setorPendenteMudanca = null;
  }

  confirmarMudancaSetorEEnviar(): void {
    this.modalConfirmarMudancaSetor.set(false);
    this.executarSalvamentoIdentidadeVisual();
  }

  private executarSalvamentoIdentidadeVisual(): void {
    this.salvandoIdentidade.set(true);
    this.mensagemErro.set(null);
    this.mensagemSucesso.set(null);

    const dados = this.formIdentidade.value;

    this.api.atualizarIdentidadeVisual(dados).subscribe({
      next: (res) => {
        this.salvandoIdentidade.set(false);
        this.tenantService.setTenantManual(res);
        this.mensagemSucesso.set('✓ Configurações e nicho de atuação atualizados com sucesso!');
        this.carregarCategorias(res.setor);
        this.carregarDados();
      },
      error: (err) => {
        this.salvandoIdentidade.set(false);
        this.mensagemErro.set(err.error?.detail || err.error?.message || 'Erro ao salvar identidade visual.');
      }
    });
  }
}