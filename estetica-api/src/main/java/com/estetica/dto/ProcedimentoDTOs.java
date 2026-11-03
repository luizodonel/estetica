package com.estetica.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ProcedimentoDTOs {

    public record CategoriaDTO(
        Long id,
        String nome,
        String descricao,
        String icone,
        String imagemUrl,
        Boolean ativo,
        Integer ordemExibicao,
        Integer duracaoMinutosPadrao,
        BigDecimal precoPadrao
    ) {}

    public record SalvarCategoriaRequest(
        @NotBlank(message = "Nome da categoria é obrigatório")
        String nome,
        String descricao,
        String icone,
        String imagemUrl,
        Boolean ativo,
        Integer ordemExibicao,
        Integer duracaoMinutosPadrao,
        BigDecimal precoPadrao
    ) {}

    public record ProcedimentoDTO(
        Long id,
        Long categoriaId,
        String categoriaNome,
        String titulo,
        String descricao,
        Integer duracaoMinutos,
        BigDecimal preco,
        String imagemUrl,
        Boolean ativo
    ) {}

    public record CriarProcedimentoRequest(
        @NotNull(message = "Categoria é obrigatória")
        Long categoriaId,

        @NotBlank(message = "Título é obrigatório")
        String titulo,

        String descricao,

        @NotNull(message = "Duração é obrigatória")
        @Min(value = 10, message = "A duração mínima é de 10 minutos")
        Integer duracaoMinutos,

        @NotNull(message = "Preço é obrigatório")
        @DecimalMin(value = "0.0", inclusive = false, message = "O preço deve ser maior que zero")
        BigDecimal preco,

        String imagemUrl
    ) {}
}

