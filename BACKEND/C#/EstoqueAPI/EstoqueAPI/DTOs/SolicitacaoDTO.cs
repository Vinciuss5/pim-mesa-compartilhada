using System.ComponentModel.DataAnnotations;

namespace EstoqueAPI.DTOs
{
    /// <summary>
    /// DTO para Criação: O que o Frontend envia (POST).
    /// </summary>
    public record SolicitacaoCreateDTO(
        [Required(ErrorMessage = "O solicitante é obrigatório.")]
        int SolicitanteId,

        [MinLength(1, ErrorMessage = "A solicitação deve ter pelo menos um item.")]
        List<SolicitacaoItemCreateDTO> Itens,

        [StringLength(255)]
        string? Observacao,

        // Opcional. Não pode ser anterior a hoje (validado no Service).
        DateTime? DataPrevisaoEntrega = null
    );

    /// <summary>
    /// Item da solicitação na criação. Quantidade decimal para suportar Kg/Litros.
    /// </summary>
    public record SolicitacaoItemCreateDTO(
        [Required]
        int ProdutoId,

        [Required]
        [Range(0.01, 999999.99, ErrorMessage = "A quantidade deve ser maior que zero.")]
        decimal Quantidade
    );

    /// <summary>
    /// DTO para Resposta: O que o Frontend consome (GET).
    /// </summary>
    public record SolicitacaoResponseDTO(
        int Id,
        int SolicitanteId,
        string NomeSolicitante,
        DateTime DataSolicitacao,
        string Status,
        string? Observacao,
        DateTime? DataPrevisaoEntrega,
        DateTime? DataEntrega,
        List<SolicitacaoItemResponseDTO> Itens,
        List<ReagendamentoResponseDTO> Reagendamentos
    );

    /// <summary>
    /// Item da solicitação no retorno.
    /// </summary>
    public record SolicitacaoItemResponseDTO(
        int Id,
        int ProdutoId,
        string NomeProduto,
        decimal Quantidade,
        string Unidade
    );

    /// <summary>
    /// Uma troca de previsão de entrega, para o histórico.
    /// </summary>
    public record ReagendamentoResponseDTO(
        int Id,
        DateTime? DataAnterior,   // nulo quando a solicitação não tinha previsão
        DateTime DataNova,
        string? Motivo,
        string? Observacao,
        string? UsuarioNome,
        DateTime DataHora
    );

    /// <summary>
    /// Pedido de reagendamento (ou de definição da previsão, quando ainda não havia).
    /// </summary>
    public record SolicitacaoReagendarDTO(
        [Required(ErrorMessage = "Informe a nova data de entrega.")]
        DateTime? NovaData,

        [RegularExpression("^(IMPREVISTO_SOLICITANTE|TRANSPORTE|AGUARDANDO_DOACAO|OUTRO)$", ErrorMessage = "Motivo inválido.")]
        string? Motivo,

        [StringLength(255)]
        string? Observacao
    );

    /// <summary>
    /// DTO para Atualização de Status: Simples e direto.
    /// </summary>
    public record SolicitacaoStatusUpdateDTO(
        [Required]
        [RegularExpression("^(PENDENTE|ENTREGUE|CANCELADO)$", ErrorMessage = "Status inválido.")]
        string NovoStatus
    );
}