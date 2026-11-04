import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { SetorService } from '../../core/services/setor.service';
import { Agendamento, Procedimento, Profissional, SlotDisponivel, Usuario } from '../../core/models';
import { formatarTelefoneBR } from '../../shared/pipes/telefone.pipe';

@Component({
  selector: 'app-agendamento-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 font-sans">
      
      <!-- Cabeçalho do Wizard -->
      <div class="text-center mb-8">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
          {{ tenantService.nomeEmpresa() }} • {{ setorService.icone() }} {{ setorService.config().label }}
        </span>
        <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {{ setorService.termoAgendar() }}
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1.5">
          Conclua em poucos passos o agendamento no seu estabelecimento de preferência.
        </p>

        <!-- Banner de Perfil Administrativo / Especialista -->
        @if (authService.isAdminOrProfissional()) {
          <div class="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm">
            <span>🛡️ Modo Recepção / Atendimento</span>
            <span class="opacity-50">•</span>
            <span>Agendando em nome do {{ setorService.termoCliente() }}</span>
          </div>
        }
      </div>

      @if (!agendamentoConcluido()) {
      <!-- Barra de Progresso em Passos (Responsiva) -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 mb-8 shadow-sm">
        <div class="flex items-center justify-between relative">
          
          <!-- Linha de fundo -->
          <div class="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>
          <div 
            class="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-900 z-0 transition-all duration-300"
            [style.width]="(passoAtual() - 1) * 33.33 + '%'">
          </div>

          <!-- Passo 1 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              type="button"
              (click)="irParaPasso(1)"
              [class.bg-slate-900]="passoAtual() === 1"
              [class.bg-emerald-600]="passoAtual() > 1"
              [class.text-white]="passoAtual() >= 1"
              [class.bg-white]="passoAtual() < 1"
              [class.border-slate-900]="passoAtual() === 1"
              [class.border-emerald-600]="passoAtual() > 1"
              [class.border-slate-300]="passoAtual() < 1"
              [class.text-slate-400]="passoAtual() < 1"
              class="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all">
              @if (passoAtual() > 1) { ✓ } @else { 1 }
            </button>
            <span class="text-[11px] font-semibold mt-1.5 text-slate-700 hidden sm:block truncate max-w-[90px] text-center">
              {{ setorService.termoServico() }}
            </span>
          </div>

          <!-- Passo 2 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              type="button"
              (click)="irParaPasso(2)"
              [disabled]="!procedimentoSelecionado()"
              [class.bg-slate-900]="passoAtual() === 2"
              [class.bg-emerald-600]="passoAtual() > 2"
              [class.text-white]="passoAtual() >= 2"
              [class.bg-white]="passoAtual() < 2"
              [class.border-slate-900]="passoAtual() === 2"
              [class.border-emerald-600]="passoAtual() > 2"
              [class.border-slate-300]="passoAtual() < 2"
              [class.text-slate-400]="passoAtual() < 2"
              class="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all disabled:opacity-40">
              @if (passoAtual() > 2) { ✓ } @else { 2 }
            </button>
            <span class="text-[11px] font-semibold mt-1.5 text-slate-700 hidden sm:block truncate max-w-[90px] text-center">
              {{ setorService.termoProfissional() }}
            </span>
          </div>

          <!-- Passo 3 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              type="button"
              (click)="irParaPasso(3)"
              [disabled]="!procedimentoSelecionado()"
              [class.bg-slate-900]="passoAtual() === 3"
              [class.bg-emerald-600]="passoAtual() > 3"
              [class.text-white]="passoAtual() >= 3"
              [class.bg-white]="passoAtual() < 3"
              [class.border-slate-900]="passoAtual() === 3"
              [class.border-emerald-600]="passoAtual() > 3"
              [class.border-slate-300]="passoAtual() < 3"
              [class.text-slate-400]="passoAtual() < 3"
              class="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all disabled:opacity-40">
              @if (passoAtual() > 3) { ✓ } @else { 3 }
            </button>
            <span class="text-[11px] font-semibold mt-1.5 text-slate-700 hidden sm:block">Horário</span>
          </div>

          <!-- Passo 4 -->
          <div class="flex flex-col items-center relative z-10">
            <button 
              type="button"
              (click)="irParaPasso(4)"
              [disabled]="!slotSelecionado()"
              [class.bg-slate-900]="passoAtual() === 4"
              [class.text-white]="passoAtual() >= 4"
              [class.bg-white]="passoAtual() < 4"
              [class.border-slate-900]="passoAtual() === 4"
              [class.border-slate-300]="passoAtual() < 4"
              [class.text-slate-400]="passoAtual() < 4"
              class="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all disabled:opacity-40">
              4
            </button>
            <span class="text-[11px] font-semibold mt-1.5 text-slate-700 hidden sm:block">Confirmar</span>
          </div>

        </div>
      </div>

      <!-- CONTEÚDO DO WIZARD -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm transition-all">
        
        <!-- ========================================== -->
        <!-- PASSO 1: SELEÇÃO DE PROCEDIMENTO / SERVIÇO -->
        <!-- ========================================== -->
        @if (passoAtual() === 1) {
          <div>
            <div class="mb-6">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Etapa 1 de 4</span>
              <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">Escolha o {{ setorService.termoServico() }}</h2>
              <p class="text-xs text-slate-500 mt-1">Selecione o serviço desejado para o atendimento.</p>
            </div>

            <div class="space-y-3">
              @for (proc of procedimentos(); track proc.id) {
                <div 
                  (click)="selecionarProcedimento(proc)"
                  [class.border-slate-900]="procedimentoSelecionado()?.id === proc.id"
                  [class.ring-2]="procedimentoSelecionado()?.id === proc.id"
                  [class.ring-slate-900]="procedimentoSelecionado()?.id === proc.id"
                  [class.bg-slate-50]="procedimentoSelecionado()?.id === proc.id"
                  class="p-4 rounded-2xl border border-slate-200 hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between gap-4 group">
                  <div class="flex items-center gap-3.5 min-w-0">
                    <img 
                      [src]="proc.imagemUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=200'" 
                      class="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0" />
                    <div class="min-w-0">
                      <h4 class="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {{ proc.titulo }}
                      </h4>
                      <span class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>⏱️ {{ proc.duracaoMinutos }} min</span>
                        <span>•</span>
                        <span class="truncate">{{ proc.categoriaNome }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="font-bold text-slate-900 block text-sm sm:text-base">
                      {{ proc.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </span>
                    <span 
                      class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      [class.bg-slate-900]="procedimentoSelecionado()?.id === proc.id"
                      [class.text-white]="procedimentoSelecionado()?.id === proc.id"
                      [class.text-slate-500]="procedimentoSelecionado()?.id !== proc.id">
                      {{ procedimentoSelecionado()?.id === proc.id ? 'Selecionado ✓' : 'Escolher' }}
                    </span>
                  </div>
                </div>
              }
            </div>

            <div class="mt-8 flex justify-end">
              <button 
                type="button"
                [disabled]="!procedimentoSelecionado()"
                (click)="avancarParaPasso2()"
                class="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 disabled:opacity-40 transition-all shadow">
                Próximo: Escolher {{ setorService.termoProfissional() }} →
              </button>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PASSO 2: SELEÇÃO DE PROFISSIONAL -->
        <!-- ========================================== -->
        @if (passoAtual() === 2) {
          <div>
            <div class="mb-6">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Etapa 2 de 4</span>
              <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">Escolha o {{ setorService.termoProfissional() }}</h2>
              <p class="text-xs text-slate-500 mt-1">Prefere atendimento com alguém específico ou o primeiro horário disponível?</p>
            </div>

            <div class="space-y-3">
              <!-- Opção "Primeiro Horário Disponível" -->
              <div 
                (click)="selecionarProfissional(null)"
                [class.border-slate-900]="profissionalSelecionado() === null"
                [class.ring-2]="profissionalSelecionado() === null"
                [class.ring-slate-900]="profissionalSelecionado() === null"
                [class.bg-slate-50]="profissionalSelecionado() === null"
                class="p-4 rounded-2xl border border-slate-200 hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between">
                <div class="flex items-center gap-3.5">
                  <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
                    ⚡
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-sm sm:text-base">Primeiro Horário Disponível</h4>
                    <p class="text-[11px] text-slate-500">Agiliza buscando qualquer especialista disponível.</p>
                  </div>
                </div>
                <span 
                  class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  [class.bg-slate-900]="profissionalSelecionado() === null"
                  [class.text-white]="profissionalSelecionado() === null"
                  [class.text-slate-500]="profissionalSelecionado() !== null">
                  {{ profissionalSelecionado() === null ? 'Selecionado ✓' : 'Escolher' }}
                </span>
              </div>

              <!-- Lista de Profissionais Habilitados -->
              @for (prof of profissionais(); track prof.id) {
                <div 
                  (click)="selecionarProfissional(prof)"
                  [class.border-slate-900]="profissionalSelecionado()?.id === prof.id"
                  [class.ring-2]="profissionalSelecionado()?.id === prof.id"
                  [class.ring-slate-900]="profissionalSelecionado()?.id === prof.id"
                  [class.bg-slate-50]="profissionalSelecionado()?.id === prof.id"
                  class="p-4 rounded-2xl border border-slate-200 hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between">
                  <div class="flex items-center gap-3.5">
                    <img 
                      [src]="prof.fotoUrl || 'https://images.unsplash.com/photo-1594824813626-d62f6b865664?auto=format&fit=crop&q=80&w=200'" 
                      class="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    <div>
                      <h4 class="font-bold text-slate-900 text-sm sm:text-base">{{ prof.nome }}</h4>
                      <p class="text-[11px] text-slate-500">{{ prof.especialidade }}</p>
                    </div>
                  </div>
                  <span 
                    class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    [class.bg-slate-900]="profissionalSelecionado()?.id === prof.id"
                    [class.text-white]="profissionalSelecionado()?.id === prof.id"
                    [class.text-slate-500]="profissionalSelecionado()?.id !== prof.id">
                    {{ profissionalSelecionado()?.id === prof.id ? 'Selecionado ✓' : 'Escolher' }}
                  </span>
                </div>
              }
            </div>

            <div class="mt-8 flex justify-between">
              <button 
                type="button"
                (click)="irParaPasso(1)" 
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50">
                ← Voltar
              </button>
              <button 
                type="button"
                (click)="avancarParaPasso3()" 
                class="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition-all shadow">
                Próximo: Escolher Data e Hora →
              </button>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PASSO 3: CALENDÁRIO E GRADE DE HORÁRIOS LIVRES -->
        <!-- ========================================== -->
        @if (passoAtual() === 3) {
          <div>
            <div class="mb-6">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Etapa 3 de 4</span>
              <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">Data & Grade de Horários</h2>
              <p class="text-xs text-slate-500 mt-1">
                Vagas calculadas dinamicamente sem conflito para {{ procedimentoSelecionado()?.titulo }}.
              </p>
            </div>

            <!-- Seletor de Data -->
            <div class="mb-6">
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Selecione o Dia do Atendimento:
              </label>
              <input 
                type="date" 
                [min]="dataMinima"
                [ngModel]="dataSelecionada()"
                (ngModelChange)="onDataChange($event)"
                class="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white shadow-sm" />
            </div>

            <!-- Grade de Horários Livres (Slots) -->
            <div class="mt-4">
              <h4 class="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Horários Livres Disponíveis (Duração: {{ procedimentoSelecionado()?.duracaoMinutos }} min):
              </h4>

              @if (carregandoSlots()) {
                <div class="py-12 text-center text-slate-400 text-xs animate-pulse">
                  Consultando grade de horários em tempo real...
                </div>
              } @else if (slots().length === 0) {
                <div class="p-6 rounded-2xl bg-slate-50 text-center border border-slate-200">
                  <p class="text-xs text-slate-600 font-medium">Nenhum horário livre encontrado nesta data.</p>
                  <p class="text-[11px] text-slate-400 mt-1">Por favor, selecione outro dia ou profissional.</p>
                </div>
              } @else {
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  @for (slot of slots(); track slot.horarioInicio) {
                    <button 
                      type="button"
                      (click)="selecionarSlot(slot)"
                      [class.bg-slate-900]="slotSelecionado()?.horarioInicio === slot.horarioInicio && slotSelecionado()?.profissionalId === slot.profissionalId"
                      [class.text-white]="slotSelecionado()?.horarioInicio === slot.horarioInicio && slotSelecionado()?.profissionalId === slot.profissionalId"
                      [class.border-slate-900]="slotSelecionado()?.horarioInicio === slot.horarioInicio && slotSelecionado()?.profissionalId === slot.profissionalId"
                      [class.bg-white]="slotSelecionado()?.horarioInicio !== slot.horarioInicio || slotSelecionado()?.profissionalId !== slot.profissionalId"
                      [class.text-slate-800]="slotSelecionado()?.horarioInicio !== slot.horarioInicio || slotSelecionado()?.profissionalId !== slot.profissionalId"
                      class="p-3 rounded-xl border border-slate-200 hover:border-slate-900 text-center transition-all shadow-sm">
                      <span class="block text-sm font-bold">{{ formatarHora(slot.horarioInicio) }}</span>
                      <span class="block text-[10px] opacity-75 mt-0.5 truncate">{{ slot.profissionalNome.split(' ')[0] }}</span>
                    </button>
                  }
                </div>
              }
            </div>

            <div class="mt-8 flex justify-between">
              <button 
                type="button"
                (click)="irParaPasso(2)" 
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50">
                ← Voltar
              </button>
              <button 
                type="button"
                [disabled]="!slotSelecionado()"
                (click)="avancarParaPasso4()" 
                class="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 disabled:opacity-40 transition-all shadow">
                Próximo: Resumo & Confirmação →
              </button>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PASSO 4: CONFIRMAÇÃO & RESUMO DO AGENDAMENTO -->
        <!-- ========================================== -->
        @if (passoAtual() === 4) {
          <div>
            <div class="mb-6">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Etapa 4 de 4</span>
              <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">Resumo e Confirmação</h2>
              <p class="text-xs text-slate-500 mt-1">Confira os detalhes da sessão antes de confirmar o agendamento.</p>
            </div>

            <!-- Seletor de Paciente para Administrador ou Especialista -->
            @if (authService.isAdminOrProfissional()) {
              <div class="mb-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Selecione o {{ setorService.termoCliente() }} para quem está agendando: *
                  </label>
                  <button 
                    type="button" 
                    (click)="mostrarCadastroRapido.set(!mostrarCadastroRapido())"
                    class="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                    {{ mostrarCadastroRapido() ? '✕ Fechar Cadastro' : '+ Cadastrar Novo ' + setorService.termoCliente() }}
                  </button>
                </div>

                @if (!mostrarCadastroRapido()) {
                  <select 
                    [ngModel]="clienteIdSelecionado"
                    (ngModelChange)="onClienteSelecionadoChange($event)"
                    class="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
                    <option [ngValue]="null">-- Selecione o {{ setorService.termoCliente() }} Cadastrado --</option>
                    @for (cli of clientes(); track cli.id) {
                      <option [ngValue]="cli.id">
                        {{ cli.nome }} • WhatsApp: {{ formatarTelefone(cli.telefoneWhatsApp) }}
                      </option>
                    }
                  </select>

                  @if (clienteIdSelecionado && pacienteSelecionado()) {
                    <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
                      <span>✓ {{ setorService.termoCliente() }} Selecionado:</span>
                      <strong>{{ pacienteSelecionado()?.nome }}</strong>
                      <span class="text-emerald-700">({{ pacienteSelecionado()?.telefoneWhatsApp }})</span>
                    </div>
                  } @else {
                    <p class="text-xs text-rose-600 font-semibold">
                      * Obrigatório: Selecione o {{ setorService.termoCliente() }} acima para confirmar o agendamento.
                    </p>
                  }
                } @else {
                  <!-- Formulário Rápido de Novo Cliente Inline -->
                  <div class="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <h4 class="text-xs font-bold text-slate-800 uppercase">Cadastro Rápido de {{ setorService.termoCliente() }}</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-[11px] font-semibold text-slate-600 mb-1">Nome Completo *</label>
                        <input 
                          type="text" 
                          [(ngModel)]="novoClienteNome" 
                          placeholder="Ex: João da Silva" 
                          class="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-slate-600 mb-1">WhatsApp com DDD *</label>
                        <input 
                          type="text" 
                          [(ngModel)]="novoClienteWhatsApp" 
                          placeholder="(11) 99999-8888" 
                          class="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                      </div>
                    </div>
                    @if (erroNovoCliente()) {
                      <div class="text-xs text-rose-600 font-medium">{{ erroNovoCliente() }}</div>
                    }
                    <div class="flex justify-end gap-2 pt-1">
                      <button 
                        type="button" 
                        (click)="mostrarCadastroRapido.set(false)" 
                        class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                        Cancelar
                      </button>
                      <button 
                        type="button" 
                        [disabled]="salvandoNovoCliente() || !novoClienteNome || !novoClienteWhatsApp"
                        (click)="salvarNovoClienteRapido()" 
                        class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow disabled:opacity-50">
                        {{ salvandoNovoCliente() ? 'Cadastrando...' : 'Cadastrar e Selecionar' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Identificação do Cliente Online (Sem necessidade de login/senha) -->
            @if (!authService.isAdminOrProfissional()) {
              <div class="mb-6 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Seus Dados de Contato</span>
                  <h3 class="text-sm font-bold text-slate-900 mt-0.5">Informe seus dados para confirmar seu agendamento</h3>
                  <p class="text-[11px] text-slate-500">Sem burocracia: não é necessário criar senha ou fazer login.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Seu Nome Completo *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="nomeClienteOnline" 
                      placeholder="Ex: Maria Oliveira" 
                      class="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Seu WhatsApp com DDD *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="whatsappClienteOnline" 
                      placeholder="(61) 98226-1155" 
                      class="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">E-mail (opcional)</label>
                  <input 
                    type="email" 
                    [(ngModel)]="emailClienteOnline" 
                    placeholder="seuemail@exemplo.com" 
                    class="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
              </div>
            }

            <!-- Card de Resumo Elegante e Moderno -->
            <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6 space-y-4">
              
              @if (authService.isAdminOrProfissional() && pacienteSelecionado()) {
                <div class="border-b border-slate-200 pb-3">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">{{ setorService.termoCliente() }} / Beneficiário</span>
                  <h4 class="text-base font-bold text-slate-900">{{ pacienteSelecionado()?.nome }}</h4>
                  <span class="text-xs text-slate-500">WhatsApp: {{ pacienteSelecionado()?.telefoneWhatsApp }}</span>
                </div>
              }

              <div class="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">{{ setorService.termoServico() }}</span>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900">{{ procedimentoSelecionado()?.titulo }}</h3>
                  <span class="text-xs text-slate-500">Duração estimada: {{ procedimentoSelecionado()?.duracaoMinutos }} minutos</span>
                </div>
                <span class="text-lg font-extrabold text-slate-900">
                  {{ procedimentoSelecionado()?.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-4 text-xs">
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">{{ setorService.termoProfissional() }}</span>
                  <span class="font-bold text-slate-800 text-sm">{{ slotSelecionado()?.profissionalNome }}</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Data e Horário</span>
                  <span class="font-bold text-emerald-700 text-sm">
                    {{ dataSelecionada() }} às {{ formatarHora(slotSelecionado()?.horarioInicio || '') }}
                  </span>
                </div>
              </div>

              <!-- Funcionalidades Específicas por Setor -->
              @if (setorService.recursos().temVeiculoPlaca) {
                <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <label class="block text-xs font-semibold text-slate-800">
                    🚗 Modelo e Placa do Veículo (Obrigatório):
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="veiculoPlaca"
                    placeholder="Ex: Honda Civic Preto - Placa ABC-1234"
                    class="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
              }

              @if (setorService.recursos().temMesaReserva) {
                <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <label class="block text-xs font-semibold text-slate-800">
                    👥 Quantidade de Pessoas na Mesa:
                  </label>
                  <select
                    [(ngModel)]="pessoasMesa"
                    class="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium">
                    <option [value]="1">1 pessoa (Mesa Individual)</option>
                    <option [value]="2">2 pessoas (Casal / Par)</option>
                    <option [value]="3">3 pessoas</option>
                    <option [value]="4">4 pessoas (Família / Grupo)</option>
                    <option [value]="6">6 pessoas (Mesa Grande)</option>
                    <option [value]="8">8 pessoas</option>
                    <option [value]="10">10+ pessoas (Reserva Especial)</option>
                  </select>
                </div>
              }

              @if (setorService.recursos().temLocacaoEnsaio) {
                <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <label class="block text-xs font-semibold text-slate-800">
                    📸 Locação do Ensaio Fotográfico:
                  </label>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      (click)="locacaoEnsaio = 'Estúdio Interno'"
                      [class.bg-slate-900]="locacaoEnsaio === 'Estúdio Interno'"
                      [class.text-white]="locacaoEnsaio === 'Estúdio Interno'"
                      [class.bg-slate-100]="locacaoEnsaio !== 'Estúdio Interno'"
                      class="py-2 px-3 rounded-xl border border-slate-200 font-semibold transition-all">
                      🏢 Estúdio Interno
                    </button>
                    <button
                      type="button"
                      (click)="locacaoEnsaio = 'Locação Externa'"
                      [class.bg-slate-900]="locacaoEnsaio === 'Locação Externa'"
                      [class.text-white]="locacaoEnsaio === 'Locação Externa'"
                      [class.bg-slate-100]="locacaoEnsaio !== 'Locação Externa'"
                      class="py-2 px-3 rounded-xl border border-slate-200 font-semibold transition-all">
                      🌳 Locação Externa
                    </button>
                  </div>
                </div>
              }

              <!-- Observações -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Observações ou Recomendações Adicionais (opcional):
                </label>
                <textarea 
                  [(ngModel)]="observacoesCliente"
                  rows="2"
                  placeholder="Informações adicionais para a sessão..."
                  class="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"></textarea>
              </div>

            </div>

            @if (erroAgendamento()) {
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 mb-6 text-xs text-rose-800 flex items-center justify-between">
                <span>{{ erroAgendamento() }}</span>
                <button type="button" (click)="erroAgendamento.set(null)" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
              </div>
            }

            <div class="mt-8 flex justify-between items-center">
              <button 
                type="button"
                (click)="irParaPasso(3)" 
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50">
                ← Voltar
              </button>

              <button 
                type="button"
                [disabled]="salvando() || (authService.isAdminOrProfissional() && !clienteIdSelecionado)"
                (click)="confirmarAgendamento()" 
                class="px-8 py-3.5 rounded-xl bg-[#2d7a58] hover:bg-[#236347] text-white font-bold text-sm disabled:opacity-50 transition-all shadow-md flex items-center gap-2">
                @if (salvando()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Confirmando...</span>
                } @else {
                  <span>Confirmar Agendamento ✓</span>
                }
              </button>
            </div>
          </div>
        }

      </div>
      } @else {
        <!-- Tela de Sucesso do Agendamento (Sem Necessidade de Login) -->
        <div class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center max-w-xl mx-auto space-y-6 animate-scale-up">
          <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-emerald-100 shadow-sm">
            ✓
          </div>
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Reserva Concluída
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Agendamento Confirmado!
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 mt-2">
              Seu horário foi agendado com sucesso para <strong class="text-slate-800">{{ nomeClienteOnline }}</strong>.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div class="flex justify-between items-center border-b border-slate-200 pb-2">
              <span class="text-slate-500">{{ setorService.termoServico() }}:</span>
              <strong class="text-slate-900 font-semibold">{{ procedimentoSelecionado()?.titulo }}</strong>
            </div>
            <div class="flex justify-between items-center border-b border-slate-200 pb-2">
              <span class="text-slate-500">{{ setorService.termoProfissional() }}:</span>
              <strong class="text-slate-900 font-semibold">{{ slotSelecionado()?.profissionalNome }}</strong>
            </div>
            <div class="flex justify-between items-center border-b border-slate-200 pb-2">
              <span class="text-slate-500">Data e Horário:</span>
              <strong class="text-emerald-700 font-bold text-sm">{{ dataSelecionada() }} às {{ formatarHora(slotSelecionado()?.horarioInicio || '') }}</strong>
            </div>
            <div class="flex justify-between items-center pt-1">
              <span class="text-slate-500">Valor do Atendimento:</span>
              <strong class="text-slate-900 font-bold text-sm">{{ procedimentoSelecionado()?.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
          </div>

          <p class="text-[11px] text-slate-400">
            Enviamos os detalhes da reserva para seu WhatsApp <strong>{{ whatsappClienteOnline }}</strong>.
          </p>

          <div class="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a routerLink="/catalogo" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all">
              Voltar ao Início / Catálogo
            </a>
            <button (click)="reiniciarWizard()" class="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all">
              Fazer Outro Agendamento
            </button>
          </div>
        </div>
      }

    </div>
  `
})
export class AgendamentoWizardComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  tenantService = inject(TenantService);
  setorService = inject(SetorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  passoAtual = signal<number>(1);
  procedimentos = signal<Procedimento[]>([]);
  profissionais = signal<Profissional[]>([]);
  procedimentoSelecionado = signal<Procedimento | null>(null);
  profissionalSelecionado = signal<Profissional | null>(null);

  // Lista de pacientes para Admin/Profissional
  clientes = signal<Usuario[]>([]);
  clienteIdSelecionado: number | null = null;
  pacienteSelecionado = signal<Usuario | null>(null);

  // Cadastro rápido inline de cliente por Admin/Especialista
  mostrarCadastroRapido = signal<boolean>(false);
  novoClienteNome = '';
  novoClienteWhatsApp = '';
  salvandoNovoCliente = signal<boolean>(false);
  erroNovoCliente = signal<string | null>(null);

  // Campos de agendamento online para cliente (sem login)
  nomeClienteOnline = '';
  whatsappClienteOnline = '';
  emailClienteOnline = '';
  agendamentoConcluido = signal<boolean>(false);
  agendamentoResultado = signal<Agendamento | null>(null);

  // Campos condicionais por nicho (SaaS Agendar.)
  veiculoPlaca = '';
  pessoasMesa: number = 2;
  locacaoEnsaio: string = 'Estúdio Interno';
  observacoesCliente = '';

  private obterDataLocal(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  dataMinima = this.obterDataLocal();
  dataSelecionada = signal<string>(this.obterDataLocal());

  slots = signal<SlotDisponivel[]>([]);
  slotSelecionado = signal<SlotDisponivel | null>(null);
  carregandoSlots = signal<boolean>(false);

  salvando = signal<boolean>(false);
  erroAgendamento = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarProcedimentos();
    this.carregarClientesSeAdmin();

    this.route.queryParams.subscribe(params => {
      if (params['procedimentoId']) {
        const id = Number(params['procedimentoId']);
        this.api.getProcedimentoById(id).subscribe({
          next: (proc) => {
            this.selecionarProcedimento(proc);
            this.passoAtual.set(2);
          }
        });
      }
    });
  }

  carregarClientesSeAdmin(): void {
    if (this.authService.isAdminOrProfissional()) {
      this.api.getClientes().subscribe({
        next: (dados) => {
          this.clientes.set(dados || []);
          if (dados && dados.length > 0 && !this.clienteIdSelecionado) {
            this.onClienteSelecionadoChange(dados[0].id);
          }
        },
        error: (err) => console.error('Erro ao carregar clientes:', err)
      });
    }
  }

  onClienteSelecionadoChange(id: any): void {
    const numId = id ? Number(id) : null;
    this.clienteIdSelecionado = numId;
    if (numId) {
      const p = this.clientes().find(c => Number(c.id) === numId) || null;
      this.pacienteSelecionado.set(p);
    } else {
      this.pacienteSelecionado.set(null);
    }
  }

  salvarNovoClienteRapido(): void {
    if (!this.novoClienteNome || !this.novoClienteWhatsApp) return;

    this.salvandoNovoCliente.set(true);
    this.erroNovoCliente.set(null);

    this.api.criarCliente({
      nome: this.novoClienteNome.trim(),
      telefoneWhatsApp: this.novoClienteWhatsApp.replace(/[^0-9]/g, '')
    }).subscribe({
      next: (novo) => {
        this.salvandoNovoCliente.set(false);
        this.mostrarCadastroRapido.set(false);
        this.novoClienteNome = '';
        this.novoClienteWhatsApp = '';
        // Atualiza a lista de clientes e seleciona o recém-criado
        const lista = [...this.clientes(), novo];
        this.clientes.set(lista);
        this.onClienteSelecionadoChange(novo.id);
      },
      error: (err) => {
        this.salvandoNovoCliente.set(false);
        const msg = err?.error?.message || err?.error?.detail || 'Erro ao cadastrar paciente.';
        this.erroNovoCliente.set(msg);
      }
    });
  }

  carregarProcedimentos(): void {
    this.api.getProcedimentos().subscribe({
      next: (dados) => this.procedimentos.set(dados),
      error: (err) => console.error(err)
    });
  }

  selecionarProcedimento(proc: Procedimento): void {
    this.procedimentoSelecionado.set(proc);
    this.carregarProfissionaisHabilitados(proc.id);
  }

  carregarProfissionaisHabilitados(procId: number): void {
    this.api.getProfissionais(procId).subscribe({
      next: (dados) => this.profissionais.set(dados),
      error: (err) => console.error(err)
    });
  }

  selecionarProfissional(prof: Profissional | null): void {
    this.profissionalSelecionado.set(prof);
  }

  avancarParaPasso2(): void {
    if (this.procedimentoSelecionado()) {
      this.passoAtual.set(2);
    }
  }

  avancarParaPasso3(): void {
    this.passoAtual.set(3);
    this.consultarSlots();
  }

  avancarParaPasso4(): void {
    if (this.slotSelecionado()) {
      this.carregarClientesSeAdmin();
      this.passoAtual.set(4);
    }
  }

  irParaPasso(p: number): void {
    if (p === 4) {
      this.carregarClientesSeAdmin();
    }
    this.passoAtual.set(p);
  }

  formatarTelefone(tel: string | null | undefined): string {
    return formatarTelefoneBR(tel);
  }

  onDataChange(novaData: string): void {
    this.dataSelecionada.set(novaData);
    this.consultarSlots();
  }

  consultarSlots(): void {
    const proc = this.procedimentoSelecionado();
    if (!proc) return;

    this.carregandoSlots.set(true);
    this.slotSelecionado.set(null);

    const profId = this.profissionalSelecionado()?.id;
    this.api.getSlotsDisponiveis(proc.id, this.dataSelecionada(), profId).subscribe({
      next: (res) => {
        this.slots.set(res.slots || []);
        this.carregandoSlots.set(false);
      },
      error: (err) => {
        console.error(err);
        this.carregandoSlots.set(false);
      }
    });
  }

  selecionarSlot(slot: SlotDisponivel): void {
    this.slotSelecionado.set(slot);
  }

  formatarHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5);
  }

  confirmarAgendamento(): void {
    const proc = this.procedimentoSelecionado();
    const slot = this.slotSelecionado();
    if (!proc || !slot) return;

    if (this.authService.isAdminOrProfissional()) {
      if (!this.clienteIdSelecionado) {
        this.erroAgendamento.set(`Como administrador ou especialista, selecione o ${this.setorService.termoCliente()} para quem o atendimento será agendado.`);
        return;
      }
    } else {
      if (!this.nomeClienteOnline.trim() || !this.whatsappClienteOnline.trim()) {
        this.erroAgendamento.set('Por favor, informe seu Nome Completo e WhatsApp para confirmar seu agendamento.');
        return;
      }
    }

    this.salvando.set(true);
    this.erroAgendamento.set(null);

    const horaInicioLimpa = slot.horarioInicio.length === 5 ? slot.horarioInicio + ':00' : slot.horarioInicio;
    const dataHoraInicio = `${this.dataSelecionada()}T${horaInicioLimpa}`;

    let obsFinais = this.observacoesCliente ? this.observacoesCliente.trim() : '';
    if (this.setorService.recursos().temVeiculoPlaca && this.veiculoPlaca) {
      obsFinais = `[Veículo: ${this.veiculoPlaca.trim()}] ` + obsFinais;
    }
    if (this.setorService.recursos().temMesaReserva && this.pessoasMesa) {
      obsFinais = `[Mesa para ${this.pessoasMesa} pessoas] ` + obsFinais;
    }
    if (this.setorService.recursos().temLocacaoEnsaio && this.locacaoEnsaio) {
      obsFinais = `[Locação: ${this.locacaoEnsaio}] ` + obsFinais;
    }

    const payload = {
      clienteId: this.authService.isAdminOrProfissional() ? (Number(this.clienteIdSelecionado) || undefined) : undefined,
      clienteNome: !this.authService.isAdminOrProfissional() ? this.nomeClienteOnline.trim() : undefined,
      clienteTelefone: !this.authService.isAdminOrProfissional() ? this.whatsappClienteOnline.replaceAll(/[^0-9]/g, '') : undefined,
      clienteEmail: (!this.authService.isAdminOrProfissional() && this.emailClienteOnline.trim()) ? this.emailClienteOnline.trim() : undefined,
      slug: this.tenantService.obterSlugAtual(),
      procedimentoId: Number(proc.id),
      profissionalId: slot.profissionalId ? Number(slot.profissionalId) : undefined,
      dataHoraInicio: dataHoraInicio,
      observacoesCliente: obsFinais.trim() || undefined
    };

    this.api.criarAgendamento(payload).subscribe({
      next: (agendamento) => {
        this.salvando.set(false);
        if (this.authService.isAdminOrProfissional()) {
          this.router.navigate(['/admin/agenda'], { queryParams: { sucesso: agendamento.id } });
        } else {
          this.agendamentoResultado.set(agendamento);
          this.agendamentoConcluido.set(true);
        }
      },
      error: (err) => {
        this.salvando.set(false);
        const detalhe = err?.error?.detail || err?.error?.message || err?.error?.detalheTecnico || 'Erro ao confirmar agendamento. Horário pode ter sido ocupado.';
        this.erroAgendamento.set(detalhe);
      }
    });
  }

  reiniciarWizard(): void {
    this.agendamentoConcluido.set(false);
    this.agendamentoResultado.set(null);
    this.nomeClienteOnline = '';
    this.whatsappClienteOnline = '';
    this.emailClienteOnline = '';
    this.passoAtual.set(1);
    this.procedimentoSelecionado.set(null);
    this.profissionalSelecionado.set(null);
    this.slotSelecionado.set(null);
  }
}
