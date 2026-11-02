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

    @GetMapping("/clientes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Lista todos os pacientes/clientes cadastrados na clínica")
    public ResponseEntity<List<UsuarioDTO>> listarClientes() {
        List<UsuarioDTO> clientes = usuarioRepository.findByRoleOrderByNomeAsc(Role.ROLE_CLIENTE)
                .stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(clientes);
    }

    @PostMapping("/clientes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    @Operation(summary = "Cadastra um novo paciente/cliente diretamente pela clínica")
    @Transactional
    public ResponseEntity<UsuarioDTO> cadastrarCliente(@Valid @RequestBody CriarClienteRequest request) {
        String email = request.email().toLowerCase().trim();
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Já existe um cliente cadastrado com o e-mail: " + email);
        }

        String senha = (request.senha() != null && !request.senha().isBlank()) ? request.senha() : "Cliente@123";

        Usuario cliente = Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .telefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""))
                .senhaHash(passwordEncoder.encode(senha))
                .role(Role.ROLE_CLIENTE)
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

        cliente.setNome(request.nome().trim());
        cliente.setEmail(request.email().toLowerCase().trim());
        cliente.setTelefoneWhatsApp(request.telefoneWhatsApp().replaceAll("[^0-9]", ""));

        if (request.senha() != null && !request.senha().isBlank()) {
            cliente.setSenhaHash(passwordEncoder.encode(request.senha()));
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
                u.getAtivo()
        );
    }
}

