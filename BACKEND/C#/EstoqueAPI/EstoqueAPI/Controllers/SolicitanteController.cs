using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Blindagem: Controle de acesso centralizado na classe
    //[Authorize(Roles = "ADMIN,FUNCIONARIO")]
    public class SolicitanteController : ControllerBase
    {
        private readonly ISolicitanteService _service;

        public SolicitanteController(ISolicitanteService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SolicitanteResponseDTO>>> Get([FromQuery] string? search)
        {
            var solicitantes = await _service.ListarTodosAsync(search);
            return Ok(solicitantes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SolicitanteResponseDTO>> GetById(int id)
        {
            var solicitante = await _service.BuscarPorIdAsync(id);
            if (solicitante == null)
                return NotFound(new { message = "Solicitante não encontrado." });

            return Ok(solicitante);
        }

        [HttpPost]
        public async Task<ActionResult<SolicitanteResponseDTO>> Post([FromBody] SolicitanteCreateDTO dto)
        {
            try
            {
                var resultado = await _service.CriarAsync(dto);
                // Retorno 201 Created com o cabeçalho 'Location'
                return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
            }
            catch (InvalidOperationException ex)
            {
                // Captura erros de CPF duplicado lançados pelo Service
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                // Fallback para erros inesperados (Segurança: não expomos stack trace)
                return StatusCode(500, new { message = "Ocorreu um erro interno ao processar o cadastro." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] SolicitanteUpdateDTO dto)
        {
            try
            {
                var atualizado = await _service.AtualizarAsync(id, dto);
                if (!atualizado)
                    return NotFound(new { message = "Solicitante não encontrado para atualização." });

                return NoContent(); // Status 204: Sucesso sem corpo de resposta
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        // Restrição de autorização específica para o método Delete
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var excluido = await _service.ExcluirAsync(id);
                if (!excluido)
                    return NotFound(new { message = "Solicitante não encontrado para exclusão." });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                // Captura erro caso o solicitante possua pedidos vinculados
                return Conflict(new { message = ex.Message }); // Status 409: Conflito de integridade
            }
        }
    }
}