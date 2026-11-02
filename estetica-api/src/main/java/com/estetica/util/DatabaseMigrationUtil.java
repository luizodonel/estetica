package com.estetica.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DatabaseMigrationUtil {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://93.127.212.65:3008/postgres";
        String user = "postgres";
        String pass = "vra7v6XMf3798kBc2AADCLIYqUmag5OfHgdfB6j10ENx9rP5vC0bFsMufGdLIY1n";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {

            System.out.println("Conectado ao PostgreSQL com sucesso!");

            // 1. Email opcional em tb_usuario
            try {
                stmt.execute("ALTER TABLE tb_usuario ALTER COLUMN email DROP NOT NULL;");
                System.out.println("tb_usuario.email agora é opcional (DROP NOT NULL)");
            } catch (Exception e) {
                System.out.println("Aviso email drop not null: " + e.getMessage());
            }

            // 2. Coluna tenant_id e primeiro_acesso em tb_usuario
            stmt.execute("ALTER TABLE tb_usuario ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tb_clinica_tenant(id);");
            stmt.execute("ALTER TABLE tb_usuario ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT FALSE;");
            System.out.println("tb_usuario colunas tenant_id e primeiro_acesso verificadas!");

            // 3. Coluna tenant_id em tb_profissional, tb_procedimento, tb_agendamento
            stmt.execute("ALTER TABLE tb_profissional ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tb_clinica_tenant(id);");
            stmt.execute("ALTER TABLE tb_procedimento ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tb_clinica_tenant(id);");
            stmt.execute("ALTER TABLE tb_agendamento ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tb_clinica_tenant(id);");
            System.out.println("Colunas tenant_id criadas com sucesso!");

            // 4. Verificar se existe ao menos um tenant
            Long defaultTenantId = null;
            ResultSet rs = stmt.executeQuery("SELECT id FROM tb_clinica_tenant ORDER BY id ASC LIMIT 1;");
            if (rs.next()) {
                defaultTenantId = rs.getLong("id");
                System.out.println("Tenant existente encontrado com ID: " + defaultTenantId);
            } else {
                // Cria o tenant default para a clínica master
                stmt.execute("INSERT INTO tb_clinica_tenant (nome_empresa, slug, link_personalizado, cor_primaria, cor_secundaria, ativo, data_criacao) " +
                             "VALUES ('L''Élégance Estética Master', 'estetica', 'https://estetica.logistadigital.com.br/', '#e11d48', '#f43f5e', true, NOW());");
                ResultSet rsNew = stmt.executeQuery("SELECT id FROM tb_clinica_tenant WHERE slug = 'estetica';");
                if (rsNew.next()) {
                    defaultTenantId = rsNew.getLong("id");
                    System.out.println("Tenant padrão criado com ID: " + defaultTenantId);
                }
            }

            // 5. Associar registros órfãos existentes ao defaultTenantId
            if (defaultTenantId != null) {
                int u = stmt.executeUpdate("UPDATE tb_usuario SET tenant_id = " + defaultTenantId + " WHERE tenant_id IS NULL;");
                int p = stmt.executeUpdate("UPDATE tb_profissional SET tenant_id = " + defaultTenantId + " WHERE tenant_id IS NULL;");
                int pr = stmt.executeUpdate("UPDATE tb_procedimento SET tenant_id = " + defaultTenantId + " WHERE tenant_id IS NULL;");
                int a = stmt.executeUpdate("UPDATE tb_agendamento SET tenant_id = " + defaultTenantId + " WHERE tenant_id IS NULL;");
                System.out.println("Registros órfãos associados ao tenant " + defaultTenantId + ": usuarios=" + u + ", profissionais=" + p + ", procedimentos=" + pr + ", agendamentos=" + a);

                // Associar adminUsuario de tb_clinica_tenant se estiver nulo
                stmt.executeUpdate("UPDATE tb_clinica_tenant SET admin_usuario_id = (SELECT id FROM tb_usuario WHERE role = 'ROLE_ADMIN' ORDER BY id ASC LIMIT 1) WHERE admin_usuario_id IS NULL;");
            }

            // 6. Índice para busca rápida por telefoneWhatsApp
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_usuario_telefone ON tb_usuario(telefone_whatsapp);");
            System.out.println("Índice de telefone criado com sucesso!");

            System.out.println("MIGRAÇÃO DE MULTI-TENANCY E TELEFONE CONCLUÍDA COM SUCESSO!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
