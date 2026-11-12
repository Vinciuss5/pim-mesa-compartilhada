using EstoqueAPI.DTOs;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize(Roles = "ADMIN,FUNCIONARIO")]
    public class SolicitacaoController : ControllerBase
    {
        private readonly ISolicitacaoService _solicitacaoService;
        private readonly ILogger<SolicitacaoController> _logger; // Adicionado para auditoria

        public SolicitacaoController(ISolicitacaoService solicitacaoService, ILogger<SolicitacaoController> logger)
        {
            _solicitacaoService = solicitacaoService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SolicitacaoResponseDTO>>> Get()
        {
            var solicitacoes = await _solicitacaoService.ListarTodasAsync();
            return Ok(solicitacoes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SolicitacaoResponseDTO>> GetById(int id)
        {
            var solicitacao = await _solicitacaoService.BuscarPorIdAsync(id);

            if (solicitacao == null)
            {
                return NotFound(new { message = $"Solicitação com ID {id} não encontrada." });
            }

            return Ok(solicitacao);
        }

        [HttpPost]
        public async Task<ActionResult<SolicitacaoResponseDTO>> Post([FromBody] SolicitacaoCreateDTO dto)
        {
            // O ASP.NET Core já valida o [Required] e [Range] do DTO automaticamente.
            // Se o JSON for inválido, ele retorna 400 antes de chegar aqui.

            try
            {
                var resultado = await _solicitacaoService.CriarAsync(dto);

                // Retorno 201 Created: Indica sucesso e onde encontrar o novo recurso
                return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
            }
            catch (InvalidOperationException ex)
            {
                // Erros de Regra de Negócio: Saldo insuficiente, produto inativo, etc.
                _logger.LogWarning(ex, "Falha na regra de negócio ao criar solicitação.");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // Erros Críticos: Banco fora do ar, erro de rede, etc.
                // Aqui resolvemos o Warning CS0168 usando a variável 'ex' no log.
                _logger.LogError(ex, "Erro interno crítico ao processar saída de estoque.");

                return StatusCode(500, new
                {
                    message = "Ocorreu um erro interno no servidor ao processar sua solicitação. Tente novamente mais tarde."
                });
            }
        }

        [HttpPatch("{id}/status")]
        //[Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] SolicitacaoStatusUpdateDTO dto)
        {
            try
            {
                var sucesso = await _solicitacaoService.AtualizarStatusAsync(id, dto.NovoStatus);

                if (!sucesso)
                    return NotFound(new { message = "Solicitação não encontrada para atualização." });

                return NoContent(); // 204: Sucesso, mas sem corpo de resposta
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Tentativa inválida de mudança de status para ID {Id}", id);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar status da solicitação {Id}", id);
                return StatusCode(500, new { message = "Erro ao atualizar status." });
            }
        }

        /// <summary>
        /// Reagenda (ou define) a previsão de entrega de uma solicitação pendente.
        /// Cada troca fica registrada no histórico (data anterior, nova data, motivo e usuário).
        /// </summary>
        [HttpPatch("{id}/previsao")]
        public async Task<ActionResult<SolicitacaoResponseDTO>> Reagendar(int id, [FromBody] SolicitacaoReagendarDTO dto)
        {
            try
            {
                var resultado = await _solicitacaoService.ReagendarAsync(id, dto);

                if (resultado == null)
                    return NotFound(new { message = $"Solicitação com ID {id} não encontrada." });

                return Ok(resultado);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Falha na regra de negócio ao reagendar a solicitação {Id}.", id);
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}