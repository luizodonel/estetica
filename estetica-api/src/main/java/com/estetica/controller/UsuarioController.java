package com.estetica.controller;

import com.estetica.dto.AgendamentoDTOs.AgendamentoDTO;
import com.estetica.dto.AuthDTOs.ClienteHistoricoDetalheDTO;
import com.estetica.dto.AuthDTOs.ClienteResumoDTO;
import com.estetica.dto.AuthDTOs.CriarClienteRequest;
import com.estetica.dto.AuthDTOs.UsuarioDTO;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.Agendamento;
import com.estetica.model.Role;
import com.estetica.model.StatusAgendamento;
import com.estetica.model.Usuario;
import com.estetica.repository.AgendamentoRepository;
import com.estetica.repository.UsuarioRepository;
import com.estetica.service.AgendamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuários e Pacientes", description = "Gestão e listagem de clientes e pacientes")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final com.estetica.repository.ProfissionalRepository profissionalRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.estetica.service.TenantResolverService tenantResolverService;
    private final AgendamentoRepository agendamentoRepository;
    private final AgendamentoService agendamentoService;

    @GetMapping("/clientes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Lista todos os pacientes/clientes cadastrados na clínica (ou apenas os clientes agendados com o especialista logado)")
    public ResponseEntity<List<UsuarioDTO>> listarClientes(org.springframework.security.core.Authentication authentication) {
        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;

        if (isProfissional(authentication)) {
            Long profId = resolverProfissionalIdAutenticado(authentication, tenantId);
            if (profId == null) {
                return ResponseEntity.ok(List.of());
            }
            List<Usuario> clientesProf = usuarioRepository.findClientesPorProfissional(profId);
            return ResponseEntity.ok(clientesProf.stream().map(this::toDTO).toList());
        }

        List<Usuario> list = usuarioRepository.findClientesPorTenantOuSemTenant(tenantId, Role.ROLE_CLIENTE);

        List<UsuarioDTO> clientes = list.stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(clientes);
    }

    @GetMapping("/clientes/resumo")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Transactional(readOnly = true)
    @Operation(summary = "Lista os clientes da clínica com totais agregados de atendimentos, último horário e valor consumido")
    public ResponseEntity<List<ClienteResumoDTO>> listarClientesResumo(org.springframework.security.core.Authentication authentication) {
        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;

        Long profIdFiltro = null;
        List<Usuario> clientes;
        if (isProfissional(authentication)) {
            profIdFiltro = resolverProfissionalIdAutenticado(authentication, tenantId);
            if (profIdFiltro == null) {
                return ResponseEntity.ok(List.of());
            }
            clientes = usuarioRepository.findClientesPorProfissional(profIdFiltro);
        } else {
            clientes = usuarioRepository.findClientesPorTenantOuSemTenant(tenantId, Role.ROLE_CLIENTE);
        }

        List<Agendamento> agendamentos = agendamentoRepository.findAllParaResumoClientes(tenantId, profIdFiltro);
        Map<Long, List<Agendamento>> porCliente = agendamentos.stream()
                .collect(Collectors.groupingBy(a -> a.getCliente().getId()));

        List<ClienteResumoDTO> resumos = clientes.stream()
                .map(c -> calcularResumo(c, porCliente.getOrDefault(c.getId(), List.of())))
                .sorted(Comparator.comparing(ClienteResumoDTO::ultimoAgendamento, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ClienteResumoDTO::nome, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return ResponseEntity.ok(resumos);
    }

    @GetMapping("/clientes/{id}/historico")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Transactional(readOnly = true)
    @Operation(summary = "Retorna resumo financeiro e histórico completo de agendamentos e pagamentos de um cliente")
    public ResponseEntity<ClienteHistoricoDetalheDTO> buscarHistoricoCliente(
            @PathVariable Long id,
            org.springframework.security.core.Authentication authentication) {
        Usuario cliente = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado com ID: " + id));

        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;
        if (tenantId != null && cliente.getTenant() != null && !cliente.getTenant().getId().equals(tenantId)) {
            throw new RegraNegocioException("Acesso negado: Este cliente pertence a outro estabelecimento parceiro.");
        }

        Long profIdFiltro = null;
        if (isProfissional(authentication)) {
            profIdFiltro = resolverProfissionalIdAutenticado(authentication, tenantId);
            if (profIdFiltro == null) {
                throw new RegraNegocioException("Especialista não identificado para o usuário logado.");
            }
        }

        List<Agendamento> agendamentos = agendamentoRepository.findHistoricoPorCliente(id, tenantId, profIdFiltro);
        ClienteResumoDTO resumo = calcularResumo(cliente, agendamentos);

        long qtdValidos = agendamentos.stream()
                .filter(a -> a.getStatus() != StatusAgendamento.CANCELADO && a.getStatus() != StatusAgendamento.NO_SHOW)
                .count();
        BigDecimal ticketMedio = qtdValidos > 0
                ? resumo.totalConsumido().divide(BigDecimal.valueOf(qtdValidos), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<AgendamentoDTO> agendamentosDTO = agendamentos.stream()
                .map(agendamentoService::toDTO)
                .toList();

        return ResponseEntity.ok(new ClienteHistoricoDetalheDTO(
                resumo.id(),
                resumo.nome(),
                resumo.email(),
                resumo.telefoneWhatsApp(),
                resumo.ativo(),
                resumo.totalAgendamentos(),
                resumo.totalConcluidos(),
                resumo.totalCancelados(),
                resumo.ultimoAgendamento(),
                resumo.totalConsumido(),
                ticketMedio,
                agendamentosDTO
        ));
    }

    @PostMapping("/clientes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Cadastra um novo paciente/cliente diretamente pela clínica")
    @Transactional
    public ResponseEntity<UsuarioDTO> cadastrarCliente(@Valid @RequestBody CriarClienteRequest request) {
        String cleanPhone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        if (cleanPhone.length() < 8) {
            throw new RegraNegocioException("Número de WhatsApp inválido.");
        }

        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;

        String email = (request.email() != null && !request.email().isBlank())
                ? request.email().toLowerCase().trim()
                : null;

        Usuario cliente = Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .telefoneWhatsApp(cleanPhone)
                .senhaHash("SEM_LOGIN")
                .role(Role.ROLE_CLIENTE)
                .tenant(tenant)
                .primeiroAcesso(false)
                .ativo(true)
                .build();

        cliente = usuarioRepository.save(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(cliente));
    }

    @PutMapping("/clientes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Atualiza os dados de um paciente")
    @Transactional
    public ResponseEntity<UsuarioDTO> atualizarCliente(@PathVariable Long id, @Valid @RequestBody CriarClienteRequest request) {
        Usuario cliente = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado com ID: " + id));

        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant != null && cliente.getTenant() != null && !cliente.getTenant().getId().equals(tenant.getId())) {
            throw new RegraNegocioException("Acesso negado: Este cliente pertence a outro estabelecimento parceiro.");
        }
        Long tenantId = tenant != null ? tenant.getId() : null;

        cliente.setNome(request.nome().trim());

        if (request.email() != null && !request.email().isBlank()) {
            cliente.setEmail(request.email().toLowerCase().trim());
        } else {
            cliente.setEmail(null);
        }

        String cleanPhone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        cliente.setTelefoneWhatsApp(cleanPhone);

        if (request.senha() != null && !request.senha().isBlank()) {
            cliente.setSenhaHash(passwordEncoder.encode(request.senha()));
            cliente.setPrimeiroAcesso(false);
        }

        cliente = usuarioRepository.save(cliente);
        return ResponseEntity.ok(toDTO(cliente));
    }

    @DeleteMapping("/clientes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Alterna status ativo/inativo do cliente")
    @Transactional
    public ResponseEntity<Void> alternarStatus(@PathVariable Long id) {
        Usuario cliente = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado com ID: " + id));

        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant != null && cliente.getTenant() != null && !cliente.getTenant().getId().equals(tenant.getId())) {
            throw new RegraNegocioException("Acesso negado: Este cliente pertence a outro estabelecimento parceiro.");
        }

        cliente.setAtivo(!Boolean.TRUE.equals(cliente.getAtivo()));
        usuarioRepository.save(cliente);
        return ResponseEntity.noContent().build();
    }

    private boolean isProfissional(org.springframework.security.core.Authentication authentication) {
        return authentication != null
                && authentication.getPrincipal() instanceof Usuario u
                && u.getRole() == Role.ROLE_PROFISSIONAL;
    }

    private Long resolverProfissionalIdAutenticado(org.springframework.security.core.Authentication authentication, Long tenantId) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario u)) {
            return null;
        }
        com.estetica.model.Profissional prof = profissionalRepository.findByUsuarioId(u.getId()).orElse(null);
        if (prof == null && u.getNome() != null) {
            prof = (tenantId != null)
                    ? profissionalRepository.findFirstByTenantIdAndNomeIgnoreCase(tenantId, u.getNome().trim()).orElse(null)
                    : profissionalRepository.findFirstByNomeIgnoreCase(u.getNome().trim()).orElse(null);
        }
        return prof != null ? prof.getId() : null;
    }

    private ClienteResumoDTO calcularResumo(Usuario cliente, List<Agendamento> ags) {
        long total = ags.size();
        long concluidos = ags.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.CONCLUIDO)
                .count();
        long cancelados = ags.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.CANCELADO || a.getStatus() == StatusAgendamento.NO_SHOW)
                .count();
        LocalDateTime ultimo = ags.stream()
                .map(Agendamento::getDataHoraInicio)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        BigDecimal totalConsumido = ags.stream()
                .filter(a -> a.getStatus() != StatusAgendamento.CANCELADO && a.getStatus() != StatusAgendamento.NO_SHOW)
                .map(Agendamento::getValorCobrado)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ClienteResumoDTO(
                cliente.getId(),
                cliente.getNome(),
                cliente.getEmail(),
                cliente.getTelefoneWhatsApp(),
                cliente.getAtivo(),
                total,
                concluidos,
                cancelados,
                ultimo,
                totalConsumido
        );
    }

    private UsuarioDTO toDTO(Usuario u) {
        return new UsuarioDTO(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getTelefoneWhatsApp(),
                u.getRole(),
                u.getAtivo(),
                u.getPrimeiroAcesso()
        );
    }
}

