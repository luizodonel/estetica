import { Routes } from '@angular/router';
import { authGuard, adminGuard, rootRedirectGuard, tenantCatalogoGuard, masterSaasGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [rootRedirectGuard],
    loadComponent: () => import('./features/planos/planos.component').then(m => m.PlanosComponent),
    pathMatch: 'full'
  },
  {
    path: 'catalogo',
    canActivate: [tenantCatalogoGuard],
    loadComponent: () => import('./features/catalogo/catalogo.component').then(m => m.CatalogoComponent)
  },
  {
    path: 'agendar',
    canActivate: [tenantCatalogoGuard],
    loadComponent: () => import('./features/agendamento-wizard/agendamento-wizard.component').then(m => m.AgendamentoWizardComponent)
  },
  {
    path: 'meus-agendamentos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/meus-agendamentos/meus-agendamentos.component').then(m => m.MeusAgendamentosComponent)
  },
  {
    path: 'admin/dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/agenda',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-agenda/admin-agenda.component').then(m => m.AdminAgendaComponent)
  },
  {
    path: 'admin/prontuarios',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-prontuario/admin-prontuario.component').then(m => m.AdminProntuarioComponent)
  },
  {
    path: 'admin/gestao',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-gestao/admin-gestao.component').then(m => m.AdminGestaoComponent)
  },
  {
    path: 'admin/relatorios',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-relatorios/admin-relatorios.component').then(m => m.AdminRelatoriosComponent)
  },
  {
    path: 'admin/assinatura',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-assinatura/admin-assinatura.component').then(m => m.AdminAssinaturaComponent)
  },
  {
    path: 'login',
    canActivate: [masterSaasGuard],
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registrar',
    canActivate: [masterSaasGuard],
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'planos',
    canActivate: [masterSaasGuard],
    loadComponent: () => import('./features/planos/planos.component').then(m => m.PlanosComponent)
  },
  {
    path: 'precos',
    redirectTo: 'planos',
    pathMatch: 'full'
  },
  {
    path: 'parceiro/cadastro-lojista',
    canActivate: [masterSaasGuard],
    loadComponent: () => import('./features/onboarding-lojista/onboarding-lojista.component').then(m => m.OnboardingLojistaComponent)
  },
  {
    path: 'onboarding-parceiro',
    redirectTo: 'parceiro/cadastro-lojista',
    pathMatch: 'full'
  },
  {
    path: '**',
    canActivate: [rootRedirectGuard],
    loadComponent: () => import('./features/planos/planos.component').then(m => m.PlanosComponent)
  }
];
