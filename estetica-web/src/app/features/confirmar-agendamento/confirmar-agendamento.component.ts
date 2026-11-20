import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TenantService } from '../../core/services/tenant.service';
import { Agendamento, SlotDisponivel } from '../../core/models';

interface DiaOpcao {
  dataStr: string;
  diaSemana: string;
  diaMes: string;
  mes: string;
}

@Component({
  selector: 'app-confirmar-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200">
        
        @if (carregando()) {
          <div class="py-16 text-center space-y-3">
            <div class="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-semibold text-slate-500">Carregando detalhes do seu agendamento...</p>
          </div>
        } @else if (erro()) {
          <div class="text-center py-8 space-y-4">
            <div class="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto font-bold">
              !
            </div>
            <h2 class="text-xl font-extrabold text-slate-900">Link Indisponível</h2>
            <p class="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">{{ erro() }}</p>
            <a routerLink="/catalogo" class="inline-block px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow hover:bg-slate-800 transition-all">
              Ir para a Agenda Online
            </a>
          </div>
        } @else if (agendamento()) {
          <!-- Cabeçalho do Estabelecimento -->
          <div class="text-center border-b border-slate-100 pb-5 mb-5">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              {{ tenantService.nomeEmpresa() }}
            </span>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900">
              Olá, {{ agendamento()!.clienteNome.split(' ')[0] }}!
            </h1>
            <p class="text-xs text-slate-500 mt-1">
              Confira os dados do seu horário reservado abaixo:
            </p>
          </div>

          <!-- Resumo do Agendamento Atual -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 mb-6 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-medium">Serviço:</span>
              <strong class="text-slate-900 font-bold text-right">{{ agendamento()!.procedimentoTitulo }}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-medium">Profissional:</span>
              <strong class="text-slate-900 font-semibold">{{ agendamento()!.profissionalNome }}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-medium">Data e Horário:</span>
              <strong class="text-emerald-700 font-extrabold text-sm">
                {{ formatarDataBR(agendamento()!.dataHoraInicio.substring(0, 10)) }} às {{ agendamento()!.dataHoraInicio.substring(11, 16) }}
              </strong>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-200/70">
              <span class="text-slate-500 font-medium">Valor:</span>
              <strong class="text-slate-900 font-bold">{{ agendamento()!.valorCobrado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
          </div>

          <!-- Mensagem de Sucesso após Confirmar ou Reagendar -->
          @if (mensagemSucesso()) {
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 mb-6 animate-fade-in">
              <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg mx-auto font-bold shadow">
                ✓
              </div>
              <h3 class="text-sm font-extrabold text-emerald-950">{{ tituloSucesso() }}</h3>
              <p class="text-xs text-emerald-800 leading-relaxed">{{ mensagemSucesso() }}</p>
            </div>
          }

          <!-- Botões Principais: Confirmar Presença ou Reagendar -->
          @if (!modoReagendar()) {
            <div class="space-y-3">
              <button
                type="button"
                (click)="confirmarPresenca()"
                [disabled]="processando()"
                class="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>✅</span>
                <span>{{ processando() ? 'Confirmando...' : 'Confirmar Minha Presença' }}</span>
              </button>

              <button
                type="button"
                (click)="abrirReagendamento()"
                [disabled]="processando()"
                class="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>🔄</span>
                <span>Preciso Reagendar (Escolher Outro Horário)</span>
              </button>
            </div>
          } @else {
            <!-- Painel de Escolha de Nova Data e Horário -->
            <div class="border-t border-slate-200 pt-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-extrabold text-slate-900">Escolha o Novo Dia e Horário</h3>
                <button type="button" (click)="modoReagendar.set(false)" class="text-xs font-semibold text-slate-500 hover:text-slate-800">
                  ← Voltar
                </button>
              </div>

              <!-- Carrossel de Dias -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                @for (d of diasOpcoes(); track d.dataStr) {
                  <button
                    type="button"
                    (click)="selecionarNovaData(d.dataStr)"
                    [class.bg-slate-900]="novaDataSelecionada() === d.dataStr"
                    [class.text-white]="novaDataSelecionada() === d.dataStr"
                    [class.bg-slate-100]="novaDataSelecionada() !== d.dataStr"
                    [class.text-slate-700]="novaDataSelecionada() !== d.dataStr"
                    class="flex flex-col items-center justify-center min-w-[56px] py-2 px-2 rounded-xl text-xs transition-all shrink-0 cursor-pointer">
                    <span class="text-[10px] uppercase opacity-75 font-semibold">{{ d.diaSemana }}</span>
                    <span class="text-sm font-extrabold">{{ d.diaMes }}/{{ d.mes }}</span>
                  </button>
                }
              </div>

              <!-- Horários Disponíveis -->
              @if (carregandoSlots()) {
                <div class="py-6 text-center text-xs text-slate-400">
                  Buscando horários livres...
                </div>
              } @else if (slotsDisponiveis().length === 0) {
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Nenhum horário disponível nesta data. Escolha outro dia acima.
                </div>
              } @else {
                <div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  @for (slot of slotsDisponiveis(); track slot.horarioInicio) {
                    <button
                      type="button"
                      (click)="novoSlotSelecionado.set(slot)"
                      [class.bg-emerald-600]="novoSlotSelecionado()?.horarioInicio === slot.horarioInicio"
                      [class.text-white]="novoSlotSelecionado()?.horarioInicio === slot.horarioInicio"
                      [class.bg-slate-100]="novoSlotSelecionado()?.horarioInicio !== slot.horarioInicio"
                      [class.text-slate-800]="novoSlotSelecionado()?.horarioInicio !== slot.horarioInicio"
                      class="py-2 rounded-xl text-xs font-bold text-center hover:bg-slate-200 transition-all cursor-pointer">
                      {{ slot.horarioInicio.substring(0, 5) }}
                    </button>
                  }
                </div>
              }

              @if (erroReagendamento()) {
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {{ erroReagendamento() }}
                </div>
              }

              <button
                type="button"
                (click)="salvarReagendamento()"
                [disabled]="!novoSlotSelecionado() || processando()"
                class="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer">
                {{ processando() ? 'Salvando Novo Horário...' : 'Confirmar Novo Horário' }}
              </button>
            </div>
          }
        }

      </div>
    </div>
  `
})
export class ConfirmarAgendamentoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  tenantService = inject(TenantService);

  agendamento = signal<Agendamento | null>(null);
  carregando = signal<boolean>(true);
  processando = signal<boolean>(false);
  erro = signal<string | null>(null);

  tituloSucesso = signal<string>('');
  mensagemSucesso = signal<string | null>(null);

  modoReagendar = signal<boolean>(false);
  diasOpcoes = signal<DiaOpcao[]>([]);
  novaDataSelecionada = signal<string>('');
  slotsDisponiveis = signal<SlotDisponivel[]>([]);
  novoSlotSelecionado = signal<SlotDisponivel | null>(null);
  carregandoSlots = signal<boolean>(false);
  erroReagendamento = signal<string | null>(null);

  private agendamentoId = 0;
  private token = '';

  ngOnInit(): void {
    this.gerarProximosDias();
    const idParam = this.route.snapshot.paramMap.get('id');
    const tokenParam = this.route.snapshot.queryParamMap.get('t') || '';
    const acaoParam = this.route.snapshot.queryParamMap.get('acao') || '';

    this.agendamentoId = Number(idParam || 0);
    this.token = tokenParam;

    if (!this.agendamentoId || !this.token) {
      this.carregando.set(false);
      this.erro.set('Link de confirmação incompleto ou inválido.');
      return;
    }

    this.api.getAgendamentoPublicoPorToken(this.agendamentoId, this.token).subscribe({
      next: (ag) => {
        this.agendamento.set(ag);
        this.carregando.set(false);
        if (acaoParam === 'confirmar') {
          this.confirmarPresenca();
        } else if (acaoParam === 'reagendar') {
          this.abrirReagendamento();
        }
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.detail || err?.error?.message || 'Não foi possível localizar este agendamento.');
      }
    });
  }

  confirmarPresenca(): void {
    if (!this.agendamentoId || !this.token) return;
    this.processando.set(true);
    this.api.confirmarAgendamentoPublicoPorToken(this.agendamentoId, this.token).subscribe({
      next: (ag) => {
        this.agendamento.set(ag);
        this.processando.set(false);
        this.modoReagendar.set(false);
        this.tituloSucesso.set('Presença Confirmada com Sucesso!');
        this.mensagemSucesso.set('Tudo certo! O estabelecimento já recebeu a confirmação da sua presença.');
      },
      error: (err) => {
        this.processando.set(false);
        this.erro.set(err?.error?.detail || err?.error?.message || 'Não foi possível confirmar o agendamento.');
      }
    });
  }

  abrirReagendamento(): void {
    this.mensagemSucesso.set(null);
    this.erroReagendamento.set(null);
    this.modoReagendar.set(true);
    this.carregarSlotsParaReagendar();
  }

  selecionarNovaData(dataStr: string): void {
    this.novaDataSelecionada.set(dataStr);
    this.novoSlotSelecionado.set(null);
    this.carregarSlotsParaReagendar();
  }

  carregarSlotsParaReagendar(): void {
    const ag = this.agendamento();
    if (!ag || !this.novaDataSelecionada()) return;
    this.carregandoSlots.set(true);
    this.api.getSlotsDisponiveis(ag.procedimentoId, this.novaDataSelecionada(), ag.profissionalId, ag.procedimentoDuracao).subscribe({
      next: (res) => {
        this.slotsDisponiveis.set(res.slots || []);
        this.carregandoSlots.set(false);
      },
      error: () => {
        this.slotsDisponiveis.set([]);
        this.carregandoSlots.set(false);
      }
    });
  }

  salvarReagendamento(): void {
    const slot = this.novoSlotSelecionado();
    const ag = this.agendamento();
    if (!slot || !ag) return;

    this.processando.set(true);
    this.erroReagendamento.set(null);

    const horaLimpa = slot.horarioInicio.length === 5 ? slot.horarioInicio + ':00' : slot.horarioInicio;
    const novaDataHoraInicio = `${this.novaDataSelecionada()}T${horaLimpa}`;

    this.api.reagendarAgendamentoPublicoPorToken(this.agendamentoId, this.token, {
      novaDataHoraInicio,
      novoProfissionalId: ag.profissionalId
    }).subscribe({
      next: (atualizado) => {
        this.agendamento.set(atualizado);
        this.processando.set(false);
        this.modoReagendar.set(false);
        this.tituloSucesso.set('Horário Reagendado com Sucesso!');
        this.mensagemSucesso.set(
          `Seu atendimento foi remarcado para ${this.formatarDataBR(atualizado.dataHoraInicio.substring(0, 10))} às ${atualizado.dataHoraInicio.substring(11, 16)}.`
        );
      },
      error: (err) => {
        this.processando.set(false);
        this.erroReagendamento.set(err?.error?.detail || err?.error?.message || 'Este horário não está disponível. Escolha outro horário.');
      }
    });
  }

  gerarProximosDias(): void {
    const dias: DiaOpcao[] = [];
    const hoje = new Date();
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(hoje.getDate() + i);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      dias.push({
        dataStr: `${ano}-${mes}-${dia}`,
        diaSemana: nomes[d.getDay()],
        diaMes: dia,
        mes
      });
    }
    this.diasOpcoes.set(dias);
    if (dias.length > 0) {
      this.novaDataSelecionada.set(dias[0].dataStr);
    }
  }

  formatarDataBR(dataStr: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
  }
}
