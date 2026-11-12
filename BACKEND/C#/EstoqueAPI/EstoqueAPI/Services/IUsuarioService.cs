using EstoqueAPI.DTOs;

namespace EstoqueAPI.Services
{
    public interface IUsuarioService
    {
        Task<IEnumerable<UsuarioResponseDTO>> ListarTodosAsync();
        Task<UsuarioResponseDTO?> BuscarPorIdAsync(int id);
        Task<UsuarioResponseDTO> CriarAsync(UsuarioCreateDTO dto);
        Task<bool> AtualizarAsync(int id, UsuarioUpdateDTO dto);
        Task<bool> InativarAsync(int id); // Soft Delete: Nunca deletamos usuários físicos para manter histórico
        Task<string> LoginAsync(LoginDTO dto); // Retorna o Token JWT
    }
}