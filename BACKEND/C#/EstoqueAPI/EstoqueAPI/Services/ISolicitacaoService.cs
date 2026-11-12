using EstoqueAPI.DTOs;

namespace EstoqueAPI.Services
{
    public interface ISolicitacaoService
    {
        Task<IEnumerable<SolicitacaoResponseDTO>> ListarTodasAsync();

        // Novo método: Necessário para o CreatedAtAction do Controller
        Task<SolicitacaoResponseDTO?> BuscarPorIdAsync(int id);

        Task<SolicitacaoResponseDTO> CriarAsync(SolicitacaoCreateDTO dto);

        // Novo método: Para gerenciar o ciclo de vida (PENDENTE -> ENTREGUE)
        Task<bool> AtualizarStatusAsync(int id, string novoStatus);

        // Reagenda (ou define) a previsão de entrega de uma solicitação pendente
        Task<SolicitacaoResponseDTO?> ReagendarAsync(int id, SolicitacaoReagendarDTO dto);
    }
}