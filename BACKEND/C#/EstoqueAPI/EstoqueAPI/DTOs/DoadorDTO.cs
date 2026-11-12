using System.ComponentModel.DataAnnotations;

namespace EstoqueAPI.DTOs
{
    // DTO para Cadastro/Criação de um novo Doador
    public record DoadorCreateDTO(
        [Required(ErrorMessage = "O nome do doador é obrigatório.")]
        [StringLength(80, ErrorMessage = "O nome não pode exceder 80 caracteres.")]
        string Nome,

        [EmailAddress(ErrorMessage = "E-mail em formato inválido.")]
        [StringLength(120)]
        string? Email,

        [StringLength(20)]
        string? Telefone,

        [StringLength(11, MinimumLength = 11, ErrorMessage = "O CPF deve ter exatamente 11 dígitos.")]
        [RegularExpression(@"^\d+$", ErrorMessage = "O CPF deve conter apenas números.")]
        [CpfValido]
        string? CPF,

        [StringLength(150)]
        string? Endereco
    );

    // DTO para Resposta (Exibição em listas ou detalhes)
    public record DoadorResponseDTO(
        int Id,
        string Nome,
        string? Email,
        string? Telefone,
        string? CPF,
        string? Endereco
    );

    // DTO para Atualização (Permite alterar dados mantendo o ID intacto no parâmetro da URL)
    public record DoadorUpdateDTO(
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(80)]
        string Nome,

        [EmailAddress]
        string? Email,

        string? Telefone,
        string? Endereco,

        // Opcional: vazio = manter o CPF atual. Permite corrigir um CPF digitado errado.
        [StringLength(11, MinimumLength = 11, ErrorMessage = "O CPF deve ter exatamente 11 dígitos.")]
        [RegularExpression(@"^\d+$", ErrorMessage = "O CPF deve conter apenas números.")]
        [CpfValido]
        string? CPF = null
    );
}