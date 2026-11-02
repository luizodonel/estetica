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

    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
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

        return Jwts.builder()
                .claims(extraClaims)
                .subject(usuario.getUsername())
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

        return Jwts.builder()
                .claims(extraClaims)
                .subject(lojista.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(obterChaveAssinatura())
                .compact();
    }

    public boolean isTokenValido(String token, UserDetails userDetails) {
        final String username = extrairUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpirado(token);
    }

    private boolean isTokenExpirado(String token) {
        return extrairExpiracao(token).before(new Date());
    }

    private Date extrairExpiracao(String token) {
        return extrairClaim(token, Claims::getExpiration);
    }

    private Claims extraTodosClaims(String token) {
        return Jwts.parser()
                .verifyWith(obterChaveAssinatura())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Claims extrairTodosClaims(String token) {
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

