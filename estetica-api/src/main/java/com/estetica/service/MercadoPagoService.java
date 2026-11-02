package com.estetica.service;

import com.estetica.model.ClinicaTenant;
import com.estetica.model.Usuario;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class MercadoPagoService {

    private final RestTemplate restTemplate;

    @Value("${mercadopago.access-token:APP_USR-5741665921712781-082413-bc420761bcc13420c1489262ecbf2c81-3412978164}")
    private String accessToken;

    public MercadoPagoService() {
        this.restTemplate = new RestTemplate();
    }

    public Map<String, Object> criarPagamentoPix(ClinicaTenant tenant, com.estetica.model.Lojista lojista, BigDecimal valor) {
        if (accessToken == null || accessToken.contains("TEST-XXXXXXXX") || accessToken.contains("placeholder") || accessToken.trim().isEmpty()) {
            log.info("[MercadoPago] Utilizando mock de pagamento PIX para ambiente de teste");
            Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("id", "999" + (System.currentTimeMillis() / 1000));
            mockResponse.put("status", "pending");

            Map<String, Object> poi = new HashMap<>();
            Map<String, Object> td = new HashMap<>();
            td.put("qr_code", "00020101021226870014br.gov.bcb.pix2565pix.mercadopago.com/transfer/receiver/f2f/TEST-PIX-MOCK-" + tenant.getSlug());
            td.put("qr_code_base64", "iVBORw0KGgoAAAANSUhEUgAAAIIAAACCCAIAAAAFYYeqAAADAUlEQVR4nO2WMWIbMRAD/f9PJ006yTGE7ILDHKa1Z0UAzX19HeXXUc5mB9EZEHQGBJ0BQWdA0Bm+JRl777do7/n7b3UGRPbOgMjeGRDZOwMie2dAZJdmePNPAmdjK3Cymyc2npKHk908sfGUPJzs5omNp+ThZDdPbDwlDye7eWLjKXk42c0TG0/Jw8lunth4Sh5OdvPExlPycLKbJzaekoeT3Tyx8ZQ8nOzmiY2n5OFkN09sPCUPJ7t5YuMpeTjZzRMbT8nDyW6e2HhKHk5288TGU/JwspsnNp6Sh5NdOpGMnYSTvTMgsncGRPbOgMjeGRDZOwMi+5sZknjV7P3PQ+kMCDoDgs6AoDMg6Ax/eH1cydMZEHQGBJ0BQWdA0BkQRGeY+k7z7pCtzoCwOgPC6gwIqzMgrM6AsC74YCXXN2YpwlkuK7QzXGwpwlkuK7QzXGwpwlkuK5Q/g/Lcy+obsjoDwuoMCKszIKzOgLA6A8K64IP1FU59U1ZnQFidAWF1BoTVGRBWZ0BYuA/Wh1qKMMVl1XSGx1mKMMVl1XSGx1mKMMVl1fyvMyhcVt+Q1RkQVmdAWJ0BYXUGhNUZENbrX6MoAcj1TVlDdbookU5Vk7SG6nRRIp2qJmkN1emiRDpVTdIaqtNFiXSqmqQ1VKeLEulUNUlrrJqNxz3N6gwIqzMgrM6AsDoDwuoMCOuHEz8I/3CHVsQpy6xPwQvAqSZpmfUpeAE41SQtsz4FLwCnmqRl1qfgBeBUk7TM+hS8AJxqkpZZn8JUgEwRZy2zPoWpSFN3yJZZn8JUpKk7ZMusT2Eq0tQdsmXWpzAVaeoO2TLrU5iKNHWHbJn1KdxVBMH6uD4FWki+9XF9CrSQfOvj+hRoIfnWx/Up0ELyrY/rU6CF5Fsfn/DoVN9ZnQFhdQaE1RkQVmdAWJ0BYb2ZIYkSgFzflDVUp4sS6VQ1SWuoThcl0qlqktZQnS5KpFPVJK2hOl2USKeqSVpDdbookU5Vk7TGqtl43NOszoCwOgPC6gyHrd8djxjTCJp0UwAAAABJRU5ErkJggg==");
            poi.put("transaction_data", td);
            mockResponse.put("point_of_interaction", poi);
            return mockResponse;
        }

        String url = "https://api.mercadopago.com/v1/payments";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("X-Idempotency-Key", UUID.randomUUID().toString());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("transaction_amount", valor);
        requestBody.put("description", "Ativação Sistema Lojista Digital - " + tenant.getNomeEmpresa());
        requestBody.put("payment_method_id", "pix");
        requestBody.put("external_reference", "TENANT-" + tenant.getId());

        String nomeCompleto = lojista.getNomeResponsavel() != null ? lojista.getNomeResponsavel().trim() : "Lojista";
        String firstName = nomeCompleto;
        String lastName = "Digital";
        int spaceIndex = nomeCompleto.indexOf(" ");
        if (spaceIndex > 0) {
            firstName = nomeCompleto.substring(0, spaceIndex);
            String[] partes = nomeCompleto.split(" ");
            lastName = partes[partes.length - 1];
        }

        String emailPagador = (lojista.getEmail() != null && lojista.getEmail().contains("@"))
                ? lojista.getEmail()
                : "admin." + tenant.getSlug() + "@logistadigital.com.br";

        Map<String, Object> payer = new HashMap<>();
        payer.put("email", emailPagador);
        payer.put("first_name", firstName);
        payer.put("last_name", lastName);

        Map<String, String> identification = new HashMap<>();
        identification.put("type", "CPF");
        identification.put("number", "19119119100");
        payer.put("identification", identification);

        requestBody.put("payer", payer);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("[MercadoPago] Criando PIX de R$ {} para a loja: {}", valor, tenant.getNomeEmpresa());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                log.info("[MercadoPago] PIX gerado com sucesso! ID: {}", body.get("id"));
                return body;
            }
        } catch (Exception ex) {
            log.error("[MercadoPago] Erro ao criar PIX de adesão: {}", ex.getMessage(), ex);
            throw new RuntimeException("Erro ao comunicar com Mercado Pago: " + ex.getMessage(), ex);
        }

        return null;
    }

    /**
     * Gera uma cobrança Pix no Mercado Pago para adesão do lojista (R$ 149,90).
     */
    public Map<String, Object> criarPagamentoPix(ClinicaTenant tenant, Usuario admin, BigDecimal valor) {
        // Se for token placeholder de teste local
        if (accessToken == null || accessToken.contains("TEST-XXXXXXXX") || accessToken.contains("placeholder") || accessToken.trim().isEmpty()) {
            log.info("[MercadoPago] Utilizando mock de pagamento PIX para ambiente de teste");
            Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("id", "999" + (System.currentTimeMillis() / 1000));
            mockResponse.put("status", "pending");

            Map<String, Object> poi = new HashMap<>();
            Map<String, Object> td = new HashMap<>();
            td.put("qr_code", "00020101021226870014br.gov.bcb.pix2565pix.mercadopago.com/transfer/receiver/f2f/TEST-PIX-MOCK-" + tenant.getSlug());
            td.put("qr_code_base64", "iVBORw0KGgoAAAANSUhEUgAAAIIAAACCCAIAAAAFYYeqAAADAUlEQVR4nO2WMWIbMRAD/f9PJ006yTGE7ILDHKa1Z0UAzX19HeXXUc5mB9EZEHQGBJ0BQWdA0Bm+JRl777do7/n7b3UGRPbOgMjeGRDZOwMie2dAZJdmePNPAmdjK3Cymyc2npKHk908sfGUPJzs5omNp+ThZDdPbDwlDye7eWLjKXk42c0TG0/Jw8lunth4Sh5OdvPExlPycLKbJzaekoeT3Tyx8ZQ8nOzmiY2n5OFkN09sPCUPJ7t5YuMpeTjZzRMbT8nDyW6e2HhKHk5288TGU/JwspsnNp6Sh5NdOpGMnYSTvTMgsncGRPbOgMjeGRDZOwMi+5sZknjV7P3PQ+kMCDoDgs6AoDMg6Ax/eH1cydMZEHQGBJ0BQWdA0BkQRGeY+k7z7pCtzoCwOgPC6gwIqzMgrM6AsC74YCXXN2YpwlkuK7QzXGwpwlkuK7QzXGwpwlkuK5Q/g/Lcy+obsjoDwuoMCKszIKzOgLA6A8K64IP1FU59U1ZnQFidAWF1BoTVGRBWZ0BYuA/Wh1qKMMVl1XSGx1mKMMVl1XSGx1mKMMVl1fyvMyhcVt+Q1RkQVmdAWJ0BYXUGhNUZENbrX6MoAcj1TVlDdbookU5Vk7SG6nRRIp2qJmkN1emiRDpVTdIaqtNFiXSqmqQ1VKeLEulUNUlrrJqNxz3N6gwIqzMgrM6AsDoDwuoMCOuHEz8I/3CHVsQpy6xPwQvAqSZpmfUpeAE41SQtsz4FLwCnmqRl1qfgBeBUk7TM+hS8AJxqkpZZn8JUgEwRZy2zPoWpSFN3yJZZn8JUpKk7ZMusT2Eq0tQdsmXWpzAVaeoO2TLrU5iKNHWHbJn1KdxVBMH6uD4FWki+9XF9CrSQfOvj+hRoIfnWx/Up0ELyrY/rU6CF5Fsfn/DoVN9ZnQFhdQaE1RkQVmdAWJ0BYb2ZIYkSgFzflDVUp4sS6VQ1SWuoThcl0qlqktZQnS5KpFPVJK2hOl2USKeqSVpDdbookU5Vk7TGqtl43NOszoCwOgPC6gyHrd8djxjTCJp0UwAAAABJRU5ErkJggg==");
            poi.put("transaction_data", td);
            mockResponse.put("point_of_interaction", poi);

            return mockResponse;
        }

        String url = "https://api.mercadopago.com/v1/payments";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("X-Idempotency-Key", UUID.randomUUID().toString());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("transaction_amount", valor);
        requestBody.put("description", "Ativação Sistema Lojista Digital - " + tenant.getNomeEmpresa());
        requestBody.put("payment_method_id", "pix");
        requestBody.put("external_reference", "TENANT-" + tenant.getId());

        String nomeCompleto = admin.getNome() != null ? admin.getNome().trim() : "Lojista";
        String firstName = nomeCompleto;
        String lastName = "Digital";
        int spaceIndex = nomeCompleto.indexOf(" ");
        if (spaceIndex > 0) {
            firstName = nomeCompleto.substring(0, spaceIndex);
            String[] partes = nomeCompleto.split(" ");
            lastName = partes[partes.length - 1];
        }

        String emailPagador = (admin.getEmail() != null && admin.getEmail().contains("@"))
                ? admin.getEmail()
                : "admin." + tenant.getSlug() + "@logistadigital.com.br";

        Map<String, Object> payer = new HashMap<>();
        payer.put("email", emailPagador);
        payer.put("first_name", firstName);
        payer.put("last_name", lastName);

        Map<String, String> identification = new HashMap<>();
        identification.put("type", "CPF");
        identification.put("number", "19119119100");
        payer.put("identification", identification);

        requestBody.put("payer", payer);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("[MercadoPago] Criando PIX de R$ {} para a loja: {}", valor, tenant.getNomeEmpresa());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                log.info("[MercadoPago] PIX gerado com sucesso! ID: {}", body.get("id"));
                return body;
            }
        } catch (org.springframework.web.client.RestClientResponseException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("[MercadoPago] Erro HTTP {}: {}", e.getStatusCode(), errorBody);
            throw new RuntimeException("Erro ao gerar PIX no Mercado Pago (" + e.getStatusCode() + "): " + errorBody, e);
        } catch (Exception e) {
            log.error("[MercadoPago] Falha na comunicação: {}", e.getMessage());
            throw new RuntimeException("Erro ao criar pagamento Pix no Mercado Pago: " + e.getMessage(), e);
        }

        throw new RuntimeException("Resposta vazia ao criar pagamento no Mercado Pago.");
    }

    /**
     * Consulta o status de um pagamento Pix pelo ID no Mercado Pago.
     */
    public Map<String, Object> consultarStatusPagamento(String mercadoPagoId) {
        if (mercadoPagoId != null && mercadoPagoId.startsWith("999")) {
            Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("id", mercadoPagoId);
            mockResponse.put("status", "approved");
            return mockResponse;
        }

        String url = "https://api.mercadopago.com/v1/payments/" + mercadoPagoId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (org.springframework.web.client.RestClientResponseException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("[MercadoPago] Erro ao consultar pagamento {}: {}", mercadoPagoId, errorBody);
            throw new RuntimeException("Erro ao consultar pagamento no Mercado Pago: " + errorBody, e);
        } catch (Exception e) {
            log.error("[MercadoPago] Erro ao consultar pagamento: {}", e.getMessage());
            throw new RuntimeException("Erro ao consultar pagamento no Mercado Pago: " + e.getMessage(), e);
        }

        throw new RuntimeException("Resposta vazia ao consultar status do pagamento.");
    }
}

