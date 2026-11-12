using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueAPI.Models
{
    // 1. BLINDAGEM DE TABELA: Explicitando o nome da tabela no plural
    [Table("Produtos")]
    public class Produto
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome do produto é obrigatório.")]
        [StringLength(80)]
        public string Nome { get; set; } = string.Empty;

        // --- UNIDADE DE MEDIDA (Fase 1) ---
        // Todas as quantidades deste produto (estoque, doações, solicitações) estão nesta unidade.
        [Required]
        public int UnidadeMedidaId { get; set; }

        [ForeignKey(nameof(UnidadeMedidaId))]
        public virtual UnidadeMedida? UnidadeMedida { get; set; }

        /// <summary>
        /// Peso de UMA unidade, em kg (opcional). Só faz sentido para unidades de CONTAGEM
        /// (ex.: pacote de 5 kg) e permite estimar o total em kg. Fica nulo para kg, g, L e ml.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? PesoKg { get; set; }

        /// <summary>
        /// ALIMENTO_NAO_PERECIVEL, ALIMENTO_PERECIVEL, BEBIDA, HIGIENE, LIMPEZA ou OUTROS (opcional).
        /// </summary>
        [StringLength(30)]
        public string? Categoria { get; set; }

        /// <summary>
        /// Se verdadeiro, toda entrada deste produto exige data de validade.
        /// </summary>
        public bool ControlaValidade { get; set; } = true;

        /// <summary>
        /// Quantidade mínima desejada, na unidade do produto (opcional). Usada nos alertas a partir da Fase 3.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstoqueMinimo { get; set; }

        /// <summary>
        /// Com quantos dias de antecedência o lote passa a ser alertado como "Vence em breve".
        /// Cada produto tem o seu: depende da validade típica e de quanto tempo a ONG leva para distribuí-lo.
        /// </summary>
        [Range(1, 365, ErrorMessage = "A antecedência do alerta deve ficar entre 1 e 365 dias.")]
        public int DiasAlertaValidade { get; set; } = RegrasValidade.DiasAlertaPadrao;

        // --- Relacionamentos (Navegação) ---

        [InverseProperty(nameof(Estoque.Produto))]
        public virtual ICollection<Estoque> Estoques { get; set; } = new List<Estoque>();

        [InverseProperty(nameof(DoacaoItem.Produto))]
        public virtual ICollection<DoacaoItem> DoacaoItens { get; set; } = new List<DoacaoItem>();

        [InverseProperty(nameof(SolicitacaoItem.Produto))]
        public virtual ICollection<SolicitacaoItem> SolicitacaoItens { get; set; } = new List<SolicitacaoItem>();
    }
}