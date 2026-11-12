using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    /// <summary>
    /// Histórico de reagendamentos da previsão de entrega de uma solicitação.
    /// Cada troca de data gera uma linha; nada é apagado, então dá para saber
    /// a data original, quantas vezes foi adiada, por quê e por quem.
    /// </summary>
    [Table("SolicitacaoReagendamentos")]
    public class SolicitacaoReagendamento
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SolicitacaoId { get; set; }

        [ForeignKey(nameof(SolicitacaoId))]
        public virtual Solicitacao? Solicitacao { get; set; }

        /// <summary>Previsão antes da troca. Nula quando a solicitação foi criada sem previsão.</summary>
        [DataType(DataType.Date)]
        public DateTime? DataAnterior { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime DataNova { get; set; }

        /// <summary>IMPREVISTO_SOLICITANTE, TRANSPORTE, AGUARDANDO_DOACAO ou OUTRO (opcional).</summary>
        [StringLength(30)]
        public string? Motivo { get; set; }

        [StringLength(255)]
        public string? Observacao { get; set; }

        /// <summary>Quem reagendou (usuário logado).</summary>
        public int? UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public virtual Usuario? Usuario { get; set; }

        [Required]
        public DateTime DataHora { get; set; } = DateTime.Now;
    }
}