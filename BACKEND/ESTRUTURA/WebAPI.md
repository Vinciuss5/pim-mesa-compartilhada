EstoqueAPI/

│

├── Controllers/

│   ├── ProdutoController.cs

│   ├── DoacaoController.cs

│   ├── SolicitacaoController.cs

│   └── EstoqueController.cs

│

├── Models/

│   ├── Produto.cs

│   ├── Logs.cs

│   ├── Doacao.cs

│   ├── DoacaoItem.cs

│   ├── Solicitacao.cs

│   ├── SolicitacaoItem.cs

│   ├── Estoque.cs

│   ├── Doador.cs

│   ├── Solicitante.cs

│   └── Usuario.cs

│

├── Data/

│   └── AppDbContext.cs

│

├── DTOs/

│   ├── DoacaoDTO.cs

│   ├── ProdutoDTO.cs

│   ├── DoacaoItemDTO.cs

│   ├── SolicitacaoDTO.cs

│   └── SolicitacaoItemDTO.cs

│

├── Mappings/

│   └── MappingProfile.cs

│

├── Services/

│   ├── DoacaoService.cs

│   └── SolicitacaoService.cs

│

├── Program.cs

├── appsettings.json

└── EstoqueAPI.csproj





**Separação de responsabilidades:**



Models → representam o banco

Controllers → recebem requisições

Data → conexão com banco

(futuro) Services → regras de negócio





**---- RELACIONAMENTO ----**





Controller → recebe DTO → chama Service (opcional) → transforma em Model → DbContext salva no banco → retorna resposta





**---- CONTROLLER ----**





**O que faz:** Recebe a requisição HTTP (POST, PUT, GET) vinda do frontend/cliente



**Detalhe:** Ele não deve processar regras de negócio. Sua função é apenas receber os dados,

verificar se estão no formato correto (validação básica) e chamar a camada de serviço.



**---- DTO (Data Transfer Object) ----**





**O que é:** Um "Objeto de Transferência de Dados". É uma classe simples,

geralmente sem comportamentos (lógica), usada apenas para carregar dados entre o cliente e o servidor



**Por que usar:** Evita expor a estrutura real do banco de dados (Entidade/Model) para fora.

Se o seu banco tem campos sensíveis (como senhaHash, dataCriacao),

o DTO permite enviar apenas o necessário (ex: nome, email)





**---- Service (A "regra de negócio") ----**





**O que faz:** O Controller chama o Service. Aqui é onde a mágica acontece: cálculos,

regras de validação complexas, verificação de existência de dados, envio de e-mails, etc.



**Por que é opcional?** Em sistemas muito simples (CRUD básico),

o Controller pode converter o DTO e chamar o banco diretamente.

Porém, o uso de Service é recomendado para organização e reusabilidade.





**---- Transforma em Model (Entity) ----**





**O que faz:** O DTO (que veio do usuário) é

mapeado para um "Model" ou "Entidade" (a classe que representa a tabela no banco de dados).



**Detalhe:** Essa transformação pode ocorrer no Controller ou dentro do Service.

É necessário transformar porque o DbContext só salva objetos do tipo "Entity", não DTOs.





**---- DbContext salva no banco ----**





**O que faz:** O DbContext (específico do Entity Framework em .NET)

gerencia a conexão com o banco de dados.





**Ação:** Ele rastreia a mudança da entidade (Model) e, ao chamar SaveChanges(),

o EF gera o SQL necessário (INSERT ou UPDATE) e persiste os dados fisicamente.





**---- Retorna Resposta ----**





**O que faz:** Após salvar, o sistema geralmente retorna o objeto salvo (ou apenas um status 201 Created) para o usuário.



**Detalhe:** É boa prática transformar a Entity de volta em um "Response DTO"

para não enviar detalhes estruturais do banco de volta ao cliente.

