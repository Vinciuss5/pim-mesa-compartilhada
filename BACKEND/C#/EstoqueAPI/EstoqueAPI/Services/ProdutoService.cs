using AutoMapper;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public class ProdutoService : IProdutoService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public ProdutoService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ProdutoResponseDTO>> ListarTodosAsync()
        {
            var produtos = await _context.Produtos
                .Include(p => p.UnidadeMedida)
                .AsNoTracking()
                .OrderBy(p => p.Nome)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ProdutoResponseDTO>>(produtos);
        }

        public async Task<ProdutoResponseDTO?> BuscarPorIdAsync(int id)
        {
            var produto = await _context.Produtos
                .Include(p => p.UnidadeMedida)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            return produto == null ? null : _mapper.Map<ProdutoResponseDTO>(produto);
        }

        public async Task<ProdutoResponseDTO> CriarAsync(ProdutoCreateDTO dto)
        {
            var nome = dto.Nome.Trim();
            var unidade = await ObterUnidadeAsync(dto.UnidadeMedidaId);
            await GarantirNomeUnicoAsync(nome, null);

            var produto = _mapper.Map<Produto>(dto);
            produto.Nome = nome;

            // Peso por unidade só faz sentido para unidades de contagem (pct, cx, un...)
            if (unidade.Tipo != "CONTAGEM") produto.PesoKg = null;

            _context.Produtos.Add(produto);
            await _context.SaveChangesAsync();

            // Carrega a unidade para devolver sigla/nome/tipo no DTO
            await _context.Entry(produto).Reference(p => p.UnidadeMedida).LoadAsync();

            return _mapper.Map<ProdutoResponseDTO>(produto);
        }

        public async Task<bool> AtualizarAsync(int id, ProdutoUpdateDTO dto)
        {
            var produtoExistente = await _context.Produtos.FirstOrDefaultAsync(p => p.Id == id);

            if (produtoExistente == null) return false;

            var nome = dto.Nome.Trim();
            var unidade = await ObterUnidadeAsync(dto.UnidadeMedidaId);
            await GarantirNomeUnicoAsync(nome, id);

            // Trocar a unidade de um produto que já tem histórico corromperia as quantidades
            // (ex.: 10 "kg" viraria 10 "un"). Só é permitido enquanto não houver movimentação.
            if (produtoExistente.UnidadeMedidaId != dto.UnidadeMedidaId)
            {
                var temMovimentacao =
                    await _context.Estoque.AnyAsync(e => e.ProdutoId == id) ||
                    await _context.DoacaoItens.AnyAsync(i => i.ProdutoId == id) ||
                    await _context.SolicitacaoItens.AnyAsync(i => i.ProdutoId == id);

                if (temMovimentacao)
                    throw new InvalidOperationException(
                        "Não é possível trocar a unidade de medida de um produto que já possui estoque, doações ou solicitações.");
            }

            // Mapeia as alterações do DTO para a Model já rastreada pelo EF
            _mapper.Map(dto, produtoExistente);
            produtoExistente.Nome = nome;

            if (unidade.Tipo != "CONTAGEM") produtoExistente.PesoKg = null;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExcluirAsync(int id)
        {
            var produto = await _context.Produtos.FindAsync(id);

            if (produto == null) return false;

            try
            {
                _context.Produtos.Remove(produto);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException)
            {
                // Restrict nas chaves estrangeiras: produto com estoque/doações/solicitações.
                // (Na Fase 5 isso passa a ser "inativar".)
                throw new InvalidOperationException(
                    "Este produto possui estoque, doações ou solicitações e não pode ser excluído.");
            }
        }

        // ---------------------------------------------------------------
        // Auxiliares
        // ---------------------------------------------------------------

        private async Task<UnidadeMedida> ObterUnidadeAsync(int unidadeMedidaId)
        {
            return await _context.UnidadesMedida
                       .AsNoTracking()
                       .FirstOrDefaultAsync(u => u.Id == unidadeMedidaId)
                   ?? throw new InvalidOperationException("Unidade de medida inválida.");
        }

        private async Task GarantirNomeUnicoAsync(string nome, int? ignorarId)
        {
            var nomeMin = nome.ToLower();

            var duplicado = await _context.Produtos
                .AnyAsync(p => p.Nome.ToLower() == nomeMin && (ignorarId == null || p.Id != ignorarId));

            if (duplicado)
                throw new InvalidOperationException(
                    $"Já existe um produto chamado '{nome}'. Se for uma variação, inclua o diferencial no nome (ex.: \"Arroz 5 kg\").");
        }
    }
}