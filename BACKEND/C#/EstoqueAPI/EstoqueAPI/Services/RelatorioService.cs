using AutoMapper;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public interface IRelatorioService
    {
        Task<RelatorioVisaoGeralDTO> ObterVisaoGeralAsync(RelatorioFiltroDTO filtro);
        Task<RelatorioDoacoesDTO> ObterDoacoesAsync(RelatorioFiltroDTO filtro);
        Task<RelatorioSolicitacoesDTO> ObterSolicitacoesAsync(RelatorioFiltroDTO filtro);
        Task<RelatorioEstoqueDTO> ObterEstoqueAsync(RelatorioFiltroDTO filtro);
        Task<RelatorioSolicitanteDTO?> ObterSolicitanteAsync(int solicitanteId, RelatorioFiltroDTO filtro);
    }

    /// <summary>
    /// Relatórios calculados no servidor. Somente CONSULTA: nada aqui altera dados.
    /// Os números de estoque vêm do EstoqueService (ObterResumoAsync) e as regras de validade e de
    /// entrega vêm de RegrasValidade e RegrasEntrega, para os relatórios nunca divergirem das telas.
    /// As somas são feitas em memória (o SQLite não soma decimal no banco).
    /// </summary>
    public class RelatorioService : IRelatorioService
    {
        private const int MaximoDiasPeriodo = 1830; // 5 anos

        // Ajustes que representam estoque que "se perdeu" (a CORREÇÃO não é perda)
        private static readonly string[] MotivosDePerda = { "PERDA", "VENCIMENTO", "AVARIA" };

        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IEstoqueService _estoqueService;

        public RelatorioService(AppDbContext context, IMapper mapper, IEstoqueService estoqueService)
        {
            _context = context;
            _mapper = mapper;
            _estoqueService = estoqueService;
        }

        // =====================================================================
        // VISÃO GERAL
        // =====================================================================

        public async Task<RelatorioVisaoGeralDTO> ObterVisaoGeralAsync(RelatorioFiltroDTO filtro)
        {
            var (inicio, fimExclusivo, periodo) = NormalizarPeriodo(filtro);
            var hoje = DateTime.Today;

            var doacoes = await DoacoesComItens()
                .Where(d => d.Data >= inicio && d.Data < fimExclusivo)
                .ToListAsync();

            var solicitacoes = await SolicitacoesComItens()
                .Where(s => s.DataSolicitacao >= inicio && s.DataSolicitacao < fimExclusivo)
                .ToListAsync();

            var entregues = await SolicitacoesComItens()
                .Where(s => s.Status == "ENTREGUE" && s.DataEntrega != null
                            && s.DataEntrega >= inicio && s.DataEntrega < fimExclusivo)
                .ToListAsync();

            var pendentes = await _context.Solicitacoes
                .AsNoTracking()
                .Where(s => s.Status == "PENDENTE")
                .ToListAsync();

            var reagendamentos = await ReagendamentosDoPeriodoAsync(inicio, fimExclusivo);
            var perdas = await PerdasDoPeriodoAsync(inicio, fimExclusivo);
            var resumoEstoque = (await _estoqueService.ObterResumoAsync()).ToList();

            return new RelatorioVisaoGeralDTO(
                periodo,
                doacoes.Count,
                doacoes.Select(d => d.DoadorId).Distinct().Count(),
                SomarPorUnidade(UnidadesDeDoacoes(doacoes)),
                solicitacoes.Count,
                solicitacoes.Select(s => s.SolicitanteId).Distinct().Count(),
                solicitacoes.Count(s => s.Status == "ENTREGUE"),
                solicitacoes.Count(s => s.Status == "CANCELADO"),
                solicitacoes.Count(s => s.Status == "PENDENTE"),
                entregues.Count,
                SomarPorUnidade(UnidadesDeSolicitacoes(entregues)),
                SomarPorUnidade(perdas.Select(m => (UnidadeDe(m.Produto), -m.Quantidade))),
                reagendamentos.Count,
                reagendamentos.Select(r => r.SolicitacaoId).Distinct().Count(),
                MontarFila(pendentes, hoje),
                MontarSituacaoEstoque(resumoEstoque)
            );
        }

        // =====================================================================
        // DOAÇÕES
        // =====================================================================

        public async Task<RelatorioDoacoesDTO> ObterDoacoesAsync(RelatorioFiltroDTO filtro)
        {
            var (inicio, fimExclusivo, periodo) = NormalizarPeriodo(filtro);

            var doacoes = await DoacoesComItens()
                .Where(d => d.Data >= inicio && d.Data < fimExclusivo)
                .ToListAsync();

            var porDoador = doacoes
                .GroupBy(d => new { d.DoadorId, Nome = d.Doador?.Nome ?? "Doador não informado" })
                .Select(g => new DoadorResumoDTO(
                    g.Key.DoadorId,
                    g.Key.Nome,
                    g.Count(),
                    g.Sum(d => d.Itens.Count),
                    SomarPorUnidade(UnidadesDeDoacoes(g)),
                    g.Max(d => d.Data)))
                .OrderByDescending(d => d.Doacoes)
                .ThenBy(d => d.Nome)
                .ToList();

            var porProduto = SomarPorProduto(
                doacoes.SelectMany(d => d.Itens.Select(i =>
                    (i.ProdutoId, NomeDe(i.Produto), UnidadeDe(i.Produto), i.Quantidade, d.Id))));

            return new RelatorioDoacoesDTO(
                periodo,
                doacoes.Count,
                doacoes.Select(d => d.DoadorId).Distinct().Count(),
                SomarPorUnidade(UnidadesDeDoacoes(doacoes)),
                porDoador,
                porProduto
            );
        }

        // =====================================================================
        // SOLICITAÇÕES E ENTREGAS
        // =====================================================================

        public async Task<RelatorioSolicitacoesDTO> ObterSolicitacoesAsync(RelatorioFiltroDTO filtro)
        {
            var (inicio, fimExclusivo, periodo) = NormalizarPeriodo(filtro);
            var hoje = DateTime.Today;

            // Solicitações CRIADAS no período
            var solicitacoes = await SolicitacoesComItens()
                .Where(s => s.DataSolicitacao >= inicio && s.DataSolicitacao < fimExclusivo)
                .ToListAsync();

            // Entregas CONFIRMADAS no período (pela data da entrega)
            var entregues = await _context.Solicitacoes
                .AsNoTracking()
                .Where(s => s.Status == "ENTREGUE" && s.DataEntrega != null
                            && s.DataEntrega >= inicio && s.DataEntrega < fimExclusivo)
                .ToListAsync();

            // Fila de AGORA
            var pendentes = await _context.Solicitacoes
                .AsNoTracking()
                .Where(s => s.Status == "PENDENTE")
                .ToListAsync();

            var reagendamentos = await ReagendamentosDoPeriodoAsync(inicio, fimExclusivo);

            // Pontualidade: a entrega é comparada com a previsão ATUAL (a última, depois de eventuais reagendamentos)
            int noPrazo = 0, comAtraso = 0, semPrevisao = 0;

            foreach (var s in entregues)
            {
                if (!s.DataPrevisaoEntrega.HasValue) semPrevisao++;
                else if (s.DataEntrega!.Value.Date <= s.DataPrevisaoEntrega.Value.Date) noPrazo++;
                else comAtraso++;
            }

            var porSolicitante = solicitacoes
                .GroupBy(s => new { s.SolicitanteId, Nome = s.Solicitante?.Nome ?? "Solicitante não informado" })
                .Select(g => ResumirSolicitante(g.Key.SolicitanteId, g.Key.Nome, g))
                .OrderByDescending(r => r.Solicitacoes)
                .ThenBy(r => r.Nome)
                .ToList();

            var porProduto = SomarPorProduto(
                solicitacoes
                    .Where(s => s.Status != "CANCELADO")
                    .SelectMany(s => s.Itens.Select(i =>
                        (i.ProdutoId, NomeDe(i.Produto), UnidadeDe(i.Produto), i.Quantidade, s.Id))));

            var porMotivo = reagendamentos
                .GroupBy(r => r.Motivo ?? "NAO_INFORMADO")
                .Select(g => new ReagendamentoMotivoDTO(g.Key, g.Count()))
                .OrderByDescending(m => m.Quantidade)
                .ToList();

            return new RelatorioSolicitacoesDTO(
                periodo,
                solicitacoes.Count,
                solicitacoes.Count(s => s.Status == "PENDENTE"),
                solicitacoes.Count(s => s.Status == "ENTREGUE"),
                solicitacoes.Count(s => s.Status == "CANCELADO"),
                new PontualidadeDTO(noPrazo, comAtraso, semPrevisao),
                new ReagendamentosDTO(
                    reagendamentos.Count,
                    reagendamentos.Select(r => r.SolicitacaoId).Distinct().Count(),
                    porMotivo),
                MontarFila(pendentes, hoje),
                porSolicitante,
                porProduto
            );
        }

        // =====================================================================
        // ESTOQUE CRÍTICO
        // =====================================================================

        public async Task<RelatorioEstoqueDTO> ObterEstoqueAsync(RelatorioFiltroDTO filtro)
        {
            var (inicio, fimExclusivo, periodo) = NormalizarPeriodo(filtro);
            var hoje = DateTime.Today;

            var resumo = (await _estoqueService.ObterResumoAsync()).ToList();

            var semSaldo = resumo.Where(p => p.SaldoDisponivel == 0).OrderBy(p => p.Nome).ToList();
            var abaixoDoMinimo = resumo.Where(p => p.Situacao == "BAIXO").OrderBy(p => p.Nome).ToList();

            var lotes = await _context.Estoque
                .AsNoTracking()
                .Include(e => e.Produto).ThenInclude(p => p!.UnidadeMedida)
                .Where(e => e.Quantidade > 0 && e.DataValidade != null)
                .ToListAsync();

            var vencidos = new List<LoteAlertaDTO>();
            var emAlerta = new List<LoteAlertaDTO>();

            foreach (var lote in lotes)
            {
                var validade = lote.DataValidade!.Value.Date;
                var dias = (validade - hoje).Days;
                var diasAlerta = lote.Produto?.DiasAlertaValidade ?? RegrasValidade.DiasAlertaPadrao;

                if (dias < 0)
                {
                    vencidos.Add(NovoLoteAlerta(lote, validade, dias, "VENCIDO"));
                }
                else
                {
                    var alerta = RegrasValidade.ClassificarAlerta(dias, diasAlerta);

                    if (alerta != null)
                        emAlerta.Add(NovoLoteAlerta(lote, validade, dias, alerta));
                }
            }

            var perdas = await PerdasDoPeriodoAsync(inicio, fimExclusivo);

            var perdasPorMotivo = perdas
                .GroupBy(m => m.Motivo ?? "NAO_INFORMADO")
                .Select(g => new PerdaMotivoDTO(
                    g.Key,
                    g.Count(),
                    SomarPorUnidade(g.Select(m => (UnidadeDe(m.Produto), -m.Quantidade)))))
                .OrderByDescending(p => p.Ocorrencias)
                .ToList();

            var perdasPorProduto = SomarPorProduto(
                perdas.Select(m => (m.ProdutoId, NomeDe(m.Produto), UnidadeDe(m.Produto), -m.Quantidade, m.Id)));

            return new RelatorioEstoqueDTO(
                DateTime.Now,
                periodo,
                semSaldo,
                abaixoDoMinimo,
                vencidos.OrderBy(l => l.Validade).ThenBy(l => l.Produto).ToList(),
                emAlerta.OrderBy(l => l.DiasParaVencer).ThenBy(l => l.Produto).ToList(),
                perdasPorMotivo,
                perdasPorProduto
            );
        }

        // =====================================================================
        // HISTÓRICO DE UM SOLICITANTE
        // =====================================================================

        public async Task<RelatorioSolicitanteDTO?> ObterSolicitanteAsync(int solicitanteId, RelatorioFiltroDTO filtro)
        {
            var (inicio, fimExclusivo, periodo) = NormalizarPeriodo(filtro);

            var solicitante = await _context.Solicitantes
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == solicitanteId);

            if (solicitante == null) return null;

            var solicitacoes = await SolicitacoesComItens()
                .Include(s => s.Reagendamentos).ThenInclude(r => r.Usuario)
                .Where(s => s.SolicitanteId == solicitanteId
                            && s.DataSolicitacao >= inicio && s.DataSolicitacao < fimExclusivo)
                .OrderByDescending(s => s.DataSolicitacao)
                .ToListAsync();

            var produtos = SomarPorProduto(
                solicitacoes
                    .Where(s => s.Status != "CANCELADO")
                    .SelectMany(s => s.Itens.Select(i =>
                        (i.ProdutoId, NomeDe(i.Produto), UnidadeDe(i.Produto), i.Quantidade, s.Id))));

            return new RelatorioSolicitanteDTO(
                periodo,
                ResumirSolicitante(solicitante.Id, solicitante.Nome, solicitacoes),
                produtos,
                _mapper.Map<List<SolicitacaoResponseDTO>>(solicitacoes)
            );
        }

        // =====================================================================
        // CONSULTAS REUTILIZADAS
        // =====================================================================

        private IQueryable<Doacao> DoacoesComItens()
        {
            return _context.Doacoes
                .AsNoTracking()
                .Include(d => d.Doador)
                .Include(d => d.Itens).ThenInclude(i => i.Produto).ThenInclude(p => p!.UnidadeMedida);
        }

        private IQueryable<Solicitacao> SolicitacoesComItens()
        {
            return _context.Solicitacoes
                .AsNoTracking()
                .Include(s => s.Solicitante)
                .Include(s => s.Itens).ThenInclude(i => i.Produto).ThenInclude(p => p!.UnidadeMedida);
        }

        private async Task<List<SolicitacaoReagendamento>> ReagendamentosDoPeriodoAsync(DateTime inicio, DateTime fimExclusivo)
        {
            return await _context.SolicitacaoReagendamentos
                .AsNoTracking()
                .Where(r => r.DataHora >= inicio && r.DataHora < fimExclusivo)
                .ToListAsync();
        }

        private async Task<List<Movimentacao>> PerdasDoPeriodoAsync(DateTime inicio, DateTime fimExclusivo)
        {
            return await _context.Movimentacoes
                .AsNoTracking()
                .Include(m => m.Produto).ThenInclude(p => p!.UnidadeMedida)
                .Where(m => m.Tipo == "AJUSTE"
                            && m.DataHora >= inicio && m.DataHora < fimExclusivo
                            && m.Motivo != null && MotivosDePerda.Contains(m.Motivo))
                .ToListAsync();
        }

        // =====================================================================
        // AUXILIARES (cálculos em memória)
        // =====================================================================

        private static (DateTime Inicio, DateTime FimExclusivo, PeriodoDTO Periodo) NormalizarPeriodo(RelatorioFiltroDTO filtro)
        {
            // Padrão: últimos 30 dias, incluindo hoje
            var fim = (filtro.Ate ?? DateTime.Today).Date;
            var inicio = (filtro.De ?? fim.AddDays(-29)).Date;

            if (inicio > fim)
                throw new InvalidOperationException("A data inicial não pode ser posterior à data final.");

            if ((fim - inicio).Days > MaximoDiasPeriodo)
                throw new InvalidOperationException("O período máximo de consulta é de 5 anos.");

            return (inicio, fim.AddDays(1), new PeriodoDTO(inicio, fim));
        }

        private static string UnidadeDe(Produto? produto) => produto?.UnidadeMedida?.Sigla ?? "";

        private static string NomeDe(Produto? produto) => produto?.Nome ?? "Produto removido";

        private static IEnumerable<(string Unidade, decimal Quantidade)> UnidadesDeDoacoes(IEnumerable<Doacao> doacoes)
        {
            return doacoes.SelectMany(d => d.Itens).Select(i => (UnidadeDe(i.Produto), i.Quantidade));
        }

        private static IEnumerable<(string Unidade, decimal Quantidade)> UnidadesDeSolicitacoes(IEnumerable<Solicitacao> solicitacoes)
        {
            return solicitacoes.SelectMany(s => s.Itens).Select(i => (UnidadeDe(i.Produto), i.Quantidade));
        }

        /// <summary>Soma por unidade. Kg, L e un ficam em linhas separadas: não se misturam.</summary>
        private static List<QuantidadePorUnidadeDTO> SomarPorUnidade(IEnumerable<(string Unidade, decimal Quantidade)> itens)
        {
            return itens
                .GroupBy(i => i.Unidade)
                .Select(g => new QuantidadePorUnidadeDTO(g.Key, g.Sum(x => x.Quantidade)))
                .OrderBy(q => q.Unidade)
                .ToList();
        }

        /// <summary>Soma por produto. "Origem" é o Id da doação/solicitação/movimentação, para contar em quantas apareceu.</summary>
        private static List<ProdutoQuantidadeDTO> SomarPorProduto(
            IEnumerable<(int ProdutoId, string Produto, string Unidade, decimal Quantidade, int Origem)> itens)
        {
            return itens
                .GroupBy(i => (i.ProdutoId, i.Produto, i.Unidade))
                .Select(g => new ProdutoQuantidadeDTO(
                    g.Key.ProdutoId,
                    g.Key.Produto,
                    g.Key.Unidade,
                    g.Sum(x => x.Quantidade),
                    g.Select(x => x.Origem).Distinct().Count()))
                .OrderByDescending(p => p.Ocorrencias)
                .ThenBy(p => p.Produto)
                .ToList();
        }

        private static FilaEntregasDTO MontarFila(IEnumerable<Solicitacao> pendentes, DateTime hoje)
        {
            int atrasadas = 0, deHoje = 0, amanha = 0, ate7Dias = 0, depois = 0, semPrevisao = 0;

            foreach (var s in pendentes)
            {
                switch (RegrasEntrega.Classificar(s.DataPrevisaoEntrega, hoje))
                {
                    case "ATRASADA": atrasadas++; break;
                    case "HOJE": deHoje++; break;
                    case "AMANHA": amanha++; break;
                    case "SEMANA": ate7Dias++; break;
                    case "FUTURA": depois++; break;
                    default: semPrevisao++; break;
                }
            }

            return new FilaEntregasDTO(atrasadas, deHoje, amanha, ate7Dias, depois, semPrevisao);
        }

        private static EstoqueSituacaoDTO MontarSituacaoEstoque(List<EstoqueProdutoResumoDTO> resumo)
        {
            var comSaldo = resumo.Where(p => p.SaldoDisponivel > 0).ToList();

            var disponivel = comSaldo
                .GroupBy(p => p.UnidadeSigla)
                .Select(g => new QuantidadePorUnidadeDTO(g.Key, g.Sum(p => p.SaldoDisponivel)))
                .OrderBy(q => q.Unidade)
                .ToList();

            return new EstoqueSituacaoDTO(
                resumo.Count,
                comSaldo.Count,
                resumo.Count(p => p.Situacao == "ZERADO"),
                resumo.Count(p => p.Situacao == "BAIXO"),
                resumo.Count(p => p.SaldoVencido > 0),
                resumo.Count(p => p.AlertaValidade == "URGENTE"),
                resumo.Count(p => p.AlertaValidade == "ATENCAO"),
                disponivel,
                comSaldo.Where(p => p.PesoEstimadoKg.HasValue).Sum(p => p.PesoEstimadoKg!.Value),
                comSaldo.Count(p => !p.PesoEstimadoKg.HasValue)
            );
        }

        private static SolicitanteResumoDTO ResumirSolicitante(int id, string nome, IEnumerable<Solicitacao> solicitacoes)
        {
            var lista = solicitacoes.ToList();

            var quantidades = SomarPorUnidade(
                UnidadesDeSolicitacoes(lista.Where(s => s.Status != "CANCELADO")));

            return new SolicitanteResumoDTO(
                id,
                nome,
                lista.Count,
                lista.Count(s => s.Status == "ENTREGUE"),
                lista.Count(s => s.Status == "CANCELADO"),
                lista.Count(s => s.Status == "PENDENTE"),
                quantidades,
                lista.Count > 0 ? lista.Max(s => s.DataSolicitacao) : (DateTime?)null
            );
        }

        private static LoteAlertaDTO NovoLoteAlerta(Estoque lote, DateTime validade, int dias, string situacao)
        {
            return new LoteAlertaDTO(
                lote.Id,
                lote.ProdutoId,
                NomeDe(lote.Produto),
                UnidadeDe(lote.Produto),
                lote.Quantidade,
                validade,
                dias,
                situacao
            );
        }
    }
}