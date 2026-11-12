using System.ComponentModel.DataAnnotations;
using EstoqueAPI.Models;

namespace EstoqueAPI.DTOs
{
    /// <summary>
    /// Valida o CPF (dígitos verificadores). Campo vazio é aceito: a obrigatoriedade é papel do [Required].
    /// Uso: [CpfValido] string? CPF
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public sealed class CpfValidoAttribute : ValidationAttribute
    {
        public CpfValidoAttribute() : base("CPF inválido. Confira os números digitados.") { }

        public override bool IsValid(object? value)
        {
            if (value is not string texto || string.IsNullOrWhiteSpace(texto)) return true;

            return Cpf.EhValido(texto);
        }
    }
}