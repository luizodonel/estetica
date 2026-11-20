package com.estetica.service;

import com.estetica.event.AgendamentoCanceladoEvent;
import com.estetica.event.AgendamentoCriadoEvent;
import com.estetica.model.Agendamento;
import com.estetica.model.ClinicaTenant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
public class NotificacaoService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");
    private static final DateTimeFormatter FORMATTER_HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter FORMATTER_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${whatsapp.api.url:${WHATSAPP_API_URL:https://enviosmsgapi.luizodonel.cloud/api/send}}")
    private String whatsappApiUrl;

    @Value("${whatsapp.api.enabled:${WHATSAPP_API_ENABLED:true}}")
    private boolean whatsappApiEnabled;

    // Variações Spintax Anti-Ban para evitar mensagens 100% idênticas em sequência
    private static final List<String> SAUDACOES = List.of(
            "Olá",
            "Oi",
            "Tudo bem,",
            "Prezado(a)"
    );

    private static final List<String> FECHAMENTOS_OPT_IN = List.of(
            "Responda *OK* para confirmar o recebimento deste comprovante.",
            "Por gentileza, responda *OK* para validarmos sua reserva.",
            "Envie um *OK* aqui no WhatsApp para confirmar que recebeu seu horário.",
            "Responda *OK* nesta mensagem para ativar seu lembrete automático."
    );

    private String sortear(List<String> opcoes) {
        return opcoes.get(ThreadLocalRandom.current().nextInt(opcoes.size()));
    }

    private String obterNomeEstabelecimento(Agendamento a) {
        if (a.getTenant() != null && a.getTenant().getNomeEmpresa() != null && !a.getTenant().getNomeEmpresa().isBlank()) {
            return a.getTenant().getNomeEmpresa().trim();
        }
        return "Agendoou";
    }

    private String obterBaseUrlEstabelecimento(Agendamento a) {
        if (a.getTenant() != null && a.getTenant().getSlug() != null && !a.getTenant().getSlug().isBlank()) {
            return "https://" + a.getTenant().getSlug().trim().toLowerCase() + ".logistadigital.com.br";
        }
        return "https://agendoou.logistadigital.com.br";
    }

    private String montarBlocoBotoesAcao(Agendamento a) {
        return "\n\nPodemos confirmar sua presença?\n" +
               "Responda aqui no WhatsApp:\n" +
               "*1* - Confirmar presença\n" +
               "*2* - Reagendar horário";
    }

    @Async
    @EventListener
    public void onAgendamentoCriado(AgendamentoCriadoEvent event) {
        Agendamento a = event.getAgendamento();
        String dataFormatada = a.getDataHoraInicio().format(FORMATTER_DATA);
        String horaFormatada = a.getDataHoraInicio().format(FORMATTER_HORA);
        String horarioCompleto = a.getDataHoraInicio().format(FORMATTER);
        String nomeEmpresa = obterNomeEstabelecimento(a);
        String primeiroNomeCliente = extrairPrimeiroNome(a.getCliente().getNome());

        // 1. Mensagem para o Cliente (Discreta, sem links longos e sem emojis quebrados)
        String saudacao = sortear(SAUDACOES);
        String botoesAcao = montarBlocoBotoesAcao(a);
        String msgCliente = String.format(
                "*%s — Agendamento Confirmado*\n\n" +
                "%s *%s*! Seu horário foi reservado:\n\n" +
                "• *Serviço:* %s\n" +
                "• *Profissional:* %s\n" +
                "• *Data:* %s às *%s*" +
                "%s",
                nomeEmpresa,
                saudacao,
                primeiroNomeCliente,
                a.getProcedimento().getTitulo(),
                a.getProfissional().getNome(),
                dataFormatada,
                horaFormatada,
                botoesAcao
        );

        log.info("[WHATSAPP AUTO] Disparando confirmação de agendamento #{} para cliente {} ({})",
                a.getId(), a.getCliente().getNome(), a.getCliente().getTelefoneWhatsApp());
        dispararWhatsAppComRetry(a.getCliente().getTelefoneWhatsApp(), msgCliente);

        // 2. Mensagem para o Lojista / Dono da Empresa (após breve pausa humanizada)
        ClinicaTenant tenant = a.getTenant();
        String telEmpresa = (tenant != null && tenant.getTelefoneWhatsApp() != null && !tenant.getTelefoneWhatsApp().isBlank())
                ? tenant.getTelefoneWhatsApp()
                : (a.getProfissional().getUsuario() != null ? a.getProfissional().getUsuario().getTelefoneWhatsApp() : null);

        if (telEmpresa != null && !telEmpresa.isBlank() && !limparDigitos(telEmpresa).equals(limparDigitos(a.getCliente().getTelefoneWhatsApp()))) {
            aguardarDelayHumanizado(5500, 8500);
            String msgLojista = String.format(
                    "*Novo Agendamento Recebido — %s*\n\n" +
                    "• *Cliente:* %s (%s)\n" +
                    "• *Serviço:* %s\n" +
                    "• *Profissional:* %s\n" +
                    "• *Data/Hora:* %s",
                    nomeEmpresa,
                    a.getCliente().getNome(),
                    a.getCliente().getTelefoneWhatsApp(),
                    a.getProcedimento().getTitulo(),
                    a.getProfissional().getNome(),
                    horarioCompleto
            );
            log.info("[WHATSAPP AUTO] Notificando estabelecimento {} no número {}", nomeEmpresa, telEmpresa);
            dispararWhatsAppComRetry(telEmpresa, msgLojista);
        }
    }

    @Async
    @EventListener
    public void onAgendamentoCancelado(AgendamentoCanceladoEvent event) {
        Agendamento a = event.getAgendamento();
        String horarioFormatado = a.getDataHoraInicio().format(FORMATTER);
        String nomeEmpresa = obterNomeEstabelecimento(a);
        String primeiroNome = extrairPrimeiroNome(a.getCliente().getNome());

        String msgCancelamento = String.format(
                "*Aviso de Cancelamento — %s*\n\n" +
                "%s *%s*, informamos que o agendamento de *%s* previsto para *%s* foi cancelado.\n\n" +
                "Caso deseje reagendar um novo horário, responda *2* nesta mensagem.",
                nomeEmpresa,
                sortear(SAUDACOES),
                primeiroNome,
                a.getProcedimento().getTitulo(),
                horarioFormatado
        );

        log.info("[WHATSAPP AUTO] Disparando aviso de cancelamento #{} para {}", a.getId(), a.getCliente().getTelefoneWhatsApp());
        dispararWhatsAppComRetry(a.getCliente().getTelefoneWhatsApp(), msgCancelamento);
    }

    public void enviarLembretePreConsulta(Agendamento a) {
        String dataFormatada = a.getDataHoraInicio().format(FORMATTER_DATA);
        String horaFormatada = a.getDataHoraInicio().format(FORMATTER_HORA);
        String nomeEstabelecimento = obterNomeEstabelecimento(a);
        String primeiroNome = extrairPrimeiroNome(a.getCliente().getNome());
        String botoesAcao = montarBlocoBotoesAcao(a);

        String msgLembrete = String.format(
                "*%s — Lembrete de Horário*\n\n" +
                "%s *%s*! Passando para lembrar do seu agendamento:\n\n" +
                "• *Serviço:* %s\n" +
                "• *Profissional:* %s\n" +
                "• *Data:* %s às *%s*" +
                "%s",
                nomeEstabelecimento,
                sortear(SAUDACOES),
                primeiroNome,
                a.getProcedimento().getTitulo(),
                a.getProfissional().getNome(),
                dataFormatada,
                horaFormatada,
                botoesAcao
        );

        log.info("[LEMBRETE AUTOMÁTICO WHATSAPP] Enviando lembrete 24h para {} ({}) em {}",
                a.getCliente().getNome(), a.getCliente().getTelefoneWhatsApp(), nomeEstabelecimento);

        dispararWhatsAppComRetry(a.getCliente().getTelefoneWhatsApp(), msgLembrete);
    }

    public boolean dispararWhatsAppComRetry(String telefoneDestino, String mensagem) {
        if (!whatsappApiEnabled || whatsappApiUrl == null || whatsappApiUrl.isBlank()) {
            log.debug("[WHATSAPP AUTO] Envio desabilitado ou URL não configurada.");
            return false;
        }

        String numeroLimpo = limparDigitos(telefoneDestino);
        if (numeroLimpo.length() < 10) {
            log.warn("[WHATSAPP AUTO] Número inválido ou sem DDD ignorado: {}", telefoneDestino);
            return false;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "numbers", List.of(numeroLimpo),
                "message", mensagem
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // Até 2 tentativas caso a whatsappAPI esteja ocupada com outro envio ("Já existe um envio em andamento")
        for (int tentativa = 1; tentativa <= 2; tentativa++) {
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(whatsappApiUrl, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("[WHATSAPP AUTO] Mensagem enviada com sucesso para {} via whatsappAPI!", numeroLimpo);
                    return true;
                }
            } catch (Exception ex) {
                log.warn("[WHATSAPP AUTO] Tentativa {}/2 para {} retornou aviso: {}", tentativa, numeroLimpo, ex.getMessage());
                if (tentativa == 1) {
                    aguardarDelayHumanizado(4000, 6500);
                }
            }
        }
        return false;
    }

    public void aguardarDelayHumanizado(int minMs, int maxMs) {
        try {
            int sleepTime = ThreadLocalRandom.current().nextInt(minMs, maxMs + 1);
            Thread.sleep(sleepTime);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private String limparDigitos(String tel) {
        if (tel == null) return "";
        return tel.replaceAll("\\D", "");
    }

    private String extrairPrimeiroNome(String nomeCompleto) {
        if (nomeCompleto == null || nomeCompleto.isBlank()) return "Cliente";
        String[] partes = nomeCompleto.trim().split("\\s+");
        return partes[0];
    }
}
