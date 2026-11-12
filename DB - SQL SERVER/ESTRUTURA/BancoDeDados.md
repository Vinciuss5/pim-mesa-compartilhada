TABLE Usuarios (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   Nome NVARCHAR(80) NOT NULL,

&#x20;   Email NVARCHAR(120) UNIQUE NOT NULL,

&#x20;   CPF CHAR(11) NOT NULL,

&#x20;   Telefone NVARCHAR(20) NULL,

&#x20;   DataAdmissão DATETIME2(7) NOT NULL,

&#x20;   SenhaHash NVARCHAR(255) NOT NULL,

&#x20;   Tipo NVARCHAR(10) NOT NULL CHECK (Tipo IN ('ADMIN', 'FUNCIONARIO')),

&#x20;   Ativo BIT DEFAULT 1

);



TABLE Doadores (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   Nome NVARCHAR(80) NOT NULL,

&#x20;   Email NVARCHAR(120),

&#x20;   Telefone NVARCHAR(20),

&#x20;   CPF CHAR(11),

&#x20;   Endereco NVARCHAR(150)

);



TABLE Produtos (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   Nome NVARCHAR(80) NOT NULL,

&#x20;   PesoKg DECIMAL(6,2)

);



TABLE Estoque (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   ProdutoId INT NOT NULL,

&#x20;   Quantidade INT NOT NULL CHECK (Quantidade >= 0),

&#x20;   DataEntrada DATE NOT NULL,

&#x20;   DataValidade DATE,

&#x20;   Origem NVARCHAR(100),



&#x20;   FOREIGN KEY (ProdutoId) REFERENCES Produtos(Id)

);



TABLE Doacoes (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   DoadorId INT NOT NULL,

&#x20;   Data DATE NOT NULL,



&#x20;   FOREIGN KEY (DoadorId) REFERENCES Doadores(Id)

);



TABLE DoacaoItens (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   DoacaoId INT NOT NULL,

&#x20;   ProdutoId INT NOT NULL,

&#x20;   Quantidade INT NOT NULL CHECK (Quantidade > 0),

&#x20;   DataValidade DATE,



&#x20;   FOREIGN KEY (DoacaoId) REFERENCES Doacoes(Id),

&#x20;   FOREIGN KEY (ProdutoId) REFERENCES Produtos(Id)

);



TABLE Solicitantes (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   Nome NVARCHAR(80) NOT NULL,

&#x20;   Documento NVARCHAR(20),

&#x20;   Telefone NVARCHAR(20)

);



TABLE Solicitacoes (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   SolicitanteId INT NOT NULL,

&#x20;   Data DATE NOT NULL,



&#x20;   FOREIGN KEY (SolicitanteId) REFERENCES Solicitantes(Id)

);



TABLE SolicitacaoItens (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   SolicitacaoId INT NOT NULL,

&#x20;   ProdutoId INT NOT NULL,

&#x20;   Quantidade INT NOT NULL CHECK (Quantidade > 0),



&#x20;   FOREIGN KEY (SolicitacaoId) REFERENCES Solicitacoes(Id),

&#x20;   FOREIGN KEY (ProdutoId) REFERENCES Produtos(Id)

);



TABLE Logs (

&#x20;   Id INT PRIMARY KEY IDENTITY,

&#x20;   UsuarioId INT,

&#x20;   Acao NVARCHAR(150),

&#x20;   DataHora DATETIME DEFAULT GETDATE(),



&#x20;   FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)

);

