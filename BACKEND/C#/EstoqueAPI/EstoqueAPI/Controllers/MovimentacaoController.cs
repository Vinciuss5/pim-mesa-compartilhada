using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Login obrigatório pela política global (Program.cs). Permissões por perfil: Fase 5.
    public class MovimentacaoController : ControllerBase
    {
        private readonly IMovimentacaoService _service;

        public MovimentacaoController(IMovimentacaoService service)
        {
            _service = service;
        }

        /// <summary>
        /// Histórico de entradas, saídas, estornos e ajustes.
        /// Ex.: GET api/movimentacao?produtoId=3&amp;tipo=SAIDA&amp;de=2026-10-01&amp;ate=2026-10-31&amp;limite=100
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MovimentacaoResponseDTO>>> Get([FromQuery] MovimentacaoFiltroDTO filtro)
        {
            try
            {
                return Ok(await _service.ListarAsync(filtro));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}