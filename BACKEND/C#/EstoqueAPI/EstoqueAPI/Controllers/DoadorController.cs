using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization; // 1. Importante para habilitar as travas
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // 2. A Blindagem Operacional: Permite que Admins e Funcionários gerenciem doadores
    //[Authorize(Roles = "ADMIN,FUNCIONARIO")]
    public class DoadorController : ControllerBase
    {
        private readonly IDoadorService _service;

        public DoadorController(IDoadorService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DoadorResponseDTO>>> Get([FromQuery] string? filtro)
        {
            var doadores = await _service.ListarTodosAsync(filtro);
            return Ok(doadores);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DoadorResponseDTO>> GetById(int id)
        {
            var doador = await _service.BuscarPorIdAsync(id);
            if (doador == null)
                return NotFound(new { message = "Doador não encontrado." });

            return Ok(doador);
        }

        [HttpPost]
        public async Task<ActionResult<DoadorResponseDTO>> Post([FromBody] DoadorCreateDTO dto)
        {
            try
            {
                var resultado = await _service.CriarAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] DoadorUpdateDTO dto)
        {
            try
            {
                var atualizado = await _service.AtualizarAsync(id, dto);
                if (!atualizado)
                    return NotFound(new { message = "Doador não encontrado para atualização." });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]

        public async Task<IActionResult> Delete(int id)
        {
            var excluido = await _service.ExcluirAsync(id);
            if (!excluido)
                return NotFound(new { message = "Doador não encontrado para exclusão." });

            return NoContent();
        }
    }
}