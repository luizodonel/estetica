import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { TenantPublicDTO } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private api = inject(ApiService);

  tenant = signal<TenantPublicDTO | null>(null);
  carregando = signal<boolean>(false);

  nomeEmpresa = computed(() => {
    const tNome = this.tenant()?.nomeEmpresa;
    if (tNome) return tNome;

    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('estetica_user_data');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.nomeEmpresa) return u.nomeEmpresa;
        } catch {}
      }
    }
    return 'Agendoou';
  });

  logoUrl = computed(() => {
    const raw = this.tenant()?.logoUrl;
    if (raw) return this.api.formatarUrlImagem(raw);

    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('estetica_user_data');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.logoUrl) return this.api.formatarUrlImagem(u.logoUrl);
        } catch {}
      }
    }
    return null;
  });
  corPrimaria = computed(() => '#e11d48');
  corSecundaria = computed(() => '#f43f5e');
  linkPersonalizado = computed(() => this.tenant()?.linkPersonalizado || '');

  isDominioMaster = computed(() => {
    const slug = this.obterSlugAtual();
    return slug === 'agendoou' || slug === 'estetica';
  });

  assinaturaProximaDoVencimento = computed(() => {
    const t = this.tenant();
    return !!(t && typeof t.diasRestantes === 'number' && t.diasRestantes <= 5);
  });

  constructor() {
    this.detectarECarregarTenant();
  }

  obterSlugAtual(): string {
    if (typeof window === 'undefined') return 'agendoou';
    const urlParams = new URLSearchParams(window.location.search);
    const paramSlug = urlParams.get('empresa') || urlParams.get('loja') || urlParams.get('tenant');
    if (paramSlug) return paramSlug.trim().toLowerCase();

    const hostname = window.location.hostname.toLowerCase();
    const dominioPadrao = 'logistadigital.com.br';
    if (hostname.endsWith(dominioPadrao)) {
      const subdominio = hostname.replace(`.${dominioPadrao}`, '').trim();
      if (subdominio && !['www', 'api', 'app', 'painel'].includes(subdominio)) {
        return subdominio;
      }
    }
    return 'agendoou';
  }

  detectarECarregarTenant(): void {
    if (typeof window === 'undefined') return;

    // 1. Tenta extrair de parâmetros da URL (ex: ?empresa=belavida ou ?loja=belavida)
    const urlParams = new URLSearchParams(window.location.search);
    const paramSlug = urlParams.get('empresa') || urlParams.get('loja') || urlParams.get('tenant');
    if (paramSlug) {
      this.carregarTenant(paramSlug);
      return;
    }

    // 2. Tenta extrair do subdomínio (ex: agendoou.logistadigital.com.br ou belavida.logistadigital.com.br)
    const hostname = window.location.hostname.toLowerCase();
    const dominioPadrao = 'logistadigital.com.br';

    if (hostname.endsWith(dominioPadrao)) {
      const subdominio = hostname.replace(`.${dominioPadrao}`, '').trim();
      if (subdominio && !['www', 'api', 'app', 'painel'].includes(subdominio)) {
        this.carregarTenant(subdominio);
        return;
      }
    }

    // 3. Tenta extrair do usuário logado armazenado localmente
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('estetica_user_data');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.tenantSlug) {
            this.carregarTenant(u.tenantSlug);
            return;
          }
        } catch {}
      }
    }

    // Padrão: carregar tenant agendoou
    this.carregarTenant('agendoou');
  }

  carregarTenant(slug: string): void {
    this.carregando.set(true);
    this.api.getTenantPorSlug(slug).subscribe({
      next: (dados) => {
        this.tenant.set(dados);
        this.aplicarCoresETitulo(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.warn('Tenant não encontrado ou inativo para slug:', slug, err);
        this.carregando.set(false);
      }
    });
  }

  aplicarCoresETitulo(tenant: TenantPublicDTO): void {
    if (typeof document === 'undefined') return;

    // Atualiza o título da página
    if (tenant.nomeEmpresa) {
      document.title = `${tenant.nomeEmpresa} | Agendoou`;
    }

    // Injeta as cores originais da identidade da plataforma no elemento raiz (:root)
    const root = document.documentElement;
    root.style.setProperty('--cor-primaria', '#e11d48');
    root.style.setProperty('--cor-secundaria', '#f43f5e');
  }

  setTenantManual(tenant: TenantPublicDTO): void {
    this.tenant.set(tenant);
    this.aplicarCoresETitulo(tenant);
  }
}

