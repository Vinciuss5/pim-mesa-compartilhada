using AutoMapper;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public class DoacaoService : IDoacaoService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<DoacaoService> _logger;
        private readonly IEstoqueService _estoqueService;

        public DoacaoService(
            AppDbContext context,
            IMapper mapper,
            ILogger<DoacaoService> logger,
            IEstoqueService estoqueService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _estoqueService = estoqueService;
        }

        public async Task<IEnumerable<DoacaoResponseDTO>> ListarTodasAsync()
        {
            var doacoes = await _context.Doacoes
                .Include(d => d.Doador)
                .Include(d => d.Itens)
                    .ThenInclude(i => i.Produto)
                        .ThenInclude(p => p!.UnidadeMedida)
                .AsNoTracking()
                .OrderByDescending(d => d.Data)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DoacaoResponseDTO>>(doacoes);
        }

        public async Task<DoacaoResponseDTO> CriarAsync(DoacaoCreateDTO dto)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                // O 'using' garante o Rollback automático se o Commit não for chamado.
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // 1. Persistência da doação (gera o ID e valida as chaves estrangeiras)
                    var doacao = _mapper.Map<Doacao>(dto);
                    // O navegador manda a hora em UTC; o sistema trabalha na hora local do servidor.
                    doacao.Data = DataLocal.Normalizar(doacao.Data);

                    _context.Doacoes.Add(doacao);
                    await _context.SaveChangesAsync();

                    // 2. Entrada no estoque: toda alteração passa pelo EstoqueService
                    //    (que também valida unidade, validade obrigatória e quantidade inteira)
                    foreach (var item in doacao.Itens)
                    {
                        await _estoqueService.RegistrarEntradaAsync(
                            item.ProdutoId,
                            item.Quantidade,
                            item.DataValidade,
                            doacao.Data,
                            $"Doação #{doacao.Id}",
                            doacao.Id); // vincula a movimentação de ENTRADA a esta doação
                    }

                    // 3. Salva o estoque e finaliza
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    var resultado = await _context.Doacoes
                        .Include(d => d.Doador)
                        .Include(d => d.Itens)
                            .ThenInclude(i => i.Produto)
                                .ThenInclude(p => p!.UnidadeMedida)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(d => d.Id == doacao.Id);

                    return _mapper.Map<DoacaoResponseDTO>(resultado);
                }
                catch (DbUpdateException ex)
                {
                    _logger.LogError(ex, "Erro de persistência ao salvar doação.");
                    throw new InvalidOperationException("Erro de integridade no banco de dados. Verifique se o Doador e os Produtos existem.", ex);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Falha inesperada no processamento da doação.");
                    throw;
                }
            });
        }
    }
}