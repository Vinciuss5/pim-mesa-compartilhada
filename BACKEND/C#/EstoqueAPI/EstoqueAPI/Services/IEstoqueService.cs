using EstoqueAPI.DTOs;

namespace EstoqueAPI.Services
{
    public interface IEstoqueService
    {
        // --- Consultas ---
        Task<IEnumerable<EstoqueResponseDTO>> ListarEstoqueAtualAsync();
        Task<EstoqueResponseDTO?> BuscarSaldoPorProdutoAsync(int produtoId);
        Task<IEnumerable<EstoqueResponseDTO>> ListarProdutosComBaixoEstoqueAsync(int limite);

        /// <summary>Uma linha por produto (inclusive sem estoque): saldo disponível, vencido, lotes, validade e situação.</summary>
        Task<IEnumerable<EstoqueProdutoResumoDTO>> ObterResumoAsync();

        // --- PONTO ÚNICO DE ALTERAÇÃO DE ESTOQUE ---
        // Regra da casa: nenhum outro Service altera Estoque.Quantidade diretamente.
        // Cada alteração grava também uma Movimentacao (histórico), na mesma transação.
        // Os três primeiros métodos NÃO chamam SaveChanges: quem chama controla a transação e o commit.

        /// <summary>Entrada de itens de uma doação. Soma no lote com mesmo produto + validade ou cria um novo.</summary>
        Task RegistrarEntradaAsync(int produtoId, decimal quantidade, DateTime? dataValidade, DateTime dataEntrada, string origem, int? doacaoId = null);

        /// <summary>Saída pelo PVPS (vence primeiro, sai primeiro). Registra de quais lotes saiu. Lança InvalidOperationException se o saldo for insuficiente.</summary>
        Task BaixarPvpsAsync(int produtoId, decimal quantidade, int? solicitacaoId = null);

        /// <summary>Devolve ao estoque TUDO o que a solicitação baixou, em cada lote de origem.</summary>
        Task EstornarSolicitacaoAsync(int solicitacaoId);

        /// <summary>Ajuste manual de um lote (perda, vencimento, avaria, correção). Este método SALVA por conta própria.</summary>
        Task AjustarAsync(AjusteEstoqueCreateDTO dto);
    }
}