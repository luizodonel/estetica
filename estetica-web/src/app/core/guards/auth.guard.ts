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
    return true;
  }
  return router.createUrlTree([tenantService.isDominioMaster() ? '/planos' : '/catalogo']);
};

export const rootRedirectGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (tenantService.isDominioMaster()) {
    return router.createUrlTree(['/planos']);
  }
  return router.createUrlTree(['/catalogo']);
};

export const tenantCatalogoGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // No domínio principal do SaaS (agendoou.logistadigital.com.br), /catalogo não existe: redireciona para /planos
  if (tenantService.isDominioMaster()) {
    return router.createUrlTree(['/planos']);
  }
  return true;
};


