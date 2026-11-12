using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Login obrigatório pela política global (Program.cs). As permissões por perfil entram na Fase 5.
    //[Authorize(Roles = "ADMIN,FUNCIONARIO")]
    public class ProdutoController : ControllerBase
    {
        private readonly IProdutoService _service;

        public ProdutoController(IProdutoService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProdutoResponseDTO>>> Get()
        {
            var produtos = await _service.ListarTodosAsync();
            return Ok(produtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProdutoResponseDTO>> GetById(int id)
        {
            var produto = await _service.BuscarPorIdAsync(id);

            if (produto == null)
                return NotFound(new { message = $"Produto com ID {id} não encontrado." });

            return Ok(produto);
        }

        [HttpPost]
        public async Task<ActionResult<ProdutoResponseDTO>> Post([FromBody] ProdutoCreateDTO dto)
        {
            try
            {
                // O [ApiController] já faz a validação automática do ModelState
                var resultado = await _service.CriarAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] ProdutoUpdateDTO dto)
        {
            try
            {
                var atualizado = await _service.AtualizarAsync(id, dto);

                if (!atualizado)
                    return NotFound(new { message = $"Não foi possível atualizar. Produto ID {id} não encontrado." });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        // [Authorize(Roles = "ADMIN")] // Fase 5
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var excluido = await _service.ExcluirAsync(id);

                if (!excluido)
                    return NotFound(new { message = $"Não foi possível excluir. Produto ID {id} não encontrado." });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}