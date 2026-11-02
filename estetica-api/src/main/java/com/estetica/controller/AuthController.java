package com.estetica.controller;

import com.estetica.dto.AuthDTOs.*;
import com.estetica.model.Usuario;
import com.estetica.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints de login e registro de clientes com JWT")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Autentica usuário e retorna token JWT (WhatsApp/Telefone ou E-mail)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.autenticar(request));
    }

    @GetMapping("/verificar-primeiro-acesso")
    @Operation(summary = "Verifica se o telefone informado requer definição de senha (primeiro acesso)")
    public ResponseEntity<VerificarPrimeiroAcessoResponse> verificarPrimeiroAcesso(@RequestParam String telefone) {
        return ResponseEntity.ok(authService.verificarPrimeiroAcesso(telefone));
    }

    @PostMapping("/primeiro-acesso")
    @Operation(summary = "Define a senha de primeiro acesso do especialista ou cliente cadastrado pelo admin")
    public ResponseEntity<AuthResponse> primeiroAcesso(@Valid @RequestBody PrimeiroAcessoRequest request) {
        return ResponseEntity.ok(authService.primeiroAcesso(request));
    }

    @PostMapping("/registrar")
    @Operation(summary = "Cadastro simplificado de cliente (Mobile-First)")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrarCliente(request));
    }

    @PostMapping("/setup-admin")
    @Operation(summary = "Cadastro do Administrador Master (Permitido apenas se não houver admin no sistema)")
    public ResponseEntity<AuthResponse> setupAdmin(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrarAdminMaster(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtém dados do usuário autenticado atual")
    public ResponseEntity<UsuarioDTO> me(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(new UsuarioDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefoneWhatsApp(),
                usuario.getRole(),
                usuario.getAtivo(),
                usuario.getPrimeiroAcesso()
        ));
    }
}

