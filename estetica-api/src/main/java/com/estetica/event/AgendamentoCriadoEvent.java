package com.estetica.event;

import com.estetica.model.Agendamento;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class AgendamentoCriadoEvent extends ApplicationEvent {
    private final Agendamento agendamento;

    public AgendamentoCriadoEvent(Object source, Agendamento agendamento) {
        super(source);
        this.agendamento = agendamento;
    }
}

