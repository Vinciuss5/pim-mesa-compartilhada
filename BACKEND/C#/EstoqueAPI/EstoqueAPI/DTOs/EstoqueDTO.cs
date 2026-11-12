namespace EstoqueAPI.DTOs
{
    /// <summary>
    /// DTO de Resposta Completa: Utilizado em listagens e detalhes de estoque.
    /// </summary>
    public record EstoqueResponseDTO(
        int Id,
        int ProdutoId,
        string ProdutoNome,
        decimal Quantidade,
        string Status,
        decimal Peso,       // Peso de uma unidade, em kg (0 quando não informado)
        string Origem,
        DateTime? Validade,
        string? LoteCodigo,
        DateTime DataEntrada,
        string Unidade      // Sigla da unidade do produto (kg, L, un, pct...)
    );

    /// <summary>
    /// DTO Simplificado: Utilizado para consultas rápidas ou componentes leves de UI.
    /// </summary>
    public record EstoqueSimplesDTO(
        int ProdutoId,
        decimal Quantidade
    );
}