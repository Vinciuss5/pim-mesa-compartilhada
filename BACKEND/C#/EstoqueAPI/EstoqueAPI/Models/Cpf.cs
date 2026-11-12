namespace EstoqueAPI.Models
{
    /// <summary>
    /// Regras de CPF num lugar só: normalizar (só dígitos) e validar os dois dígitos verificadores.
    /// </summary>
    public static class Cpf
    {
        /// <summary>"123.456.789-09" -> "12345678909" (mantém só os dígitos). Nulo vira texto vazio.</summary>
        public static string Normalizar(string? valor)
        {
            return new string((valor ?? string.Empty).Where(char.IsDigit).ToArray());
        }

        /// <summary>
        /// Verdadeiro se o CPF tem 11 dígitos, não é uma sequência repetida (000.000.000-00, 111.111.111-11...)
        /// e os dois dígitos verificadores conferem. Aceita com ou sem máscara.
        /// </summary>
        public static bool EhValido(string? valor)
        {
            var digitos = Normalizar(valor);

            if (digitos.Length != 11) return false;
            if (digitos.Distinct().Count() == 1) return false;

            return CalcularDigito(digitos, 9) == digitos[9] - '0'
                && CalcularDigito(digitos, 10) == digitos[10] - '0';
        }
        
        // Soma ponderada (pesos de quantidade+1 até 2); resto < 2 vira 0, senão 11 - resto
        private static int CalcularDigito(string digitos, int quantidade)
        {
            var soma = 0;

            for (var i = 0; i < quantidade; i++)
                soma += (digitos[i] - '0') * (quantidade + 1 - i);

            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }
    }
}