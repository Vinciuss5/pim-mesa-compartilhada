using AutoMapper;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public class SolicitacaoService : ISolicitacaoService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IEstoqueService _estoqueService;
        private readonly IUsuarioAtualService _usuarioAtual;

        public SolicitacaoService(
            AppDbContext context, IMapper mapper, IEstoqueService estoqueService, IUsuarioAtualService usuarioAtual)
        {
            _context = context;
            _mapper = mapper;
            _estoqueService = estoqueService;
            _usuarioAtual = usuarioAtual;
        }

        public async Task<IEnumerable<SolicitacaoResponseDTO>> ListarTodasAsync()
        {
            var solicitacoes = await _context.Solicitacoes
                .Include(s => s.Solicitante)
                .Include(s => s.Itens)
                    .ThenInclude(i => i.Produto)
                        .ThenInclude(p => p!.UnidadeMedida)
                .Include(s => s.Reagendamentos).ThenInclude(r => r.Usuario)
                .AsNoTracking()
                .OrderByDescending(s => s.DataSolicitacao)
                .ToListAsync();

            return _mapper.Map<IEnumerable<SolicitacaoResponseDTO>>(solicitacoes);
        }

        public async Task<SolicitacaoResponseDTO> CriarAsync(SolicitacaoCreateDTO dto)
        {
            if (dto.DataPrevisaoEntrega.HasValue && dto.DataPrevisaoEntrega.Value.Date < DateTime.Today)
                throw new InvalidOperationException("A previsão de entrega não pode ser anterior a hoje.");

            // Transação: ou a solicitação e a baixa de estoque acontecem juntas, ou nada acontece.
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var solicitacao = _mapper.Map<Solicitacao>(dto);
                solicitacao.DataSolicitacao = DateTime.Now;
                solicitacao.Status = "PENDENTE";

                _context.Solicitacoes.Add(solicitacao);
                await _context.SaveChangesAsync();

                // Validação de saldo + baixa PVPS ficam no EstoqueService.
                // Se faltar saldo, ele lança InvalidOperationException e a transação é desfeita.
                // O ID da solicitação fica gravado em cada movimentação de saída: é por ele que
                // o estorno sabe de quais lotes devolver.
                foreach (var item in dto.Itens)
                {
                    await _estoqueService.BaixarPvpsAsync(item.ProdutoId, item.Quantidade, solicitacao.Id);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return await BuscarPorIdAsync(solicitacao.Id)
                    ?? throw new Exception("Erro ao recuperar solicitação criada.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<SolicitacaoResponseDTO?> BuscarPorIdAsync(int id)
        {
            var solicitacao = await _context.Solicitacoes
                .Include(s => s.Solicitante)
                .Include(s => s.Itens)
                    .ThenInclude(i => i.Produto)
                        .ThenInclude(p => p!.UnidadeMedida)
                .Include(s => s.Reagendamentos).ThenInclude(r => r.Usuario)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            return _mapper.Map<SolicitacaoResponseDTO>(solicitacao);
        }

        public async Task<SolicitacaoResponseDTO?> ReagendarAsync(int id, SolicitacaoReagendarDTO dto)
        {
            var solicitacao = await _context.Solicitacoes.FirstOrDefaultAsync(s => s.Id == id);

            if (solicitacao == null) return null;

            if (solicitacao.Status != "PENDENTE")
                throw new InvalidOperationException(
                    $"Só é possível reagendar solicitações pendentes. Esta já está {solicitacao.Status}.");

            var novaData = dto.NovaData!.Value.Date; // [Required] no DTO garante que existe

            if (novaData < DateTime.Today)
                throw new InvalidOperationException("A nova data não pode ser anterior a hoje.");

            var dataAtual = solicitacao.DataPrevisaoEntrega?.Date;

            if (dataAtual == novaData)
                throw new InvalidOperationException("A nova data é igual à previsão atual.");

            var observacao = dto.Observacao?.Trim();

            if (dto.Motivo == "OUTRO" && string.IsNullOrEmpty(observacao))
                throw new InvalidOperationException("Explique o motivo no campo de observação.");

            // Histórico e nova data vão no mesmo SaveChanges: ou grava os dois, ou nenhum.
            _context.SolicitacaoReagendamentos.Add(new SolicitacaoReagendamento
            {
                Solicitacao = solicitacao,
                DataAnterior = dataAtual,
                DataNova = novaData,
                Motivo = dto.Motivo,
                Observacao = string.IsNullOrEmpty(observacao) ? null : observacao,
                UsuarioId = _usuarioAtual.Id,
                DataHora = DateTime.Now
            });

            solicitacao.DataPrevisaoEntrega = novaData;

            await _context.SaveChangesAsync();

            return await BuscarPorIdAsync(id);
        }

        public async Task<bool> AtualizarStatusAsync(int id, string novoStatus)
        {
            var novoStatusUpper = novoStatus.ToUpper();

            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Itens carregados porque o cancelamento precisa devolver o estoque
                    var solicitacao = await _context.Solicitacoes
                        .Include(s => s.Itens)
                        .FirstOrDefaultAsync(s => s.Id == id);

                    if (solicitacao == null) return false;

                    // Máquina de estados
                    if (solicitacao.Status == novoStatusUpper) return true;
                    if (solicitacao.Status == "CANCELADO" || solicitacao.Status == "ENTREGUE")
                    {
                        throw new InvalidOperationException($"Impossível alterar: Solicitação já está {solicitacao.Status}.");
                    }

                    // Estorno de estoque: devolve cada parte ao lote de onde saiu (via movimentações)
                    if (novoStatusUpper == "CANCELADO" && solicitacao.Status == "PENDENTE")
                    {
                        await _estoqueService.EstornarSolicitacaoAsync(solicitacao.Id);
                    }

                    // A data da entrega alimenta os relatórios de pontualidade
                    if (novoStatusUpper == "ENTREGUE")
                        solicitacao.DataEntrega = DateTime.Now;

                    solicitacao.Status = novoStatusUpper;

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }
    }
}