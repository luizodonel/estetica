package com.estetica.event;

import com.estetica.model.Agendamento;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class AgendamentoCanceladoEvent extends ApplicationEvent {
    private final Agendamento agendamento;
    private final String motivo;

    public AgendamentoCanceladoEvent(Object source, Agendamento agendamento, String motivo) {
        super(source);
        this.agendamento = agendamento;
        this.motivo = motivo;
    }
}

