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

  nomeEmpresa = computed(() => this.tenant()?.nomeEmpresa || "L'Élégance");
  logoUrl = computed(() => this.tenant()?.logoUrl || null);
  corPrimaria = computed(() => this.tenant()?.corPrimaria || '#e11d48');
  corSecundaria = computed(() => this.tenant()?.corSecundaria || '#f43f5e');
  linkPersonalizado = computed(() => this.tenant()?.linkPersonalizado || '');

  constructor() {
    this.detectarECarregarTenant();
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

    // 2. Tenta extrair do subdomínio (ex: belavida.logistadigital.com.br)
    const hostname = window.location.hostname.toLowerCase();
    const dominioPadrao = 'logistadigital.com.br';

    if (hostname.endsWith(dominioPadrao)) {
      const subdominio = hostname.replace(`.${dominioPadrao}`, '').trim();
      // Ignora subdomínios padrão do sistema como "estetica", "www", "api"
      if (subdominio && !['estetica', 'www', 'api', 'app', 'painel'].includes(subdominio)) {
        this.carregarTenant(subdominio);
        return;
      }
    }
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
      document.title = `${tenant.nomeEmpresa} | Agendamento Online`;
    }

    // Injeta as variáveis CSS dinâmicas no elemento raiz (:root)
    const root = document.documentElement;
    if (tenant.corPrimaria) {
      root.style.setProperty('--cor-primaria', tenant.corPrimaria);
    }
    if (tenant.corSecundaria) {
      root.style.setProperty('--cor-secundaria', tenant.corSecundaria);
    }
  }

  setTenantManual(tenant: TenantPublicDTO): void {
    this.tenant.set(tenant);
    this.aplicarCoresETitulo(tenant);
  }
}

