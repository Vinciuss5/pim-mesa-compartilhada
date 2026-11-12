using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    /// <summary>
    /// Registro de TODA alteração no estoque. Só o EstoqueService grava aqui,
    /// na mesma transação que altera Estoque.Quantidade.
    ///
    /// Tipos:
    ///  ENTRADA = doação recebida (quantidade positiva)
    ///  SAIDA   = baixa por solicitação (quantidade negativa)
    ///  ESTORNO = devolução ao cancelar uma solicitação (quantidade positiva, no mesmo lote da baixa)
    ///  AJUSTE  = perda, vencimento, avaria ou correção manual (positiva ou negativa)
    /// </summary>
    [Table("Movimentacoes")]
    public class Movimentacao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime DataHora { get; set; } = DateTime.Now;

        [Required]
        [StringLength(10)]
        public string Tipo { get; set; } = string.Empty;

        [Required]
        public int ProdutoId { get; set; }

        [ForeignKey(nameof(ProdutoId))]
        public virtual Produto? Produto { get; set; }

        /// <summary>Lote (linha de Estoque) afetado.</summary>
        public int? EstoqueId { get; set; }

        [ForeignKey(nameof(EstoqueId))]
        public virtual Estoque? Estoque { get; set; }

        /// <summary>
        /// Variação COM SINAL, na unidade do produto: entrada e estorno somam (+), saída subtrai (-),
        /// ajuste pode ser os dois. A soma de todas as movimentações de um produto é o saldo dele.
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantidade { get; set; }

        // Origem da movimentação (no máximo uma das duas)
        public int? DoacaoId { get; set; }

        [ForeignKey(nameof(DoacaoId))]
        public virtual Doacao? Doacao { get; set; }

        public int? SolicitacaoId { get; set; }

        [ForeignKey(nameof(SolicitacaoId))]
        public virtual Solicitacao? Solicitacao { get; set; }

        /// <summary>Só nos ajustes: PERDA, VENCIMENTO, AVARIA ou CORRECAO.</summary>
        [StringLength(20)]
        public string? Motivo { get; set; }

        [StringLength(255)]
        public string? Observacao { get; set; }

        /// <summary>Quem fez a operação (usuário logado).</summary>
        public int? UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public virtual Usuario? Usuario { get; set; }
    }
}