namespace EstoqueAPI.Models
{
    /// <summary>
    /// Datas e horas do sistema ficam sempre na HORA LOCAL do servidor (como DateTime.Now).
    /// Esta regra existe porque o navegador, ao enviar new Date().toISOString(), manda a hora em UTC
    /// (no Brasil, 3 horas à frente): uma doação feita às 22h30 chegaria como "01h30 do dia seguinte"
    /// e ficaria de fora dos relatórios do dia em que foi feita.
    /// </summary>
    public static class DataLocal
    {
        /// <summary>Converte para a hora local quando a data veio marcada como UTC; as demais ficam como estão.</summary>
        public static DateTime Normalizar(DateTime data)
        {
            return data.Kind == DateTimeKind.Utc ? data.ToLocalTime() : data;
        }
    }
}