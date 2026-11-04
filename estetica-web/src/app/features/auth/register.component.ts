import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        
        <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner border border-emerald-100">
          ✨
        </div>

        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Agendamento Direto
          </span>
          <h2 class="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Clientes não precisam de login!
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Para sua facilidade, você não precisa criar conta nem memorizar senhas. Basta escolher o serviço e informar seu Nome e WhatsApp na confirmação.
          </p>
        </div>

        <div class="pt-2 space-y-3">
          <a routerLink="/catalogo" class="w-full py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md block">
            Ver Serviços e Agendar Horário →
          </a>
          <a routerLink="/login" class="text-xs text-slate-500 hover:text-slate-800 block">
            É da equipe de especialistas ou administrador? <strong class="underline">Acessar Painel</strong>
          </a>
        </div>

      </div>
    </div>
  `
})
export class RegisterComponent {}
