package com.estetica.service;

import com.estetica.dto.ProfissionalDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.*;
import com.estetica.repository.BloqueioAgendaRepository;
import com.estetica.repository.HorarioTrabalhoRepository;
import com.estetica.repository.ProcedimentoRepository;
import com.estetica.repository.ProfissionalRepository;
import com.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProfissionalService {

    private final ProfissionalRepository profissionalRepository;
    private final HorarioTrabalhoRepository horarioTrabalhoRepository;
    private final BloqueioAgendaRepository bloqueioAgendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProcedimentoRepository procedimentoRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantResolverService tenantResolverService;

    @Transactional(readOnly = true)
    public List<ProfissionalDTO> listarTodos() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        List<Profissional> profs = (tenant != null)
                ? profissionalRepository.findByTenantIdAndAtivoTrueOrderByNomeAsc(tenant.getId())
                : profissionalRepository.findByAtivoTrueOrderByNomeAsc();

        return profs.stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProfissionalDTO> listarTodosAdmin() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        List<Profissional> profs = (tenant != null)
                ? profissionalRepository.findByTenantIdOrderByNomeAsc(tenant.getId())
                : profissionalRepository.findAll();

        return profs.stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProfissionalDTO> listarHabilitados(Long procedimentoId) {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        List<Profissional> profs = (tenant != null)
                ? profissionalRepository.findHabilitadosParaProcedimentoETenant(procedimentoId, tenant.getId())
                : profissionalRepository.findHabilitadosParaProcedimento(procedimentoId);

        return profs.stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HorarioTrabalhoDTO> listarJornada(Long profissionalId) {
        return horarioTrabalhoRepository.findByProfissionalId(profissionalId)
                .stream()
                .map(this::toHorarioDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfissionalDTO obterMeuPerfil(Usuario usuario) {
        Profissional prof = profissionalRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Perfil de especialista não encontrado para o usuário logado."));
        return toDTO(prof);
    }

    @Transactional
    public ProfissionalDTO criarProfissional(CriarProfissionalRequest request) {
        String cleanPhone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        if (cleanPhone.length() < 8) {
            throw new RegraNegocioException("Número de WhatsApp inválido.");
        }

        if (usuarioRepository.existsByTelefoneWhatsApp(cleanPhone)) {
            throw new RegraNegocioException(
                    "Já existe um especialista ou usuário cadastrado com o WhatsApp: " + cleanPhone);
        }

        String email = (request.email() != null && !request.email().isBlank())
                ? request.email().toLowerCase().trim()
                : "tel" + cleanPhone + "@especialista.local";

        if (request.email() != null && !request.email().isBlank() && usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Já existe um usuário com o e-mail: " + email);
        }

        ClinicaTenant adminTenant = tenantResolverService.getTenantDoUsuarioAutenticado();

        // Senha temporária caso não informada (o especialista definirá no Primeiro
        // Acesso via WhatsApp)
        String senha = (request.senha() != null && !request.senha().isBlank())
                ? request.senha()
                : java.util.UUID.randomUUID().toString();

        String cleanLogin = (request.login() != null && !request.login().isBlank())
                ? request.login().trim().toLowerCase()
                : null;

        if (cleanLogin != null && usuarioRepository.existsByLoginIgnoreCase(cleanLogin)) {
            throw new RegraNegocioException(
                    "Já existe um especialista ou usuário cadastrado com o login: " + cleanLogin);
        }

        // Cria a conta de acesso como ROLE_PROFISSIONAL com primeiro_acesso = true
        Usuario usuario = Usuario.builder()
                .nome(request.nome().trim())
                .login(cleanLogin)
                .email(email)
                .telefoneWhatsApp(cleanPhone)
                .senhaHash(passwordEncoder.encode(senha))
                .role(Role.ROLE_PROFISSIONAL)
                .tenant(adminTenant)
                .primeiroAcesso(request.senha() == null || request.senha().isBlank())
                .ativo(true)
                .build();
        usuario = usuarioRepository.save(usuario);

        // Procedimentos habilitados
        Set<Procedimento> procedimentos = new HashSet<>();
        if (request.procedimentosIds() != null && !request.procedimentosIds().isEmpty()) {
            procedimentos.addAll(procedimentoRepository.findAllById(request.procedimentosIds()));
        }

        Profissional prof = Profissional.builder()
                .usuario(usuario)
                .tenant(adminTenant)
                .nome(request.nome().trim())
                .especialidade(request.especialidade())
                .bio(request.bio())
                .fotoUrl(request.fotoUrl())
                .corIdentificacao(request.corIdentificacao() != null ? request.corIdentificacao() : "#f43f5e")
                .ativo(true)
                .procedimentos(procedimentos)
                .build();

        prof = profissionalRepository.save(prof);

        // Cria jornada semanal padrão (Segunda a Sexta, 08:00 às 18:00, almoço 12:00 às
        // 13:00)
        List<DayOfWeek> diasUteis = List.of(
                DayOfWeek.MONDAY,
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY);

        for (DayOfWeek dia : diasUteis) {
            HorarioTrabalho ht = HorarioTrabalho.builder()
                    .profissional(prof)
                    .diaSemana(dia)
                    .horaInicio(LocalTime.of(8, 0))
                    .horaFim(LocalTime.of(18, 0))
                    .inicioIntervalo(LocalTime.of(12, 0))
                    .fimIntervalo(LocalTime.of(13, 0))
                    .ativo(true)
                    .build();
            horarioTrabalhoRepository.save(ht);
        }

        return toDTO(prof);
    }

    @Transactional
    public ProfissionalDTO atualizarProfissional(Long id, CriarProfissionalRequest request) {
        Profissional prof = profissionalRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado com ID: " + id));

        ClinicaTenant adminTenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (adminTenant != null && prof.getTenant() != null && !prof.getTenant().getId().equals(adminTenant.getId())) {
            throw new RegraNegocioException(
                    "Acesso negado: Este especialista pertence a outro estabelecimento parceiro.");
        }

        prof.setNome(request.nome().trim());
        prof.setEspecialidade(request.especialidade());
        prof.setBio(request.bio());
        prof.setFotoUrl(request.fotoUrl());
        if (request.corIdentificacao() != null) {
            prof.setCorIdentificacao(request.corIdentificacao());
        }

        if (prof.getUsuario() != null) {
            prof.getUsuario().setNome(request.nome().trim());
            if (request.email() != null && !request.email().isBlank()) {
                String novoEmail = request.email().toLowerCase().trim();
                if (!novoEmail.equalsIgnoreCase(prof.getUsuario().getEmail())
                        && usuarioRepository.existsByEmail(novoEmail)) {
                    throw new RegraNegocioException("Já existe um usuário com o e-mail: " + novoEmail);
                }
                prof.getUsuario().setEmail(novoEmail);
            }
            if (request.telefoneWhatsApp() != null && !request.telefoneWhatsApp().isBlank()) {
                String cleanPhone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
                if (!cleanPhone.equals(prof.getUsuario().getTelefoneWhatsApp())
                        && usuarioRepository.existsByTelefoneWhatsApp(cleanPhone)) {
                    throw new RegraNegocioException("Já existe um usuário cadastrado com este WhatsApp: " + cleanPhone);
                }
                prof.getUsuario().setTelefoneWhatsApp(cleanPhone);
            }
            if (request.senha() != null && !request.senha().isBlank()) {
                prof.getUsuario().setSenhaHash(passwordEncoder.encode(request.senha()));
                prof.getUsuario().setPrimeiroAcesso(false);
            }
            usuarioRepository.save(prof.getUsuario());
        }

        if (request.procedimentosIds() != null) {
            prof.getProcedimentos().clear();
            prof.getProcedimentos().addAll(procedimentoRepository.findAllById(request.procedimentosIds()));
        }

        prof = profissionalRepository.save(prof);
        return toDTO(prof);
    }

    @Transactional
    public void alternarStatus(Long id) {
        Profissional prof = profissionalRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado com ID: " + id));
        boolean novoStatus = !Boolean.TRUE.equals(prof.getAtivo());
        prof.setAtivo(novoStatus);
        if (prof.getUsuario() != null) {
            prof.getUsuario().setAtivo(novoStatus);
            usuarioRepository.save(prof.getUsuario());
        }
        profissionalRepository.save(prof);
    }

    private ProfissionalDTO toDTO(Profissional p) {
        List<Long> procIds = p.getProcedimentos().stream().map(Procedimento::getId).toList();
        String login = p.getUsuario() != null ? p.getUsuario().getLogin() : null;
        String email = p.getUsuario() != null ? p.getUsuario().getEmail() : null;
        String telefone = p.getUsuario() != null ? p.getUsuario().getTelefoneWhatsApp() : null;
        return new ProfissionalDTO(
                p.getId(),
                p.getUsuario() != null ? p.getUsuario().getId() : null,
                p.getNome(),
                login,
                email,
                telefone,
                p.getEspecialidade(),
                p.getBio(),
                p.getFotoUrl(),
                p.getCorIdentificacao(),
                p.getAtivo(),
                procIds);
    }

    private HorarioTrabalhoDTO toHorarioDTO(HorarioTrabalho h) {
        return new HorarioTrabalhoDTO(
                h.getId(),
                h.getProfissional().getId(),
                h.getDiaSemana(),
                h.getHoraInicio(),
                h.getHoraFim(),
                h.getInicioIntervalo(),
                h.getFimIntervalo(),
                h.getAtivo());
    }

    // =========================================================================
    // BLOQUEIOS DE AGENDA (TRAVAR HORÁRIOS / FOLGAS)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<BloqueioAgendaDTO> listarBloqueios(Long profissionalId) {
        return bloqueioAgendaRepository.findByProfissionalIdOrderByDataInicioDesc(profissionalId)
                .stream()
                .map(b -> new BloqueioAgendaDTO(
                        b.getId(),
                        b.getProfissional().getId(),
                        b.getDataInicio(),
                        b.getDataFim(),
                        b.getMotivo()))
                .toList();
    }

    @Transactional
    public BloqueioAgendaDTO criarBloqueio(Long profissionalId, CriarBloqueioRequest request) {
        Profissional prof = profissionalRepository.findById(profissionalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Profissional não encontrado com ID: " + profissionalId));

        if (request.dataInicio() == null || request.dataFim() == null) {
            throw new RegraNegocioException("Data de início e data de término são obrigatórias para travar a agenda.");
        }
        if (request.dataFim().isBefore(request.dataInicio())) {
            throw new RegraNegocioException("A data de término não pode ser anterior à data de início.");
        }

        BloqueioAgenda bloqueio = BloqueioAgenda.builder()
                .profissional(prof)
                .dataInicio(request.dataInicio())
                .dataFim(request.dataFim())
                .motivo(request.motivo() != null && !request.motivo().isBlank() ? request.motivo().trim()
                        : "Agenda travada / Indisponível")
                .build();

        bloqueio = bloqueioAgendaRepository.save(bloqueio);
        return new BloqueioAgendaDTO(
                bloqueio.getId(),
                prof.getId(),
                bloqueio.getDataInicio(),
                bloqueio.getDataFim(),
                bloqueio.getMotivo());
    }

    @Transactional
    public void removerBloqueio(Long bloqueioId) {
        if (!bloqueioAgendaRepository.existsById(bloqueioId)) {
            throw new RecursoNaoEncontradoException("Bloqueio de agenda não encontrado com ID: " + bloqueioId);
        }
        bloqueioAgendaRepository.deleteById(bloqueioId);
    }

    // =========================================================================
    // CONFIGURAÇÃO DE DIAS E HORÁRIOS DE ATENDIMENTO (JORNADA)
    // =========================================================================
    @Transactional
    public List<HorarioTrabalhoDTO> salvarJornada(Long profissionalId, List<SalvarJornadaItemRequest> itens) {
        Profissional prof = profissionalRepository.findById(profissionalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Profissional não encontrado com ID: " + profissionalId));

        if (itens != null) {
            for (SalvarJornadaItemRequest item : itens) {
                HorarioTrabalho jornada = horarioTrabalhoRepository
                        .findByProfissionalIdAndDiaSemana(profissionalId, item.diaSemana())
                        .orElse(HorarioTrabalho.builder()
                                .profissional(prof)
                                .diaSemana(item.diaSemana())
                                .build());

                jornada.setHoraInicio(item.horaInicio());
                jornada.setHoraFim(item.horaFim());
                jornada.setInicioIntervalo(item.inicioIntervalo());
                jornada.setFimIntervalo(item.fimIntervalo());
                jornada.setAtivo(Boolean.TRUE.equals(item.ativo()));
                horarioTrabalhoRepository.save(jornada);
            }
        }

        return horarioTrabalhoRepository.findByProfissionalId(profissionalId)
                .stream()
                .map(this::toHorarioDTO)
                .toList();
    }
}
