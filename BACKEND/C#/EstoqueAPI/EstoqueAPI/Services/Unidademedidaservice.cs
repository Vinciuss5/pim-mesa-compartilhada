using AutoMapper;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueAPI.Services
{
    public interface IUnidadeMedidaService
    {
        Task<IEnumerable<UnidadeMedidaResponseDTO>> ListarTodasAsync();
        Task<UnidadeMedidaResponseDTO> CriarAsync(UnidadeMedidaCreateDTO dto);
    }

    public class UnidadeMedidaService : IUnidadeMedidaService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public UnidadeMedidaService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<UnidadeMedidaResponseDTO>> ListarTodasAsync()
        {
            var unidades = await _context.UnidadesMedida
                .AsNoTracking()
                .OrderBy(u => u.Tipo)
                .ThenBy(u => u.Nome)
                .ToListAsync();

            return _mapper.Map<IEnumerable<UnidadeMedidaResponseDTO>>(unidades);
        }

        public async Task<UnidadeMedidaResponseDTO> CriarAsync(UnidadeMedidaCreateDTO dto)
        {
            var nome = dto.Nome.Trim();
            var sigla = dto.Sigla.Trim();

            if (nome.Length == 0 || sigla.Length == 0)
                throw new InvalidOperationException("Nome e sigla são obrigatórios.");

            // Comparação sem diferenciar maiúsculas/minúsculas, para não haver "KG" e "kg"
            var siglaMin = sigla.ToLower();
            var nomeMin = nome.ToLower();

            if (await _context.UnidadesMedida.AnyAsync(u => u.Sigla.ToLower() == siglaMin))
                throw new InvalidOperationException($"Já existe uma unidade com a sigla '{sigla}'.");

            if (await _context.UnidadesMedida.AnyAsync(u => u.Nome.ToLower() == nomeMin))
                throw new InvalidOperationException($"Já existe uma unidade chamada '{nome}'.");

            var unidade = new UnidadeMedida
            {
                Nome = nome,
                Sigla = sigla,
                Tipo = dto.Tipo
            };

            _context.UnidadesMedida.Add(unidade);
            await _context.SaveChangesAsync();

            return _mapper.Map<UnidadeMedidaResponseDTO>(unidade);
        }
    }
}