package com.estetica.service;

import com.estetica.dto.AgendamentoDTOs.*;
import com.estetica.event.AgendamentoCanceladoEvent;
import com.estetica.event.AgendamentoCriadoEvent;
import com.estetica.exception.HorarioIndisponivelException;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.*;
import com.estetica.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ProcedimentoRepository procedimentoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final BloqueioAgendaRepository bloqueioAgendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final TenantResolverService tenantResolverService;
    private final ClinicaTenantRepository tenantRepository;

    private static final int HORAS_MINIMAS_CANCELAMENTO = 2;

    @Transactional
    public AgendamentoDTO criarAgendamento(Object principal, CriarAgendamentoRequest request) {
        Usuario cliente;
        ClinicaTenant tenant;

        if (principal == null) {
            // Agendamento online feito diretamente pelo cliente (sem necessidade de login ou senha)
            Procedimento proc = procedimentoRepository.findById(request.procedimentoId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Procedimento não encontrado com ID: " + request.procedimentoId()));

            tenant = tenantResolverService.resolverTenantPorSlugOuAutenticado(request.slug());
            if (tenant == null) {
                tenant = proc.getTenant();
            }
            if (tenant == null) {
                tenant = tenantRepository.findAll().stream().findFirst().orElse(null);
            }

            String nomeCliente = request.clienteNome() != null && !request.clienteNome().isBlank() 
                    ? request.clienteNome().trim() : "Cliente";
            String telefoneLimpo = request.clienteTelefone() != null 
                    ? request.clienteTelefone().replaceAll("[^0-9]", "") : "";

            if (telefoneLimpo.isBlank() || telefoneLimpo.length() < 8) {
                throw new RegraNegocioException("Por favor, informe seu WhatsApp com DDD para confirmar o agendamento.");
            }
            if (telefoneLimpo.length() > 30) {
                telefoneLimpo = telefoneLimpo.substring(0, 30);
            }

            final Long tid = tenant != null ? tenant.getId() : null;
            cliente = buscarClientePorTelefoneNoTenant(tid, telefoneLimpo);

            if (cliente == null) {
                cliente = Usuario.builder()
                        .nome(nomeCliente)
                        .telefoneWhatsApp(telefoneLimpo)
                        .email(request.clienteEmail() != null && !request.clienteEmail().isBlank() ? request.clienteEmail().trim() : null)
                        .role(Role.ROLE_CLIENTE)
                        .ativo(true)
                        .tenant(tenant)
                        .senhaHash("SEM_LOGIN")
                        .build();
                cliente = usuarioRepository.save(cliente);
            } else {
                if (request.clienteNome() != null && !request.clienteNome().isBlank()) {
                    cliente.setNome(nomeCliente);
                }
                if (request.clienteEmail() != null && !request.clienteEmail().isBlank()) {
                    cliente.setEmail(request.clienteEmail().trim());
                }
                cliente = usuarioRepository.save(cliente);
            }
        } else if (principal instanceof com.estetica.model.Lojista lojista) {
            tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
            if (tenant == null && lojista.getSlug() != null) {
                tenant = tenantRepository.findBySlugIgnoreCase(lojista.getSlug()).orElse(null);
            }

            if (request.clienteId() != null) {
                cliente = usuarioRepository.findById(request.clienteId())
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente selecionado não encontrado com ID: " + request.clienteId()));
                if (tenant != null && cliente.getTenant() != null && !cliente.getTenant().getId().equals(tenant.getId())) {
                    throw new RegraNegocioException("Acesso negado: Este cliente pertence a outro estabelecimento.");
                }
            } else if (request.clienteNome() != null && request.clienteTelefone() != null) {
                String telLimpo = request.clienteTelefone().replaceAll("[^0-9]", "");
                if (telLimpo.length() > 30) {
                    telLimpo = telLimpo.substring(0, 30);
                }
                final Long tid = tenant != null ? tenant.getId() : null;
                cliente = buscarClientePorTelefoneNoTenant(tid, telLimpo);
                if (cliente == null) {
                    cliente = Usuario.builder()
                            .nome(request.clienteNome().trim())
                            .telefoneWhatsApp(telLimpo)
                            .email(request.clienteEmail() != null && !request.clienteEmail().isBlank() ? request.clienteEmail().trim() : null)
                            .role(Role.ROLE_CLIENTE)
                            .ativo(true)
                            .tenant(tenant)
                            .senhaHash("SEM_LOGIN")
                            .build();
                    cliente = usuarioRepository.save(cliente);
                }
            } else {
                throw new RegraNegocioException("Como administrador, selecione um cliente cadastrado ou informe nome e WhatsApp.");
            }
        } else if (principal instanceof Usuario usuario) {
            tenant = usuario.getTenant() != null ? usuario.getTenant() : tenantResolverService.getTenantDoUsuarioAutenticado();

            if (usuario.getRole() == Role.ROLE_ADMIN || usuario.getRole() == Role.ROLE_PROFISSIONAL) {
                if (request.clienteId() != null) {
                    cliente = usuarioRepository.findById(request.clienteId())
                            .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente selecionado não encontrado com ID: " + request.clienteId()));
                    if (tenant != null && cliente.getTenant() != null && !cliente.getTenant().getId().equals(tenant.getId())) {
                        throw new RegraNegocioException("Acesso negado: Este cliente pertence a outro estabelecimento.");
                    }
                } else if (request.clienteNome() != null && request.clienteTelefone() != null) {
                    String telLimpo = request.clienteTelefone().replaceAll("[^0-9]", "");
                    if (telLimpo.length() > 30) {
                        telLimpo = telLimpo.substring(0, 30);
                    }
                    final Long tid = tenant != null ? tenant.getId() : null;
                    cliente = buscarClientePorTelefoneNoTenant(tid, telLimpo);
                    if (cliente == null) {
                        cliente = Usuario.builder()
                                .nome(request.clienteNome().trim())
                                .telefoneWhatsApp(telLimpo)
                                .email(request.clienteEmail() != null && !request.clienteEmail().isBlank() ? request.clienteEmail().trim() : null)
                                .role(Role.ROLE_CLIENTE)
                                .ativo(true)
                                .tenant(tenant)
                                .senhaHash("SEM_LOGIN")
                                .build();
                        cliente = usuarioRepository.save(cliente);
                    }
                } else {
                    throw new RegraNegocioException("Como especialista ou administrador, selecione um cliente cadastrado ou informe nome e WhatsApp.");
                }
            } else {
                cliente = usuario;
            }
        } else {
            throw new org.springframework.security.authentication.BadCredentialsException("Tipo de credencial inválido.");
        }

        Procedimento procedimento = procedimentoRepository.findById(request.procedimentoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Procedimento não encontrado com ID: " + request.procedimentoId()));

        if (!procedimento.getAtivo()) {
            throw new RegraNegocioException("Procedimento inativo no momento.");
        }

        if (tenant == null && procedimento.getTenant() != null) {
            tenant = procedimento.getTenant();
        }

        int duracaoTotalMinutos = procedimento.getDuracaoMinutos();
        java.math.BigDecimal valorTotalCobrado = procedimento.getPreco();

        if (request.procedimentosIds() != null && request.procedimentosIds().size() > 1) {
            List<Procedimento> combo = procedimentoRepository.findAllById(request.procedimentosIds());
            if (!combo.isEmpty()) {
                int somaDuracao = 0;
                java.math.BigDecimal somaValor = java.math.BigDecimal.ZERO;
                for (Procedimento pItem : combo) {
                    if (!Boolean.TRUE.equals(pItem.getAtivo())) {
                        throw new RegraNegocioException("Um dos procedimentos selecionados está inativo: " + pItem.getTitulo());
                    }
                    if (tenant != null && pItem.getTenant() != null && !pItem.getTenant().getId().equals(tenant.getId())) {
                        throw new RegraNegocioException("Procedimento não pertence a este estabelecimento.");
                    }
                    somaDuracao += pItem.getDuracaoMinutos() != null ? pItem.getDuracaoMinutos() : 30;
                    somaValor = somaValor.add(pItem.getPreco() != null ? pItem.getPreco() : java.math.BigDecimal.ZERO);
                }
                duracaoTotalMinutos = somaDuracao;
                valorTotalCobrado = somaValor;
            }
        }

        Profissional profissional;
        if (request.profissionalId() != null && request.profissionalId() > 0) {
            profissional = profissionalRepository.findById(request.profissionalId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado com ID: " + request.profissionalId()));
            if (tenant != null && profissional.getTenant() != null && !profissional.getTenant().getId().equals(tenant.getId())) {
                throw new RegraNegocioException("O especialista selecionado não pertence a este estabelecimento.");
            }
        } else {
            // Primeiro profissional habilitado disponível do próprio tenant
            List<Profissional> habilitados = (tenant != null)
                    ? profissionalRepository.findHabilitadosParaProcedimentoETenant(procedimento.getId(), tenant.getId())
                    : profissionalRepository.findHabilitadosParaProcedimento(procedimento.getId());
            if (habilitados.isEmpty()) {
                habilitados = (tenant != null)
                        ? profissionalRepository.findByTenantIdAndAtivoTrueOrderByNomeAsc(tenant.getId())
                        : profissionalRepository.findByAtivoTrueOrderByNomeAsc();
            }
            if (habilitados.isEmpty()) {
                throw new RegraNegocioException("Nenhum profissional disponível no momento.");
            }
            profissional = habilitados.get(0);
        }

        LocalDateTime inicio = request.dataHoraInicio();
        LocalDateTime fim = inicio.plusMinutes(duracaoTotalMinutos);

        LocalDateTime agoraBrasil = LocalDateTime.now(DisponibilidadeService.ZONE_BRASIL);
        if (inicio.isBefore(agoraBrasil.minusMinutes(5))) {
            throw new RegraNegocioException("Não é permitido agendar em datas/horários passados.");
        }

        // Validação Estrita de Bloqueio de Agenda (Trava feita pelo especialista ou admin)
        boolean bloqueado = bloqueioAgendaRepository.existsConflitoBloqueio(profissional.getId(), inicio, fim);
        if (bloqueado) {
            throw new HorarioIndisponivelException("A agenda deste especialista está travada/bloqueada neste horário.");
        }

        // Validação Estrita de Concorrência e Double-Booking
        boolean conflito = agendamentoRepository.existsConflitoHorario(
                profissional.getId(),
                inicio,
                fim,
                List.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO),
                null
        );

        if (conflito) {
            log.warn("Tentativa de double-booking detectada para o profissional {} entre {} e {}",
                    profissional.getNome(), inicio, fim);
            throw new HorarioIndisponivelException("O horário selecionado acabou de ser reservado por outro cliente. Por favor, escolha outro slot.");
        }

        if (tenant == null && profissional.getTenant() != null) {
            tenant = profissional.getTenant();
        }

        Agendamento agendamento = Agendamento.builder()
                .cliente(cliente)
                .profissional(profissional)
                .procedimento(procedimento)
                .tenant(tenant)
                .dataHoraInicio(inicio)
                .dataHoraFim(fim)
                .status(StatusAgendamento.CONFIRMADO)
                .valorCobrado(valorTotalCobrado)
                .observacoesCliente(request.observacoesCliente())
                .dataCriacao(LocalDateTime.now())
                .build();

        agendamento = agendamentoRepository.save(agendamento);

        // Dispara evento assíncrono para notificação imediata
        eventPublisher.publishEvent(new AgendamentoCriadoEvent(this, agendamento));

        return toDTO(agendamento);
    }

    @Transactional
    public AgendamentoDTO criarAgendamento(Long usuarioAutenticadoId, CriarAgendamentoRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado com ID: " + usuarioAutenticadoId));
        return criarAgendamento(usuario, request);
    }

    @Transactional(readOnly = true)
    public List<AgendamentoDTO> listarMeusAgendamentos(Object principal) {
        if (principal instanceof Usuario usuario) {
            return agendamentoRepository.findByClienteIdOrderByDataHoraInicioDesc(usuario.getId())
                    .stream()
                    .map(this::toDTO)
                    .toList();
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public List<AgendamentoDTO> listarMeusAgendamentos(Long clienteId) {
        return agendamentoRepository.findByClienteIdOrderByDataHoraInicioDesc(clienteId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AgendamentoDTO> listarCalendarioGeral(LocalDateTime inicio, LocalDateTime fim, Object principal) {
        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        List<Agendamento> agendamentos = (tenant != null)
                ? agendamentoRepository.findAgendamentosCalendarioTenant(tenant.getId(), inicio, fim)
                : agendamentoRepository.findAgendamentosCalendario(inicio, fim);

        if (principal instanceof Usuario usuario && usuario.getRole() == Role.ROLE_PROFISSIONAL) {
            return agendamentos.stream()
                    .filter(a -> a.getProfissional() != null && a.getProfissional().getUsuario() != null
                            && a.getProfissional().getUsuario().getId().equals(usuario.getId()))
                    .map(this::toDTO)
                    .toList();
        }
        return agendamentos.stream()
                .map(this::toDTO)
                .toList();
    }

    private Usuario buscarClientePorTelefoneNoTenant(Long tenantId, String telefone) {
        if (tenantId != null) {
            return usuarioRepository.findFirstByTenantIdAndTelefoneWhatsApp(tenantId, telefone).orElse(null);
        }
        return usuarioRepository.findAllByTelefoneWhatsApp(telefone).stream().findFirst().orElse(null);
    }

    @Transactional
    public AgendamentoDTO cancelarAgendamento(Long agendamentoId, Object principal, String motivo) {
        Agendamento agendamento = agendamentoRepository.findById(agendamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado com ID: " + agendamentoId));
        tenantResolverService.validarPertenceAoTenantAtual(agendamento.getTenant(),
                "Acesso negado: Este agendamento pertence a outro estabelecimento.");

        boolean isAdmin = false;
        Long usuarioId = null;

        if (principal instanceof com.estetica.model.Lojista) {
            isAdmin = true;
        } else if (principal instanceof Usuario u) {
            isAdmin = (u.getRole() == Role.ROLE_ADMIN || u.getRole() == Role.ROLE_PROFISSIONAL);
            usuarioId = u.getId();
        }

        if (!isAdmin && (usuarioId == null || !agendamento.getCliente().getId().equals(usuarioId))) {
            throw new RegraNegocioException("Você não tem permissão para cancelar este agendamento.");
        }

        if (agendamento.getStatus() == StatusAgendamento.CANCELADO) {
            throw new RegraNegocioException("Este agendamento já está cancelado.");
        }

        if (agendamento.getStatus() == StatusAgendamento.CONCLUIDO) {
            throw new RegraNegocioException("Não é possível cancelar um agendamento já concluído.");
        }

        // Validação da regra de antecedência mínima de 2 horas (para clientes comuns)
        if (!isAdmin) {
            long horasAteInicio = ChronoUnit.HOURS.between(LocalDateTime.now(), agendamento.getDataHoraInicio());
            if (horasAteInicio < HORAS_MINIMAS_CANCELAMENTO) {
                throw new RegraNegocioException("O cancelamento só pode ser realizado com no mínimo " +
                        HORAS_MINIMAS_CANCELAMENTO + " horas de antecedência. Entre em contato com o estabelecimento.");
            }
        }

        agendamento.setStatus(StatusAgendamento.CANCELADO);
        if (motivo != null && !motivo.isBlank()) {
            agendamento.setNotasInternas((agendamento.getNotasInternas() == null ? "" : agendamento.getNotasInternas() + " | ") +
                    "Cancelado: " + motivo);
        }

        agendamento = agendamentoRepository.save(agendamento);
        eventPublisher.publishEvent(new AgendamentoCanceladoEvent(this, agendamento, motivo));

        return toDTO(agendamento);
    }

    @Transactional
    public AgendamentoDTO remarcarAgendamento(Long agendamentoId, Object principal, RemarcarAgendamentoRequest request) {
        Agendamento agendamento = agendamentoRepository.findById(agendamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado com ID: " + agendamentoId));
        tenantResolverService.validarPertenceAoTenantAtual(agendamento.getTenant(),
                "Acesso negado: Este agendamento pertence a outro estabelecimento.");

        boolean isAdmin = false;
        Long usuarioId = null;

        if (principal instanceof com.estetica.model.Lojista) {
            isAdmin = true;
        } else if (principal instanceof Usuario u) {
            isAdmin = (u.getRole() == Role.ROLE_ADMIN || u.getRole() == Role.ROLE_PROFISSIONAL);
            usuarioId = u.getId();
        }

        if (!isAdmin && (usuarioId == null || !agendamento.getCliente().getId().equals(usuarioId))) {
            throw new RegraNegocioException("Você não tem permissão para remarcar este agendamento.");
        }

        if (agendamento.getStatus() == StatusAgendamento.CANCELADO || agendamento.getStatus() == StatusAgendamento.CONCLUIDO) {
            throw new RegraNegocioException("Não é possível remarcar um agendamento com status " + agendamento.getStatus());
        }

        if (!isAdmin) {
            long horasAteInicio = ChronoUnit.HOURS.between(LocalDateTime.now(), agendamento.getDataHoraInicio());
            if (horasAteInicio < HORAS_MINIMAS_CANCELAMENTO) {
                throw new RegraNegocioException("A remarcação online deve ser feita com antecedência mínima de " +
                        HORAS_MINIMAS_CANCELAMENTO + " horas.");
            }
        }

        Profissional profissional = agendamento.getProfissional();
        if (request.novoProfissionalId() != null && request.novoProfissionalId() > 0) {
            profissional = profissionalRepository.findById(request.novoProfissionalId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado"));
        }

        LocalDateTime novoInicio = request.novaDataHoraInicio();
        long duracaoOriginal = (agendamento.getDataHoraInicio() != null && agendamento.getDataHoraFim() != null)
                ? Math.max(15, ChronoUnit.MINUTES.between(agendamento.getDataHoraInicio(), agendamento.getDataHoraFim()))
                : agendamento.getProcedimento().getDuracaoMinutos();
        LocalDateTime novoFim = novoInicio.plusMinutes(duracaoOriginal);

        if (novoInicio.isBefore(LocalDateTime.now(DisponibilidadeService.ZONE_BRASIL).minusMinutes(5))) {
            throw new RegraNegocioException("Não é permitido remarcar para horários passados.");
        }

        boolean bloqueado = bloqueioAgendaRepository.existsConflitoBloqueio(profissional.getId(), novoInicio, novoFim);
        if (bloqueado) {
            throw new HorarioIndisponivelException("A agenda deste especialista está travada/bloqueada neste novo horário.");
        }

        boolean conflito = agendamentoRepository.existsConflitoHorario(
                profissional.getId(),
                novoInicio,
                novoFim,
                List.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO),
                agendamento.getId()
        );

        if (conflito) {
            throw new HorarioIndisponivelException("O novo horário selecionado já está ocupado. Por favor, escolha outro slot.");
        }

        agendamento.setProfissional(profissional);
        agendamento.setDataHoraInicio(novoInicio);
        agendamento.setDataHoraFim(novoFim);
        agendamento.setStatus(StatusAgendamento.CONFIRMADO);
        agendamento = agendamentoRepository.save(agendamento);

        return toDTO(agendamento);
    }

    @Transactional
    public AgendamentoDTO atualizarStatusOperacional(Long agendamentoId, AtualizarStatusRequest request) {
        Agendamento agendamento = agendamentoRepository.findById(agendamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado com ID: " + agendamentoId));
        tenantResolverService.validarPertenceAoTenantAtual(agendamento.getTenant(),
                "Acesso negado: Este agendamento pertence a outro estabelecimento.");

        agendamento.setStatus(request.status());
        if (request.notasInternas() != null && !request.notasInternas().isBlank()) {
            agendamento.setNotasInternas(request.notasInternas());
        }

        agendamento = agendamentoRepository.save(agendamento);
        return toDTO(agendamento);
    }

    public AgendamentoDTO toDTO(Agendamento a) {
        int duracaoEfetiva = (a.getDataHoraInicio() != null && a.getDataHoraFim() != null)
                ? (int) Math.max(1, ChronoUnit.MINUTES.between(a.getDataHoraInicio(), a.getDataHoraFim()))
                : a.getProcedimento().getDuracaoMinutos();
        String tituloExibicao = (a.getObservacoesCliente() != null && a.getObservacoesCliente().startsWith("Combo: "))
                ? a.getObservacoesCliente()
                : a.getProcedimento().getTitulo();
        return new AgendamentoDTO(
                a.getId(),
                a.getCliente().getId(),
                a.getCliente().getNome(),
                a.getCliente().getEmail(),
                a.getCliente().getTelefoneWhatsApp(),
                a.getProfissional().getId(),
                a.getProfissional().getNome(),
                a.getProfissional().getFotoUrl(),
                a.getProfissional().getCorIdentificacao(),
                a.getProcedimento().getId(),
                tituloExibicao,
                duracaoEfetiva,
                a.getValorCobrado(),
                a.getDataHoraInicio(),
                a.getDataHoraFim(),
                a.getStatus(),
                a.getObservacoesCliente(),
                a.getNotasInternas(),
                a.getDataCriacao()
        );
    }
}

