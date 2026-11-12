namespace EstoqueAPI.Models
{
    /// <summary>
    /// Regra de prazo de entrega num lugar só (usada pelos relatórios).
    /// </summary>
    public static class RegrasEntrega
    {
        /// <summary>
        /// Classifica a previsão de entrega de uma solicitação PENDENTE em relação a hoje:
        /// ATRASADA, HOJE, AMANHA, SEMANA (de 2 a 7 dias), FUTURA (mais de 7) ou SEM_PREVISAO.
        /// </summary>
        public static string Classificar(DateTime? previsao, DateTime hoje)
        {
            if (!previsao.HasValue) return "SEM_PREVISAO";

            var dias = (previsao.Value.Date - hoje.Date).Days;

            if (dias < 0) return "ATRASADA";
            if (dias == 0) return "HOJE";
            if (dias == 1) return "AMANHA";
            if (dias <= 7) return "SEMANA";

            return "FUTURA";
        }
    }
}