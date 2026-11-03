package com.estetica.model;

import lombok.Getter;

@Getter
public enum SetorAtuacao {
    CLINICA_ESTETICA("Clínica de Estética", "Paciente", "Consulta / Procedimento", true, false, false, false, false),
    SALAO_BELEZA("Salão de Beleza", "Cliente", "Procedimento / Corte / Sessão", false, false, false, false, false),
    BARBEARIA("Barbearia", "Cliente", "Corte / Barba / Sessão", false, false, false, false, false),
    RESTAURANTE("Restaurante", "Cliente", "Reserva de Mesa", false, false, true, false, false),
    DENTISTA("Clínica de Dentista", "Paciente", "Consulta / Procedimento", true, false, false, false, false),
    MEDICA("Clínica Médica", "Paciente", "Consulta / Exame", true, false, false, false, false),
    TATUAGEM("Estúdio de Tatuagem e Piercing", "Cliente", "Sessão / Tatuagem", false, false, false, false, false),
    PSICOLOGIA("Consultório de Psicologia e Terapia", "Paciente", "Sessão / Consulta", true, false, false, false, false),
    NUTRICAO("Nutricionistas e Nutrólogos", "Paciente", "Consulta / Avaliação", true, false, false, false, false),
    PILATES_PERSONAL("Pilates e Personal Trainer", "Aluno", "Aula / Treino", false, false, false, true, false),
    SPA_MASSOTERAPIA("Spa e Massoterapia", "Cliente", "Sessão / Massagem", false, false, false, false, false),
    ESTETICA_AUTOMOTIVA("Estética Automotiva / Car Detailing", "Cliente", "Serviço / Lavagem", false, true, false, false, false),
    ESTUDIO_FOTOGRAFICO("Estúdio Fotográfico", "Cliente", "Ensaio / Sessão", false, false, false, false, true);

    private final String descricao;
    private final String termoCliente;
    private final String termoServico;
    private final boolean requerProntuario;
    private final boolean requerVeiculo;
    private final boolean requerMesa;
    private final boolean requerTurmaCheckin;
    private final boolean requerLocacaoEnsaio;

    SetorAtuacao(String descricao, String termoCliente, String termoServico,
                 boolean requerProntuario, boolean requerVeiculo, boolean requerMesa,
                 boolean requerTurmaCheckin, boolean requerLocacaoEnsaio) {
        this.descricao = descricao;
        this.termoCliente = termoCliente;
        this.termoServico = termoServico;
        this.requerProntuario = requerProntuario;
        this.requerVeiculo = requerVeiculo;
        this.requerMesa = requerMesa;
        this.requerTurmaCheckin = requerTurmaCheckin;
        this.requerLocacaoEnsaio = requerLocacaoEnsaio;
    }
}
