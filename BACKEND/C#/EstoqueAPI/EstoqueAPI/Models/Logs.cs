using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    public class Logs
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        [StringLength(100)]
        public string Acao { get; set; } = string.Empty;

        [Required]
        public DateTime DataHora { get; set; } = DateTime.Now;

        // --- Relacionamentos (Navegação) ---

        // Referência para o Usuário que gerou o log
        [ForeignKey("UsuarioId")]
        public virtual Usuario Usuario { get; set; } = null!;
    }
}