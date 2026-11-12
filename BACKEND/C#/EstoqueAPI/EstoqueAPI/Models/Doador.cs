using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    // 1. PADRONIZAÇÃO: Explicitando o nome da tabela no plural
    [Table("Doadores")]
    public class Doador
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome do doador é obrigatório.")]
        [StringLength(80)]
        public string Nome { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "E-mail em formato inválido.")]
        [StringLength(120)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Telefone { get; set; }

        [StringLength(11)]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter apenas 11 números.")]
        public string? CPF { get; set; }

        [StringLength(150)]
        public string? Endereco { get; set; }

        // --- Relacionamentos (Navegação) ---

        /// <summary>
        /// 2. MAPEAMENTO INVERSO: O atributo InverseProperty vincula esta coleção 
        /// à propriedade de navegação 'Doador' que existe dentro da classe Doacao.
        /// Isso elimina a criação da coluna 'DoadorId1' no banco de dados.
        /// </summary>
        [InverseProperty(nameof(Doacao.Doador))]
        public virtual ICollection<Doacao> Doacoes { get; set; } = new List<Doacao>();
    }
}