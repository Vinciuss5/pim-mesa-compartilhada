using EstoqueAPI.DTOs;

namespace EstoqueAPI.Services
{
    public interface ISolicitanteService
    {
        Task<IEnumerable<SolicitanteResponseDTO>> ListarTodosAsync(string? search = null);
        Task<SolicitanteResponseDTO?> BuscarPorIdAsync(int id);
        Task<SolicitanteResponseDTO> CriarAsync(SolicitanteCreateDTO dto);
        Task<bool> AtualizarAsync(int id, SolicitanteUpdateDTO dto);
        Task<bool> ExcluirAsync(int id);
    }
}