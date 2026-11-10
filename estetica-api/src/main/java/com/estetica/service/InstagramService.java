package com.estetica.service;

import com.estetica.dto.RedeSocialDTOs.*;
import com.estetica.exception.RegraNegocioException;
import com.estetica.model.ClinicaTenant;
import com.estetica.model.PostSocial;
import com.estetica.model.RedeSocialConexao;
import com.estetica.repository.ClinicaTenantRepository;
import com.estetica.repository.PostSocialRepository;
import com.estetica.repository.RedeSocialConexaoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstagramService {

    private final RedeSocialConexaoRepository conexaoRepository;
    private final PostSocialRepository postSocialRepository;
    private final ClinicaTenantRepository tenantRepository;
    private final TenantResolverService tenantResolverService;
    private final HttpServletRequest httpServletRequest;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${meta.app-id:${META_APP_ID:}}")
    private String metaAppId;

    @Value("${meta.app-secret:${META_APP_SECRET:}}")
    private String metaAppSecret;

    @Value("${meta.graph-version:v21.0}")
    private String graphVersion;

    @Value("${meta.redirect-uri:${META_REDIRECT_URI:}}")
    private String metaRedirectUri;

    @Value("${jwt.secret:${JWT_SECRET:devOnlyLocalSecretKeyMustBeAtLeast32BytesLongForHS256!}}")
    private String stateSigningSecret;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public boolean isAppConfigurado() {
        return metaAppId != null && !metaAppId.isBlank() && metaAppSecret != null && !metaAppSecret.isBlank();
    }

    public String resolverRedirectUri() {
        if (metaRedirectUri != null && !metaRedirectUri.isBlank()) {
            return metaRedirectUri.trim();
        }
        String origin = extrairBaseUrlRequisicao();
        if (origin.contains("localhost") || origin.contains("127.0.0.1")) {
            return origin + "/api/v1/redes-sociais/instagram/callback";
        }
        // Callback centralizado para facilitar whitelist única no painel da Meta
        return "https://estetica.logistadigital.com.br/api/v1/redes-sociais/instagram/callback";
    }

    @Transactional(readOnly = true)
    public InstagramStatusResponse obterStatus() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            throw new RegraNegocioException("Estabelecimento não identificado.");
        }

        RedeSocialConexao conn = conexaoRepository
                .findFirstByTenantIdAndPlataformaIgnoreCase(tenant.getId(), "INSTAGRAM")
                .filter(c -> Boolean.TRUE.equals(c.getAtivo()) && c.getAccessToken() != null)
                .orElse(null);

        List<PostSocialDTO> posts = postSocialRepository.findTop30ByTenantIdOrderByCriadoEmDesc(tenant.getId())
                .stream()
                .map(this::toPostDTO)
                .toList();

        return new InstagramStatusResponse(
                isAppConfigurado(),
                conn != null,
                conn != null ? conn.getIgUserId() : null,
                conn != null ? conn.getIgUsername() : null,
                conn != null ? conn.getIgName() : null,
                conn != null ? conn.getIgAccountType() : null,
                conn != null ? conn.getIgProfilePictureUrl() : null,
                conn != null ? conn.getTokenExpiraEm() : null,
                resolverRedirectUri(),
                posts
        );
    }

    public AuthUrlResponse gerarAuthUrl(String returnOriginParam) {
        if (!isAppConfigurado()) {
            throw new RegraNegocioException("Integração com Instagram aguardando configuração das credenciais META_APP_ID e META_APP_SECRET no servidor.");
        }

        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            throw new RegraNegocioException("Estabelecimento não identificado.");
        }

        String returnOrigin = (returnOriginParam != null && !returnOriginParam.isBlank())
                ? returnOriginParam.trim().replaceAll("/+$", "")
                : extrairBaseUrlRequisicao();

        String redirectUri = resolverRedirectUri();
        String state = gerarStateAssinado(tenant.getId(), returnOrigin);

        String authUrl = "https://www.instagram.com/oauth/authorize"
                + "?enable_fb_login=0"
                + "&force_authentication=1"
                + "&client_id=" + urlEncode(metaAppId.trim())
                + "&redirect_uri=" + urlEncode(redirectUri)
                + "&response_type=code"
                + "&scope=" + urlEncode("instagram_business_basic,instagram_business_content_publish")
                + "&state=" + urlEncode(state);

        return new AuthUrlResponse(authUrl, redirectUri);
    }

    @Transactional
    public String processarCallback(String code, String state, String error, String errorDescription) {
        Map<String, Object> stateData = validarStateAssinado(state);
        String returnOrigin = stateData != null && stateData.get("returnOrigin") != null
                ? String.valueOf(stateData.get("returnOrigin"))
                : "https://estetica.logistadigital.com.br";

        if (error != null && !error.isBlank()) {
            String msg = (errorDescription != null && !errorDescription.isBlank()) ? errorDescription : error;
            return returnOrigin + "/admin/redes-sociais?instagram=erro&msg=" + urlEncode(msg);
        }

        if (stateData == null || code == null || code.isBlank()) {
            return returnOrigin + "/admin/redes-sociais?instagram=erro&msg=" + urlEncode("Autorização inválida ou expirada.");
        }

        try {
            Long tenantId = Long.valueOf(String.valueOf(stateData.get("tenantId")));
            ClinicaTenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new RegraNegocioException("Estabelecimento não encontrado."));

            String redirectUri = resolverRedirectUri();

            // 1. Trocar code por short-lived access token
            HttpHeaders formHeaders = new HttpHeaders();
            formHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> formBody = new LinkedMultiValueMap<>();
            formBody.add("client_id", metaAppId.trim());
            formBody.add("client_secret", metaAppSecret.trim());
            formBody.add("grant_type", "authorization_code");
            formBody.add("redirect_uri", redirectUri);
            formBody.add("code", code.trim());

            ResponseEntity<Map> shortRes = restTemplate.postForEntity(
                    "https://api.instagram.com/oauth/access_token",
                    new HttpEntity<>(formBody, formHeaders),
                    Map.class
            );

            Map<String, Object> shortBody = shortRes.getBody();
            if (shortBody == null || shortBody.get("access_token") == null) {
                throw new RegraNegocioException("Não foi possível obter o token de acesso do Instagram.");
            }

            String shortToken = String.valueOf(shortBody.get("access_token"));
            String igUserIdFallback = shortBody.get("user_id") != null ? String.valueOf(shortBody.get("user_id")) : null;

            // 2. Trocar short-lived token por long-lived token (60 dias)
            String longUrl = UriComponentsBuilder.fromHttpUrl("https://graph.instagram.com/access_token")
                    .queryParam("grant_type", "ig_exchange_token")
                    .queryParam("client_secret", metaAppSecret.trim())
                    .queryParam("access_token", shortToken)
                    .toUriString();

            String finalAccessToken = shortToken;
            long expiresSeconds = 3600L;
            try {
                ResponseEntity<Map> longRes = restTemplate.getForEntity(longUrl, Map.class);
                if (longRes.getBody() != null && longRes.getBody().get("access_token") != null) {
                    finalAccessToken = String.valueOf(longRes.getBody().get("access_token"));
                    Object expObj = longRes.getBody().get("expires_in");
                    if (expObj instanceof Number n) {
                        expiresSeconds = n.longValue();
                    }
                }
            } catch (Exception ex) {
                log.warn("[Instagram] Aviso ao trocar por long-lived token: {}", ex.getMessage());
            }

            // 3. Buscar dados do perfil Instagram
            String meUrl = UriComponentsBuilder.fromHttpUrl("https://graph.instagram.com/" + graphVersion + "/me")
                    .queryParam("fields", "user_id,username,name,account_type,profile_picture_url")
                    .queryParam("access_token", finalAccessToken)
                    .toUriString();

            ResponseEntity<Map> meRes = restTemplate.getForEntity(meUrl, Map.class);
            Map<String, Object> meBody = meRes.getBody() != null ? meRes.getBody() : Map.of();

            String igUserId = meBody.get("user_id") != null ? String.valueOf(meBody.get("user_id"))
                    : (meBody.get("id") != null ? String.valueOf(meBody.get("id")) : igUserIdFallback);
            String igUsername = meBody.get("username") != null ? String.valueOf(meBody.get("username")) : null;
            String igName = meBody.get("name") != null ? String.valueOf(meBody.get("name")) : igUsername;
            String igAccountType = meBody.get("account_type") != null ? String.valueOf(meBody.get("account_type")) : null;
            String igProfilePic = meBody.get("profile_picture_url") != null ? String.valueOf(meBody.get("profile_picture_url")) : null;

            RedeSocialConexao conn = conexaoRepository
                    .findFirstByTenantIdAndPlataformaIgnoreCase(tenant.getId(), "INSTAGRAM")
                    .orElse(RedeSocialConexao.builder()
                            .tenant(tenant)
                            .plataforma("INSTAGRAM")
                            .build());

            conn.setIgUserId(igUserId);
            conn.setIgUsername(igUsername);
            conn.setIgName(igName);
            conn.setIgAccountType(igAccountType);
            conn.setIgProfilePictureUrl(igProfilePic);
            conn.setAccessToken(finalAccessToken);
            conn.setTokenExpiraEm(LocalDateTime.now().plusSeconds(expiresSeconds));
            conn.setAtivo(true);
            conexaoRepository.save(conn);

            log.info("[Instagram] Conta @{} conectada ao tenant {} ({})", igUsername, tenant.getId(), tenant.getSlug());
            return returnOrigin + "/admin/redes-sociais?instagram=conectado";
        } catch (Exception ex) {
            log.error("[Instagram] Falha no callback OAuth: {}", ex.getMessage(), ex);
            return returnOrigin + "/admin/redes-sociais?instagram=erro&msg=" + urlEncode("Falha ao concluir conexão com Instagram.");
        }
    }

    @Transactional
    public void desconectar() {
        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            throw new RegraNegocioException("Estabelecimento não identificado.");
        }

        conexaoRepository.findFirstByTenantIdAndPlataformaIgnoreCase(tenant.getId(), "INSTAGRAM")
                .ifPresent(conn -> {
                    conn.setAtivo(false);
                    conn.setAccessToken(null);
                    conexaoRepository.save(conn);
                });
    }

    @Transactional
    public PostSocialDTO publicar(PublicarInstagramRequest req) {
        if (!isAppConfigurado()) {
            throw new RegraNegocioException("Credenciais do aplicativo Instagram (META_APP_ID/META_APP_SECRET) não estão configuradas no servidor.");
        }

        ClinicaTenant tenant = tenantResolverService.getTenantDoUsuarioAutenticado();
        if (tenant == null) {
            throw new RegraNegocioException("Estabelecimento não identificado.");
        }

        RedeSocialConexao conn = conexaoRepository
                .findFirstByTenantIdAndPlataformaIgnoreCase(tenant.getId(), "INSTAGRAM")
                .filter(c -> Boolean.TRUE.equals(c.getAtivo()) && c.getAccessToken() != null && c.getIgUserId() != null)
                .orElseThrow(() -> new RegraNegocioException("Nenhuma conta do Instagram conectada. Clique em 'Conectar Instagram' primeiro."));

        String tipoMidia = "STORIES".equalsIgnoreCase(req.tipoMidia()) ? "STORIES" : "FEED";
        String basePublica = extrairBaseUrlPublica(tenant);
        String imagemPublicaJpeg = prepararImagemJpegPublica(req.imagemUrl(), basePublica);

        // Renovar token se faltar menos de 7 dias para vencer
        renovarTokenSeNecessario(conn);

        PostSocial post = PostSocial.builder()
                .tenant(tenant)
                .plataforma("INSTAGRAM")
                .tipoMidia(tipoMidia)
                .imagemUrl(imagemPublicaJpeg)
                .legenda("FEED".equals(tipoMidia) ? req.legenda() : null)
                .status("PROCESSANDO")
                .build();

        try {
            String token = conn.getAccessToken();
            String igUserId = conn.getIgUserId();

            // Passo 1: Criar Container de Mídia
            String createUrl = "https://graph.instagram.com/" + graphVersion + "/" + igUserId + "/media";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> mediaParams = new LinkedMultiValueMap<>();
            mediaParams.add("image_url", imagemPublicaJpeg);
            mediaParams.add("access_token", token);
            if ("STORIES".equals(tipoMidia)) {
                mediaParams.add("media_type", "STORIES");
            } else if (req.legenda() != null && !req.legenda().isBlank()) {
                mediaParams.add("caption", req.legenda().trim());
            }

            ResponseEntity<Map> containerRes = restTemplate.postForEntity(
                    createUrl,
                    new HttpEntity<>(mediaParams, headers),
                    Map.class
            );

            if (containerRes.getBody() == null || containerRes.getBody().get("id") == null) {
                throw new RegraNegocioException("A Meta não retornou o ID do container de mídia.");
            }
            String creationId = String.valueOf(containerRes.getBody().get("id"));

            // Passo 2: Aguardar container ficar pronto (polling rápido até 10s)
            aguardarContainerPronto(creationId, token);

            // Passo 3: Publicar Container
            String publishUrl = "https://graph.instagram.com/" + graphVersion + "/" + igUserId + "/media_publish";
            MultiValueMap<String, String> publishParams = new LinkedMultiValueMap<>();
            publishParams.add("creation_id", creationId);
            publishParams.add("access_token", token);

            ResponseEntity<Map> publishRes = restTemplate.postForEntity(
                    publishUrl,
                    new HttpEntity<>(publishParams, headers),
                    Map.class
            );

            if (publishRes.getBody() == null || publishRes.getBody().get("id") == null) {
                throw new RegraNegocioException("Falha ao confirmar publicação no Instagram.");
            }
            String igMediaId = String.valueOf(publishRes.getBody().get("id"));
            String permalink = buscarPermalink(igMediaId, token);

            post.setIgMediaId(igMediaId);
            post.setPermalink(permalink);
            post.setStatus("PUBLICADO");
            post.setPublicadoEm(LocalDateTime.now());
            post = postSocialRepository.save(post);

            log.info("[Instagram] Post {} ({}) publicado com sucesso em @{}!", igMediaId, tipoMidia, conn.getIgUsername());
            return toPostDTO(post);

        } catch (RestClientResponseException httpEx) {
            String erroDetalhe = extrairErroMeta(httpEx.getResponseBodyAsString());
            log.error("[Instagram] Erro da API Meta ao publicar: {}", httpEx.getResponseBodyAsString());
            post.setStatus("ERRO");
            post.setMensagemErro(erroDetalhe);
            postSocialRepository.save(post);
            throw new RegraNegocioException("Erro ao publicar no Instagram: " + erroDetalhe);
        } catch (Exception ex) {
            log.error("[Instagram] Erro inesperado ao publicar: {}", ex.getMessage(), ex);
            post.setStatus("ERRO");
            post.setMensagemErro(ex.getMessage());
            postSocialRepository.save(post);
            throw new RegraNegocioException("Erro ao publicar no Instagram: " + ex.getMessage());
        }
    }

    @Transactional
    public Map<String, String> processarExclusaoDadosMeta(String signedRequest) {
        String confirmationCode = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        String igUserId = extrairUserIdDeSignedRequest(signedRequest);

        if (igUserId != null && !igUserId.isBlank()) {
            List<RedeSocialConexao> conexoes = conexaoRepository.findAllByIgUserId(igUserId);
            for (RedeSocialConexao c : conexoes) {
                c.setAtivo(false);
                c.setAccessToken(null);
                conexaoRepository.save(c);
            }
            log.info("[Instagram] Exclusão de dados executada para igUserId={}. Código={}", igUserId, confirmationCode);
        }

        return Map.of(
                "url", "https://estetica.logistadigital.com.br/exclusao-de-dados?code=" + confirmationCode,
                "confirmation_code", confirmationCode
        );
    }

    private void aguardarContainerPronto(String creationId, String token) {
        String statusUrl = UriComponentsBuilder.fromHttpUrl("https://graph.instagram.com/" + graphVersion + "/" + creationId)
                .queryParam("fields", "status_code")
                .queryParam("access_token", token)
                .toUriString();

        for (int i = 0; i < 6; i++) {
            try {
                ResponseEntity<Map> res = restTemplate.getForEntity(statusUrl, Map.class);
                if (res.getBody() != null) {
                    String status = String.valueOf(res.getBody().get("status_code"));
                    if ("FINISHED".equalsIgnoreCase(status) || "PUBLISHED".equalsIgnoreCase(status)) {
                        return;
                    }
                    if ("ERROR".equalsIgnoreCase(status) || "EXPIRED".equalsIgnoreCase(status)) {
                        throw new RegraNegocioException("A imagem foi rejeitada no processamento do Instagram (verifique formato JPEG e proporção).");
                    }
                }
                Thread.sleep(1500);
            } catch (RegraNegocioException rne) {
                throw rne;
            } catch (Exception ignored) {
                return;
            }
        }
    }

    private String buscarPermalink(String igMediaId, String token) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl("https://graph.instagram.com/" + graphVersion + "/" + igMediaId)
                    .queryParam("fields", "id,permalink")
                    .queryParam("access_token", token)
                    .toUriString();
            ResponseEntity<Map> res = restTemplate.getForEntity(url, Map.class);
            if (res.getBody() != null && res.getBody().get("permalink") != null) {
                return String.valueOf(res.getBody().get("permalink"));
            }
        } catch (Exception ignored) {}
        return null;
    }

    private void renovarTokenSeNecessario(RedeSocialConexao conn) {
        if (conn.getTokenExpiraEm() == null || conn.getTokenExpiraEm().isAfter(LocalDateTime.now().plusDays(7))) {
            return;
        }
        try {
            String refreshUrl = UriComponentsBuilder.fromHttpUrl("https://graph.instagram.com/refresh_access_token")
                    .queryParam("grant_type", "ig_refresh_token")
                    .queryParam("access_token", conn.getAccessToken())
                    .toUriString();
            ResponseEntity<Map> res = restTemplate.getForEntity(refreshUrl, Map.class);
            if (res.getBody() != null && res.getBody().get("access_token") != null) {
                conn.setAccessToken(String.valueOf(res.getBody().get("access_token")));
                Object expObj = res.getBody().get("expires_in");
                long secs = (expObj instanceof Number n) ? n.longValue() : 5184000L;
                conn.setTokenExpiraEm(LocalDateTime.now().plusSeconds(secs));
                conexaoRepository.save(conn);
            }
        } catch (Exception ex) {
            log.warn("[Instagram] Não foi possível renovar token preventivamente: {}", ex.getMessage());
        }
    }

    private String prepararImagemJpegPublica(String imagemUrl, String basePublica) {
        if (imagemUrl == null || imagemUrl.isBlank()) {
            throw new RegraNegocioException("Informe uma imagem válida.");
        }
        String limpa = imagemUrl.trim();

        // Se for data:image/...;base64,... salva como .jpg em /uploads
        if (limpa.startsWith("data:image/")) {
            try {
                int commaIdx = limpa.indexOf(",");
                if (commaIdx < 0) throw new RegraNegocioException("Imagem base64 inválida.");
                byte[] bytes = Base64.getDecoder().decode(limpa.substring(commaIdx + 1));
                BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
                if (img == null) throw new RegraNegocioException("Não foi possível ler a imagem enviada.");
                String fileName = "ig_" + UUID.randomUUID() + ".jpg";
                salvarComoJpeg(img, fileName);
                return basePublica + "/uploads/" + fileName;
            } catch (RegraNegocioException rne) {
                throw rne;
            } catch (Exception ex) {
                throw new RegraNegocioException("Erro ao converter imagem para JPEG compatível com Instagram.");
            }
        }

        // Se for arquivo local em /uploads/... e não terminar em .jpg/.jpeg, converte para JPEG
        if (limpa.startsWith("/uploads/") || limpa.startsWith("uploads/")) {
            String nomeArquivo = limpa.substring(limpa.lastIndexOf("/") + 1);
            String lower = nomeArquivo.toLowerCase();
            if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) {
                try {
                    Path origem = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(nomeArquivo);
                    if (Files.exists(origem)) {
                        BufferedImage img = ImageIO.read(origem.toFile());
                        if (img != null) {
                            String novoJpg = "ig_" + UUID.randomUUID() + ".jpg";
                            salvarComoJpeg(img, novoJpg);
                            return basePublica + "/uploads/" + novoJpg;
                        }
                    }
                } catch (Exception ex) {
                    log.warn("[Instagram] Falha ao converter arquivo local para JPEG: {}", ex.getMessage());
                }
            }
            return basePublica + (limpa.startsWith("/") ? limpa : "/" + limpa);
        }

        return limpa;
    }

    private void salvarComoJpeg(BufferedImage source, String fileName) throws Exception {
        Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }
        BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, source.getWidth(), source.getHeight());
        g.drawImage(source, 0, 0, null);
        g.dispose();

        File out = targetDir.resolve(fileName).toFile();
        ImageIO.write(rgb, "jpg", out);
    }

    private String extrairBaseUrlPublica(ClinicaTenant tenant) {
        if (tenant != null && tenant.getSlug() != null && !tenant.getSlug().isBlank() && !"estetica".equalsIgnoreCase(tenant.getSlug())) {
            return "https://" + tenant.getSlug().toLowerCase().trim() + ".logistadigital.com.br";
        }
        return "https://estetica.logistadigital.com.br";
    }

    private String extrairBaseUrlRequisicao() {
        if (httpServletRequest == null) return "https://estetica.logistadigital.com.br";
        String proto = httpServletRequest.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) proto = httpServletRequest.getScheme();
        String host = httpServletRequest.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) host = httpServletRequest.getHeader("Host");
        if (host == null || host.isBlank()) host = httpServletRequest.getServerName();
        return proto + "://" + host;
    }

    private String gerarStateAssinado(Long tenantId, String returnOrigin) {
        try {
            Map<String, Object> payload = Map.of(
                    "tenantId", tenantId,
                    "returnOrigin", returnOrigin,
                    "exp", System.currentTimeMillis() + 15 * 60 * 1000L
            );
            String json = objectMapper.writeValueAsString(payload);
            String b64 = Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
            String sig = hmacSha256(b64, stateSigningSecret);
            return b64 + "." + sig;
        } catch (Exception ex) {
            throw new RuntimeException("Erro ao gerar state OAuth", ex);
        }
    }

    private Map<String, Object> validarStateAssinado(String state) {
        if (state == null || !state.contains(".")) return null;
        try {
            String[] parts = state.split("\\.", 2);
            String b64 = parts[0];
            String sig = parts[1];
            String esperado = hmacSha256(b64, stateSigningSecret);
            if (!MessageDigest.isEqual(sig.getBytes(StandardCharsets.UTF_8), esperado.getBytes(StandardCharsets.UTF_8))) {
                return null;
            }
            byte[] decoded = Base64.getUrlDecoder().decode(b64);
            Map<String, Object> data = objectMapper.readValue(decoded, Map.class);
            Object expObj = data.get("exp");
            if (expObj instanceof Number n && n.longValue() < System.currentTimeMillis()) {
                return null;
            }
            return data;
        } catch (Exception ex) {
            return null;
        }
    }

    private String extrairUserIdDeSignedRequest(String signedRequest) {
        if (signedRequest == null || !signedRequest.contains(".")) return null;
        try {
            String[] parts = signedRequest.split("\\.", 2);
            byte[] sig = Base64.getUrlDecoder().decode(parts[0]);
            String payloadB64 = parts[1];
            if (metaAppSecret != null && !metaAppSecret.isBlank()) {
                Mac mac = Mac.getInstance("HmacSHA256");
                mac.init(new SecretKeySpec(metaAppSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
                byte[] expected = mac.doFinal(payloadB64.getBytes(StandardCharsets.UTF_8));
                if (!MessageDigest.isEqual(sig, expected)) {
                    log.warn("[Instagram] Assinatura inválida em signed_request.");
                    return null;
                }
            }
            byte[] decoded = Base64.getUrlDecoder().decode(payloadB64);
            Map<String, Object> map = objectMapper.readValue(decoded, Map.class);
            return map.get("user_id") != null ? String.valueOf(map.get("user_id")) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private String hmacSha256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    }

    private String extrairErroMeta(String body) {
        try {
            Map<String, Object> map = objectMapper.readValue(body, Map.class);
            if (map.get("error") instanceof Map<?, ?> err) {
                Object msg = err.get("error_user_msg") != null ? err.get("error_user_msg") : err.get("message");
                if (msg != null) return String.valueOf(msg);
            }
        } catch (Exception ignored) {}
        return "Falha de comunicação com a API do Instagram.";
    }

    private String urlEncode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private PostSocialDTO toPostDTO(PostSocial p) {
        return new PostSocialDTO(
                p.getId(),
                p.getPlataforma(),
                p.getTipoMidia(),
                p.getImagemUrl(),
                p.getLegenda(),
                p.getIgMediaId(),
                p.getPermalink(),
                p.getStatus(),
                p.getMensagemErro(),
                p.getPublicadoEm(),
                p.getCriadoEm()
        );
    }
}
