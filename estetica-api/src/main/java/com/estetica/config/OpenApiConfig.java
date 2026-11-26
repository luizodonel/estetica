package com.estetica.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("Agendoou API — Plataforma SaaS Multi-Nicho de Agendamento Online")
                        .version("1.0.0")
                        .description("API RESTful Multi-Tenant para agendamentos online mobile-first em 13 setores (Estética, Salões, Barbearias, Clínicas Médicas, Odontologia, Restaurantes, Estúdios e mais), cálculo em tempo real de horários livres, prontuário e cobrança PIX.")
                        .contact(new Contact().name("Equipe Técnica Agendoou").email("contato@agendoousistemas.com.br"))
                        .license(new License().name("Proprietária").url("https://agendoousistemas.com.br")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Insira o token JWT gerado no endpoint de login/registro: Bearer {token}")));
    }
}

