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

  if (authService.isAuthenticated() && authService.isAdminOrProfissional()) {
    const userSlug = authService.currentUser()?.tenantSlug?.toLowerCase().trim();
    const currentSlug = tenantService.obterSlugAtual().toLowerCase().trim();

    // Validação estrita de isolamento: o lojista/especialista só pode acessar o painel no seu próprio subdomínio!
    if (userSlug && currentSlug !== userSlug) {
      authService.logout();
      return router.createUrlTree(['/login']);
    }
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

  // No domínio principal do SaaS (agendoousistemas.com.br), /catalogo não existe: redireciona para /planos
  if (!tenantService.isSubdominioCliente()) {
    return router.createUrlTree(['/planos']);
  }
  return true;
};

export const masterSaasGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // Nos subdomínios dos lojistas/clientes, bloqueia acesso a /planos e /parceiro/cadastro-lojista
  if (tenantService.isSubdominioCliente()) {
    return router.createUrlTree(['/catalogo']);
  }
  return true;
};



