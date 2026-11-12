using AutoMapper;
using EstoqueAPI.Data;
using EstoqueAPI.DTOs;
using EstoqueAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EstoqueAPI.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;

        // Injetamos IConfiguration para ler a chave secreta do JWT do appsettings.json
        public UsuarioService(AppDbContext context, IMapper mapper, IConfiguration config)
        {
            _context = context;
            _mapper = mapper;
            _config = config;
        }

        public async Task<IEnumerable<UsuarioResponseDTO>> ListarTodosAsync()
        {
            // AsNoTracking para performance, já que é apenas leitura
            var usuarios = await _context.Usuarios.AsNoTracking().ToListAsync();
            return _mapper.Map<IEnumerable<UsuarioResponseDTO>>(usuarios);
        }

        public async Task<UsuarioResponseDTO?> BuscarPorIdAsync(int id)
        {
            var usuario = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            return usuario == null ? null : _mapper.Map<UsuarioResponseDTO>(usuario);
        }

        public async Task<UsuarioResponseDTO> CriarAsync(UsuarioCreateDTO dto)
        {
            var email = dto.Email.Trim();
            var cpf = Cpf.Normalizar(dto.CPF);

            // Regras de negócio: e-mail e CPF devem ser únicos
            await GarantirEmailDisponivelAsync(email, null);
            await GarantirCpfDisponivelAsync(cpf, null);

            var usuario = _mapper.Map<Usuario>(dto);
            usuario.Email = email;
            usuario.CPF = cpf;

            // SEGURANÇA: BCrypt gera um "Salt" automático e hashea a senha.
            // NUNCA salvamos a senha em texto plano.
            usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
            usuario.Ativo = true;

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            // Retornamos o DTO de resposta que propositalmente NÃO contém a senha
            return _mapper.Map<UsuarioResponseDTO>(usuario);
        }

        public async Task<bool> AtualizarAsync(int id, UsuarioUpdateDTO dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return false;

            var email = dto.Email.Trim();

            // CPF e data de admissão são opcionais no PUT: vazio/ausente = manter o que já está cadastrado
            var cpfNovo = string.IsNullOrWhiteSpace(dto.CPF) ? usuario.CPF : Cpf.Normalizar(dto.CPF);
            var admissaoNova = dto.DataAdmissao?.Date ?? usuario.DataAdmissao;

            // E-mail e CPF corrigidos não podem ser os de OUTRO funcionário (o próprio usuário é ignorado)
            await GarantirEmailDisponivelAsync(email, id);
            await GarantirCpfDisponivelAsync(cpfNovo, id);

            // O sistema nunca pode ficar sem um administrador ativo (ninguém mais conseguiria gerenciar o acesso)
            var deixaDeSerAdminAtivo = usuario.Tipo == "ADMIN" && usuario.Ativo && (dto.Tipo != "ADMIN" || !dto.Ativo);
            if (deixaDeSerAdminAtivo && !await ExisteOutroAdminAtivoAsync(id))
                throw new InvalidOperationException(MensagemUltimoAdmin);

            _mapper.Map(dto, usuario);

            // Definidos à mão DEPOIS do mapeamento: o mapeador copiaria o vazio por cima do valor atual
            usuario.Email = email;
            usuario.CPF = cpfNovo;
            usuario.DataAdmissao = admissaoNova;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> InativarAsync(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return false;

            if (usuario.Ativo && usuario.Tipo == "ADMIN" && !await ExisteOutroAdminAtivoAsync(id))
                throw new InvalidOperationException(MensagemUltimoAdmin);

            // Soft Delete: Apenas mudamos o status.
            // Se deletarmos fisicamente, quebraremos a integridade referencial se ele fez alguma ação no sistema (Logs).
            usuario.Ativo = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string> LoginAsync(LoginDTO dto)
        {
            // Busca apenas usuários ativos
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email && u.Ativo);

            // SEGURANÇA: Prevenção contra enumeração de usuários.
            // Se o e-mail não existe OU a senha está errada, a mensagem é a MESMA.
            // O BCrypt.Verify pega a senha digitada, aplica o Salt salvo no banco e compara os Hashes.
            if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
                throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

            return GerarTokenJwt(usuario);
        }

        // ---------------------------------------------------------------
        // Regras auxiliares
        // ---------------------------------------------------------------

        private const string MensagemUltimoAdmin =
            "Este é o único administrador ativo do sistema. Cadastre ou ative outro administrador antes de alterar o perfil ou desativar este usuário.";

        private async Task GarantirEmailDisponivelAsync(string email, int? ignorarId)
        {
            var emailMin = email.ToLower();

            var emUso = await _context.Usuarios
                .AnyAsync(u => u.Email.ToLower() == emailMin && (ignorarId == null || u.Id != ignorarId));

            if (emUso)
                throw new InvalidOperationException("Este e-mail já está em uso por outro funcionário.");
        }

        private async Task GarantirCpfDisponivelAsync(string cpf, int? ignorarId)
        {
            var emUso = await _context.Usuarios
                .AnyAsync(u => u.CPF == cpf && (ignorarId == null || u.Id != ignorarId));

            if (emUso)
                throw new InvalidOperationException("Este CPF já está cadastrado em outro funcionário.");
        }

        private Task<bool> ExisteOutroAdminAtivoAsync(int idAtual)
        {
            return _context.Usuarios.AnyAsync(u => u.Id != idAtual && u.Tipo == "ADMIN" && u.Ativo);
        }

        // Método privado: A responsabilidade de gerar o token é interna deste serviço.
        private string GerarTokenJwt(Usuario usuario)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var chaveSecreta = _config["Jwt:Key"];

            if (string.IsNullOrEmpty(chaveSecreta))
                throw new Exception("Chave JWT não configurada no sistema.");

            var key = Encoding.ASCII.GetBytes(chaveSecreta);

            // Claims são as "afirmações" ou dados embutidos dentro do token
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                    new Claim(ClaimTypes.Name, usuario.Nome),
                    new Claim(ClaimTypes.Email, usuario.Email),
                    // Esta Claim é a chave para o Controle de Acesso (RBAC) nos Controllers
                    new Claim(ClaimTypes.Role, usuario.Tipo)
                }),
                Expires = DateTime.UtcNow.AddHours(8), // Token expira em 8 horas (jornada de trabalho)
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}