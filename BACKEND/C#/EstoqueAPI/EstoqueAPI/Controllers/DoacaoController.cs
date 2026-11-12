using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize(Roles = "ADMIN,FUNCIONARIO")]
    public class DoacaoController : ControllerBase
    {
        private readonly IDoacaoService _service;
        private readonly ILogger<DoacaoController> _logger;

        public DoacaoController(IDoacaoService service, ILogger<DoacaoController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DoacaoResponseDTO>>> Get()
        {
            // O uso de AsNoTracking() no Service (que já configuramos) garante 
            // que esta listagem seja rápida e leve para a memória.
            var doacoes = await _service.ListarTodasAsync();
            return Ok(doacoes);
        }

        [HttpPost]
        public async Task<ActionResult<DoacaoResponseDTO>> Post([FromBody] DoacaoCreateDTO dto)
        {
            // Validação de segurança: Proteção contra payloads vazios que passam pelo bind
            if (dto == null) return BadRequest(new { message = "Corpo da requisição inválido." });

            try
            {
                // A mágica acontece no Service (Transação + Estoque + Log)
                var resultado = await _service.CriarAsync(dto);

                // Tech Lead Tip: Retornamos Ok() se não houver um endpoint específico de busca por ID
                // ou Created() se quisermos seguir o protocolo REST à risca.
                return Ok(resultado);
            }
            catch (InvalidOperationException ex)
            {
                // Aqui capturamos o erro do Service quando o Rollback acontece.
                // O log aqui serve para o desenvolvedor saber o que o cliente tentou fazer.
                _logger.LogWarning("Tentativa de doação inválida: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // Erros inesperados (Banco offline, queda de conexão, etc)
                _logger.LogError(ex, "Erro catastrófico no processamento da doação.");

                return StatusCode(500, new
                {
                    message = "Serviço temporariamente indisponível. O incidente foi registrado para análise."
                });
            }
        }
    }
}