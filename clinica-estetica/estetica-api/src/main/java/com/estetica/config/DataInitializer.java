package com.estetica.config;

import com.estetica.model.*;
import com.estetica.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProcedimentoRepository procedimentoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final HorarioTrabalhoRepository horarioTrabalhoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final HistoricoAtendimentoRepository historicoAtendimentoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (categoriaRepository.count() > 0) {
            log.info("Base de dados já inicializada.");
            garantirPacientesExemplo();
            return;
        }

        log.info("Populando dados iniciais da Clínica de Estética...");

        // 1. Usuário Administrador
        Usuario admin = Usuario.builder()
                .nome("Administradora da Clínica")
                .email("admin@clinicaestetica.com")
                .telefoneWhatsApp("11988887777")
                .senhaHash(passwordEncoder.encode("admin123"))
                .role(Role.ROLE_ADMIN)
                .ativo(true)
                .build();
        usuarioRepository.save(admin);

        // 2. Clientes / Pacientes de Teste
        Usuario clienteTeste = Usuario.builder()
                .nome("Beatriz Helena Ramos")
                .email("beatriz@exemplo.com")
                .telefoneWhatsApp("11999998888")
                .senhaHash(passwordEncoder.encode("cliente123"))
                .role(Role.ROLE_CLIENTE)
                .ativo(true)
                .build();
        usuarioRepository.save(clienteTeste);

        Usuario cliente2 = Usuario.builder()
                .nome("Larissa Cristina Prado")
                .email("larissa@exemplo.com")
                .telefoneWhatsApp("11987654321")
                .senhaHash(passwordEncoder.encode("cliente123"))
                .role(Role.ROLE_CLIENTE)
                .ativo(true)
                .build();
        usuarioRepository.save(cliente2);

        Usuario cliente3 = Usuario.builder()
                .nome("Fernanda Alencar Souza")
                .email("fernanda@exemplo.com")
                .telefoneWhatsApp("11976543210")
                .senhaHash(passwordEncoder.encode("cliente123"))
                .role(Role.ROLE_CLIENTE)
                .ativo(true)
                .build();
        usuarioRepository.save(cliente3);

        // 3. Usuários e Perfis Profissionais
        Usuario userCamila = Usuario.builder()
                .nome("Dra. Camila Silveira")
                .email("camila@clinicaestetica.com")
                .telefoneWhatsApp("11977776666")
                .senhaHash(passwordEncoder.encode("prof123"))
                .role(Role.ROLE_PROFISSIONAL)
                .ativo(true)
                .build();
        usuarioRepository.save(userCamila);

        Usuario userMariana = Usuario.builder()
                .nome("Mariana Costa")
                .email("mariana@clinicaestetica.com")
                .telefoneWhatsApp("11966665555")
                .senhaHash(passwordEncoder.encode("prof123"))
                .role(Role.ROLE_PROFISSIONAL)
                .ativo(true)
                .build();
        usuarioRepository.save(userMariana);

        Profissional profCamila = Profissional.builder()
                .usuario(userCamila)
                .nome("Dra. Camila Silveira")
                .especialidade("Biomédica Esteta & Injetáveis")
                .bio("Especialista em harmonização facial, bioestimuladores de colágeno e peelings avançados com mais de 8 anos de experiência clínica.")
                .fotoUrl("https://images.unsplash.com/photo-1594824813626-d62f6b865664?auto=format&fit=crop&q=80&w=400")
                .corIdentificacao("#e0a899") // Rosé Nude
                .ativo(true)
                .procedimentos(new HashSet<>())
                .build();

        Profissional profMariana = Profissional.builder()
                .usuario(userMariana)
                .nome("Mariana Costa")
                .especialidade("Fisioterapeuta Dermato-Funcional")
                .bio("Foco em tratamentos corporais de alta tecnologia, drenagem linfática método Renata França e pós-operatório estético.")
                .fotoUrl("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400")
                .corIdentificacao("#c89f8d") // Nude Suave
                .ativo(true)
                .procedimentos(new HashSet<>())
                .build();

        profCamila = profissionalRepository.save(profCamila);
        profMariana = profissionalRepository.save(profMariana);

        // 4. Configurar Jornadas de Trabalho (Segunda a Sexta 08:00 às 18:00 com almoço das 12:00 às 13:00, e Sábado 08:00 às 13:00)
        configurarJornadaPadrao(profCamila);
        configurarJornadaPadrao(profMariana);

        // 5. Categorias de Estética
        Categoria catFacial = categoriaRepository.save(Categoria.builder()
                .nome("Facial")
                .descricao("Rejuvenescimento, hidratação profunda, limpeza e renovação celular")
                .icone("sparkles")
                .ordemExibicao(1)
                .ativo(true)
                .build());

        Categoria catCorporal = categoriaRepository.save(Categoria.builder()
                .nome("Corporal")
                .descricao("Contorno corporal, tratamento de celulite, gordura localizada e flacidez")
                .icone("sparkles")
                .ordemExibicao(2)
                .ativo(true)
                .build());

        Categoria catMassagens = categoriaRepository.save(Categoria.builder()
                .nome("Massagens & Spa")
                .descricao("Massagens relaxantes, drenagem linfática e alívio do estresse diário")
                .icone("heart")
                .ordemExibicao(3)
                .ativo(true)
                .build());

        Categoria catLaser = categoriaRepository.save(Categoria.builder()
                .nome("Depilação a Laser")
                .descricao("Tecnologia de ponta indolor e definitiva com laser de diodo de última geração")
                .icone("zap")
                .ordemExibicao(4)
                .ativo(true)
                .build());

        // 6. Procedimentos
        Procedimento p1 = procedimentoRepository.save(Procedimento.builder()
                .categoria(catFacial)
                .titulo("Limpeza de Pele Profunda com Fototerapia")
                .descricao("Higienização minuciosa, extração de cravos sem dor, esfoliação ultrassônica e máscara de LED regeneradora.")
                .duracaoMinutos(60)
                .preco(new BigDecimal("180.00"))
                .imagemUrl("https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        Procedimento p2 = procedimentoRepository.save(Procedimento.builder()
                .categoria(catFacial)
                .titulo("Peeling Químico Renovador de Colágeno")
                .descricao("Aplicação de ácidos selecionados para atenuação de manchas solares, melasma e renovação da textura cutânea.")
                .duracaoMinutos(45)
                .preco(new BigDecimal("250.00"))
                .imagemUrl("https://images.unsplash.com/photo-1512290900672-1f55b0a3c20c?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        Procedimento p3 = procedimentoRepository.save(Procedimento.builder()
                .categoria(catCorporal)
                .titulo("Criomodelagem e Drenagem Escultural")
                .descricao("Combinação de resfriamento controlado para quebra de adipócitos com manobras drenantes ativadoras da circulação.")
                .duracaoMinutos(60)
                .preco(new BigDecimal("320.00"))
                .imagemUrl("https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        Procedimento p4 = procedimentoRepository.save(Procedimento.builder()
                .categoria(catMassagens)
                .titulo("Massagem Relaxante com Pedras Quentes e Aromaterapia")
                .descricao("Sessão revigorante com óleos essenciais nobres, pedras vulcânicas aquecidas e alívio das tensões acumuladas.")
                .duracaoMinutos(50)
                .preco(new BigDecimal("160.00"))
                .imagemUrl("https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        Procedimento p5 = procedimentoRepository.save(Procedimento.builder()
                .categoria(catLaser)
                .titulo("Depilação a Laser - Sessão Axilas & Pernas")
                .descricao("Remoção definitiva e suave com tecnologia de resfriamento na ponteira que garante conforto total.")
                .duracaoMinutos(30)
                .preco(new BigDecimal("190.00"))
                .imagemUrl("https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=600")
                .ativo(true)
                .build());

        // Habilitar procedimentos para os profissionais
        profCamila.getProcedimentos().addAll(Set.of(p1, p2, p5));
        profMariana.getProcedimentos().addAll(Set.of(p3, p4, p5));
        profissionalRepository.save(profCamila);
        profissionalRepository.save(profMariana);

        // 7. Agendamento de Exemplo para Hoje (Demonstração do Painel & Slots Ocupados)
        LocalDateTime hoje14h = LocalDateTime.now().withHour(14).withMinute(0).withSecond(0).withNano(0);
        Agendamento agendamentoHoje = Agendamento.builder()
                .cliente(clienteTeste)
                .profissional(profCamila)
                .procedimento(p1)
                .dataHoraInicio(hoje14h)
                .dataHoraFim(hoje14h.plusMinutes(p1.getDuracaoMinutos()))
                .status(StatusAgendamento.CONFIRMADO)
                .valorCobrado(p1.getPreco())
                .observacoesCliente("Primeira sessão na clínica. Pele sensível.")
                .notasInternas("Recomendado teste de sensibilidade para ácido hialurônico.")
                .build();
        agendamentoHoje = agendamentoRepository.save(agendamentoHoje);

        // 8. Histórico / Prontuário Exemplo
        HistoricoAtendimento prontuarioExemplo = HistoricoAtendimento.builder()
                .cliente(clienteTeste)
                .profissional(profCamila)
                .agendamento(agendamentoHoje)
                .dataAtendimento(LocalDateTime.now().minusDays(30))
                .notasAnamnese("Queixa principal: ressecamento na zona T e marcas leves de expressão. Não faz uso de ácidos atualmente.")
                .orientacoesPosProcedimento("Uso rigoroso de protetor solar FPS 50 a cada 3 horas. Suspender esfoliantes caseiros.")
                .reacoesAdversas("Nenhuma reação adversa observada durante o procedimento.")
                .build();
        historicoAtendimentoRepository.save(prontuarioExemplo);

        log.info("Base de dados da Clínica de Estética inicializada com sucesso!");
    }

    private void configurarJornadaPadrao(Profissional profissional) {
        List<DayOfWeek> diasUteis = List.of(
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY
        );

        for (DayOfWeek dia : diasUteis) {
            horarioTrabalhoRepository.save(HorarioTrabalho.builder()
                    .profissional(profissional)
                    .diaSemana(dia)
                    .horaInicio(LocalTime.of(8, 0))
                    .horaFim(LocalTime.of(18, 0))
                    .inicioIntervalo(LocalTime.of(12, 0))
                    .fimIntervalo(LocalTime.of(13, 0))
                    .ativo(true)
                    .build());
        }

        // Sábado de manhã
        horarioTrabalhoRepository.save(HorarioTrabalho.builder()
                .profissional(profissional)
                .diaSemana(DayOfWeek.SATURDAY)
                .horaInicio(LocalTime.of(8, 0))
                .horaFim(LocalTime.of(13, 0))
                .inicioIntervalo(null)
                .fimIntervalo(null)
                .ativo(true)
                .build());
    }

    private void garantirPacientesExemplo() {
        if (!usuarioRepository.existsByEmail("beatriz@exemplo.com") && !usuarioRepository.existsByEmail("cliente@exemplo.com")) {
            usuarioRepository.save(Usuario.builder()
                    .nome("Beatriz Helena Ramos")
                    .email("beatriz@exemplo.com")
                    .telefoneWhatsApp("11999998888")
                    .senhaHash(passwordEncoder.encode("cliente123"))
                    .role(Role.ROLE_CLIENTE)
                    .ativo(true)
                    .build());
        }

        if (!usuarioRepository.existsByEmail("larissa@exemplo.com")) {
            usuarioRepository.save(Usuario.builder()
                    .nome("Larissa Cristina Prado")
                    .email("larissa@exemplo.com")
                    .telefoneWhatsApp("11987654321")
                    .senhaHash(passwordEncoder.encode("cliente123"))
                    .role(Role.ROLE_CLIENTE)
                    .ativo(true)
                    .build());
        }

        if (!usuarioRepository.existsByEmail("fernanda@exemplo.com")) {
            usuarioRepository.save(Usuario.builder()
                    .nome("Fernanda Alencar Souza")
                    .email("fernanda@exemplo.com")
                    .telefoneWhatsApp("11976543210")
                    .senhaHash(passwordEncoder.encode("cliente123"))
                    .role(Role.ROLE_CLIENTE)
                    .ativo(true)
                    .build());
        }
    }
}

