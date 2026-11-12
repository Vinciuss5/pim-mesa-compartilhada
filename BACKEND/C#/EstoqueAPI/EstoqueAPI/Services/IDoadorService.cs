using EstoqueAPI.DTOs;

namespace EstoqueAPI.Services
{
    public interface IDoadorService
    {
        Task<IEnumerable<DoadorResponseDTO>> ListarTodosAsync(string? filtro);
        Task<DoadorResponseDTO?> BuscarPorIdAsync(int id);
        Task<DoadorResponseDTO> CriarAsync(DoadorCreateDTO dto);
        Task<bool> AtualizarAsync(int id, DoadorUpdateDTO dto);
        Task<bool> ExcluirAsync(int id);
    }
}