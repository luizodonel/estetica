import { Injectable, computed, inject } from '@angular/core';
import { SetorAtuacao } from '../models';
import { TenantService } from './tenant.service';

export interface SetorConfig {
  id: SetorAtuacao;
  label: string;
  icone: string;
  categoriaGeral: string;
  descricao: string;
  termoCliente: string;
  termoClientes: string;
  termoServico: string;
  termoServicos: string;
  termoProfissional: string;
  termoProfissionais: string;
  termoAgendar: string;
  termoProntuario: string;
  placeholderServico: string;
  recursos: {
    temProntuario: boolean;
    temVeiculoPlaca: boolean;
    temMesaReserva: boolean;
    temTurmaCheckin: boolean;
    temLocacaoEnsaio: boolean;
    temPortfolio: boolean;
  };
  temaVisual: {
    badge: string;
    gradienteHeader: string;
    corDestaque: string;
  };
}

export const SETORES_CATALOGO: Record<SetorAtuacao, SetorConfig> = {
  CLINICA_ESTETICA: {
    id: 'CLINICA_ESTETICA',
    label: 'Clínica de Estética',
    icone: '💆‍♀️',
    categoriaGeral: 'Saúde & Beleza',
    descricao: 'Tratamentos faciais, corporais, harmonização e cuidados estéticos avançados.',
    termoCliente: 'Paciente',
    termoClientes: 'Pacientes',
    termoServico: 'Procedimento',
    termoServicos: 'Procedimentos',
    termoProfissional: 'Especialista',
    termoProfissionais: 'Especialistas',
    termoAgendar: 'Agendar Consulta',
    termoProntuario: 'Prontuários & Anamnese',
    placeholderServico: 'Ex: Limpeza de Pele Profunda, Botox, Harmonização Facial',
    recursos: {
      temProntuario: true,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: true
    },
    temaVisual: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      gradienteHeader: 'from-rose-500 to-rose-600',
      corDestaque: '#e11d48'
    }
  },
  SALAO_BELEZA: {
    id: 'SALAO_BELEZA',
    label: 'Salão de Beleza',
    icone: '✂️',
    categoriaGeral: 'Beleza & Estilo',
    descricao: 'Cabeleireiros, manicures, maquiagem e cuidados pessoais.',
    termoCliente: 'Cliente',
    termoClientes: 'Clientes',
    termoServico: 'Serviço',
    termoServicos: 'Serviços',
    termoProfissional: 'Profissional',
    termoProfissionais: 'Profissionais',
    termoAgendar: 'Agendar Horário',
    termoProntuario: 'Ficha & Preferências',
    placeholderServico: 'Ex: Mechas Criativas, Escova Modeladora, Manicure & Pedicure',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: true
    },
    temaVisual: {
      badge: 'bg-pink-50 text-pink-700 border-pink-200',
      gradienteHeader: 'from-pink-500 to-rose-600',
      corDestaque: '#ec4899'
    }
  },
  BARBEARIA: {
    id: 'BARBEARIA',
    label: 'Barbearia',
    icone: '💈',
    categoriaGeral: 'Estilo Masculino',
    descricao: 'Corte masculino, barba terapia, químicas e cuidados masculinos.',
    termoCliente: 'Cliente',
    termoClientes: 'Clientes',
    termoServico: 'Corte / Serviço',
    termoServicos: 'Cortes & Serviços',
    termoProfissional: 'Barbeiro',
    termoProfissionais: 'Barbeiros',
    termoAgendar: 'Agendar Horário',
    termoProntuario: 'Histórico de Cortes',
    placeholderServico: 'Ex: Corte Degradê, Barba com Toalha Quente, Pigmentação',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: true
    },
    temaVisual: {
      badge: 'bg-stone-100 text-stone-800 border-stone-300',
      gradienteHeader: 'from-stone-800 to-stone-900',
      corDestaque: '#1c1917'
    }
  },
  RESTAURANTE: {
    id: 'RESTAURANTE',
    label: 'Restaurante & Bistrô',
    icone: '🍽️',
    categoriaGeral: 'Gastronomia',
    descricao: 'Reserva de mesas, turnos de almoço/jantar, eventos e menus degustação.',
    termoCliente: 'Cliente',
    termoClientes: 'Clientes da Mesa',
    termoServico: 'Reserva de Mesa',
    termoServicos: 'Reservas de Mesas',
    termoProfissional: 'Host / Atendente',
    termoProfissionais: 'Equipe de Recepção',
    termoAgendar: 'Reservar Mesa',
    termoProntuario: 'Histórico & Preferências da Mesa',
    placeholderServico: 'Ex: Mesa Salão Principal (4 Pessoas), Espaço Varanda VIP',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: false,
      temMesaReserva: true,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: false
    },
    temaVisual: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      gradienteHeader: 'from-amber-600 to-orange-700',
      corDestaque: '#d97706'
    }
  },
  DENTISTA: {
    id: 'DENTISTA',
    label: 'Clínica Odontológica',
    icone: '🦷',
    categoriaGeral: 'Saúde Odontológica',
    descricao: 'Consultas dentárias, ortodontia, próteses, clareamento e cirurgias.',
    termoCliente: 'Paciente',
    termoClientes: 'Pacientes',
    termoServico: 'Consulta / Procedimento',
    termoServicos: 'Consultas & Procedimentos',
    termoProfissional: 'Dentista',
    termoProfissionais: 'Cirurgiões-Dentistas',
    termoAgendar: 'Agendar Consulta',
    termoProntuario: 'Odontograma & Prontuário',
    placeholderServico: 'Ex: Profilaxia & Limpeza, Clareamento a Laser, Avaliação Ortodôntica',
    recursos: {
      temProntuario: true,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: false
    },
    temaVisual: {
      badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      gradienteHeader: 'from-cyan-600 to-blue-600',
      corDestaque: '#0891b2'
    }
  },
  MEDICA: {
    id: 'MEDICA',
    label: 'Clínica Médica',
    icone: '🩺',
    categoriaGeral: 'Saúde & Medicina',
    descricao: 'Consultas médicas especializadas, exames clínicos e acompanhamentos.',
    termoCliente: 'Paciente',
    termoClientes: 'Pacientes',
    termoServico: 'Consulta / Exame',
    termoServicos: 'Consultas & Exames',
    termoProfissional: 'Médico',
    termoProfissionais: 'Médicos Especialistas',
    termoAgendar: 'Agendar Consulta',
    termoProntuario: 'Prontuário Médico Eletrônico',
    placeholderServico: 'Ex: Consulta Cardiológica, Ultrassom Clínico, Check-up Geral',
    recursos: {
      temProntuario: true,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: false
    },
    temaVisual: {
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      gradienteHeader: 'from-blue-600 to-indigo-700',
      corDestaque: '#2563eb'
    }
  },
  TATUAGEM: {
    id: 'TATUAGEM',
    label: 'Estúdio de Tatuagem & Piercing',
    icone: '🎨',
    categoriaGeral: 'Arte Corporal',
    descricao: 'Sessões de tatuagem, orçamentos, body piercing e criações autorais.',
    termoCliente: 'Cliente',
    termoClientes: 'Clientes',
    termoServico: 'Sessão / Tatuagem',
    termoServicos: 'Sessões & Projetos',
    termoProfissional: 'Tatuador / Body Piercer',
    termoProfissionais: 'Artistas / Tatuadores',
    termoAgendar: 'Agendar Sessão',
    termoProntuario: 'Histórico & Ficha de Consentimento',
    placeholderServico: 'Ex: Tatuagem Fine Line (até 10cm), Aplicação de Piercing Titânio',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: true
    },
    temaVisual: {
      badge: 'bg-zinc-100 text-zinc-900 border-zinc-300',
      gradienteHeader: 'from-zinc-900 to-black',
      corDestaque: '#18181b'
    }
  },
  PSICOLOGIA: {
    id: 'PSICOLOGIA',
    label: 'Consultório de Psicologia & Terapia',
    icone: '🧠',
    categoriaGeral: 'Saúde Mental',
    descricao: 'Terapia individual, casal, infantil e psicodiagnóstico.',
    termoCliente: 'Paciente',
    termoClientes: 'Pacientes',
    termoServico: 'Sessão de Terapia',
    termoServicos: 'Sessões & Consultas',
    termoProfissional: 'Psicólogo(a) / Terapeuta',
    termoProfissionais: 'Psicólogos e Terapeutas',
    termoAgendar: 'Agendar Sessão',
    termoProntuario: 'Evoluções & Prontuário Psicológico',
    placeholderServico: 'Ex: Terapia Cognitivo-Comportamental (50 min), Orientação Vocacional',
    recursos: {
      temProntuario: true,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: false
    },
    temaVisual: {
      badge: 'bg-teal-50 text-teal-800 border-teal-200',
      gradienteHeader: 'from-teal-600 to-emerald-700',
      corDestaque: '#0d9488'
    }
  },
  NUTRICAO: {
    id: 'NUTRICAO',
    label: 'Nutricionistas & Nutrólogos',
    icone: '🥗',
    categoriaGeral: 'Saúde & Nutrição',
    descricao: 'Planos alimentares, bioimpedância, nutrição clínica e esportiva.',
    termoCliente: 'Paciente',
    termoClientes: 'Pacientes',
    termoServico: 'Consulta Nutricional',
    termoServicos: 'Consultas & Avaliações',
    termoProfissional: 'Nutricionista',
    termoProfissionais: 'Nutricionistas & Nutrólogos',
    termoAgendar: 'Agendar Consulta',
    termoProntuario: 'Anamnese & Plano Alimentar',
    placeholderServico: 'Ex: Consulta + Exame de Bioimpedância, Plano Nutricional Esportivo',
    recursos: {
      temProntuario: true,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: false
    },
    temaVisual: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      gradienteHeader: 'from-emerald-600 to-green-700',
      corDestaque: '#059669'
    }
  },
  PILATES_PERSONAL: {
    id: 'PILATES_PERSONAL',
    label: 'Pilates & Personal Trainer',
    icone: '🧘',
    categoriaGeral: 'Atividade Física',
    descricao: 'Aulas de pilates em aparelhos, treinos personalizados e reabilitação postural.',
    termoCliente: 'Aluno',
    termoClientes: 'Alunos',
    termoServico: 'Aula / Treino',
    termoServicos: 'Aulas & Treinos',
    termoProfissional: 'Instrutor / Personal',
    termoProfissionais: 'Instrutores & Treinadores',
    termoAgendar: 'Agendar Aula',
    termoProntuario: 'Ficha de Evolução & Treino',
    placeholderServico: 'Ex: Aula de Pilates Studio (Max 3 alunos), Treino Personalizado 1h',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: true,
      temLocacaoEnsaio: false,
      temPortfolio: false
    },
    temaVisual: {
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      gradienteHeader: 'from-indigo-600 to-purple-700',
      corDestaque: '#4f46e5'
    }
  },
  SPA_MASSOTERAPIA: {
    id: 'SPA_MASSOTERAPIA',
    label: 'Spas & Massoterapia',
    icone: '🌿',
    categoriaGeral: 'Bem-Estar & Relaxamento',
    descricao: 'Massagens relaxantes, drenagens, banhos terapêuticos e rituais de spa.',
    termoCliente: 'Cliente',
    termoClientes: 'Clientes',
    termoServico: 'Sessão / Massagem',
    termoServicos: 'Sessões & Rituais',
    termoProfissional: 'Massoterapeuta / Terapeuta',
    termoProfissionais: 'Terapeutas Corporais',
    termoAgendar: 'Agendar Sessão',
    termoProntuario: 'Ficha de Saúde & Relaxamento',
    placeholderServico: 'Ex: Massagem Relaxante com Pedras Quentes 60min, Drenagem Linfática',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: true
    },
    temaVisual: {
      badge: 'bg-green-50 text-green-800 border-green-200',
      gradienteHeader: 'from-emerald-700 to-teal-800',
      corDestaque: '#047857'
    }
  },
  ESTETICA_AUTOMOTIVA: {
    id: 'ESTETICA_AUTOMOTIVA',
    label: 'Estética Automotiva / Car Detailing',
    icone: '🚗',
    categoriaGeral: 'Automotivo',
    descricao: 'Lavagem técnica detalhada, polimento comercial, vitrificação e higienização.',
    termoCliente: 'Cliente',
    termoClientes: 'Clientes & Veículos',
    termoServico: 'Serviço / Lavagem',
    termoServicos: 'Serviços Automotivos',
    termoProfissional: 'Detailer / Técnico',
    termoProfissionais: 'Profissionais Técnicos',
    termoAgendar: 'Agendar Serviço',
    termoProntuario: 'Histórico & Prontuário do Veículo',
    placeholderServico: 'Ex: Lavagem Detalhada + Cera Carnaúba, Vitrificação Cerâmica 9H',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: true,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: false,
      temPortfolio: true
    },
    temaVisual: {
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
      gradienteHeader: 'from-slate-800 to-slate-950',
      corDestaque: '#334155'
    }
  },
  ESTUDIO_FOTOGRAFICO: {
    id: 'ESTUDIO_FOTOGRAFICO',
    label: 'Estúdio Fotográfico',
    icone: '📸',
    categoriaGeral: 'Fotografia & Produção',
    descricao: 'Ensaios em estúdio, fotos externas, cobertura de eventos e ensaios corporativos.',
    termoCliente: 'Cliente',
    termoClientes: 'Clientes',
    termoServico: 'Ensaio / Sessão',
    termoServicos: 'Ensaios & Produções',
    termoProfissional: 'Fotógrafo(a)',
    termoProfissionais: 'Fotógrafos',
    termoAgendar: 'Agendar Ensaio',
    termoProntuario: 'Briefing & Ficha do Ensaio',
    placeholderServico: 'Ex: Ensaio Gestante Externo 2h, Ensaio Corporativo em Estúdio',
    recursos: {
      temProntuario: false,
      temVeiculoPlaca: false,
      temMesaReserva: false,
      temTurmaCheckin: false,
      temLocacaoEnsaio: true,
      temPortfolio: true
    },
    temaVisual: {
      badge: 'bg-violet-50 text-violet-800 border-violet-200',
      gradienteHeader: 'from-violet-700 to-purple-900',
      corDestaque: '#6d28d9'
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class SetorService {
  private tenantService = inject(TenantService);

  readonly listaSetores = Object.values(SETORES_CATALOGO);

  setorAtual = computed<SetorAtuacao>(() => {
    const s = this.tenantService.tenant()?.setor;
    if (s && SETORES_CATALOGO[s]) {
      return s;
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('estetica_user_data');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.setor && SETORES_CATALOGO[u.setor as SetorAtuacao]) {
            return u.setor as SetorAtuacao;
          }
        } catch {}
      }
    }
    return 'CLINICA_ESTETICA';
  });

  config = computed<SetorConfig>(() => {
    return SETORES_CATALOGO[this.setorAtual()] || SETORES_CATALOGO.CLINICA_ESTETICA;
  });

  termoCliente = computed(() => this.config().termoCliente);
  termoClientes = computed(() => this.config().termoClientes);
  termoServico = computed(() => this.config().termoServico);
  termoServicos = computed(() => this.config().termoServicos);
  termoProfissional = computed(() => this.config().termoProfissional);
  termoProfissionais = computed(() => this.config().termoProfissionais);
  termoAgendar = computed(() => this.config().termoAgendar);
  termoProntuario = computed(() => this.config().termoProntuario);
  termoProntuarioCurto = computed(() => {
    const p = this.config().termoProntuario;
    if (p.includes('&')) {
      return p.split('&')[0].trim();
    }
    if (p.includes('/')) {
      return p.split('/')[0].trim();
    }
    return p;
  });
  placeholderServico = computed(() => this.config().placeholderServico);
  icone = computed(() => this.config().icone);
  recursos = computed(() => this.config().recursos);

  obterConfig(setor?: SetorAtuacao | string): SetorConfig {
    if (!setor) return SETORES_CATALOGO.CLINICA_ESTETICA;
    return SETORES_CATALOGO[setor as SetorAtuacao] || SETORES_CATALOGO.CLINICA_ESTETICA;
  }
}

