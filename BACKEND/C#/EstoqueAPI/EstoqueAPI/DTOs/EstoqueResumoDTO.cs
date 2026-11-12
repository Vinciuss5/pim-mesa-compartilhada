namespace EstoqueAPI.DTOs
{
    /// <summary>
    /// Uma linha do resumo de estoque: tudo que o produto tem, somando todos os lotes.
    /// "Disponível" = lotes dentro da validade (ou sem validade). Lotes vencidos NÃO entram no
    /// disponível e não podem ser entregues; ficam separados em SaldoVencido.
    /// </summary>
    public record EstoqueProdutoResumoDTO(
        int ProdutoId,
        string Nome,
        string? Categoria,
        string UnidadeSigla,         // kg, L, un, pct...
        string UnidadeTipo,          // MASSA | VOLUME | CONTAGEM
        decimal SaldoDisponivel,
        decimal SaldoVencido,
        int Lotes,                   // lotes com saldo (inclui os vencidos)
        DateTime? ProximaValidade,   // validade mais próxima entre os lotes disponíveis
        int? DiasParaVencer,         // dias até a ProximaValidade (0 = vence hoje)
        string? AlertaValidade,      // URGENTE | ATENCAO | null (regra: RegrasValidade)
        int DiasAlertaValidade,      // antecedência de alerta configurada neste produto
        decimal? EstoqueMinimo,
        decimal? PesoKgPorUnidade,
        decimal? PesoEstimadoKg,     // disponível convertido em kg, quando dá para converter
        string Situacao              // OK | BAIXO | ZERADO | SOMENTE_VENCIDO
    );
}