using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    /// <summary>
    /// Unidade de medida de um produto (kg, L, un, pct, cx...).
    /// Cada produto usa UMA unidade; não há conversão automática entre unidades.
    /// </summary>
    [Table("UnidadesMedida")]
    public class UnidadeMedida
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome da unidade é obrigatório.")]
        [StringLength(40)]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "A sigla da unidade é obrigatória.")]
        [StringLength(10)]
        public string Sigla { get; set; } = string.Empty;

        /// <summary>
        /// MASSA (kg, g), VOLUME (L, ml) ou CONTAGEM (un, pct, cx...).
        /// Define se a quantidade pode ser fracionada e como os totais são agrupados.
        /// </summary>
        [Required]
        [StringLength(10)]
        public string Tipo { get; set; } = "CONTAGEM";
    }
}