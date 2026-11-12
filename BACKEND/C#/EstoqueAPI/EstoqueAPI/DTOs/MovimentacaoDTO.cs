using System.ComponentModel.DataAnnotations;

namespace EstoqueAPI.DTOs
{
    /// <summary>Uma linha do histórico de movimentações.</summary>
    public record MovimentacaoResponseDTO(
        int Id,
        DateTime DataHora,
        string Tipo,              // ENTRADA | SAIDA | ESTORNO | AJUSTE
        int ProdutoId,
        string ProdutoNome,
        string Unidade,           // sigla (kg, L, un...)
        decimal Quantidade,       // COM SINAL: entrada/estorno (+), saída (-), ajuste (+/-)
        int? LoteId,
        DateTime? LoteValidade,
        string? Motivo,           // só nos ajustes
        string? Observacao,
        string? UsuarioNome,
        int? DoacaoId,
        int? SolicitacaoId,
        string? Referencia        // ex.: "Doação #12 — Maria", "Solicitação #5 — João"
    );

    /// <summary>Filtros da consulta (todos opcionais), vindos pela query string.</summary>
    public class MovimentacaoFiltroDTO
    {
        public int? ProdutoId { get; set; }
        public string? Tipo { get; set; }
        public DateTime? De { get; set; }     // inclusive
        public DateTime? Ate { get; set; }    // inclusive (até o fim do dia)
        public int? Limite { get; set; }      // padrão 200, máximo 500
    }

    /// <summary>
    /// Ajuste manual em UM lote. Variação com sinal: negativa tira do estoque, positiva coloca.
    /// PERDA, VENCIMENTO e AVARIA só aceitam variação negativa. CORRECAO aceita as duas,
    /// mas exige observação.
    /// </summary>
    public record AjusteEstoqueCreateDTO(
        [Range(1, int.MaxValue, ErrorMessage = "Informe o lote a ajustar.")]
        int EstoqueId,

        [Range(-9999999.99, 9999999.99, ErrorMessage = "Quantidade fora do limite.")]
        decimal Variacao,

        [Required(ErrorMessage = "O motivo é obrigatório.")]
        [RegularExpression("^(PERDA|VENCIMENTO|AVARIA|CORRECAO)$", ErrorMessage = "Motivo inválido.")]
        string Motivo,

        [StringLength(255)]
        string? Observacao
    );
}