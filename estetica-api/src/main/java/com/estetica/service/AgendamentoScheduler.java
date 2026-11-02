package com.estetica.service;

import com.estetica.model.Agendamento;
import com.estetica.model.StatusAgendamento;
import com.estetica.repository.AgendamentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AgendamentoScheduler {

    private final AgendamentoRepository agendamentoRepository;
    private final NotificacaoService notificacaoService;

    // Roda a cada 15 minutos procurando agendamentos nas próximas 24 horas que ainda não receberam lembrete
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void processarLembretesPreConsulta() {
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime daqui24Horas = agora.plusHours(24);

        List<Agendamento> agendamentosParaLembrar = agendamentoRepository.findAgendamentosParaLembrete(
                StatusAgendamento.CONFIRMADO,
                agora,
                daqui24Horas
        );

        if (!agendamentosParaLembrar.isEmpty()) {
            log.info("[SCHEDULER] Encontrados {} agendamentos elegíveis para disparo de lembrete de consulta.", agendamentosParaLembrar.size());
            for (Agendamento a : agendamentosParaLembrar) {
                try {
                    notificacaoService.enviarLembretePreConsulta(a);
                    a.setLembreteEnviado(true);
                    agendamentoRepository.save(a);
                } catch (Exception e) {
                    log.error("Erro ao enviar lembrete para agendamento #{}", a.getId(), e);
                }
            }
        }
    }
}

