using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    /// <summary>
    /// Relatórios calculados no servidor. Todos aceitam ?de=AAAA-MM-DD&amp;ate=AAAA-MM-DD
    /// (padrão: últimos 30 dias). Login obrigatório pela política global (Program.cs).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class RelatorioController : ControllerBase
    {
        private readonly IRelatorioService _service;

        public RelatorioController(IRelatorioService service)
        {
            _service = service;
        }

        /// <summary>Números gerais: doações, solicitações, entregas, perdas, fila de entregas e situação do estoque.</summary>
        [HttpGet("visao-geral")]
        public Task<IActionResult> VisaoGeral([FromQuery] RelatorioFiltroDTO filtro)
            => Executar(() => _service.ObterVisaoGeralAsync(filtro));

        /// <summary>Doações recebidas: por doador e por produto.</summary>
        [HttpGet("doacoes")]
        public Task<IActionResult> Doacoes([FromQuery] RelatorioFiltroDTO filtro)
            => Executar(() => _service.ObterDoacoesAsync(filtro));

        /// <summary>Solicitações e entregas: pontualidade, reagendamentos, por solicitante e por produto.</summary>
        [HttpGet("solicitacoes")]
        public Task<IActionResult> Solicitacoes([FromQuery] RelatorioFiltroDTO filtro)
            => Executar(() => _service.ObterSolicitacoesAsync(filtro));

        /// <summary>Estoque crítico: sem saldo, abaixo do mínimo, lotes vencidos e em alerta, e perdas do período.</summary>
        [HttpGet("estoque")]
        public Task<IActionResult> Estoque([FromQuery] RelatorioFiltroDTO filtro)
            => Executar(() => _service.ObterEstoqueAsync(filtro));

        /// <summary>Tudo o que um solicitante pediu no período, com os produtos somados.</summary>
        [HttpGet("solicitantes/{id}")]
        public async Task<IActionResult> Solicitante(int id, [FromQuery] RelatorioFiltroDTO filtro)
        {
            try
            {
                var resultado = await _service.ObterSolicitanteAsync(id, filtro);

                if (resultado == null)
                    return NotFound(new { message = $"Solicitante com ID {id} não encontrado." });

                return Ok(resultado);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Evita repetir o try/catch em cada relatório: regra de negócio violada vira 400 com a mensagem
        private async Task<IActionResult> Executar<T>(Func<Task<T>> consulta)
        {
            try
            {
                return Ok(await consulta());
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}