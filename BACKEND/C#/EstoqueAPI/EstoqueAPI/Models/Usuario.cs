using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(80)]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "E-mail em formato inválido.")]
        [StringLength(120)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [StringLength(11, MinimumLength = 11)]
        [Column(TypeName = "CHAR(11)")] // Otimização de banco: CPF sempre tem 11 caracteres
        public string CPF { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Telefone { get; set; }

        [Required]
        public DateTime DataAdmissao { get; set; } = DateTime.Now;

        [Required]
        [StringLength(255)]
        public string SenhaHash { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string Tipo { get; set; } = "FUNCIONARIO"; // ADMIN ou FUNCIONARIO[cite: 7]

        public bool Ativo { get; set; } = true;

        // --- Relacionamentos (Navegação) ---

        // Um usuário pode ser autor de vários logs de sistema[cite: 7]
        public virtual ICollection<Logs> Logs { get; set; } = new List<Logs>();
    }
}