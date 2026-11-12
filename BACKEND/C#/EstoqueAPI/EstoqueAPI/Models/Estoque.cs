using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    [Table("Estoque")] // Explicitando o nome da tabela
    public class Estoque
    {
        [Key]
        public int Id { get; set; }

        // Chave Estrangeira explícita. O [Required] garante a obrigatoriedade no banco
        [Required]
        public int ProdutoId { get; set; }

        // Propriedade de Navegação.
        // O uso do nameof() aqui é a garantia que o EF precisa para ligar esta propriedade à coluna ProdutoId acima
        [ForeignKey(nameof(ProdutoId))]
        public virtual Produto? Produto { get; set; } = null!;

        [Required]
        [Range(0, 9999999.99, ErrorMessage = "A quantidade deve ser positiva.")]
        public decimal Quantidade { get; set; }

        [Required]
        public DateTime DataEntrada { get; set; } = DateTime.Now;

        // Propriedade mantida para a regra PVPS[cite: 1]
        public DateTime? DataValidade { get; set; }

        [StringLength(100)]
        public string? Origem { get; set; }

        // LoteCodigo mantido para a sua rastreabilidade[cite: 1]
        [StringLength(50)]
        public string? LoteCodigo { get; set; }
    }
}