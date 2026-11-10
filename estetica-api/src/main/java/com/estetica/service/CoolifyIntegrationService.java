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

    @Value("${coolify.base-url:${COOLIFY_BASE_URL:}}")
    private String baseUrl;

    @Value("${coolify.token:${COOLIFY_TOKEN:}}")
    private String token;

    @Value("${coolify.app-uuid:${COOLIFY_APP_UUID:}}")
    private String appUuid;

    @Value("${coolify.auto-restart-on-domain:false}")
    private boolean autoRestartOnDomain;

    @Async
    public void adicionarDominioLojista(String slug) {
        if (slug == null || slug.isBlank() || "estetica".equalsIgnoreCase(slug)) {
            return;
        }
        if (baseUrl == null || baseUrl.isBlank() || token == null || token.isBlank() || appUuid == null || appUuid.isBlank()) {
            log.debug("[CoolifyIntegration] Variáveis COOLIFY_* não configuradas; pulando registro automático de domínio para {}", slug);
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
                if (fqdnAtual == null || (!fqdnAtual.contains(novoDominio) && !fqdnAtual.contains("*.logistadigital.com.br"))) {
                    String novoFqdn = (fqdnAtual != null && !fqdnAtual.isBlank())
                            ? fqdnAtual + "," + novoDominio
                            : novoDominio;

                    log.info("[CoolifyIntegration] Adicionando novo subdomínio ao Coolify: {}", novoDominio);
                    HttpEntity<Map<String, String>> patchEntity = new HttpEntity<>(Map.of("fqdn", novoFqdn), headers);
                    restTemplate.exchange(url, HttpMethod.PATCH, patchEntity, Void.class);

                    // Reinício opcional (desabilitado por padrão se houver wildcard DNS/Traefik para não derrubar sessões ativas)
                    if (autoRestartOnDomain) {
                        restTemplate.exchange(url + "/restart", HttpMethod.POST, getEntity, Void.class);
                        log.info("[CoolifyIntegration] Subdomínio {} configurado e reinício disparado.", novoDominio);
                    } else {
                        log.info("[CoolifyIntegration] Subdomínio {} registrado no FQDN sem reiniciar conexões ativas.", novoDominio);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("[CoolifyIntegration] Erro ao adicionar subdomínio no Coolify: {}", ex.getMessage());
        }
    }
}

