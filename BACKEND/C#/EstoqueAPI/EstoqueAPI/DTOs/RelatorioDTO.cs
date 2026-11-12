namespace EstoqueAPI.DTOs
{
    // =====================================================================
    // BLOCOS COMPARTILHADOS
    // =====================================================================

    /// <summary>Filtro de período (todos os relatórios). Datas inclusivas. Padrão: últimos 30 dias.</summary>
    public class RelatorioFiltroDTO
    {
        public DateTime? De { get; set; }
        public DateTime? Ate { get; set; }
    }

    public record PeriodoDTO(DateTime De, DateTime Ate);

    /// <summary>Quantidade somada POR UNIDADE (kg, L, un...). Unidades diferentes nunca se misturam.</summary>
    public record QuantidadePorUnidadeDTO(string Unidade, decimal Quantidade);

    /// <summary>Total de um produto (sempre na unidade dele) e em quantas doações/solicitações/ocorrências apareceu.</summary>
    public record ProdutoQuantidadeDTO(int ProdutoId, string Produto, string Unidade, decimal Quantidade, int Ocorrencias);

    /// <summary>Solicitações PENDENTES agora, por situação do prazo de entrega.</summary>
    public record FilaEntregasDTO(int Atrasadas, int Hoje, int Amanha, int Ate7Dias, int Depois, int SemPrevisao);

    // =====================================================================
    // VISÃO GERAL
    // =====================================================================

    public record EstoqueSituacaoDTO(
        int ProdutosCadastrados,
        int ProdutosComSaldo,
        int ProdutosZerados,
        int ProdutosAbaixoDoMinimo,
        int ProdutosComVencido,
        int ProdutosVencimentoUrgente,
        int ProdutosVencimentoEmAtencao,
        List<QuantidadePorUnidadeDTO> Disponivel,
        decimal PesoEstimadoKg,
        int ProdutosSemPesoEstimado
    );

    public record RelatorioVisaoGeralDTO(
        PeriodoDTO Periodo,
        // Doações recebidas no período
        int Doacoes,
        int DoadoresDistintos,
        List<QuantidadePorUnidadeDTO> Recebido,
        // Solicitações criadas no período
        int Solicitacoes,
        int SolicitantesDistintos,
        int SolicitacoesEntregues,
        int SolicitacoesCanceladas,
        int SolicitacoesPendentes,
        // Entregas CONFIRMADAS no período (pela data da entrega)
        int EntregasConfirmadas,
        List<QuantidadePorUnidadeDTO> Distribuido,
        // Perdas registradas no período (ajustes de perda, vencimento e avaria)
        List<QuantidadePorUnidadeDTO> Perdas,
        // Reagendamentos feitos no período
        int Reagendamentos,
        int SolicitacoesReagendadas,
        // Retrato de AGORA (não depende do período)
        FilaEntregasDTO FilaEntregas,
        EstoqueSituacaoDTO Estoque
    );

    // =====================================================================
    // DOAÇÕES
    // =====================================================================

    public record DoadorResumoDTO(
        int DoadorId,
        string Nome,
        int Doacoes,
        int Itens,
        List<QuantidadePorUnidadeDTO> Quantidades,
        DateTime UltimaDoacao
    );

    public record RelatorioDoacoesDTO(
        PeriodoDTO Periodo,
        int TotalDoacoes,
        int DoadoresDistintos,
        List<QuantidadePorUnidadeDTO> Recebido,
        List<DoadorResumoDTO> PorDoador,
        List<ProdutoQuantidadeDTO> PorProduto
    );

    // =====================================================================
    // SOLICITAÇÕES E ENTREGAS
    // =====================================================================

    public record SolicitanteResumoDTO(
        int SolicitanteId,
        string Nome,
        int Solicitacoes,
        int Entregues,
        int Canceladas,
        int Pendentes,
        List<QuantidadePorUnidadeDTO> Quantidades,   // exclui solicitações canceladas
        DateTime? UltimaSolicitacao
    );

    /// <summary>Entregas confirmadas no período, comparadas com a previsão ATUAL de cada solicitação.</summary>
    public record PontualidadeDTO(int EntreguesNoPrazo, int EntreguesComAtraso, int EntreguesSemPrevisao);

    public record ReagendamentoMotivoDTO(string Motivo, int Quantidade);

    public record ReagendamentosDTO(int Total, int SolicitacoesReagendadas, List<ReagendamentoMotivoDTO> PorMotivo);

    public record RelatorioSolicitacoesDTO(
        PeriodoDTO Periodo,
        int Total,
        int Pendentes,
        int Entregues,
        int Canceladas,
        PontualidadeDTO Pontualidade,
        ReagendamentosDTO Reagendamentos,
        FilaEntregasDTO FilaEntregas,
        List<SolicitanteResumoDTO> PorSolicitante,
        List<ProdutoQuantidadeDTO> PorProduto
    );

    // =====================================================================
    // ESTOQUE CRÍTICO
    // =====================================================================

    /// <summary>Um lote vencido ou em alerta de validade. Situacao: VENCIDO | URGENTE | ATENCAO.</summary>
    public record LoteAlertaDTO(
        int LoteId,
        int ProdutoId,
        string Produto,
        string Unidade,
        decimal Quantidade,
        DateTime Validade,
        int DiasParaVencer,    // negativo = já venceu há N dias
        string Situacao
    );

    public record PerdaMotivoDTO(string Motivo, int Ocorrencias, List<QuantidadePorUnidadeDTO> Quantidades);

    public record RelatorioEstoqueDTO(
        DateTime GeradoEm,
        PeriodoDTO PeriodoPerdas,
        List<EstoqueProdutoResumoDTO> SemSaldoDisponivel,
        List<EstoqueProdutoResumoDTO> AbaixoDoMinimo,
        List<LoteAlertaDTO> LotesVencidos,
        List<LoteAlertaDTO> LotesEmAlerta,
        List<PerdaMotivoDTO> PerdasPorMotivo,
        List<ProdutoQuantidadeDTO> PerdasPorProduto
    );

    // =====================================================================
    // HISTÓRICO DE UM SOLICITANTE
    // =====================================================================

    public record RelatorioSolicitanteDTO(
        PeriodoDTO Periodo,
        SolicitanteResumoDTO Resumo,
        List<ProdutoQuantidadeDTO> Produtos,
        List<SolicitacaoResponseDTO> Solicitacoes
    );
}