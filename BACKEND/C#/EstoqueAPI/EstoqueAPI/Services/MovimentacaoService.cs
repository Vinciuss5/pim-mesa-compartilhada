using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public interface IMovimentacaoService
    {
        Task<IEnumerable<MovimentacaoResponseDTO>> ListarAsync(MovimentacaoFiltroDTO filtro);
    }

    /// <summary>
    /// Somente CONSULTA. Quem grava movimentações é o EstoqueService (ponto único de alteração).
    /// </summary>
    public class MovimentacaoService : IMovimentacaoService
    {
        private const int LimitePadrao = 200;
        private const int LimiteMaximo = 500;

        private static readonly string[] TiposValidos = { "ENTRADA", "SAIDA", "ESTORNO", "AJUSTE" };

        private readonly AppDbContext _context;

        public MovimentacaoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MovimentacaoResponseDTO>> ListarAsync(MovimentacaoFiltroDTO filtro)
        {
            IQueryable<Movimentacao> query = _context.Movimentacoes
                .AsNoTracking()
                .Include(m => m.Produto).ThenInclude(p => p!.UnidadeMedida)
                .Include(m => m.Estoque)
                .Include(m => m.Usuario)
                .Include(m => m.Doacao).ThenInclude(d => d!.Doador)
                .Include(m => m.Solicitacao).ThenInclude(s => s!.Solicitante);

            if (filtro.ProdutoId.HasValue)
                query = query.Where(m => m.ProdutoId == filtro.ProdutoId.Value);

            if (!string.IsNullOrWhiteSpace(filtro.Tipo))
            {
                var tipo = filtro.Tipo.Trim().ToUpper();

                if (!TiposValidos.Contains(tipo))
                    throw new InvalidOperationException("Tipo de movimentação inválido.");

                query = query.Where(m => m.Tipo == tipo);
            }

            if (filtro.De.HasValue)
            {
                var de = filtro.De.Value.Date;
                query = query.Where(m => m.DataHora >= de);
            }

            if (filtro.Ate.HasValue)
            {
                // "até" é inclusivo: vai até o fim do dia informado
                var ateExclusivo = filtro.Ate.Value.Date.AddDays(1);
                query = query.Where(m => m.DataHora < ateExclusivo);
            }

            var limite = Math.Clamp(filtro.Limite ?? LimitePadrao, 1, LimiteMaximo);

            var movimentacoes = await query
                .OrderByDescending(m => m.DataHora)
                .ThenByDescending(m => m.Id)
                .Take(limite)
                .ToListAsync();

            return movimentacoes.Select(Mapear).ToList();
        }

        private static MovimentacaoResponseDTO Mapear(Movimentacao m)
        {
            string? referencia = null;

            if (m.DoacaoId.HasValue)
                referencia = $"Doação #{m.DoacaoId} — {m.Doacao?.Doador?.Nome ?? "doador não informado"}";
            else if (m.SolicitacaoId.HasValue)
                referencia = $"Solicitação #{m.SolicitacaoId} — {m.Solicitacao?.Solicitante?.Nome ?? "solicitante não informado"}";

            return new MovimentacaoResponseDTO(
                m.Id,
                m.DataHora,
                m.Tipo,
                m.ProdutoId,
                m.Produto?.Nome ?? "Produto não encontrado",
                m.Produto?.UnidadeMedida?.Sigla ?? "",
                m.Quantidade,
                m.EstoqueId,
                m.Estoque?.DataValidade,
                m.Motivo,
                m.Observacao,
                m.Usuario?.Nome,
                m.DoacaoId,
                m.SolicitacaoId,
                referencia
            );
        }
    }
}