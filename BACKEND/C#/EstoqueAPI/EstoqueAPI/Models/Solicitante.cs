using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    // 1. BLINDAGEM DE TABELA: Explicitando o nome da tabela no plural para o EF
    [Table("Solicitantes")]
    public class Solicitante
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome do solicitante é obrigatório.")]
        [StringLength(80)]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CPF é obrigatório para evitar duplicidade de cadastros.")]
        [StringLength(11, MinimumLength = 11, ErrorMessage = "O CPF deve conter exatamente 11 dígitos.")]
        [Column(TypeName = "CHAR(11)")]
        public string CPF { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "E-mail em formato inválido.")]
        [StringLength(120)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Telefone { get; set; }

        [Required(ErrorMessage = "O endereço de entrega é vital para a logística.")]
        [StringLength(200, ErrorMessage = "O endereço não pode exceder 200 caracteres.")]
        public string EnderecoEntrega { get; set; } = string.Empty;

        [Required]
        public DateTime DataCadastro { get; set; } = DateTime.Now;

        // --- Relacionamentos (Navegação) ---

        /// <summary>
        /// 2. RELACIONAMENTO INVERSO: Mantemos a coleção, mas garantimos que 
        /// o EF saiba que o "SolicitanteId" na tabela Solicitacao aponta para cá.
        /// </summary>
        [InverseProperty(nameof(Solicitacao.Solicitante))]
        public virtual ICollection<Solicitacao> Solicitacoes { get; set; } = new List<Solicitacao>();
    }
}