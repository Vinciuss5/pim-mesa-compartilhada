using System.ComponentModel.DataAnnotations;

namespace EstoqueAPI.DTOs
{
    // DTO para Criar uma Doação: O que o Frontend envia (POST)
    public record DoacaoCreateDTO(
        [Required(ErrorMessage = "O doador deve ser identificado.")]
        int? DoadorId,

        [Required(ErrorMessage = "A data da doação é obrigatória.")]
        DateTime? Data,

        [Required]
        [MinLength(1, ErrorMessage = "A doação deve conter pelo menos um item.")]
        List<DoacaoItemCreateDTO> Itens
    );

    // DTO para os itens na criação
    public record DoacaoItemCreateDTO(
        [Required(ErrorMessage = "O produto deve ser informado.")]
        int? ProdutoId,

        [Required]
        // CORREÇÃO: Alterado para decimal para suportar Kg/Litros e sincronizar com a Model
        [Range(0.01, 9999999.99, ErrorMessage = "A quantidade deve ser maior que zero.")]
        decimal Quantidade,

        DateTime? DataValidade
    );

    // DTO para Resposta: O que o Frontend consome (GET)
    public record DoacaoResponseDTO(
        int Id,
        int DoadorId,
        string NomeDoador,
        DateTime Data,
        List<DoacaoItemResponseDTO> Itens
    );

    public record DoacaoItemResponseDTO(
        int Id,
        int ProdutoId,
        string NomeProduto,
        // CORREÇÃO: Alterado para decimal para manter a precisão do estoque
        decimal Quantidade,
        DateTime? DataValidade,
        string Unidade
    );
}