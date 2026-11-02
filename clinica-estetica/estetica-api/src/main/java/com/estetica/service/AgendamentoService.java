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
    private final UsuarioRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final int HORAS_MINIMAS_CANCELAMENTO = 2;

    @Transactional
    public AgendamentoDTO criarAgendamento(Long usuarioAutenticadoId, CriarAgendamentoRequest request) {
        Usuario usuarioAutenticado = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado com ID: " + usuarioAutenticadoId));

        Usuario cliente;
        if (usuarioAutenticado.getRole() == Role.ROLE_ADMIN || usuarioAutenticado.getRole() == Role.ROLE_PROFISSIONAL) {
            if (request.clienteId() == null) {
                throw new RegraNegocioException("Como administrador ou especialista, você deve selecionar o paciente para o qual a consulta será marcada.");
            }
            cliente = usuarioRepository.findById(request.clienteId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Paciente selecionado não encontrado com ID: " + request.clienteId()));
        } else {
            cliente = usuarioAutenticado;
        }

        Procedimento procedimento = procedimentoRepository.findById(request.procedimentoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Procedimento não encontrado com ID: " + request.procedimentoId()));

        if (!procedimento.getAtivo()) {
            throw new RegraNegocioException("Procedimento inativo no momento.");
        }

        Profissional profissional;
        if (request.profissionalId() != null && request.profissionalId() > 0) {
            profissional = profissionalRepository.findById(request.profissionalId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado com ID: " + request.profissionalId()));
        } else {
            // Primeiro profissional habilitado disponível
            List<Profissional> habilitados = profissionalRepository.findHabilitadosParaProcedimento(procedimento.getId());
            if (habilitados.isEmpty()) {
                habilitados = profissionalRepository.findByAtivoTrueOrderByNomeAsc();
            }
            if (habilitados.isEmpty()) {
                throw new RegraNegocioException("Nenhum profissional disponível no momento.");
            }
            profissional = habilitados.get(0);
        }

        LocalDateTime inicio = request.dataHoraInicio();
        LocalDateTime fim = inicio.plusMinutes(procedimento.getDuracaoMinutos());

        if (inicio.isBefore(LocalDateTime.now())) {
            throw new RegraNegocioException("Não é permitido agendar em datas/horários passados.");
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

        Agendamento agendamento = Agendamento.builder()
                .cliente(cliente)
                .profissional(profissional)
                .procedimento(procedimento)
                .dataHoraInicio(inicio)
                .dataHoraFim(fim)
                .status(StatusAgendamento.CONFIRMADO) // ou PENDENTE se exigisse pré-aprovação
                .valorCobrado(procedimento.getPreco())
                .observacoesCliente(request.observacoesCliente())
                .dataCriacao(LocalDateTime.now())
                .build();

        agendamento = agendamentoRepository.save(agendamento);

        // Dispara evento assíncrono para notificação imediata
        eventPublisher.publishEvent(new AgendamentoCriadoEvent(this, agendamento));

        return toDTO(agendamento);
    }

    @Transactional(readOnly = true)
    public List<AgendamentoDTO> listarMeusAgendamentos(Long clienteId) {
        return agendamentoRepository.findByClienteIdOrderByDataHoraInicioDesc(clienteId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AgendamentoDTO> listarCalendarioGeral(LocalDateTime inicio, LocalDateTime fim) {
        return agendamentoRepository.findAgendamentosCalendario(inicio, fim)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public AgendamentoDTO cancelarAgendamento(Long agendamentoId, Long usuarioId, boolean isAdmin, String motivo) {
        Agendamento agendamento = agendamentoRepository.findById(agendamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado com ID: " + agendamentoId));

        if (!isAdmin && !agendamento.getCliente().getId().equals(usuarioId)) {
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
                        HORAS_MINIMAS_CANCELAMENTO + " horas de antecedência. Entre em contato com a clínica.");
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
    public AgendamentoDTO remarcarAgendamento(Long agendamentoId, Long usuarioId, boolean isAdmin, RemarcarAgendamentoRequest request) {
        Agendamento agendamento = agendamentoRepository.findById(agendamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado com ID: " + agendamentoId));

        if (!isAdmin && !agendamento.getCliente().getId().equals(usuarioId)) {
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
        LocalDateTime novoFim = novoInicio.plusMinutes(agendamento.getProcedimento().getDuracaoMinutos());

        if (novoInicio.isBefore(LocalDateTime.now())) {
            throw new RegraNegocioException("Não é permitido remarcar para horários passados.");
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

        agendamento.setStatus(request.status());
        if (request.notasInternas() != null && !request.notasInternas().isBlank()) {
            agendamento.setNotasInternas(request.notasInternas());
        }

        agendamento = agendamentoRepository.save(agendamento);
        return toDTO(agendamento);
    }

    public AgendamentoDTO toDTO(Agendamento a) {
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
                a.getProcedimento().getTitulo(),
                a.getProcedimento().getDuracaoMinutos(),
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

