import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-exclusao-dados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div class="border-b border-slate-100 pb-6">
          <span class="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-3">
            Controle do Usuário
          </span>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">Exclusão de Dados do Usuário</h1>
          <p class="text-sm text-slate-500 mt-2">
            Instruções oficiais para remoção de dados vinculados ao Instagram e à plataforma.
          </p>
        </div>

        @if (codigoConfirmacao()) {
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
            <p class="font-semibold">Solicitação de exclusão registrada com sucesso.</p>
            <p class="mt-1">
              Código de confirmação: <code class="font-mono font-bold">{{ codigoConfirmacao() }}</code>.
              Todos os tokens e vínculos da conta do Instagram associados a esta solicitação foram removidos do servidor.
            </p>
          </div>
        }

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">Opção 1 — Remover diretamente no painel do sistema</h2>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>Acesse o painel administrativo da sua conta e entre em <strong>Instagram</strong> (<code>/admin/redes-sociais</code>);</li>
            <li>Clique no botão <strong>Desconectar Instagram</strong>;</li>
            <li>O token de acesso e os metadados da conta conectada são apagados imediatamente do banco de dados.</li>
          </ol>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">Opção 2 — Remover pelas configurações do Instagram / Meta</h2>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>Abra o aplicativo do <strong>Instagram</strong> e vá em <strong>Configurações e atividade</strong> → <strong>Permissões do site → Apps e sites</strong>;</li>
            <li>Localize o aplicativo vinculado à plataforma e toque em <strong>Remover</strong>;</li>
            <li>
              A Meta envia automaticamente uma notificação assinada ao nosso endpoint oficial de exclusão de dados
              (<code>/api/v1/redes-sociais/instagram/data-deletion</code>), eliminando tokens e vínculos armazenados.
            </li>
          </ol>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">Opção 3 — Solicitação manual completa da conta</h2>
          <p>
            Para exclusão integral de todos os dados cadastrais do estabelecimento e registros históricos de agendamento
            em conformidade com a LGPD, entre em contato com o suporte administrativo do portal informando seu subdomínio e
            e-mail de cadastro. A exclusão definitiva é concluída em até 48 horas úteis.
          </p>
        </section>

        <div class="pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
          <a routerLink="/termos-de-uso" class="hover:text-slate-900 underline">Termos de Uso</a>
          <a routerLink="/privacidade" class="hover:text-slate-900 underline">Política de Privacidade</a>
          <a routerLink="/" class="hover:text-slate-900 underline ml-auto">Voltar ao início</a>
        </div>
      </div>
    </div>
  `
})
export class ExclusaoDadosComponent implements OnInit {
  tenantService = inject(TenantService);
  private route = inject(ActivatedRoute);

  codigoConfirmacao = signal<string | null>(null);

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.codigoConfirmacao.set(code);
    }
  }
}
