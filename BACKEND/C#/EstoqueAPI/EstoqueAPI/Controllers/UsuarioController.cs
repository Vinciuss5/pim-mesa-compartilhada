using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // A "Blindagem": Apenas administradores gerenciam a equipe
    //[Authorize(Roles = "ADMIN")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuarioController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UsuarioResponseDTO>>> Get()
        {
            var usuarios = await _usuarioService.ListarTodosAsync();
            return Ok(usuarios);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UsuarioResponseDTO>> GetById(int id)
        {
            var usuario = await _usuarioService.BuscarPorIdAsync(id);

            if (usuario == null)
                return NotFound(new { message = "Usuário não encontrado." });

            return Ok(usuario);
        }

        [HttpPost]
        public async Task<ActionResult<UsuarioResponseDTO>> Post([FromBody] UsuarioCreateDTO dto)
        {
            try
            {
                var novoUsuario = await _usuarioService.CriarAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = novoUsuario.Id }, novoUsuario);
            }
            catch (InvalidOperationException ex)
            {
                // Captura erros de regra de negócio (CPF/E-mail já existentes)
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                // Segurança: Não expomos detalhes técnicos em erros 500
                return StatusCode(500, new { message = "Erro interno ao processar o cadastro do usuário." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] UsuarioUpdateDTO dto)
        {
            try
            {
                var atualizado = await _usuarioService.AtualizarAsync(id, dto);

                if (!atualizado)
                    return NotFound(new { message = "Usuário não encontrado para atualização." });

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
            // RN: Implementamos a exclusão lógica (Inativação) para manter integridade de logs
            try
            {
                var inativado = await _usuarioService.InativarAsync(id);

                if (!inativado)
                    return NotFound(new { message = "Usuário não encontrado." });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}