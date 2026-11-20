package com.estetica.service;

import com.estetica.dto.SuporteDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.*;
import com.estetica.repository.ClinicaTenantRepository;
import com.estetica.repository.SuporteChamadoRepository;
import com.estetica.repository.SuporteMensagemRepository;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SuporteService {

    private final SuporteChamadoRepository chamadoRepository;
    private final SuporteMensagemRepository mensagemRepository;
    private final ClinicaTenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private record DonoAutenticado(
            boolean autenticado,
            boolean isAdminLojista,
            Long usuarioId,
            Long lojistaId,
            Long tenantId,
            String nomeEmpresaPadrao
    ) {}

    @Transactional
    public SuporteChamadoDTO criarChamado(CriarChamadoSuporteRequest req, Authentication authentication) {
        String nome = req.nome() != null ? req.nome().trim() : "";
        if (nome.length() < 2) {
            throw new RegraNegocioException("Informe seu nome completo (mínimo 2 caracteres).");
        }

        String foneLimpo = normalizarWhatsapp(req.whatsapp());
        if (foneLimpo.length() < 10 || foneLimpo.length() > 11 || foneLimpo.chars().distinct().count() <= 1) {
            throw new RegraNegocioException("Informe um número de WhatsApp válido com DDD (10 ou 11 dígitos).");
        }

        String emailLimpo = req.email() != null && !req.email().isBlank() ? req.email().trim() : null;
        if (emailLimpo != null && !EMAIL_PATTERN.matcher(emailLimpo).matches()) {
            throw new RegraNegocioException("Informe um e-mail válido ou deixe o campo em branco.");
        }

        String assunto = req.assunto() != null ? req.assunto().trim() : "";
        if (assunto.length() < 3) {
            throw new RegraNegocioException("Informe o assunto da sua dúvida (mínimo 3 caracteres).");
        }

        String textoMensagem = req.mensagem() != null ? req.mensagem().trim() : "";
        if (textoMensagem.length() < 5) {
            throw new RegraNegocioException("Descreva sua dúvida com pelo menos 5 caracteres.");
        }

        DonoAutenticado dono = extrairDono(authentication);
        String nomeEmpresa = req.nomeEmpresa() != null && !req.nomeEmpresa().isBlank()
                ? req.nomeEmpresa().trim()
                : dono.nomeEmpresaPadrao();

        String protocolo = gerarProtocoloUnico();
        LocalDateTime agora = LocalDateTime.now();

        String categoria = (req.categoria() != null && !req.categoria().isBlank())
                ? req.categoria().trim().toUpperCase()
                : "DUVIDA";
        String origem = (req.origem() != null && !req.origem().isBlank())
                ? req.origem().trim().toUpperCase()
                : (dono.autenticado() ? "PAINEL_LOJISTA" : "PLANOS");

        SuporteChamado chamado = SuporteChamado.builder()
                .protocolo(protocolo)
                .usuarioId(dono.usuarioId())
                .lojistaId(dono.lojistaId())
                .tenantId(dono.tenantId())
                .clienteCadastrado(dono.autenticado())
                .nome(nome)
                .whatsapp(foneLimpo)
                .email(emailLimpo)
                .nomeEmpresa(nomeEmpresa)
                .assunto(assunto)
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
                .mensagem(textoMensagem)
                .criadoEm(agora)
                .build();
        mensagemRepository.save(msg);

        return toDTO(chamado);
    }

    @Transactional(readOnly = true)
    public List<SuporteChamadoDTO> listarMeusChamados(Authentication authentication) {
        DonoAutenticado dono = extrairDono(authentication);
        if (!dono.autenticado()) {
            throw new RegraNegocioException("Faça login para visualizar suas conversas de suporte.");
        }

        List<SuporteChamado> lista;
        if (dono.isAdminLojista()) {
            if (dono.lojistaId() == null && dono.tenantId() == null && dono.usuarioId() == null) {
                return List.of();
            }
            lista = chamadoRepository.findMeusChamados(dono.lojistaId(), dono.tenantId(), dono.usuarioId());
        } else {
            if (dono.usuarioId() == null) {
                return List.of();
            }
            lista = chamadoRepository.findByUsuarioIdOrderByAtualizadoEmDesc(dono.usuarioId());
        }

        return lista.stream().map(this::toDTO).toList();
    }

    @Transactional
    public SuporteChamadoDTO enviarMensagemNoMeuChamado(Long chamadoId, ResponderChamadoClienteRequest req, Authentication authentication) {
        DonoAutenticado dono = extrairDono(authentication);
        if (!dono.autenticado()) {
            throw new RegraNegocioException("Faça login para responder nesta conversa.");
        }

        SuporteChamado chamado = chamadoRepository.findById(chamadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Chamado de suporte não encontrado."));

        if (!pertenceAoDono(chamado, dono)) {
            throw new RegraNegocioException("Acesso negado: você só pode visualizar e responder às suas próprias conversas.");
        }

        String texto = req.mensagem() != null ? req.mensagem().trim() : "";
        if (texto.isEmpty()) {
            throw new RegraNegocioException("Escreva sua mensagem antes de enviar.");
        }

        LocalDateTime agora = LocalDateTime.now();
        SuporteMensagem msg = SuporteMensagem.builder()
                .chamado(chamado)
                .remetente("CLIENTE")
                .autorNome(chamado.getNome())
                .mensagem(texto)
                .criadoEm(agora)
                .build();
        mensagemRepository.save(msg);

        chamado.setStatus("ABERTO");
        chamado.setAtualizadoEm(agora);
        chamadoRepository.save(chamado);

        return toDTO(chamado);
    }

    private boolean pertenceAoDono(SuporteChamado chamado, DonoAutenticado dono) {
        if (!dono.autenticado()) return false;
        if (dono.isAdminLojista()) {
            boolean matchLojista = dono.lojistaId() != null && Objects.equals(chamado.getLojistaId(), dono.lojistaId());
            boolean matchTenant = dono.tenantId() != null && Objects.equals(chamado.getTenantId(), dono.tenantId());
            boolean matchUsuario = dono.usuarioId() != null && Objects.equals(chamado.getUsuarioId(), dono.usuarioId());
            return matchLojista || matchTenant || matchUsuario;
        }
        return dono.usuarioId() != null && Objects.equals(chamado.getUsuarioId(), dono.usuarioId());
    }

    private DonoAutenticado extrairDono(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return new DonoAutenticado(false, false, null, null, null, null);
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof Lojista l) {
            Long tenantId = l.getSlug() != null
                    ? tenantRepository.findBySlugIgnoreCase(l.getSlug()).map(ClinicaTenant::getId).orElse(null)
                    : null;
            return new DonoAutenticado(true, true, null, l.getId(), tenantId, l.getNomeEmpresa());
        }

        if (principal instanceof Usuario uDetached) {
            Usuario u = usuarioRepository.findById(uDetached.getId()).orElse(uDetached);
            boolean ehAdmin = u.getRole() == Role.ROLE_ADMIN;
            ClinicaTenant tenant = u.getTenant();
            if (tenant == null && ehAdmin) {
                tenant = tenantRepository.findByAdminUsuarioId(u.getId()).orElse(null);
            }
            Long tenantId = tenant != null ? tenant.getId() : null;
            Long lojistaId = (tenant != null && tenant.getLojista() != null) ? tenant.getLojista().getId() : null;
            String empresa = tenant != null ? tenant.getNomeEmpresa() : null;
            return new DonoAutenticado(true, ehAdmin, u.getId(), lojistaId, tenantId, empresa);
        }

        return new DonoAutenticado(false, false, null, null, null, null);
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
                Boolean.TRUE.equals(c.getClienteCadastrado()),
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
}
