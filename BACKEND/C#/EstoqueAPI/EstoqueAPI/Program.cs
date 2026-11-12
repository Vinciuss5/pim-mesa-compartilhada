using EstoqueAPI.Data;
using EstoqueAPI.Mappings;
using EstoqueAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,  // força ler o appsettings.json do mesmo lugar do .exe
    WebRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot")
});

builder.WebHost.UseUrls("http://localhost:5235");

// --- 1. CONFIGURAÇÃO DE BANCO E MAPPINGS ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddAutoMapper(cfg => { }, typeof(MappingProfile));

// --- CORS: permite tanto o Vite (dev) quanto o próprio servidor (produção) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",  // Vite em desenvolvimento
                "http://localhost:5235"   // API servindo o React em produção
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --- 2. REGISTRO DE SERVIÇOS (DI) ---
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<IDoadorService, DoadorService>();
builder.Services.AddScoped<ISolicitanteService, SolicitanteService>();
builder.Services.AddScoped<IDoacaoService, DoacaoService>();
builder.Services.AddScoped<ISolicitacaoService, SolicitacaoService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IEstoqueService, EstoqueService>();
builder.Services.AddScoped<IUnidadeMedidaService, UnidadeMedidaService>();
builder.Services.AddScoped<IMovimentacaoService, MovimentacaoService>();
builder.Services.AddScoped<IUsuarioAtualService, UsuarioAtualService>();
builder.Services.AddScoped<IRelatorioService, RelatorioService>();

// --- 3. CONFIGURAÇÃO DE AUTENTICAÇÃO JWT ---
// Sem chave padrão no código: a chave vem SOMENTE do appsettings.json (Jwt:Key).
// Use uma chave aleatória, só com caracteres ASCII, com 32+ caracteres.
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "Configure 'Jwt:Key' no appsettings.json com pelo menos 32 caracteres.");
}
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true
    };
});

// LOGIN OBRIGATÓRIO PARA TODA A API (política padrão).
// Qualquer endpoint sem atributo de autorização exige usuário autenticado, inclusive
// controllers criados no futuro. A única exceção é o login, marcado com [AllowAnonymous].
// Para desligar temporariamente em desenvolvimento, comente este bloco inteiro.
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// --- 4. CONFIGURAÇÃO MINIMALISTA ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Aplica migrations pendentes automaticamente (cria o banco se não existir)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}


// --- 5. PIPELINE DE MIDDLEWARE ---

app.UseCors("AllowFrontendApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Arquivos do React: não exigem autenticação JWT
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// Endpoints da API
app.MapControllers();

// Fallback do React Router.
// Deve ser mapeado como endpoint, com acesso anônimo.
app.MapFallbackToFile("index.html")
   .AllowAnonymous();

app.Run();