-- ======================================================================================
-- SCRIPT SQL: CRIAR OU ATUALIZAR ADMINISTRADOR NO BANCO DE PRODUÇÃO (PostgreSQL)
-- Clínica de Estética | Host: 93.127.212.65:3008 | Database: postgres
-- ======================================================================================

-- OPÇÃO 1: INSERT DIRETO COM HASH BCRYPT PRÉ-COMPILADO (100% compatível com Spring Security)
-- E-mail: admin@logistadigital.com.br
-- Senha de Acesso: Admin@123
-- Hash BCrypt correspondente: $2a$10$v1KhXRkveBcpW8cZSfeHK.MYsRZdvXTPSxVNGecUwMOMxS77p9P72

INSERT INTO tb_usuario (
    nome,
    email,
    telefone_whatsapp,
    senha_hash,
    role,
    ativo,
    data_criacao,
    version
) VALUES (
    'Administrador Master',
    'admin@logistadigital.com.br',
    '11999999999',
    '$2a$10$v1KhXRkveBcpW8cZSfeHK.MYsRZdvXTPSxVNGecUwMOMxS77p9P72',
    'ROLE_ADMIN',
    true,
    NOW(),
    0
)
ON CONFLICT (email) DO UPDATE 
SET senha_hash = '$2a$10$v1KhXRkveBcpW8cZSfeHK.MYsRZdvXTPSxVNGecUwMOMxS77p9P72',
    role = 'ROLE_ADMIN',
    ativo = true;

-- OPÇÃO 2: CASO QUEIRA CRIAR OUTRO ADMIN COM UMA SENHA PERSONALIZADA VIA EXTENSÃO PGCRYPTO:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- INSERT INTO tb_usuario (nome, email, telefone_whatsapp, senha_hash, role, ativo, data_criacao, version)
-- VALUES ('Seu Nome', 'seu-email@exemplo.com', '11999999999', crypt('SuaSenha123', gen_salt('bf', 10)), 'ROLE_ADMIN', true, NOW(), 0)
-- ON CONFLICT (email) DO UPDATE SET senha_hash = crypt('SuaSenha123', gen_salt('bf', 10)), role = 'ROLE_ADMIN', ativo = true;

-- 3. Confirmar que o usuário administrador foi criado
SELECT id, nome, email, telefone_whatsapp, role, ativo, data_criacao 
FROM tb_usuario 
WHERE email = 'admin@logistadigital.com.br';
