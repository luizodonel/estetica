-- ======================================================================================
-- SCRIPT SQL: CADASTRO DO ADMINISTRADOR MASTER NO BANCO DE PRODUÇÃO (PostgreSQL)
-- Clínica de Estética | Host: 93.127.212.65:3008 | Database: postgres
-- ======================================================================================

-- 1. Habilita a extensão pgcrypto do PostgreSQL para geração automática de hash BCrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insere o Administrador Master Oficial da Clínica
-- Se o usuário já existir pelo e-mail, atualiza para garantir que ele seja ROLE_ADMIN e ativo
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
    crypt('Admin@123', gen_salt('bf', 10)), -- Criptografa a senha 'Admin@123' em formato BCrypt compatível com Spring Security
    'ROLE_ADMIN',
    true,
    NOW(),
    0
)
ON CONFLICT (email) DO UPDATE 
SET senha_hash = crypt('Admin@123', gen_salt('bf', 10)),
    role = 'ROLE_ADMIN',
    ativo = true;

-- 3. Confirmação do cadastro
SELECT id, nome, email, telefone_whatsapp, role, ativo, data_criacao 
FROM tb_usuario 
WHERE email = 'admin@logistadigital.com.br';
