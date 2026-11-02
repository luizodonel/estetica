package com.estetica.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GerarAdminMaster {
    public static void main(String[] args) {
        String senha = args.length > 0 ? args[0] : "Admin@2026#Master";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(senha);
        System.out.println("SENHA: " + senha);
        System.out.println("HASH_BCRYPT: " + hash);
    }
}
