import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Role, Usuario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? '/api/v1/auth'
    : 'http://localhost:8080/api/v1/auth';

  private readonly TOKEN_KEY = 'estetica_jwt_token';
  private readonly USER_KEY = 'estetica_user_data';

  // Signals para estado reativo
  currentUser = signal<Usuario | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());

  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ROLE_ADMIN');
  isProfissional = computed(() => this.currentUser()?.role === 'ROLE_PROFISSIONAL');
  isAdminOrProfissional = computed(() => this.isAdmin() || this.isProfissional());

  constructor(private http: HttpClient) {}

  obterSlugAtual(): string {
    if (typeof window === 'undefined') return 'estetica';
    const params = new URLSearchParams(window.location.search);
    const param = params.get('empresa') || params.get('loja') || params.get('tenant');
    if (param) return param.trim().toLowerCase();

    const hostname = window.location.hostname.toLowerCase();
    const dominioBase = 'logistadigital.com.br';
    if (hostname.endsWith(dominioBase)) {
      const sub = hostname.replace(`.${dominioBase}`, '').trim();
      if (sub && !['www', 'api', 'app', 'painel'].includes(sub)) {
        return sub;
      }
    }
    return 'estetica';
  }

  login(dados: { login: string; senha: string; host?: string; origin?: string; slug?: string }): Observable<AuthResponse> {
    const slugAtual = dados.slug || this.obterSlugAtual();
    const payload = {
      ...dados,
      slug: slugAtual,
      host: dados.host || (typeof window !== 'undefined' ? window.location.host : ''),
      origin: dados.origin || (typeof window !== 'undefined' ? window.location.origin : '')
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  primeiroAcesso(dados: { telefoneWhatsApp: string; novaSenha: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/primeiro-acesso`, dados).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  verificarPrimeiroAcesso(telefone: string): Observable<{ existe: boolean; nome: string; primeiroAcesso: boolean }> {
    return this.http.get<{ existe: boolean; nome: string; primeiroAcesso: boolean }>(`${this.apiUrl}/verificar-primeiro-acesso?telefone=${encodeURIComponent(telefone)}`);
  }

  registrar(dados: { nome: string; email?: string; telefoneWhatsApp: string; senha: string; slug?: string; host?: string }): Observable<AuthResponse> {
    const slugAtual = dados.slug || this.obterSlugAtual();
    const payload = {
      ...dados,
      slug: slugAtual,
      host: dados.host || (typeof window !== 'undefined' ? window.location.host : '')
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/registrar`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    const user: Usuario = {
      id: res.id,
      nome: res.nome,
      email: res.email,
      telefoneWhatsApp: res.telefoneWhatsApp,
      role: res.role,
      ativo: true,
      tenantSlug: res.tenantSlug,
      nomeEmpresa: res.nomeEmpresa,
      logoUrl: res.logoUrl
    };
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(res.token);
    this.currentUser.set(user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): Usuario | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as Usuario;
    } catch {
      return null;
    }
  }
}

