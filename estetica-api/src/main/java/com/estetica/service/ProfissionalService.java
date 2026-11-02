package com.estetica.service;

import com.estetica.dto.ProfissionalDTOs.*;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.*;
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
    private final UsuarioRepository usuarioRepository;
    private final ProcedimentoRepository procedimentoRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<ProfissionalDTO> listarTodos() {
        return profissionalRepository.findByAtivoTrueOrderByNomeAsc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProfissionalDTO> listarTodosAdmin() {
        return profissionalRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProfissionalDTO> listarHabilitados(Long procedimentoId) {
        return profissionalRepository.findHabilitadosParaProcedimento(procedimentoId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HorarioTrabalhoDTO> listarJornada(Long profissionalId) {
        return horarioTrabalhoRepository.findByProfissionalIdAndAtivoTrue(profissionalId)
                .stream()
                .map(this::toHorarioDTO)
                .toList();
    }

    @Transactional
    public ProfissionalDTO criarProfissional(CriarProfissionalRequest request) {
        String email = request.email().toLowerCase().trim();
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Já existe um usuário com o e-mail: " + email);
        }

        String senha = (request.senha() != null && !request.senha().isBlank()) ? request.senha() : "Clinica@123";

        // Cria a conta de acesso como ROLE_PROFISSIONAL
        Usuario usuario = Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .senhaHash(passwordEncoder.encode(senha))
                .role(Role.ROLE_PROFISSIONAL)
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
                if (!novoEmail.equalsIgnoreCase(prof.getUsuario().getEmail()) && usuarioRepository.existsByEmail(novoEmail)) {
                    throw new RegraNegocioException("Já existe um usuário com o e-mail: " + novoEmail);
                }
                prof.getUsuario().setEmail(novoEmail);
            }
            if (request.telefoneWhatsApp() != null && !request.telefoneWhatsApp().isBlank()) {
                prof.getUsuario().setTelefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""));
            }
            if (request.senha() != null && !request.senha().isBlank()) {
                prof.getUsuario().setSenhaHash(passwordEncoder.encode(request.senha()));
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
        String email = p.getUsuario() != null ? p.getUsuario().getEmail() : null;
        String telefone = p.getUsuario() != null ? p.getUsuario().getTelefoneWhatsApp() : null;
        return new ProfissionalDTO(
                p.getId(),
                p.getUsuario() != null ? p.getUsuario().getId() : null,
                p.getNome(),
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
}
