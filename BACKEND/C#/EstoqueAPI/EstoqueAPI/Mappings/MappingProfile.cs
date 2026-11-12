using AutoMapper;
using EstoqueAPI.Models;
using EstoqueAPI.DTOs;

namespace EstoqueAPI.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // --- UNIDADE DE MEDIDA ---
            CreateMap<UnidadeMedida, UnidadeMedidaResponseDTO>();
            CreateMap<UnidadeMedidaCreateDTO, UnidadeMedida>();

            // --- PRODUTO ---
            // A unidade vem de Produto.UnidadeMedida: os Services precisam carregá-la (Include).
            CreateMap<Produto, ProdutoResponseDTO>()
                .ConstructUsing(src => new ProdutoResponseDTO(
                    src.Id,
                    src.Nome,
                    src.PesoKg,
                    src.UnidadeMedidaId,
                    src.UnidadeMedida != null ? src.UnidadeMedida.Sigla : "",
                    src.UnidadeMedida != null ? src.UnidadeMedida.Nome : "",
                    src.UnidadeMedida != null ? src.UnidadeMedida.Tipo : "",
                    src.Categoria,
                    src.ControlaValidade,
                    src.EstoqueMinimo,
                    src.DiasAlertaValidade
                ));
            CreateMap<ProdutoCreateDTO, Produto>();
            CreateMap<ProdutoUpdateDTO, Produto>();

            // --- DOADOR ---
            CreateMap<Doador, DoadorResponseDTO>();
            CreateMap<DoadorCreateDTO, Doador>();
            CreateMap<DoadorUpdateDTO, Doador>();

            // --- SOLICITANTE ---
            CreateMap<Solicitante, SolicitanteResponseDTO>();
            CreateMap<SolicitanteCreateDTO, Solicitante>();
            CreateMap<SolicitanteUpdateDTO, Solicitante>();

            // --- USUÁRIO ---
            CreateMap<Usuario, UsuarioResponseDTO>();
            CreateMap<UsuarioUpdateDTO, Usuario>();
            CreateMap<UsuarioCreateDTO, Usuario>()
                .ForMember(dest => dest.SenhaHash, opt => opt.Ignore())
                .ForMember(dest => dest.DataAdmissao, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Ativo, opt => opt.MapFrom(src => true));

            // --- ESTOQUE (O CORAÇÃO DA TELA) ---
            CreateMap<Estoque, EstoqueResponseDTO>()
                .ConstructUsing(src => new EstoqueResponseDTO(
                    src.Id,
                    src.ProdutoId,
                    src.Produto != null ? src.Produto.Nome : "Produto não encontrado",
                    src.Quantidade,
                    DeterminarStatusLote(
                        src.Quantidade,
                        src.DataValidade,
                        src.Produto != null ? src.Produto.DiasAlertaValidade : RegrasValidade.DiasAlertaPadrao),
                    src.Produto != null ? (src.Produto.PesoKg ?? 0m) : 0m,
                    src.Origem ?? "Não informada",
                    src.DataValidade,
                    src.LoteCodigo ?? "N/A",
                    src.DataEntrada,
                    (src.Produto != null && src.Produto.UnidadeMedida != null) ? src.Produto.UnidadeMedida.Sigla : "un"
                ));

            CreateMap<Estoque, EstoqueSimplesDTO>()
                .ConstructUsing(src => new EstoqueSimplesDTO(
                    src.ProdutoId,
                    src.Quantidade
                ));

            // --- DOAÇÃO ITEM ---
            CreateMap<DoacaoItemCreateDTO, DoacaoItem>();
            CreateMap<DoacaoItem, DoacaoItemResponseDTO>()
                .ConstructUsing(src => new DoacaoItemResponseDTO(
                    src.Id,
                    src.ProdutoId,
                    src.Produto != null ? src.Produto.Nome : "Desconhecido",
                    src.Quantidade,
                    src.DataValidade,
                    (src.Produto != null && src.Produto.UnidadeMedida != null) ? src.Produto.UnidadeMedida.Sigla : "un"
                ));

            // --- DOAÇÃO (CABECALHO) ---
            CreateMap<Doacao, DoacaoResponseDTO>()
                .ConstructUsing((src, context) => new DoacaoResponseDTO(
                    src.Id,
                    src.DoadorId,
                    src.Doador != null ? src.Doador.Nome : "Doador não informado",
                    src.Data,
                    context.Mapper.Map<List<DoacaoItemResponseDTO>>(src.Itens)
                ));

            // --- SOLICITAÇÃO ITEM ---
            CreateMap<SolicitacaoItemCreateDTO, SolicitacaoItem>();
            CreateMap<SolicitacaoItem, SolicitacaoItemResponseDTO>()
                .ConstructUsing(src => new SolicitacaoItemResponseDTO(
                    src.Id,
                    src.ProdutoId,
                    src.Produto != null ? src.Produto.Nome : "Produto não encontrado",
                    src.Quantidade,
                    (src.Produto != null && src.Produto.UnidadeMedida != null) ? src.Produto.UnidadeMedida.Sigla : "un"
                ));

            // --- REAGENDAMENTO ---
            CreateMap<SolicitacaoReagendamento, ReagendamentoResponseDTO>()
                .ConstructUsing(src => new ReagendamentoResponseDTO(
                    src.Id,
                    src.DataAnterior,
                    src.DataNova,
                    src.Motivo,
                    src.Observacao,
                    src.Usuario != null ? src.Usuario.Nome : null,
                    src.DataHora
                ));

            // --- SOLICITAÇÃO (CABECALHO) ---
            CreateMap<Solicitacao, SolicitacaoResponseDTO>()
                .ConstructUsing((src, context) => new SolicitacaoResponseDTO(
                    src.Id,
                    src.SolicitanteId,
                    src.Solicitante != null ? src.Solicitante.Nome : "Solicitante não informado",
                    src.DataSolicitacao,
                    src.Status.ToString(),
                    src.Observacao,
                    src.DataPrevisaoEntrega,
                    src.DataEntrega,
                    context.Mapper.Map<List<SolicitacaoItemResponseDTO>>(src.Itens),
                    context.Mapper.Map<List<ReagendamentoResponseDTO>>(
                        src.Reagendamentos.OrderBy(r => r.DataHora).ThenBy(r => r.Id).ToList())
                ));

            // Mapeamentos de entrada (Create)
            CreateMap<DoacaoCreateDTO, Doacao>();
            CreateMap<SolicitacaoCreateDTO, Solicitacao>();
        }

        // Status de UM LOTE, pela validade. (O "baixo estoque" é por produto, comparado ao estoque
        // mínimo cadastrado, e vem do resumo: EstoqueService.ObterResumoAsync.)
        private static string DeterminarStatusLote(decimal quantidade, DateTime? validade, int diasAlertaDoProduto)
        {
            if (quantidade <= 0) return "Esgotado";

            if (validade.HasValue)
            {
                var dias = (validade.Value.Date - DateTime.Today).Days;

                if (dias < 0) return "Vencido";

                // Urgente ou em atenção: ambos aparecem como "Vence em breve" na lista de lotes
                if (RegrasValidade.ClassificarAlerta(dias, diasAlertaDoProduto) != null) return "Vence em breve";
            }

            return "Disponível";
        }
    }
}