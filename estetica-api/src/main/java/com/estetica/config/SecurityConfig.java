package com.estetica.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"detail\":\"Sessão expirada ou não autenticada. Faça login novamente.\"}");
                }))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints Públicos
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/onboarding/lojista", "/api/v1/onboarding/webhook-mercadopago").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/onboarding/tenant/**",
                                "/api/v1/onboarding/verificar-slug",
                                "/api/v1/onboarding/meu-tenant",
                                "/api/v1/onboarding/status-pagamento/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/uploads").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/procedimentos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/profissionais/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/disponibilidade/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/agendamentos").permitAll()

                        // Swagger / OpenAPI
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // H2 Console (se habilitado em dev)
                        .requestMatchers("/h2-console/**").permitAll()

                        // Recursos estáticos Frontend, SPA e Arquivos Enviados (Uploads)
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/", "/index.html", "/*.js", "/*.css", "/*.ico", "/*.png", "/*.jpg", "/*.svg",
                                "/assets/**", "/media/**")
                        .permitAll()
                        .requestMatchers("/catalogo/**", "/agendar/**", "/meus-agendamentos/**", "/admin/**",
                                "/login/**", "/registrar/**", "/parceiro/**")
                        .permitAll()

                        // Endpoints protegidos da API
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        // Habilita frames para console H2 se necessário
        http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
