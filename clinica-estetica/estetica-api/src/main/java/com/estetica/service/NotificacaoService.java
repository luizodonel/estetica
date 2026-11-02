package com.estetica.service;

import com.estetica.event.AgendamentoCanceladoEvent;
import com.estetica.event.AgendamentoCriadoEvent;
import com.estetica.model.Agendamento;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class NotificacaoService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    @Async
    @EventListener
    public void onAgendamentoCriado(AgendamentoCriadoEvent event) {
        Agendamento a = event.getAgendamento();
        String horarioFormatado = a.getDataHoraInicio().format(FORMATTER);

        log.info("====================================================================");
        log.info("[NOTIFICAÇÃO ASSÍNCRONA] Confirmação Imediata de Agendamento #{}", a.getId());
        log.info("Destinatário: {} (WhatsApp: {}, Email: {})",
                a.getCliente().getNome(), a.getCliente().getTelefoneWhatsApp(), a.getCliente().getEmail());
        log.info("Procedimento: {} | Profissional: {}", a.getProcedimento().getTitulo(), a.getProfissional().getNome());
        log.info("Data/Horário: {}", horarioFormatado);
        log.info("Mensagem simulada: 'Olá {}, seu agendamento para {} foi confirmado com sucesso para {} com a especialista {}.'",
                a.getCliente().getNome(), a.getProcedimento().getTitulo(), horarioFormatado, a.getProfissional().getNome());
        log.info("====================================================================");
    }

    @Async
    @EventListener
    public void onAgendamentoCancelado(AgendamentoCanceladoEvent event) {
        Agendamento a = event.getAgendamento();
        log.info("====================================================================");
        log.info("[NOTIFICAÇÃO ASSÍNCRONA] Cancelamento de Agendamento #{}", a.getId());
        log.info("Destinatário: {} (WhatsApp: {})", a.getCliente().getNome(), a.getCliente().getTelefoneWhatsApp());
        log.info("Procedimento cancelado: {} no horário {}", a.getProcedimento().getTitulo(), a.getDataHoraInicio().format(FORMATTER));
        log.info("Motivo: {}", event.getMotivo());
        log.info("====================================================================");
    }

    public void enviarLembretePreConsulta(Agendamento a) {
        String horarioFormatado = a.getDataHoraInicio().format(FORMATTER);
        log.info("[LEMBRETE AUTOMÁTICO WHATSAPP/EMAIL] Olá {}, lembre-se do seu procedimento {} amanhã/hoje ({}) na Clínica de Estética!",
                a.getCliente().getNome(), a.getProcedimento().getTitulo(), horarioFormatado);
    }
}

