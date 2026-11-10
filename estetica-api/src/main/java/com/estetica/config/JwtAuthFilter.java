package com.estetica.config;

import com.estetica.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final com.estetica.repository.LojistaRepository lojistaRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        try {
            final io.jsonwebtoken.Claims claims = jwtService.extrairTodosClaims(jwt);
            final String userSubject = claims.getSubject();

            if (userSubject != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = null;
                Number idClaim = claims.get("id", Number.class);
                String tipoClaim = claims.get("tipo", String.class);

                if (idClaim != null && "LOJISTA".equals(tipoClaim)) {
                    userDetails = lojistaRepository.findById(idClaim.longValue()).map(l -> (UserDetails) l).orElse(null);
                } else if (idClaim != null && "USUARIO".equals(tipoClaim)) {
                    userDetails = usuarioRepository.findById(idClaim.longValue()).map(u -> (UserDetails) u).orElse(null);
                }

                // Fallback seguro para tokens antigos sem claim "tipo"
                if (userDetails == null && !"LOJISTA".equals(tipoClaim)) {
                    String slugClaim = claims.get("slug", String.class);
                    if (idClaim != null && slugClaim == null) {
                        userDetails = usuarioRepository.findById(idClaim.longValue()).map(u -> (UserDetails) u).orElse(null);
                    }
                    if (userDetails == null) {
                        userDetails = usuarioRepository.findAllByEmailIgnoreCase(userSubject).stream().findFirst()
                                .or(() -> usuarioRepository.findAllByLoginIgnoreCase(userSubject).stream().findFirst())
                                .or(() -> usuarioRepository.findAllByTelefoneWhatsApp(userSubject).stream().findFirst())
                                .map(u -> (UserDetails) u)
                                .orElse(null);
                    }
                }

                if (userDetails == null && !"USUARIO".equals(tipoClaim)) {
                    userDetails = lojistaRepository.findByEmail(userSubject)
                            .or(() -> lojistaRepository.findByLoginIgnoreCase(userSubject))
                            .or(() -> lojistaRepository.findByTelefoneWhatsApp(userSubject))
                            .map(l -> (UserDetails) l)
                            .orElse(null);
                }

                if (userDetails != null && userDetails.isEnabled() && jwtService.isTokenValido(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Token inválido ou expirado - deixa o fluxo seguir para o Spring Security rejeitar
        }

        filterChain.doFilter(request, response);
    }
}

