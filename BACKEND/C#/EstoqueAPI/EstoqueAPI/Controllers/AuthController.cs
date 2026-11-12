using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // O login precisa ser público: sem isso a política global (login obrigatório) bloqueia o próprio login
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        // Injeção de Dependência: O framework entrega a instância do serviço pronta para uso
        public AuthController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        /// <summary>
        /// Autentica um usuário e retorna um Token JWT.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            try
            {
                // Delegamos toda a complexidade para o Service
                var token = await _usuarioService.LoginAsync(dto);

                // O front-end lê o token e guarda no localStorage.
                return Ok(new { token });
            }
            catch (UnauthorizedAccessException ex)
            {
                // Senha ou e-mail errados: 401 Unauthorized.
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception)
            {
                // Qualquer outro erro inesperado (ex: banco fora do ar).
                // Não devolvemos ex.Message para não expor detalhes internos.
                return StatusCode(500, new { message = "Erro interno no servidor." });
            }
        }
    }
}