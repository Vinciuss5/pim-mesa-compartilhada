using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    [Table("Solicitacoes")]
    public class Solicitacao
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "O solicitante é obrigatório.")]
        public int SolicitanteId { get; set; }

        [Required]
        public DateTime DataSolicitacao { get; set; } = DateTime.Now;

        /// <summary>
        /// Previsão de entrega (opcional). Antes ficava escrita dentro da Observação.
        /// </summary>
        [DataType(DataType.Date)]
        public DateTime? DataPrevisaoEntrega { get; set; }

        /// <summary>
        /// Quando a entrega foi confirmada (preenchida ao marcar como ENTREGUE).
        /// É o que permite medir pontualidade nos relatórios.
        /// </summary>
        public DateTime? DataEntrega { get; set; }

        [Required]
        [StringLength(20)]
        // Status: PENDENTE, ENTREGUE, CANCELADO
        public string Status { get; set; } = "PENDENTE";

        [StringLength(255)]
        public string? Observacao { get; set; }

        // --- Relacionamentos (Navegação) ---

        [ForeignKey(nameof(SolicitanteId))]
        public virtual Solicitante? Solicitante { get; set; } = null!;

        public virtual ICollection<SolicitacaoItem> Itens { get; set; } = new List<SolicitacaoItem>();

        // Histórico de trocas da previsão de entrega
        public virtual ICollection<SolicitacaoReagendamento> Reagendamentos { get; set; } = new List<SolicitacaoReagendamento>();
    }
}