using System.ComponentModel.DataAnnotations;

namespace EstoqueAPI.DTOs
{
    /// <summary>
    /// DTO para Cadastro: Captura a intenção de criar um novo usuário.
    /// Note que aqui pedimos 'Senha', que o Service converterá em 'SenhaHash'.
    /// </summary>
    public record UsuarioCreateDTO(
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(80, ErrorMessage = "O nome não pode exceder 80 caracteres.")]
        string Nome,

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "E-mail em formato inválido.")]
        string Email,

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter exatamente 11 números.")]
        [CpfValido]
        string CPF,

        [StringLength(20)]
        string? Telefone,

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
        string Senha,

        [Required(ErrorMessage = "O tipo de perfil é obrigatório.")]
        [RegularExpression("^(ADMIN|FUNCIONARIO)$", ErrorMessage = "O tipo deve ser ADMIN ou FUNCIONARIO.")]
        string Tipo,

        [Required(ErrorMessage = "A data de admissão é obrigatória.")]
        DateTime DataAdmissao
    );

    /// <summary>
    /// DTO para Resposta: O que o mundo exterior vê. 
    /// Totalmente seguro, sem rastros de senhas.
    /// </summary>
    public record UsuarioResponseDTO(
        int Id,
        string Nome,
        string Email,
        string CPF,
        string? Telefone,
        string Tipo,
        bool Ativo,
        DateTime DataAdmissao
    );

    /// <summary>
    /// DTO para Login: O contrato mínimo para autenticação.
    /// </summary>
    public record LoginDTO(
        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress]
        string Email,

        [Required(ErrorMessage = "A senha é obrigatória.")]
        string Senha
    );

    /// <summary>
    /// DTO para Atualização: Permite alterar dados cadastrais e status, mas não a senha.
    /// A troca de senha deve ser um endpoint separado (esqueci minha senha/alterar senha).
    /// </summary>
    public record UsuarioUpdateDTO(
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(80)]
        string Nome,

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress]
        string Email,

        [StringLength(20)]
        string? Telefone,

        [Required]
        [RegularExpression("^(ADMIN|FUNCIONARIO)$")]
        string Tipo,

        bool Ativo,

        // Opcionais: ausente/vazio = manter o que já está cadastrado. Permitem corrigir dados digitados errado.
        [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter exatamente 11 números.")]
        [CpfValido]
        string? CPF = null,

        DateTime? DataAdmissao = null
    );
}