using Microsoft.EntityFrameworkCore;
using EstoqueAPI.Models;

namespace EstoqueAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Doador> Doadores { get; set; }
        public DbSet<UnidadeMedida> UnidadesMedida { get; set; }
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Estoque> Estoque { get; set; }
        public DbSet<Doacao> Doacoes { get; set; }
        public DbSet<DoacaoItem> DoacaoItens { get; set; }
        public DbSet<Solicitante> Solicitantes { get; set; }
        public DbSet<Solicitacao> Solicitacoes { get; set; }
        public DbSet<SolicitacaoItem> SolicitacaoItens { get; set; }
        public DbSet<Movimentacao> Movimentacoes { get; set; }
        public DbSet<SolicitacaoReagendamento> SolicitacaoReagendamentos { get; set; }
        public DbSet<Logs> Logs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- USUÁRIO ---
            modelBuilder.Entity<Usuario>(entity => {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.CPF).IsUnique();
                entity.Property(u => u.CPF).HasColumnType("CHAR(11)");
                entity.Property(u => u.Tipo).HasMaxLength(15);
            });

            // --- SOLICITANTE ---
            modelBuilder.Entity<Solicitante>(entity => {
                entity.HasIndex(s => s.CPF).IsUnique();
                entity.Property(s => s.CPF).HasColumnType("CHAR(11)");
            });

            // --- SOLICITAÇÃO ---
            modelBuilder.Entity<Solicitacao>(entity => {
                entity.Property(s => s.Status).HasDefaultValue("PENDENTE").HasMaxLength(20);

                entity.HasOne(s => s.Solicitante)
                      .WithMany(sl => sl.Solicitacoes)
                      .HasForeignKey(s => s.SolicitanteId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // --- DOAÇÃO ---
            modelBuilder.Entity<Doacao>(entity => {
                entity.HasOne(d => d.Doador)
                      .WithMany(dr => dr.Doacoes)
                      .HasForeignKey(d => d.DoadorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // --- UNIDADE DE MEDIDA ---
            modelBuilder.Entity<UnidadeMedida>(entity => {
                entity.HasIndex(u => u.Sigla).IsUnique();
                entity.HasIndex(u => u.Nome).IsUnique();
            });

            // --- PRODUTO E ESTOQUE ---
            modelBuilder.Entity<Produto>(entity => {
                entity.Property(p => p.PesoKg).HasPrecision(18, 2);
                entity.Property(p => p.EstoqueMinimo).HasPrecision(18, 2);
                entity.Property(p => p.DiasAlertaValidade).HasDefaultValue(RegrasValidade.DiasAlertaPadrao);

                // Restrict: não é possível apagar uma unidade que ainda tem produtos
                entity.HasOne(p => p.UnidadeMedida)
                      .WithMany()
                      .HasForeignKey(p => p.UnidadeMedidaId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Estoque>(entity => {
                entity.Property(e => e.Quantidade).HasPrecision(18, 2);

                entity.HasOne(e => e.Produto)
                      .WithMany(p => p.Estoques)
                      .HasForeignKey(e => e.ProdutoId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // --- RELACIONAMENTOS COMPOSIÇÃO (Cascade) ---
            modelBuilder.Entity<DoacaoItem>(entity => {
                entity.Property(di => di.Quantidade).HasPrecision(18, 2);
                entity.HasOne(di => di.Doacao).WithMany(d => d.Itens)
                      .HasForeignKey(di => di.DoacaoId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SolicitacaoItem>(entity => {
                entity.Property(si => si.Quantidade).HasPrecision(18, 2);
                entity.HasOne(si => si.Solicitacao).WithMany(s => s.Itens)
                      .HasForeignKey(si => si.SolicitacaoId).OnDelete(DeleteBehavior.Cascade);
            });

            // --- MOVIMENTAÇÕES (livro de estoque) ---
            // Tudo Restrict: o histórico nunca some junto com produto, lote, doação, solicitação ou usuário.
            modelBuilder.Entity<Movimentacao>(entity => {
                entity.Property(m => m.Quantidade).HasPrecision(18, 2);

                entity.HasIndex(m => m.DataHora);
                entity.HasIndex(m => new { m.ProdutoId, m.DataHora });
                entity.HasIndex(m => m.SolicitacaoId);

                entity.HasOne(m => m.Produto).WithMany()
                      .HasForeignKey(m => m.ProdutoId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(m => m.Estoque).WithMany()
                      .HasForeignKey(m => m.EstoqueId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(m => m.Doacao).WithMany()
                      .HasForeignKey(m => m.DoacaoId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(m => m.Solicitacao).WithMany()
                      .HasForeignKey(m => m.SolicitacaoId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(m => m.Usuario).WithMany()
                      .HasForeignKey(m => m.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            });

            // --- REAGENDAMENTOS DE ENTREGA ---
            // Restrict: o histórico nunca some junto com a solicitação ou o usuário.
            modelBuilder.Entity<SolicitacaoReagendamento>(entity => {
                entity.HasIndex(r => r.SolicitacaoId);

                entity.HasOne(r => r.Solicitacao).WithMany(s => s.Reagendamentos)
                      .HasForeignKey(r => r.SolicitacaoId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(r => r.Usuario).WithMany()
                      .HasForeignKey(r => r.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            });

            // --- LOGS ---
            modelBuilder.Entity<Logs>(entity => {

                entity.HasOne(l => l.Usuario)
                      .WithMany(u => u.Logs)
                      .HasForeignKey(l => l.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // --- SEEDING (Versão Blindada) ---
            modelBuilder.Entity<Usuario>().HasData(new Usuario
            {
                Id = 1,
                Nome = "Administrador Sistema",
                Email = "admin@mesa.com",
                CPF = "12345678910",
                SenhaHash = "$2a$12$Dx/Vcypz.HnIbCYjoauFqO1yRj2LMrB4BaUzn4o9trclbcM.wIl/K",
                Tipo = "ADMIN",
                Ativo = true,
                // Data fixa. Nunca use DateTime.Now aqui.
                DataAdmissao = new DateTime(2026, 04, 01, 0, 0, 0, DateTimeKind.Utc)
            });

            // Unidades de medida iniciais (IDs fixos). Novas unidades são criadas pelo sistema.
            modelBuilder.Entity<UnidadeMedida>().HasData(
                new UnidadeMedida { Id = 1, Nome = "Quilograma", Sigla = "kg", Tipo = "MASSA" },
                new UnidadeMedida { Id = 2, Nome = "Grama", Sigla = "g", Tipo = "MASSA" },
                new UnidadeMedida { Id = 3, Nome = "Litro", Sigla = "L", Tipo = "VOLUME" },
                new UnidadeMedida { Id = 4, Nome = "Mililitro", Sigla = "ml", Tipo = "VOLUME" },
                new UnidadeMedida { Id = 5, Nome = "Unidade", Sigla = "un", Tipo = "CONTAGEM" },
                new UnidadeMedida { Id = 6, Nome = "Pacote", Sigla = "pct", Tipo = "CONTAGEM" },
                new UnidadeMedida { Id = 7, Nome = "Caixa", Sigla = "cx", Tipo = "CONTAGEM" },
                new UnidadeMedida { Id = 8, Nome = "Fardo", Sigla = "fardo", Tipo = "CONTAGEM" },
                new UnidadeMedida { Id = 9, Nome = "Saco", Sigla = "saco", Tipo = "CONTAGEM" },
                new UnidadeMedida { Id = 10, Nome = "Lata", Sigla = "lata", Tipo = "CONTAGEM" },
                new UnidadeMedida { Id = 11, Nome = "Garrafa", Sigla = "garrafa", Tipo = "CONTAGEM" },
                new UnidadeMedida { Id = 12, Nome = "Dúzia", Sigla = "dz", Tipo = "CONTAGEM" }
            );
        }
    }
}