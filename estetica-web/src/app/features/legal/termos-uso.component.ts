import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-termos-uso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div class="border-b border-slate-100 pb-6">
          <span class="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">
            Documento Legal
          </span>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">Termos de Uso</h1>
          <p class="text-sm text-slate-500 mt-2">
            Última atualização: 10 de novembro de 2026 • {{ tenantService.nomeEmpresa() }}
          </p>
        </div>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar esta plataforma de gestão de agendamentos, catálogo de serviços e ferramentas de divulgação
            (<strong>{{ tenantService.nomeEmpresa() }}</strong>), você concorda em cumprir integralmente estes Termos de Uso
            e a legislação brasileira aplicável.
          </p>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">2. Descrição do Serviço</h2>
          <p>
            A plataforma oferece agendamento online de horários para barbearias, clínicas de estética, estética automotiva e
            estabelecimentos de serviços, além de painel administrativo, relatórios financeiros e integração opcional com a
            <strong>API Oficial do Instagram (Meta Platforms, Inc.)</strong> para publicação de imagens e banners promocionais
            no Feed e nos Stories diretamente pelo administrador autorizado da conta.
          </p>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">3. Integração Oficial com o Instagram</h2>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>
              A conexão com o Instagram é opcional e realizada exclusivamente mediante consentimento expresso do titular da
              conta profissional (Business ou Creator) através do fluxo oficial OAuth da Meta.
            </li>
            <li>
              O administrador do estabelecimento é o único responsável pelos arquivos de imagem, banners e legendas
              enviados para publicação em sua conta conectada, comprometendo-se a respeitar os Termos de Uso e as
              Diretrizes da Comunidade do Instagram.
            </li>
            <li>
              A plataforma atua apenas como intermediária técnica autenticada para executar as publicações solicitadas
              manualmente pelo usuário autorizado.
            </li>
          </ul>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">4. Responsabilidades e Restrições</h2>
          <p>
            É proibido utilizar o sistema para publicar conteúdos ilegais, ofensivos, enganosos, que violem direitos autorais
            ou propriedades intelectuais de terceiros, ou automatizar spam em desacordo com as políticas da Meta.
          </p>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">5. Privacidade e Desconexão</h2>
          <p>
            O tratamento de dados pessoais segue nossa
            <a routerLink="/privacidade" class="text-slate-900 underline font-medium">Política de Privacidade</a>.
            O usuário pode desconectar sua conta do Instagram ou solicitar a remoção completa de tokens e registros a qualquer
            momento conforme as instruções da página
            <a routerLink="/exclusao-de-dados" class="text-slate-900 underline font-medium">Exclusão de Dados</a>.
          </p>
        </section>

        <div class="pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
          <a routerLink="/privacidade" class="hover:text-slate-900 underline">Política de Privacidade</a>
          <a routerLink="/exclusao-de-dados" class="hover:text-slate-900 underline">Instruções de Exclusão de Dados</a>
          <a routerLink="/" class="hover:text-slate-900 underline ml-auto">Voltar ao início</a>
        </div>
      </div>
    </div>
  `
})
export class TermosUsoComponent {
  tenantService = inject(TenantService);
}
