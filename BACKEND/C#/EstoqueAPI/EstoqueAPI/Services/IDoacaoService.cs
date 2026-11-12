using EstoqueAPI.DTOs;

namespace EstoqueAPI.Services
{
    public interface IDoacaoService
    {
        Task<IEnumerable<DoacaoResponseDTO>> ListarTodasAsync();
        Task<DoacaoResponseDTO> CriarAsync(DoacaoCreateDTO dto);
    }
}