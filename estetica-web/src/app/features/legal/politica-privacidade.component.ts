import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-politica-privacidade',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div class="border-b border-slate-100 pb-6">
          <span class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-3">
            LGPD & Meta Compliance
          </span>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">Política de Privacidade</h1>
          <p class="text-sm text-slate-500 mt-2">
            Última atualização: 10 de novembro de 2026 • {{ tenantService.nomeEmpresa() }}
          </p>
        </div>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">1. Compromisso com a Privacidade</h2>
          <p>
            Esta Política de Privacidade descreve como coletamos, armazenamos e protegemos os dados tratados na plataforma
            em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e com as Políticas
            da Plataforma Meta.
          </p>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">2. Dados Coletados na Integração com o Instagram</h2>
          <p>Quando o administrador conecta voluntariamente uma conta profissional do Instagram, tratamos estritamente:</p>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>Identificador da conta no Instagram (<code>igUserId</code>), nome de usuário (<code>&#64;username</code>), nome de exibição, tipo de conta e foto de perfil;</li>
            <li>Token de acesso OAuth concedido pelas permissões <code>instagram_business_basic</code> e <code>instagram_business_content_publish</code>;</li>
            <li>Mídias (banners/fotos), legendas e identificadores de publicação gerados exclusivamente mediante ação explícita do administrador no painel.</li>
          </ul>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">3. Finalidade do Tratamento</h2>
          <p>
            Os dados do Instagram são utilizados <strong>exclusivamente</strong> para exibir a conta conectada no painel do
            estabelecimento e publicar fotos ou banners no Feed e nos Stories quando solicitado pelo administrador.
            <strong>Não vendemos, alugamos ou compartilhamos</strong> dados obtidos via API da Meta com terceiros ou corretores de dados.
          </p>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">4. Segurança e Armazenamento</h2>
          <p>
            Toda a comunicação ocorre sob criptografia HTTPS/TLS. Os tokens OAuth permanecem armazenados em banco de dados
            no servidor da aplicação com acesso restrito ao tenant proprietário, nunca sendo expostos no navegador do usuário.
          </p>
        </section>

        <section class="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 class="text-lg font-semibold text-slate-900">5. Direitos do Titular e Exclusão</h2>
          <p>
            Você pode revogar o acesso e solicitar a exclusão definitiva dos seus dados a qualquer instante diretamente pelo
            painel administrativo ou seguindo as orientações da página
            <a routerLink="/exclusao-de-dados" class="text-slate-900 underline font-medium">Exclusão de Dados do Usuário</a>.
          </p>
        </section>

        <div class="pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
          <a routerLink="/termos-de-uso" class="hover:text-slate-900 underline">Termos de Uso</a>
          <a routerLink="/exclusao-de-dados" class="hover:text-slate-900 underline">Exclusão de Dados</a>
          <a routerLink="/" class="hover:text-slate-900 underline ml-auto">Voltar ao início</a>
        </div>
      </div>
    </div>
  `
})
export class PoliticaPrivacidadeComponent {
  tenantService = inject(TenantService);
}
