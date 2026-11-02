package com.estetica.repository;

import com.estetica.model.Agendamento;
import com.estetica.model.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    // Detecção de colisão de horário (Double-Booking Prevention)
    @Query("SELECT COUNT(a) > 0 FROM Agendamento a " +
           "WHERE a.profissional.id = :profissionalId " +
           "AND a.status IN :statuses " +
           "AND a.dataHoraInicio < :fim " +
           "AND a.dataHoraFim > :inicio " +
           "AND (:ignorarId IS NULL OR a.id != :ignorarId)")
    boolean existsConflitoHorario(@Param("profissionalId") Long profissionalId,
                                  @Param("inicio") LocalDateTime inicio,
                                  @Param("fim") LocalDateTime fim,
                                  @Param("statuses") List<StatusAgendamento> statuses,
                                  @Param("ignorarId") Long ignorarId);

    // Agendamentos de um profissional num intervalo de datas
    @Query("SELECT a FROM Agendamento a " +
           "JOIN FETCH a.procedimento " +
           "JOIN FETCH a.cliente " +
           "WHERE a.profissional.id = :profissionalId " +
           "AND a.status IN :statuses " +
           "AND a.dataHoraInicio >= :inicio " +
           "AND a.dataHoraFim <= :fim " +
           "ORDER BY a.dataHoraInicio ASC")
    List<Agendamento> findByProfissionalAndIntervalo(@Param("profissionalId") Long profissionalId,
                                                    @Param("inicio") LocalDateTime inicio,
                                                    @Param("fim") LocalDateTime fim,
                                                    @Param("statuses") List<StatusAgendamento> statuses);

    // Buscar agendamentos de um cliente
    @Query("SELECT a FROM Agendamento a " +
           "JOIN FETCH a.procedimento " +
           "JOIN FETCH a.profissional " +
           "WHERE a.cliente.id = :clienteId " +
           "ORDER BY a.dataHoraInicio DESC")
    List<Agendamento> findByClienteIdOrderByDataHoraInicioDesc(@Param("clienteId") Long clienteId);

    // Agendamentos para o calendário geral (painel administrativo)
    @Query("SELECT a FROM Agendamento a " +
           "JOIN FETCH a.procedimento " +
           "JOIN FETCH a.profissional " +
           "JOIN FETCH a.cliente " +
           "WHERE a.dataHoraInicio >= :inicio AND a.dataHoraFim <= :fim " +
           "ORDER BY a.dataHoraInicio ASC")
    List<Agendamento> findAgendamentosCalendario(@Param("inicio") LocalDateTime inicio,
                                                @Param("fim") LocalDateTime fim);

    // Agendamentos para lembretes automáticos
    @Query("SELECT a FROM Agendamento a " +
           "JOIN FETCH a.cliente " +
           "JOIN FETCH a.procedimento " +
           "JOIN FETCH a.profissional " +
           "WHERE a.status = :status " +
           "AND a.lembreteEnviado = false " +
           "AND a.dataHoraInicio BETWEEN :de AND :ate")
    List<Agendamento> findAgendamentosParaLembrete(@Param("status") StatusAgendamento status,
                                                  @Param("de") LocalDateTime de,
                                                  @Param("ate") LocalDateTime ate);

    // Contadores para o Dashboard
    long countByStatus(StatusAgendamento status);
    
    @Query("SELECT COUNT(a) FROM Agendamento a WHERE a.dataHoraInicio BETWEEN :inicio AND :fim")
    long countAgendamentosNoPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);
}

