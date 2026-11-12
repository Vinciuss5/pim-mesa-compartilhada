using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    [Table("SolicitacaoItens")] // Mantendo a padronização de nomes de tabela
    public class SolicitacaoItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SolicitacaoId { get; set; }

        [Required]
        public int ProdutoId { get; set; }

        [Required]
        // CORREÇÃO: Alterado para decimal para permitir fracionamento (Kg/Litros)
        // O Range começa em 0.01 para permitir pequenas frações
        [Range(0.01, 9999999.99, ErrorMessage = "A quantidade solicitada deve ser maior que zero.")]
        public decimal Quantidade { get; set; }

        // --- Relacionamentos (Navegação) ---

        // Referência para a Solicitação "pai". O nameof vincula sem erro de shadow property.
        [ForeignKey(nameof(SolicitacaoId))]
        public virtual Solicitacao? Solicitacao { get; set; }

        // Referência para o Produto. Uso do anulável evita avisos de desreferência nula.
        [ForeignKey(nameof(ProdutoId))]
        public virtual Produto? Produto { get; set; }
    }
}