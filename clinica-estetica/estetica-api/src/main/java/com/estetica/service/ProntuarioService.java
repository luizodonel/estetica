package com.estetica.service;

import com.estetica.dto.ProntuarioDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.model.Agendamento;
import com.estetica.model.HistoricoAtendimento;
import com.estetica.model.Profissional;
import com.estetica.model.Usuario;
import com.estetica.repository.AgendamentoRepository;
import com.estetica.repository.HistoricoAtendimentoRepository;
import com.estetica.repository.ProfissionalRepository;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProntuarioService {

    private final HistoricoAtendimentoRepository historicoAtendimentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProfissionalRepository profissionalRepository;
    private final AgendamentoRepository agendamentoRepository;

    @Transactional(readOnly = true)
    public List<HistoricoAtendimentoDTO> buscarHistoricoPorCliente(Long clienteId) {
        return historicoAtendimentoRepository.findByClienteIdOrderByDataAtendimentoDesc(clienteId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public HistoricoAtendimentoDTO salvarAtendimento(SalvarProntuarioRequest req) {
        Usuario cliente = usuarioRepository.findById(req.clienteId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado"));

        Profissional prof = null;
        if (req.profissionalId() != null) {
            prof = profissionalRepository.findById(req.profissionalId()).orElse(null);
        }

        Agendamento agendamento = null;
        if (req.agendamentoId() != null) {
            agendamento = agendamentoRepository.findById(req.agendamentoId()).orElse(null);
        }

        HistoricoAtendimento h = HistoricoAtendimento.builder()
                .cliente(cliente)
                .profissional(prof)
                .agendamento(agendamento)
                .dataAtendimento(LocalDateTime.now())
                .notasAnamnese(req.notasAnamnese())
                .orientacoesPosProcedimento(req.orientacoesPosProcedimento())
                .reacoesAdversas(req.reacoesAdversas())
                .build();

        h = historicoAtendimentoRepository.save(h);
        return toDTO(h);
    }

    private HistoricoAtendimentoDTO toDTO(HistoricoAtendimento h) {
        return new HistoricoAtendimentoDTO(
                h.getId(),
                h.getCliente().getId(),
                h.getCliente().getNome(),
                h.getProfissional() != null ? h.getProfissional().getId() : null,
                h.getProfissional() != null ? h.getProfissional().getNome() : "Clínica",
                h.getAgendamento() != null ? h.getAgendamento().getId() : null,
                h.getDataAtendimento(),
                h.getNotasAnamnese(),
                h.getOrientacoesPosProcedimento(),
                h.getReacoesAdversas()
        );
    }
}

