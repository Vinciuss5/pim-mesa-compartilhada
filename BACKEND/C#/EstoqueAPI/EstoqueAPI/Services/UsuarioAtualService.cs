using System.Security.Claims;

namespace EstoqueAPI.Services
{
    /// <summary>
    /// Quem é o usuário logado na requisição atual (lido do token JWT).
    /// Usado pelos Services que registram "quem fez" (movimentações, reagendamentos).
    /// </summary>
    public interface IUsuarioAtualService
    {
        /// <summary>Id do usuário logado, ou null se não houver usuário autenticado.</summary>
        int? Id { get; }
    }

    public class UsuarioAtualService : IUsuarioAtualService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UsuarioAtualService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? Id
        {
            get
            {
                var usuario = _httpContextAccessor.HttpContext?.User;

                var valor = usuario?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                            ?? usuario?.FindFirst("nameid")?.Value
                            ?? usuario?.FindFirst("sub")?.Value;

                return int.TryParse(valor, out var id) ? id : null;
            }
        }
    }
}