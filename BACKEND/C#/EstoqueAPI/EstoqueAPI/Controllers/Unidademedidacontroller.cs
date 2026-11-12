using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/unidades-medida")]
    // Login obrigatório pela política global (Program.cs).
    // Quem pode criar unidades novas será definido na Fase 5 (permissões).
    public class UnidadeMedidaController : ControllerBase
    {
        private readonly IUnidadeMedidaService _service;

        public UnidadeMedidaController(IUnidadeMedidaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UnidadeMedidaResponseDTO>>> Get()
        {
            return Ok(await _service.ListarTodasAsync());
        }

        [HttpPost]
        public async Task<ActionResult<UnidadeMedidaResponseDTO>> Post([FromBody] UnidadeMedidaCreateDTO dto)
        {
            try
            {
                var criada = await _service.CriarAsync(dto);
                return Created($"api/unidades-medida/{criada.Id}", criada);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}