using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Blindagem Operacional: Ambos os perfis podem consultar o saldo de estoque
    //[Authorize(Roles = "ADMIN,FUNCIONARIO")]
    public class EstoqueController : ControllerBase
    {
        private readonly IEstoqueService _estoqueService;

        public EstoqueController(IEstoqueService estoqueService)
        {
            _estoqueService = estoqueService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EstoqueResponseDTO>>> Get()
        {
            // Busca todos os produtos que possuem saldo em estoque
            var estoque = await _estoqueService.ListarEstoqueAtualAsync();
            return Ok(estoque);
        }

        [HttpGet("produto/{produtoId}")]
        public async Task<ActionResult<EstoqueResponseDTO>> GetByProduto(int produtoId)
        {
            // Busca o saldo específico de um produto
            var saldo = await _estoqueService.BuscarSaldoPorProdutoAsync(produtoId);

            if (saldo == null)
                return NotFound(new { message = "Produto não encontrado ou sem saldo em estoque." });

            return Ok(saldo);
        }

        [HttpGet("baixo-estoque")]
        public async Task<ActionResult<IEnumerable<EstoqueResponseDTO>>> GetBaixoEstoque([FromQuery] int limite = 5)
        {
            // Endpoint estratégico: Lista produtos que estão com pouca quantidade (ex: menos de 5 unidades)
            // Útil para a ONG saber o que precisa pedir urgentemente aos doadores
            var alerta = await _estoqueService.ListarProdutosComBaixoEstoqueAsync(limite);
            return Ok(alerta);
        }

        /// <summary>
        /// Resumo por produto: saldo disponível (dentro da validade), saldo vencido, lotes,
        /// próxima validade e situação (OK, BAIXO, ZERADO ou SOMENTE_VENCIDO).
        /// </summary>
        [HttpGet("resumo")]
        public async Task<ActionResult<IEnumerable<EstoqueProdutoResumoDTO>>> GetResumo()
        {
            return Ok(await _estoqueService.ObterResumoAsync());
        }

        /// <summary>
        /// Ajuste manual de um lote (perda, vencimento, avaria ou correção).
        /// Gera uma movimentação do tipo AJUSTE com o motivo e o usuário.
        /// </summary>
        [HttpPost("ajuste")]
        // [Authorize(Roles = "ADMIN")] // Fase 5: provavelmente só administradores
        public async Task<IActionResult> Ajustar([FromBody] AjusteEstoqueCreateDTO dto)
        {
            try
            {
                await _estoqueService.AjustarAsync(dto);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}