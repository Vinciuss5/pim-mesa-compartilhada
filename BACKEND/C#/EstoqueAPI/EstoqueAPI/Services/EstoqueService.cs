using AutoMapper;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public class EstoqueService : IEstoqueService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUsuarioAtualService _usuarioAtual;

        public EstoqueService(AppDbContext context, IMapper mapper, IUsuarioAtualService usuarioAtual)
        {
            _context = context;
            _mapper = mapper;
            _usuarioAtual = usuarioAtual;
        }

        // =====================================================================
        // CONSULTAS (serão reescritas na Fase 3: totais por produto)
        // =====================================================================

        public async Task<IEnumerable<EstoqueResponseDTO>> ListarEstoqueAtualAsync()
        {
            var estoque = await _context.Estoque
                            .Include(e => e.Produto).ThenInclude(p => p!.UnidadeMedida)
                            .AsNoTracking()
                            // Ordena os zerados para o final e depois por nome do produto
                            .OrderByDescending(e => e.Quantidade > 0)
                            .ThenBy(e => e.Produto != null ? e.Produto.Nome : string.Empty)
                            .ToListAsync();

            return _mapper.Map<IEnumerable<EstoqueResponseDTO>>(estoque);
        }

        public async Task<EstoqueResponseDTO?> BuscarSaldoPorProdutoAsync(int produtoId)
        {
            var item = await _context.Estoque
                .Include(e => e.Produto).ThenInclude(p => p!.UnidadeMedida)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.ProdutoId == produtoId);

            return _mapper.Map<EstoqueResponseDTO>(item);
        }

        public async Task<IEnumerable<EstoqueResponseDTO>> ListarProdutosComBaixoEstoqueAsync(int limite)
        {
            if (limite < 0) return Enumerable.Empty<EstoqueResponseDTO>();

            var baixoEstoque = await _context.Estoque
                .Include(e => e.Produto).ThenInclude(p => p!.UnidadeMedida)
                .Where(e => e.Quantidade <= (decimal)limite)
                .AsNoTracking()
                .OrderBy(e => e.Quantidade)
                .ToListAsync();

            return _mapper.Map<IEnumerable<EstoqueResponseDTO>>(baixoEstoque);
        }

        /// <summary>
        /// Resumo por produto. Lote vencido NÃO conta como disponível: fica em SaldoVencido
        /// e não pode ser entregue (veja BaixarPvpsAsync).
        /// </summary>
        public async Task<IEnumerable<EstoqueProdutoResumoDTO>> ObterResumoAsync()
        {
            var hoje = DateTime.Today;

            var produtos = await _context.Produtos
                .Include(p => p.UnidadeMedida)
                .AsNoTracking()
                .OrderBy(p => p.Nome)
                .ToListAsync();

            // Só lotes com saldo. As somas são feitas em memória (o SQLite não soma decimal no banco).
            var lotesPorProduto = (await _context.Estoque
                    .AsNoTracking()
                    .Where(e => e.Quantidade > 0)
                    .ToListAsync())
                .ToLookup(l => l.ProdutoId);

            var resumo = new List<EstoqueProdutoResumoDTO>();

            foreach (var produto in produtos)
            {
                var lotes = lotesPorProduto[produto.Id].ToList();

                var vencidos = lotes
                    .Where(l => l.DataValidade.HasValue && l.DataValidade.Value.Date < hoje)
                    .ToList();

                var disponiveis = lotes
                    .Where(l => !l.DataValidade.HasValue || l.DataValidade.Value.Date >= hoje)
                    .ToList();

                var saldoDisponivel = disponiveis.Sum(l => l.Quantidade);
                var saldoVencido = vencidos.Sum(l => l.Quantidade);

                var validades = disponiveis
                    .Where(l => l.DataValidade.HasValue)
                    .Select(l => l.DataValidade!.Value.Date)
                    .ToList();

                DateTime? proximaValidade = validades.Count > 0 ? validades.Min() : null;

                // Dias até a validade mais próxima e o nível de alerta, pela regra do PRODUTO
                int? diasParaVencer = proximaValidade.HasValue ? (proximaValidade.Value - hoje).Days : null;
                var alertaValidade = diasParaVencer.HasValue
                    ? RegrasValidade.ClassificarAlerta(diasParaVencer.Value, produto.DiasAlertaValidade)
                    : null;

                string situacao;
                if (saldoDisponivel == 0 && saldoVencido == 0) situacao = "ZERADO";
                else if (saldoDisponivel == 0) situacao = "SOMENTE_VENCIDO";
                else if (produto.EstoqueMinimo.HasValue && saldoDisponivel < produto.EstoqueMinimo.Value) situacao = "BAIXO";
                else situacao = "OK";

                resumo.Add(new EstoqueProdutoResumoDTO(
                    produto.Id,
                    produto.Nome,
                    produto.Categoria,
                    produto.UnidadeMedida?.Sigla ?? "",
                    produto.UnidadeMedida?.Tipo ?? "",
                    saldoDisponivel,
                    saldoVencido,
                    lotes.Count,
                    proximaValidade,
                    diasParaVencer,
                    alertaValidade,
                    produto.DiasAlertaValidade,
                    produto.EstoqueMinimo,
                    produto.PesoKg,
                    PesoEstimadoKg(produto, saldoDisponivel),
                    situacao
                ));
            }

            return resumo;
        }

        /// <summary>Converte o saldo em kg quando dá: kg e g direto; contagem com peso por unidade informado.
        /// Litros e unidades sem peso não têm como virar kg (devolve null).</summary>
        private static decimal? PesoEstimadoKg(Produto produto, decimal saldo)
        {
            var sigla = produto.UnidadeMedida?.Sigla?.Trim().ToLower();

            if (sigla == "kg") return saldo;
            if (sigla == "g") return saldo / 1000m;
            if (produto.UnidadeMedida?.Tipo == "CONTAGEM" && produto.PesoKg.HasValue)
                return saldo * produto.PesoKg.Value;

            return null;
        }

        // =====================================================================
        // PONTO ÚNICO DE ALTERAÇÃO DE ESTOQUE
        // Toda mudança em Estoque.Quantidade acontece aqui e gera uma Movimentacao.
        // RegistrarEntrada, BaixarPvps e EstornarSolicitacao NÃO chamam SaveChanges:
        // o Service que os chama controla a transação (BeginTransaction -> SaveChanges -> Commit).
        // =====================================================================

        public async Task RegistrarEntradaAsync(
            int produtoId, decimal quantidade, DateTime? dataValidade, DateTime dataEntrada, string origem, int? doacaoId = null)
        {
            if (quantidade <= 0)
                throw new InvalidOperationException("A quantidade de entrada deve ser maior que zero.");

            var produto = await ObterProdutoParaMovimentoAsync(produtoId, quantidade);

            // Normaliza para só a data: evita lotes duplicados por diferença de horário.
            var validade = dataValidade?.Date;

            if (produto.ControlaValidade && validade == null)
                throw new InvalidOperationException($"Informe a data de validade de {produto.Nome}.");

            if (validade != null && validade < DateTime.Today)
                throw new InvalidOperationException($"A validade informada para {produto.Nome} ({validade:dd/MM/yyyy}) já passou.");

            // Procura primeiro no que já está rastreado (itens adicionados nesta mesma operação,
            // ainda não salvos) e só depois no banco.
            var lote = _context.Estoque.Local
                           .FirstOrDefault(e => e.ProdutoId == produtoId && e.DataValidade == validade)
                       ?? await _context.Estoque
                           .FirstOrDefaultAsync(e => e.ProdutoId == produtoId && e.DataValidade == validade);

            if (lote != null)
            {
                lote.Quantidade += quantidade;
                lote.DataEntrada = dataEntrada;
            }
            else
            {
                lote = new Estoque
                {
                    ProdutoId = produtoId,
                    Quantidade = quantidade,
                    DataValidade = validade,
                    DataEntrada = dataEntrada,
                    Origem = origem
                };
                _context.Estoque.Add(lote);
            }

            RegistrarMovimentacao("ENTRADA", produtoId, lote, quantidade, doacaoId: doacaoId);
        }

        public async Task BaixarPvpsAsync(int produtoId, decimal quantidade, int? solicitacaoId = null)
        {
            if (quantidade <= 0)
                throw new InvalidOperationException("A quantidade de saída deve ser maior que zero.");

            var produto = await ObterProdutoParaMovimentoAsync(produtoId, quantidade);
            var sigla = produto.UnidadeMedida?.Sigla ?? "";

            var lotes = await _context.Estoque
                .Where(e => e.ProdutoId == produtoId && e.Quantidade > 0)
                .ToListAsync();

            var hoje = DateTime.Today;

            // Lote vencido NUNCA é entregue (segurança alimentar): fica de fora da baixa.
            // Ele deve ser retirado do estoque com um ajuste do tipo VENCIMENTO.
            var vencidos = lotes
                .Where(l => l.Quantidade > 0 && l.DataValidade.HasValue && l.DataValidade.Value.Date < hoje)
                .ToList();

            // Ordenação em memória, sobre os valores atuais (inclusive alterações ainda não salvas):
            //  1) lotes COM validade primeiro, do que vence antes para o que vence depois;
            //  2) lotes SEM validade por último (no SQLite, nulo viria primeiro);
            //  3) desempate pelo mais antigo.
            var disponiveis = lotes
                .Where(l => l.Quantidade > 0 && !vencidos.Contains(l))
                .OrderBy(l => l.DataValidade.HasValue ? 0 : 1)
                .ThenBy(l => l.DataValidade)
                .ThenBy(l => l.DataEntrada)
                .ToList();

            decimal saldo = disponiveis.Sum(l => l.Quantidade);

            if (saldo < quantidade)
            {
                var avisoVencido = vencidos.Count > 0
                    ? $" Há {vencidos.Sum(l => l.Quantidade):0.##} {sigla} vencidos, que não podem ser entregues: registre-os em Estoque > Lotes > Ajustar."
                    : "";

                throw new InvalidOperationException(
                    $"Saldo insuficiente para {produto.Nome}. Disponível: {saldo:0.##} {sigla}. Solicitado: {quantidade:0.##} {sigla}.{avisoVencido}");
            }

            decimal restante = quantidade;

            foreach (var lote in disponiveis)
            {
                if (restante <= 0) break;

                decimal retirar = Math.Min(lote.Quantidade, restante);
                lote.Quantidade -= retirar;
                restante -= retirar;

                // Uma movimentação por lote: é isso que permite estornar cada parte no lote certo
                RegistrarMovimentacao("SAIDA", produtoId, lote, -retirar, solicitacaoId: solicitacaoId);
            }
        }

        public async Task EstornarSolicitacaoAsync(int solicitacaoId)
        {
            var jaEstornada = await _context.Movimentacoes
                .AnyAsync(m => m.SolicitacaoId == solicitacaoId && m.Tipo == "ESTORNO");

            if (jaEstornada)
                throw new InvalidOperationException("Esta solicitação já foi estornada.");

            // Include sem AsNoTracking: o lote vem rastreado e podemos devolver a quantidade nele
            var saidas = await _context.Movimentacoes
                .Include(m => m.Estoque)
                .Where(m => m.SolicitacaoId == solicitacaoId && m.Tipo == "SAIDA")
                .ToListAsync();

            if (saidas.Count == 0)
                throw new InvalidOperationException(
                    "Não há registro das baixas desta solicitação, então o estorno não pode ser feito automaticamente.");

            foreach (var saida in saidas)
            {
                var lote = saida.Estoque
                    ?? throw new InvalidOperationException("Lote de origem da baixa não encontrado.");

                var devolver = -saida.Quantidade; // a saída é negativa; a devolução é positiva
                lote.Quantidade += devolver;

                RegistrarMovimentacao("ESTORNO", saida.ProdutoId, lote, devolver, solicitacaoId: solicitacaoId);
            }
        }

        public async Task AjustarAsync(AjusteEstoqueCreateDTO dto)
        {
            var lote = await _context.Estoque
                .Include(e => e.Produto).ThenInclude(p => p!.UnidadeMedida)
                .FirstOrDefaultAsync(e => e.Id == dto.EstoqueId)
                ?? throw new InvalidOperationException("Lote não encontrado.");

            var produto = lote.Produto
                ?? throw new InvalidOperationException("Produto do lote não encontrado.");

            var variacao = dto.Variacao;

            if (variacao == 0)
                throw new InvalidOperationException("A quantidade do ajuste deve ser diferente de zero.");

            if (dto.Motivo != "CORRECAO" && variacao > 0)
                throw new InvalidOperationException("Perda, vencimento e avaria só podem reduzir o estoque.");

            var observacao = dto.Observacao?.Trim();

            if (dto.Motivo == "CORRECAO" && string.IsNullOrEmpty(observacao))
                throw new InvalidOperationException("Explique a correção no campo de observação.");

            if (produto.UnidadeMedida?.Tipo == "CONTAGEM" && variacao != Math.Truncate(variacao))
                throw new InvalidOperationException(
                    $"{produto.Nome} é contado em {produto.UnidadeMedida.Sigla} e aceita apenas quantidades inteiras.");

            var novaQuantidade = lote.Quantidade + variacao;

            if (novaQuantidade < 0)
                throw new InvalidOperationException(
                    $"O lote tem apenas {lote.Quantidade:0.##} {produto.UnidadeMedida?.Sigla}; não é possível retirar {-variacao:0.##}.");

            lote.Quantidade = novaQuantidade;

            RegistrarMovimentacao("AJUSTE", produto.Id, lote, variacao, motivo: dto.Motivo, observacao: observacao);

            // Operação isolada (não faz parte de doação/solicitação): salva aqui mesmo.
            // Lote e movimentação vão na mesma chamada, portanto na mesma transação do banco.
            await _context.SaveChangesAsync();
        }

        // ---------------------------------------------------------------
        // Auxiliares
        // ---------------------------------------------------------------

        /// <summary>Cria a Movimentacao (ainda sem salvar). O lote é ligado pela navegação,
        /// então funciona mesmo quando o lote acabou de ser criado e ainda não tem Id.</summary>
        private void RegistrarMovimentacao(
            string tipo, int produtoId, Estoque lote, decimal quantidadeComSinal,
            int? doacaoId = null, int? solicitacaoId = null, string? motivo = null, string? observacao = null)
        {
            _context.Movimentacoes.Add(new Movimentacao
            {
                DataHora = DateTime.Now,
                Tipo = tipo,
                ProdutoId = produtoId,
                Estoque = lote,
                Quantidade = quantidadeComSinal,
                DoacaoId = doacaoId,
                SolicitacaoId = solicitacaoId,
                Motivo = motivo,
                Observacao = observacao,
                UsuarioId = _usuarioAtual.Id
            });
        }

        /// <summary>Carrega o produto com a unidade e valida a quantidade.
        /// Unidades de CONTAGEM (un, pct, cx...) só aceitam números inteiros.</summary>
        private async Task<Produto> ObterProdutoParaMovimentoAsync(int produtoId, decimal quantidade)
        {
            var produto = await _context.Produtos
                .Include(p => p.UnidadeMedida)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == produtoId)
                ?? throw new InvalidOperationException($"Produto {produtoId} não encontrado.");

            if (produto.UnidadeMedida?.Tipo == "CONTAGEM" && quantidade != Math.Truncate(quantidade))
            {
                throw new InvalidOperationException(
                    $"{produto.Nome} é contado em {produto.UnidadeMedida.Sigla} e aceita apenas quantidades inteiras.");
            }

            return produto;
        }
    }
}