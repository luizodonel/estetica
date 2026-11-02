package com.estetica.controller;

import com.estetica.dto.AuthDTOs.CriarClienteRequest;
import com.estetica.dto.AuthDTOs.UsuarioDTO;
import com.estetica.exception.RecursoNaoEncontradoException;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.Role;
import com.estetica.model.Usuario;
import com.estetica.repository.UsuarioRepository;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuários e Pacientes", description = "Gestão e listagem de clientes e pacientes")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.estetica.service.TenantResolverService tenantResolverService;

    @GetMapping("/clientes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Lista todos os pacientes/clientes cadastrados na clínica")
    public ResponseEntity<List<UsuarioDTO>> listarClientes() {
        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        Long tenantId = tenant != null ? tenant.getId() : null;
        List<Usuario> list = usuarioRepository.findClientesPorTenantOuSemTenant(tenantId, Role.ROLE_CLIENTE);

        List<UsuarioDTO> clientes = list.stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(clientes);
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

        if (usuarioRepository.existsByTelefoneWhatsApp(cleanPhone)) {
            throw new RegraNegocioException("Já existe um cliente cadastrado com este WhatsApp: " + cleanPhone);
        }

        String email = (request.email() != null && !request.email().isBlank())
                ? request.email().toLowerCase().trim()
                : "tel" + cleanPhone + "@cliente.local";

        if (request.email() != null && !request.email().isBlank() && usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Já existe um cliente cadastrado com o e-mail: " + email);
        }

        com.estetica.model.ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        String senha = (request.senha() != null && !request.senha().isBlank())
                ? request.senha()
                : java.util.UUID.randomUUID().toString();

        Usuario cliente = Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .telefoneWhatsApp(cleanPhone)
                .senhaHash(passwordEncoder.encode(senha))
                .role(Role.ROLE_CLIENTE)
                .tenant(tenant)
                .primeiroAcesso(request.senha() == null || request.senha().isBlank())
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
            throw new RegraNegocioException("Acesso negado: Este cliente pertence a outra clínica parceira.");
        }

        cliente.setNome(request.nome().trim());

        if (request.email() != null && !request.email().isBlank()) {
            String novoEmail = request.email().toLowerCase().trim();
            if (!novoEmail.equalsIgnoreCase(cliente.getEmail()) && usuarioRepository.existsByEmail(novoEmail)) {
                throw new RegraNegocioException("Já existe um cliente cadastrado com o e-mail: " + novoEmail);
            }
            cliente.setEmail(novoEmail);
        }

        String cleanPhone = request.telefoneWhatsApp().replaceAll("[^0-9]", "");
        if (!cleanPhone.equals(cliente.getTelefoneWhatsApp()) && usuarioRepository.existsByTelefoneWhatsApp(cleanPhone)) {
            throw new RegraNegocioException("Já existe um cliente cadastrado com este WhatsApp: " + cleanPhone);
        }
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
            throw new RegraNegocioException("Acesso negado: Este cliente pertence a outra clínica parceira.");
        }

        cliente.setAtivo(!Boolean.TRUE.equals(cliente.getAtivo()));
        usuarioRepository.save(cliente);
        return ResponseEntity.noContent().build();
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

