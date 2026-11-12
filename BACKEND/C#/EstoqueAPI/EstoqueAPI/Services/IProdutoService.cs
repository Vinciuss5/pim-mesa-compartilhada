using EstoqueAPI.DTOs;

public interface IProdutoService
{
    Task<IEnumerable<ProdutoResponseDTO>> ListarTodosAsync();
    Task<ProdutoResponseDTO?> BuscarPorIdAsync(int id);
    Task<ProdutoResponseDTO> CriarAsync(ProdutoCreateDTO dto);
    Task<bool> AtualizarAsync(int id, ProdutoUpdateDTO dto);
    Task<bool> ExcluirAsync(int id);
}