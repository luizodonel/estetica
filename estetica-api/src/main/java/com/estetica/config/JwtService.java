package com.estetica.config;

import com.estetica.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret:${JWT_SECRET:}}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}") // 24 horas em milissegundos
    private long jwtExpiration;

    public String extrairUsername(String token) {
        return extrairClaim(token, Claims::getSubject);
    }

    public <T> T extrairClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extrairTodosClaims(token);
        return claimsResolver.apply(claims);
    }

    public String gerarToken(Usuario usuario) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("id", usuario.getId());
        extraClaims.put("nome", usuario.getNome());
        extraClaims.put("role", usuario.getRole().name());
        extraClaims.put("whatsapp", usuario.getTelefoneWhatsApp());
        extraClaims.put("tipo", "USUARIO");
        if (usuario.getTenant() != null) {
            extraClaims.put("slug", usuario.getTenant().getSlug());
        }

        String subject = usuario.getUsername();
        if (subject == null || subject.isBlank()) {
            subject = String.valueOf(usuario.getId());
        }

        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(obterChaveAssinatura())
                .compact();
    }

    public String gerarToken(com.estetica.model.Lojista lojista) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("id", lojista.getId());
        extraClaims.put("nome", lojista.getNomeResponsavel());
        extraClaims.put("role", com.estetica.model.Role.ROLE_ADMIN.name());
        extraClaims.put("whatsapp", lojista.getTelefoneWhatsApp());
        extraClaims.put("slug", lojista.getSlug());
        extraClaims.put("tipo", "LOJISTA");

        String subject = lojista.getUsername();
        if (subject == null || subject.isBlank()) {
            subject = String.valueOf(lojista.getId());
        }

        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(obterChaveAssinatura())
                .compact();
    }

    public boolean isTokenValido(String token, UserDetails userDetails) {
        if (isTokenExpirado(token)) {
            return false;
        }
        final String username = extrairUsername(token);
        if (username != null && userDetails.getUsername() != null && username.equals(userDetails.getUsername())) {
            return true;
        }
        // Validação por ID do claim quando o usuário foi carregado diretamente pelo ID do banco
        Claims claims = extrairTodosClaims(token);
        Number idClaim = claims.get("id", Number.class);
        if (idClaim != null) {
            if (userDetails instanceof Usuario u && idClaim.longValue() == u.getId()) {
                return true;
            }
            if (userDetails instanceof com.estetica.model.Lojista l && idClaim.longValue() == l.getId()) {
                return true;
            }
        }
        return false;
    }

    private boolean isTokenExpirado(String token) {
        return extrairExpiracao(token).before(new Date());
    }

    private Date extrairExpiracao(String token) {
        return extrairClaim(token, Claims::getExpiration);
    }

    public Claims extrairTodosClaims(String token) {
        return Jwts.parser()
                .verifyWith(obterChaveAssinatura())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey obterChaveAssinatura() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

