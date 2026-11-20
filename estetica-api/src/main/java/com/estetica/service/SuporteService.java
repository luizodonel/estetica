package com.estetica.service;

import com.estetica.dto.SuporteDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.SuporteChamado;
import com.estetica.model.SuporteMensagem;
import com.estetica.repository.SuporteChamadoRepository;
import com.estetica.repository.SuporteMensagemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SuporteService {

    private final SuporteChamadoRepository chamadoRepository;
    private final SuporteMensagemRepository mensagemRepository;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public SuporteChamadoDTO criarChamado(CriarChamadoSuporteRequest req) {
        String foneLimpo = normalizarWhatsapp(req.whatsapp());
        if (foneLimpo.length() < 10) {
            throw new RegraNegocioException("Informe um WhatsApp válido com DDD para receber a resposta.");
        }

        String protocolo = gerarProtocoloUnico();
        LocalDateTime agora = LocalDateTime.now();

        String categoria = (req.categoria() != null && !req.categoria().isBlank())
                ? req.categoria().trim().toUpperCase()
                : "DUVIDA";
        String origem = (req.origem() != null && !req.origem().isBlank())
                ? req.origem().trim().toUpperCase()
                : "PLANOS";

        SuporteChamado chamado = SuporteChamado.builder()
                .protocolo(protocolo)
                .nome(req.nome().trim())
                .whatsapp(foneLimpo)
                .email(req.email() != null && !req.email().isBlank() ? req.email().trim() : null)
                .nomeEmpresa(req.nomeEmpresa() != null && !req.nomeEmpresa().isBlank() ? req.nomeEmpresa().trim() : null)
                .assunto(req.assunto().trim())
                .categoria(categoria)
                .status("ABERTO")
                .origem(origem)
                .criadoEm(agora)
                .atualizadoEm(agora)
                .build();
        chamado = chamadoRepository.save(chamado);

        SuporteMensagem msg = SuporteMensagem.builder()
                .chamado(chamado)
                .remetente("CLIENTE")
                .autorNome(chamado.getNome())
                .mensagem(req.mensagem().trim())
                .criadoEm(agora)
                .build();
        mensagemRepository.save(msg);

        return toDTO(chamado);
    }

    @Transactional(readOnly = true)
    public List<SuporteChamadoDTO> consultarChamados(String protocolo, String whatsapp) {
        if (protocolo != null && !protocolo.isBlank()) {
            SuporteChamado chamado = chamadoRepository.findByProtocoloIgnoreCase(protocolo.trim())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Protocolo não encontrado: " + protocolo));
            return List.of(toDTO(chamado));
        }

        if (whatsapp != null && !whatsapp.isBlank()) {
            String fone = normalizarWhatsapp(whatsapp);
            if (fone.length() < 8) {
                throw new RegraNegocioException("Informe o WhatsApp completo com DDD.");
            }
            List<String> variacoes = gerarVariacoesWhatsapp(fone);
            return chamadoRepository.findByWhatsappInOrderByAtualizadoEmDesc(variacoes)
                    .stream()
                    .map(this::toDTO)
                    .toList();
        }

        throw new RegraNegocioException("Informe o número do protocolo ou seu WhatsApp para consultar.");
    }

    @Transactional
    public SuporteChamadoDTO enviarMensagemCliente(String protocolo, ResponderChamadoClienteRequest req) {
        SuporteChamado chamado = chamadoRepository.findByProtocoloIgnoreCase(protocolo.trim())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Protocolo não encontrado: " + protocolo));

        String foneInformado = normalizarWhatsapp(req.whatsapp());
        String foneCadastro = normalizarWhatsapp(chamado.getWhatsapp());
        String ult8Inf = foneInformado.length() >= 8 ? foneInformado.substring(foneInformado.length() - 8) : foneInformado;
        String ult8Cad = foneCadastro.length() >= 8 ? foneCadastro.substring(foneCadastro.length() - 8) : foneCadastro;

        if (!ult8Inf.equals(ult8Cad)) {
            throw new RegraNegocioException("O WhatsApp informado não confere com o protocolo.");
        }

        LocalDateTime agora = LocalDateTime.now();
        SuporteMensagem msg = SuporteMensagem.builder()
                .chamado(chamado)
                .remetente("CLIENTE")
                .autorNome(chamado.getNome())
                .mensagem(req.mensagem().trim())
                .criadoEm(agora)
                .build();
        mensagemRepository.save(msg);

        chamado.setStatus("ABERTO");
        chamado.setAtualizadoEm(agora);
        chamadoRepository.save(chamado);

        return toDTO(chamado);
    }

    private SuporteChamadoDTO toDTO(SuporteChamado c) {
        List<SuporteMensagemDTO> msgs = mensagemRepository.findByChamadoIdOrderByCriadoEmAscIdAsc(c.getId())
                .stream()
                .map(m -> new SuporteMensagemDTO(
                        m.getId(),
                        c.getId(),
                        m.getRemetente(),
                        m.getAutorNome(),
                        m.getMensagem(),
                        m.getCriadoEm()
                ))
                .toList();

        return new SuporteChamadoDTO(
                c.getId(),
                c.getProtocolo(),
                c.getNome(),
                c.getWhatsapp(),
                c.getEmail(),
                c.getNomeEmpresa(),
                c.getAssunto(),
                c.getCategoria(),
                c.getStatus(),
                c.getOrigem(),
                c.getCriadoEm(),
                c.getAtualizadoEm(),
                c.getRespondidoEm(),
                msgs
        );
    }

    private String gerarProtocoloUnico() {
        for (int i = 0; i < 15; i++) {
            int num = 1000 + RANDOM.nextInt(9000);
            String prot = "AG-" + num;
            if (!chamadoRepository.existsByProtocoloIgnoreCase(prot)) {
                return prot;
            }
        }
        return "AG-" + (System.currentTimeMillis() % 100000);
    }

    private String normalizarWhatsapp(String raw) {
        String digits = raw != null ? raw.replaceAll("[^0-9]", "") : "";
        if ((digits.length() == 12 || digits.length() == 13) && digits.startsWith("55")) {
            return digits.substring(2);
        }
        return digits;
    }

    private List<String> gerarVariacoesWhatsapp(String fone) {
        List<String> list = new ArrayList<>();
        list.add(fone);
        list.add("55" + fone);
        if (fone.length() == 11 && fone.charAt(2) == '9') {
            String sem9 = fone.substring(0, 2) + fone.substring(3);
            list.add(sem9);
            list.add("55" + sem9);
        } else if (fone.length() == 10) {
            String com9 = fone.substring(0, 2) + "9" + fone.substring(2);
            list.add(com9);
            list.add("55" + com9);
        }
        return list;
    }
}
