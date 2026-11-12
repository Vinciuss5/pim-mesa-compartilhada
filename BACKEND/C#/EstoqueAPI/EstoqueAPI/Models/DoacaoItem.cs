using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    [Table("DoacaoItens")] // Padronização de nome de tabela no plural
    public class DoacaoItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DoacaoId { get; set; }

        [Required]
        public int ProdutoId { get; set; }

        [Required]
        // CORREÇÃO: Alterado para decimal(18,2) para suportar Kg/Litros
        // O Range agora permite frações a partir de 0.01
        [Range(0.01, 9999999.99, ErrorMessage = "A quantidade deve ser maior que zero.")]
        public decimal Quantidade { get; set; }

        [DataType(DataType.Date)]
        public DateTime? DataValidade { get; set; }

        // --- Relacionamentos (Navegação) ---

        // CORREÇÃO: Uso de nameof() para evitar 'DoacaoId1' e suporte a Nullable para segurança de navegação
        [ForeignKey(nameof(DoacaoId))]
        public virtual Doacao? Doacao { get; set; }

        // CORREÇÃO: Vinculação explícita com Produto para garantir integridade referencial
        [ForeignKey(nameof(ProdutoId))]
        public virtual Produto? Produto { get; set; }
    }
}