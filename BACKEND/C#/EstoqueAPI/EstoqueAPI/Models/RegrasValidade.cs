namespace EstoqueAPI.Models
{
    /// <summary>
    /// Regras de validade num lugar só. É daqui que saem o status do lote ("Vence em breve"),
    /// os alertas do resumo de estoque e, na Fase 4, os relatórios: assim nenhuma tela inventa
    /// a sua própria janela de dias.
    /// </summary>
    public static class RegrasValidade
    {
        /// <summary>Até este número de dias o vencimento é URGENTE, qualquer que seja o produto.</summary>
        public const int DiasUrgente = 7;

        /// <summary>Antecedência de alerta usada quando o produto não define a sua.</summary>
        public const int DiasAlertaPadrao = 30;

        /// <summary>
        /// Nível de alerta de um lote que ainda NÃO venceu:
        /// "URGENTE" (faltam poucos dias), "ATENCAO" (dentro da antecedência do produto) ou null (sem alerta).
        /// </summary>
        public static string? ClassificarAlerta(int diasParaVencer, int diasAlertaDoProduto)
        {
            // Um produto com alerta curto (ex.: 5 dias) não vira "urgente" antes de entrar na própria janela
            var limiteUrgente = Math.Min(DiasUrgente, diasAlertaDoProduto);

            if (diasParaVencer <= limiteUrgente) return "URGENTE";
            if (diasParaVencer <= diasAlertaDoProduto) return "ATENCAO";

            return null;
        }
    }
}