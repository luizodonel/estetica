package com.estetica.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class CoolifyIntegrationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${coolify.base-url:http://93.127.212.65:8000}")
    private String baseUrl;

    @Value("${coolify.token:6|m7T16Ph8guHOWj8tPJnGaPPoGkJnYEaPaEdPwoGfb3498437}")
    private String token;

    @Value("${coolify.app-uuid:msz9q9dwvhrtskj4jmd1bomn}")
    private String appUuid;

    @Async
    public void adicionarDominioLojista(String slug) {
        if (slug == null || slug.isBlank() || "estetica".equalsIgnoreCase(slug)) {
            return;
        }

        try {
            String novoDominio = "https://" + slug.toLowerCase().trim() + ".logistadigital.com.br";
            String url = baseUrl + "/api/v1/applications/" + appUuid;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + token);

            HttpEntity<Void> getEntity = new HttpEntity<>(headers);
            ResponseEntity<Map> getRes = restTemplate.exchange(url, HttpMethod.GET, getEntity, Map.class);

            if (getRes.getBody() != null) {
                String fqdnAtual = (String) getRes.getBody().get("fqdn");
                if (fqdnAtual == null || !fqdnAtual.contains(novoDominio)) {
                    String novoFqdn = (fqdnAtual != null && !fqdnAtual.isBlank())
                            ? fqdnAtual + "," + novoDominio
                            : novoDominio;

                    log.info("[CoolifyIntegration] Adicionando novo subdomínio ao Coolify: {}", novoDominio);
                    HttpEntity<Map<String, String>> patchEntity = new HttpEntity<>(Map.of("fqdn", novoFqdn), headers);
                    restTemplate.exchange(url, HttpMethod.PATCH, patchEntity, Void.class);

                    // Reinicia para aplicar o novo router Traefik/Caddy
                    restTemplate.exchange(url + "/restart", HttpMethod.POST, getEntity, Void.class);
                    log.info("[CoolifyIntegration] Subdomínio {} configurado e reinício do proxy disparado com sucesso!", novoDominio);
                }
            }
        } catch (Exception ex) {
            log.error("[CoolifyIntegration] Erro ao adicionar subdomínio no Coolify: {}", ex.getMessage());
        }
    }
}
