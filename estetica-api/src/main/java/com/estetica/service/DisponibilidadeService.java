package com.estetica.service;

import com.estetica.dto.DisponibilidadeDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.model.*;
import com.estetica.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisponibilidadeService {

    private final ProcedimentoRepository procedimentoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final HorarioTrabalhoRepository horarioTrabalhoRepository;
    private final BloqueioAgendaRepository bloqueioAgendaRepository;
    private final AgendamentoRepository agendamentoRepository;

    private static final int STEP_MINUTOS = 30; // Granularidade da grade
    private static final int ANTECEDENCIA_MINIMA_MINUTOS = 30; // Margem para agendamento no próprio dia

    @Transactional(readOnly = true)
    public DisponibilidadeResponseDTO calcularSlots(Long procedimentoId, Long profissionalId, LocalDate data) {
        Procedimento procedimento = procedimentoRepository.findById(procedimentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Procedimento não encontrado com ID: " + procedimentoId));

        if (data.isBefore(LocalDate.now())) {
            return new DisponibilidadeResponseDTO(data, procedimentoId, procedimento.getTitulo(), procedimento.getDuracaoMinutos(), List.of());
        }

        List<Profissional> profissionaisAlvo;
        if (profissionalId != null && profissionalId > 0) {
            Profissional prof = profissionalRepository.findById(profissionalId)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado com ID: " + profissionalId));
            profissionaisAlvo = List.of(prof);
        } else {
            profissionaisAlvo = profissionalRepository.findHabilitadosParaProcedimento(procedimentoId);
            if (profissionaisAlvo.isEmpty()) {
                profissionaisAlvo = profissionalRepository.findByAtivoTrueOrderByNomeAsc();
            }
        }

        DayOfWeek diaSemana = data.getDayOfWeek();
        LocalDateTime inicioDia = data.atStartOfDay();
        LocalDateTime fimDia = data.atTime(23, 59, 59);
        LocalDateTime agora = LocalDateTime.now();

        List<SlotDisponivelDTO> slotsDisponiveis = new ArrayList<>();
        int duracao = procedimento.getDuracaoMinutos();

        for (Profissional prof : profissionaisAlvo) {
            Optional<HorarioTrabalho> horarioOpt = horarioTrabalhoRepository.findByProfissionalIdAndDiaSemanaAndAtivoTrue(prof.getId(), diaSemana);
            if (horarioOpt.isEmpty()) {
                continue; // Não trabalha neste dia da semana
            }

            HorarioTrabalho jornada = horarioOpt.get();
            LocalTime horaAtual = jornada.getHoraInicio();
            LocalTime horaLimite = jornada.getHoraFim();

            // Buscar agendamentos existentes ativos do profissional no dia
            List<Agendamento> agendamentos = agendamentoRepository.findByProfissionalAndIntervalo(
                    prof.getId(),
                    inicioDia,
                    fimDia,
                    List.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO)
            );

            // Buscar bloqueios de agenda do profissional no intervalo
            List<BloqueioAgenda> bloqueios = bloqueioAgendaRepository.findBloqueiosNoIntervalo(
                    prof.getId(),
                    inicioDia,
                    fimDia
            );

            while (!horaAtual.plusMinutes(duracao).isAfter(horaLimite)) {
                LocalTime slotInicio = horaAtual;
                LocalTime slotFim = slotInicio.plusMinutes(duracao);
                LocalDateTime slotDataHoraInicio = data.atTime(slotInicio);
                LocalDateTime slotDataHoraFim = data.atTime(slotFim);

                // Se for hoje, ignora horários passados ou muito próximos
                if (data.isEqual(LocalDate.now()) && slotDataHoraInicio.isBefore(agora.plusMinutes(ANTECEDENCIA_MINIMA_MINUTOS))) {
                    horaAtual = horaAtual.plusMinutes(STEP_MINUTOS);
                    continue;
                }

                // Verifica colisão com intervalo de almoço/descanso
                boolean colideAlmoco = false;
                if (jornada.getInicioIntervalo() != null && jornada.getFimIntervalo() != null) {
                    if (slotInicio.isBefore(jornada.getFimIntervalo()) && slotFim.isAfter(jornada.getInicioIntervalo())) {
                        colideAlmoco = true;
                    }
                }

                // Verifica colisão com agendamentos existentes
                boolean colideAgendamento = agendamentos.stream().anyMatch(a ->
                        slotDataHoraInicio.isBefore(a.getDataHoraFim()) && slotDataHoraFim.isAfter(a.getDataHoraInicio())
                );

                // Verifica colisão com bloqueios de folga/férias
                boolean colideBloqueio = bloqueios.stream().anyMatch(b ->
                        slotDataHoraInicio.isBefore(b.getDataFim()) && slotDataHoraFim.isAfter(b.getDataInicio())
                );

                if (!colideAlmoco && !colideAgendamento && !colideBloqueio) {
                    slotsDisponiveis.add(new SlotDisponivelDTO(
                            slotInicio,
                            slotFim,
                            prof.getId(),
                            prof.getNome(),
                            prof.getFotoUrl(),
                            prof.getCorIdentificacao()
                    ));
                }

                horaAtual = horaAtual.plusMinutes(STEP_MINUTOS);
            }
        }

        // Ordenar os slots cronologicamente
        slotsDisponiveis.sort(Comparator.comparing(SlotDisponivelDTO::horarioInicio));

        return new DisponibilidadeResponseDTO(
                data,
                procedimento.getId(),
                procedimento.getTitulo(),
                procedimento.getDuracaoMinutos(),
                slotsDisponiveis
        );
    }
}

