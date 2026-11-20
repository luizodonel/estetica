import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // Nos subdomínios públicos dos clientes (ex: clinica.logistadigital.com.br), só existe o catálogo de agendamento!
  if (tenantService.isSubdominioCliente()) {
    return router.createUrlTree(['/catalogo']);
  }

  if (authService.isAuthenticated() && authService.isAdminOrProfissional()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const rootRedirectGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (tenantService.isSubdominioCliente()) {
    return router.createUrlTree(['/catalogo']);
  }
  return router.createUrlTree(['/planos']);
};

export const tenantCatalogoGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // No domínio principal do SaaS (agendoou.logistadigital.com.br), /catalogo não existe: redireciona para /planos
  if (!tenantService.isSubdominioCliente()) {
    return router.createUrlTree(['/planos']);
  }
  return true;
};

export const masterSaasGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // Nos subdomínios dos lojistas/clientes (ex: clinica.logistadigital.com.br), o cliente final só vê o agendamento!
  // Bloqueia acesso a /planos, /login e /parceiro/cadastro-lojista nos subdomínios dos clientes.
  if (tenantService.isSubdominioCliente()) {
    return router.createUrlTree(['/catalogo']);
  }
  return true;
};



