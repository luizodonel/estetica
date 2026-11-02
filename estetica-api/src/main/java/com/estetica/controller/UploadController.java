package com.estetica.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/uploads")
@Tag(name = "Uploads", description = "Envio e upload de arquivos e fotos")
public class UploadController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Fazer upload de imagem (foto de perfil, capa de procedimento ou logotipo)")
    public ResponseEntity<?> uploadImagem(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nenhum arquivo enviado"));
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        // Validar tipo de imagem
        if (contentType != null && !contentType.startsWith("image/") && !contentType.equals("application/octet-stream")) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body(Map.of("message", "Apenas arquivos de imagem são permitidos (.jpg, .jpeg, .png, .webp, .svg, .gif)"));
        }

        // Extrair extensão
        String extension = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        } else if (contentType != null && contentType.contains("/")) {
            extension = "." + contentType.substring(contentType.lastIndexOf("/") + 1).replace("jpeg", "jpg").replace("+xml", "");
        }

        // Gerar nome único seguro
        String safeName = UUID.randomUUID().toString() + extension;

        try {
            Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            Path targetFile = targetDir.resolve(safeName);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Upload de imagem realizado com sucesso: {} -> {}", originalFilename, targetFile);

            String publicUrl = "/uploads/" + safeName;
            return ResponseEntity.ok(Map.of(
                    "url", publicUrl,
                    "filename", safeName,
                    "size", file.getSize()
            ));

        } catch (IOException e) {
            log.error("Erro ao salvar arquivo de upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Falha ao processar e salvar a imagem enviada"));
        }
    }
}

