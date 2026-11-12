using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    // 1. BLINDAGEM DE TABELA: Garante o mapeamento exato para a tabela 'Doacoes'
    [Table("Doacoes")]
    public class Doacao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DoadorId { get; set; }

        [Required]
        [Column("Data")]
        public DateTime Data { get; set; } = DateTime.Now; // Defesa de código: valor padrão na criação

        // --- Relacionamentos ---

        // 2. SEGURANÇA DE REFATORAÇÃO: O uso do nameof() protege o código contra renomeações acidentais.
        // 3. NULL SAFETY: Ao deixar 'Doador?' anulável, obrigamos o desenvolvedor a verificar 
        // a nulidade no Service, evitando NullReferenceExceptions caso falte um .Include().
        [ForeignKey(nameof(DoadorId))]
        public virtual Doador? Doador { get; set; } = null!;

        // Mantido conforme a sua estrutura original para carregar a lista de itens vinculados.
        public virtual ICollection<DoacaoItem> Itens { get; set; } = new List<DoacaoItem>();
    }
}