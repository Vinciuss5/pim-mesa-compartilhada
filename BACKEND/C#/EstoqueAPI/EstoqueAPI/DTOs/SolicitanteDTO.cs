using System.ComponentModel.DataAnnotations;

namespace EstoqueAPI.DTOs
{
    // DTO para Cadastro: O que o Frontend envia ao criar um novo solicitante
    public record SolicitanteCreateDTO(
        [Required(ErrorMessage = "O nome do solicitante é obrigatório.")]
        [StringLength(80, ErrorMessage = "O nome não pode exceder 80 caracteres.")]
        string Nome,

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter apenas 11 números.")]
        [CpfValido]
        string CPF, // Substituído 'Documento' por 'CPF'

        [StringLength(20)]
        string? Telefone,

        [Required(ErrorMessage = "O endereço de entrega é obrigatório.")]
        [StringLength(200, ErrorMessage = "O endereço é muito longo.")]
        string EnderecoEntrega, // Novo campo essencial para a logística

        [EmailAddress(ErrorMessage = "E-mail inválido.")]
        string? Email
    );

    // DTO para Resposta: O que a API devolve (Seguro, sem expor dados desnecessários)
    public record SolicitanteResponseDTO(
        int Id,
        string Nome,
        string CPF,
        string? Telefone,
        string EnderecoEntrega,
        string? Email,
        DateTime DataCadastro // Importante para o Frontend mostrar quando o cadastro foi feito[cite: 1]
    );

    // DTO para Atualização: O que pode ser editado futuramente
    public record SolicitanteUpdateDTO(
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(80)]
        string Nome,

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter apenas 11 números.")]
        [CpfValido]
        string CPF,

        string? Telefone,

        [Required(ErrorMessage = "O endereço é obrigatório.")]
        [StringLength(200)]
        string EnderecoEntrega,

        string? Email
    );
}