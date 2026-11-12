using System.ComponentModel.DataAnnotations;

namespace EstoqueAPI.DTOs
{
    // ---------------------------------------------------------------
    // UNIDADE DE MEDIDA
    // ---------------------------------------------------------------
    public record UnidadeMedidaResponseDTO(
        int Id,
        string Nome,
        string Sigla,
        string Tipo // MASSA | VOLUME | CONTAGEM
    );

    public record UnidadeMedidaCreateDTO(
        [Required(ErrorMessage = "O nome da unidade é obrigatório.")]
        [StringLength(40, ErrorMessage = "O nome não pode exceder 40 caracteres.")]
        string Nome,

        [Required(ErrorMessage = "A sigla da unidade é obrigatória.")]
        [StringLength(10, ErrorMessage = "A sigla não pode exceder 10 caracteres.")]
        string Sigla,

        [Required(ErrorMessage = "O tipo da unidade é obrigatório.")]
        [RegularExpression("^(MASSA|VOLUME|CONTAGEM)$", ErrorMessage = "O tipo deve ser MASSA, VOLUME ou CONTAGEM.")]
        string Tipo
    );

    // ---------------------------------------------------------------
    // PRODUTO
    // ---------------------------------------------------------------

    // DTO para Criação: o que recebemos do formulário
    public record ProdutoCreateDTO(
        [Required(ErrorMessage = "O nome do produto é obrigatório.")]
        [StringLength(80, ErrorMessage = "O nome não pode exceder 80 caracteres.")]
        string Nome,

        [Range(1, int.MaxValue, ErrorMessage = "A unidade de medida é obrigatória.")]
        int UnidadeMedidaId,

        [StringLength(30)]
        [RegularExpression("^(ALIMENTO_NAO_PERECIVEL|ALIMENTO_PERECIVEL|BEBIDA|HIGIENE|LIMPEZA|OUTROS)$",
            ErrorMessage = "Categoria inválida.")]
        string? Categoria = null,

        bool ControlaValidade = true,

        [Range(0, 9999999.99, ErrorMessage = "O estoque mínimo deve ser um valor positivo.")]
        decimal? EstoqueMinimo = null,

        [Range(0, 9999.99, ErrorMessage = "O peso deve ser um valor positivo.")]
        decimal? PesoKg = null,

        // 30 = RegrasValidade.DiasAlertaPadrao
        [Range(1, 365, ErrorMessage = "A antecedência do alerta deve ficar entre 1 e 365 dias.")]
        int DiasAlertaValidade = 30
    );

    // DTO para Resposta: o que devolvemos para o cliente (inclui o ID e os dados da unidade)
    public record ProdutoResponseDTO(
        int Id,
        string Nome,
        decimal? PesoKg,
        int UnidadeMedidaId,
        string UnidadeSigla,
        string UnidadeNome,
        string UnidadeTipo,
        string? Categoria,
        bool ControlaValidade,
        decimal? EstoqueMinimo,
        int DiasAlertaValidade
    );

    // DTO para Atualização
    public record ProdutoUpdateDTO(
        [Required(ErrorMessage = "O nome do produto é obrigatório.")]
        [StringLength(80)]
        string Nome,

        [Range(1, int.MaxValue, ErrorMessage = "A unidade de medida é obrigatória.")]
        int UnidadeMedidaId,

        [StringLength(30)]
        [RegularExpression("^(ALIMENTO_NAO_PERECIVEL|ALIMENTO_PERECIVEL|BEBIDA|HIGIENE|LIMPEZA|OUTROS)$",
            ErrorMessage = "Categoria inválida.")]
        string? Categoria = null,

        bool ControlaValidade = true,

        [Range(0, 9999999.99)]
        decimal? EstoqueMinimo = null,

        [Range(0, 9999.99)]
        decimal? PesoKg = null,

        // 30 = RegrasValidade.DiasAlertaPadrao
        [Range(1, 365, ErrorMessage = "A antecedência do alerta deve ficar entre 1 e 365 dias.")]
        int DiasAlertaValidade = 30
    );
}