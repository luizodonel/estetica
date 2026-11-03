import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { HistoricoAtendimento, Usuario } from '../../../core/models';
import { formatarTelefoneBR } from '../../../shared/pipes/telefone.pipe';

@Component({
  selector: 'app-admin-prontuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      
      <!-- Cabeçalho -->
      <div class="mb-8">
        <span class="text-xs font-semibold uppercase tracking-widest text-rose-600 block mb-1">
          Prontuário & Histórico de Atendimentos
        </span>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Ficha & Histórico do Cliente
        </h1>
        <p class="text-xs text-stone-500 mt-1">Consulte o histórico e registre novas anotações de atendimento.</p>
      </div>

      <!-- Seleção de Paciente Cadastrado -->
      <div class="bg-white rounded-3xl p-6 border border-nude-200 mb-8 shadow-sm">
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
          Selecione o Cliente Cadastrado:
        </label>
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select 
            [ngModel]="clienteId" 
            (ngModelChange)="onClienteChange($event)"
            class="flex-1 p-3 rounded-2xl border border-nude-300 text-xs sm:text-sm font-medium text-stone-800 focus:ring-2 focus:ring-rose-400 focus:outline-none bg-white">
            <option [ngValue]="null">-- Selecione um Cliente Cadastrado --</option>
            @for (p of clientes(); track p.id) {
              <option [ngValue]="p.id">
                {{ p.nome }} • WhatsApp: {{ formatarTelefone(p.telefoneWhatsApp) }} ({{ p.email }})
              </option>
            }
          </select>

          <button 
            (click)="buscarHistorico()" 
            [disabled]="!clienteId"
            class="px-6 py-3 rounded-2xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-all shadow-sm disabled:opacity-50">
            Atualizar Ficha
          </button>
        </div>

        @if (pacienteSelecionado()) {
          <div class="mt-4 p-4 rounded-2xl bg-gradient-to-r from-nude-100 to-rose-50 border border-nude-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span class="text-[10px] uppercase font-bold text-rose-600 block">Paciente em Atendimento</span>
              <h4 class="font-serif font-bold text-stone-900 text-base">{{ pacienteSelecionado()?.nome }}</h4>
              <span class="text-stone-500">E-mail: {{ pacienteSelecionado()?.email }}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-stone-400 block">Contato WhatsApp</span>
              <span class="font-bold text-emerald-700 text-sm">{{ pacienteSelecionado()?.telefoneWhatsApp }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Formulário de Nova Anamnese / Registro de Atendimento -->
      @if (clienteId) {
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-nude-200 shadow-sm mb-8">
          <h3 class="font-serif text-lg font-bold text-stone-900 mb-4">+ Nova Anotação / Histórico de Atendimento</h3>

          @if (mensagemSucesso()) {
            <div class="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span>{{ mensagemSucesso() }}</span>
              <button (click)="mensagemSucesso.set(null)" class="text-emerald-600 font-bold ml-2">✕</button>
            </div>
          }

          @if (mensagemErro()) {
            <div class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>{{ mensagemErro() }}</span>
              <button (click)="mensagemErro.set(null)" class="text-rose-600 font-bold ml-2">✕</button>
            </div>
          }

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Notas de Anamnese & Queixas *:</label>
              <textarea 
                [(ngModel)]="notasAnamnese" 
                rows="3" 
                placeholder="Descreva observações do atendimento, preferências do cliente, evolução e histórico..."
                class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Orientações Pós-Procedimento:</label>
                <textarea 
                  [(ngModel)]="orientacoesPos" 
                  rows="2" 
                  placeholder="Home care recomendado, fotoproteção..."
                  class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"></textarea>
              </div>
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Reações Adversas Observadas:</label>
                <textarea 
                  [(ngModel)]="reacoesAdversas" 
                  rows="2" 
                  placeholder="Vermelhidão leve, edema transitório..."
                  class="w-full p-3 rounded-xl border border-nude-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"></textarea>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button 
                [disabled]="salvando() || !notasAnamnese"
                (click)="salvarEntrada()" 
                class="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                <span>{{ salvando() ? 'Salvando...' : 'Salvar Entrada no Prontuário' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Linha do Tempo / Histórico de Procedimentos Realizados -->
        <div>
          <h3 class="font-serif text-lg font-bold text-stone-900 mb-4">
            Histórico de Atendimentos de {{ pacienteSelecionado()?.nome }}
          </h3>

          @if (carregando()) {
            <div class="py-12 text-center text-stone-400 text-xs animate-pulse">Carregando prontuário...</div>
          } @else if (historico().length === 0) {
            <div class="p-8 rounded-2xl bg-white border border-nude-200 text-center text-xs text-stone-400">
              Nenhuma anotação ou atendimento anterior registrado para este paciente.
            </div>
          } @else {
            <div class="space-y-4">
              @for (h of historico(); track h.id) {
                <div class="bg-white rounded-2xl p-5 border border-nude-200 shadow-sm">
                  <div class="flex items-center justify-between border-b border-nude-100 pb-2 mb-3">
                    <span class="text-xs font-bold text-stone-800">
                      Atendimento em {{ h.dataAtendimento.substring(0, 10) }} às {{ h.dataAtendimento.substring(11, 16) }}
                    </span>
                    <span class="text-[11px] text-stone-500 font-semibold">
                      Especialista: {{ h.profissionalNome }}
                    </span>
                  </div>

                  <div class="space-y-2 text-xs">
                    <div>
                      <span class="font-bold text-stone-700">Anamnese / Evolução:</span>
                      <p class="text-stone-600 mt-0.5 leading-relaxed">{{ h.notasAnamnese }}</p>
                    </div>
                    @if (h.orientacoesPosProcedimento) {
                      <div class="pt-2 border-t border-nude-50">
                        <span class="font-bold text-stone-700">Orientações:</span>
                        <p class="text-stone-600 mt-0.5">{{ h.orientacoesPosProcedimento }}</p>
                      </div>
                    }
                    @if (h.reacoesAdversas) {
                      <div class="pt-2 border-t border-nude-50">
                        <span class="font-bold text-rose-700">Reações / Alergias:</span>
                        <p class="text-rose-600 mt-0.5">{{ h.reacoesAdversas }}</p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="p-12 rounded-3xl bg-white border border-nude-200 text-center text-stone-500 text-xs">
          Selecione um paciente na lista acima para visualizar seu prontuário e histórico clínico.
        </div>
      }

    </div>
  `
})
export class AdminProntuarioComponent implements OnInit {
  private api = inject(ApiService);

  clientes = signal<Usuario[]>([]);
  clienteId: number | null = null;
  pacienteSelecionado = signal<Usuario | null>(null);

  historico = signal<HistoricoAtendimento[]>([]);
  carregando = signal<boolean>(false);
  salvando = signal<boolean>(false);
  mensagemSucesso = signal<string | null>(null);
  mensagemErro = signal<string | null>(null);

  notasAnamnese = '';
  orientacoesPos = '';
  reacoesAdversas = '';

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.api.getClientes().subscribe({
      next: (dados) => {
        this.clientes.set(dados);
        if (dados.length > 0 && !this.clienteId) {
          this.onClienteChange(dados[0].id);
        }
      },
      error: (err) => console.error(err)
    });
  }

  onClienteChange(novoId: number | null): void {
    this.clienteId = novoId;
    this.mensagemSucesso.set(null);
    this.mensagemErro.set(null);
    if (novoId) {
      const p = this.clientes().find(c => c.id === novoId) || null;
      this.pacienteSelecionado.set(p);
      this.buscarHistorico();
    } else {
      this.pacienteSelecionado.set(null);
      this.historico.set([]);
    }
  }

  buscarHistorico(): void {
    if (!this.clienteId) return;
    this.carregando.set(true);
    this.api.getProntuarioPorCliente(this.clienteId).subscribe({
      next: (dados) => {
        this.historico.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.carregando.set(false);
      }
    });
  }

  formatarTelefone(tel: string | null | undefined): string {
    return formatarTelefoneBR(tel);
  }

  salvarEntrada(): void {
    if (!this.clienteId) {
      this.mensagemErro.set('Selecione um paciente cadastrado.');
      return;
    }
    if (!this.notasAnamnese) {
      this.mensagemErro.set('Preencha as notas de anamnese e queixas.');
      return;
    }

    this.salvando.set(true);
    this.mensagemSucesso.set(null);
    this.mensagemErro.set(null);

    this.api.salvarProntuario({
      clienteId: this.clienteId,
      notasAnamnese: this.notasAnamnese,
      orientacoesPosProcedimento: this.orientacoesPos,
      reacoesAdversas: this.reacoesAdversas
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagemSucesso.set('Anotação de atendimento registrada com sucesso no prontuário!');
        this.notasAnamnese = '';
        this.orientacoesPos = '';
        this.reacoesAdversas = '';
        this.buscarHistorico();
      },
      error: (err) => {
        this.salvando.set(false);
        this.mensagemErro.set(err?.error?.message || err?.error?.detail || 'Erro ao salvar prontuário.');
      }
    });
  }
}
