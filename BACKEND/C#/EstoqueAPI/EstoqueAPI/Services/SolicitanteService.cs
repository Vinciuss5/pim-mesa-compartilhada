using AutoMapper;
using AutoMapper.QueryableExtensions;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public class SolicitanteService : ISolicitanteService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public SolicitanteService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<SolicitanteResponseDTO>> ListarTodosAsync(string? search = null)
        {
            // 1. Iniciamos a Query como IQueryable (nenhum SQL disparado ainda)
            var query = _context.Solicitantes.AsNoTracking();

            // 2. Filtro de busca aplicado antes da execução
            if (!string.IsNullOrWhiteSpace(search))
            {
                // O EF Core traduzirá isso para um LIKE no SQL, prevenindo SQL Injection automaticamente
                query = query.Where(s => s.Nome.Contains(search) || s.CPF.Contains(search));
            }

            // 3. Ordenação
            query = query.OrderByDescending(s => s.DataCadastro);

            // 4. A Mágica do AutoMapper (ProjectTo)
            // Em vez de retornar a Entidade para depois mapear, o ProjectTo diz ao EF:
            // "Gere um SELECT apenas com os campos necessários para preencher o SolicitanteResponseDTO"
            return await query
                .ProjectTo<SolicitanteResponseDTO>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public async Task<SolicitanteResponseDTO?> BuscarPorIdAsync(int id)
        {
            // FindAsync é eficiente para buscas por Chave Primária
            var solicitante = await _context.Solicitantes.FindAsync(id);
            return _mapper.Map<SolicitanteResponseDTO>(solicitante);
        }

        public async Task<SolicitanteResponseDTO> CriarAsync(SolicitanteCreateDTO dto)
        {
            // RN: Validação de CPF duplicado (Substituindo o antigo 'Documento')
            // O CPF agora é obrigatório conforme nossa nova Model
            var existe = await _context.Solicitantes
                .AnyAsync(s => s.CPF == dto.CPF);

            if (existe)
                throw new InvalidOperationException("Já existe um solicitante cadastrado com este CPF.");

            // Mapeamento DTO -> Entity
            var solicitante = _mapper.Map<Solicitante>(dto);

            // Garantimos que a data de cadastro seja capturada no momento da persistência
            solicitante.DataCadastro = DateTime.Now;

            _context.Solicitantes.Add(solicitante);
            await _context.SaveChangesAsync();

            return _mapper.Map<SolicitanteResponseDTO>(solicitante);
        }

        public async Task<bool> AtualizarAsync(int id, SolicitanteUpdateDTO dto)
        {
            var existente = await _context.Solicitantes.FindAsync(id);
            if (existente == null) return false;

            // Validação de CPF para evitar duplicidade em atualizações
            if (existente.CPF != dto.CPF)
            {
                var cpfEmUso = await _context.Solicitantes.AnyAsync(s => s.CPF == dto.CPF && s.Id != id);
                if (cpfEmUso)
                    throw new InvalidOperationException("Este CPF já está sendo utilizado por outro solicitante.");
            }

            // Atualiza as propriedades do objeto existente com os dados do DTO
            _mapper.Map(dto, existente);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExcluirAsync(int id)
        {
            var solicitante = await _context.Solicitantes.FindAsync(id);
            if (solicitante == null) return false;

            // Nota do Tech Lead: Se houver solicitações vinculadas, o banco lançará uma 
            // exceção de DbUpdateException devido à integridade referencial
            try
            {
                _context.Solicitantes.Remove(solicitante);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException)
            {
                throw new InvalidOperationException("Não é possível excluir um solicitante que possui pedidos registrados.");
            }
        }
    }
}