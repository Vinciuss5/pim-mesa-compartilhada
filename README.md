# Mesa Compartilhada

Sistema de gestão de doações e estoque para ONGs, desenvolvido como Projeto Integrador Multidisciplinar (PIM).

O projeto é dividido em três aplicações que conversam entre si:

| Pasta | Aplicação | Tecnologias |
|---|---|---|
| `BACKEND/C#/EstoqueAPI` | API REST (WebAPI) | .NET 10, ASP.NET Core, Entity Framework Core, SQLite, JWT, Swagger |
| `ANDROID` | Aplicativo mobile | Kotlin, Jetpack Compose, Retrofit, OkHttp, Material 3 |
| `FRONTEND/PROGRAMAÇÃO/sistema-ong-frontend` | Painel web | React 19, Vite, Tailwind CSS 4, Axios |

---

## Como executar

### 1. Atalho automático (Windows)

Na raiz do projeto existe o executável **`ABRIR-MESA-COMPARTILHADA.exe`**. Com um duplo clique ele:

1. sobe a WebAPI (`dotnet run`) se a porta 5235 estiver livre;
2. abre o Swagger no navegador;
3. liga o emulador Android, se necessário;
4. instala o APK (quando ainda não instalado) e abre o aplicativo.

Parâmetros opcionais:

```powershell
.\ABRIR-MESA-COMPARTILHADA.exe              # uso normal
.\ABRIR-MESA-COMPARTILHADA.exe -reinstalar  # reinstala o APK antes de abrir
.\ABRIR-MESA-COMPARTILHADA.exe -parar       # encerra API e emulador
.\ABRIR-MESA-COMPARTILHADA.exe -ajuda
```

Requisitos: .NET 10 SDK instalado, Android SDK com um AVD criado e o caminho do `.exe` mantido na raiz do projeto.

### 2. Manualmente

**WebAPI**

```powershell
cd "BACKEND\C#\EstoqueAPI\EstoqueAPI"
dotnet run --launch-profile http
```

- API: <http://localhost:5235>
- Swagger: <http://localhost:5235/swagger>

O banco SQLite (`estoque.db`) é criado automaticamente na primeira execução, com as migrações e os dados iniciais (seed).

**Aplicativo Android**

```powershell
cd ANDROID
.\gradlew.bat assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

O app acessa a API pelo endereço `http://10.0.2.2:5235/api/` (alias do `localhost` da máquina visto de dentro do emulador).

**Painel web**

```powershell
cd "FRONTEND\PROGRAMAÇÃO\sistema-ong-frontend"
npm install
npm run dev
```

---

## Acesso inicial

| Campo | Valor |
|---|---|
| E-mail | `admin@mesa.com` |
| Senha | `admin123` |

> Usuário administrador criado pelo seed do banco. O banco é recriado sempre que o arquivo `estoque.db` é removido.

---

## Funcionalidades

- **Funcionários** – cadastro e gerenciamento de usuários da ONG (perfis ADMIN e padrão).
- **Doadores / Solicitantes** – cadastro das entidades atendidas.
- **Controle de Estoque** – produtos, unidades de medida, entradas e status (disponível, baixo estoque, esgotado).
- **Entrada de Doações** – registro de doações com itens, lotes e validade.
- **Saída de Solicitações** – solicitações de retirada, com aprovação e controle de entrega.
- **Relatórios** – indicadores de estoque, doações e solicitações.
- **Autenticação JWT** – sessão persistida no app; ao receber `401`, o token é descartado e o usuário volta à tela de login com aviso de sessão expirada.

---

## Estrutura do repositório

```
.
├── ABRIR-MESA-COMPARTILHADA.exe   # atalho que sobe API + emulador + app
├── ANDROID/                       # aplicativo Kotlin / Jetpack Compose
├── BACKEND/
│   ├── C#/EstoqueAPI/             # solução .NET (API + projetos auxiliares)
│   └── ESTRUTURA/                 # diagramas e documentação do backend
├── FRONTEND/
│   ├── DIAGRAMAS/                 # diagramas do front-end
│   ├── ESTRUTURA/                 # documentação de estrutura
│   ├── PROGRAMAÇÃO/
│   │   ├── Back-Frontend/         # protótipo/estudos de integração
│   │   └── sistema-ong-frontend/  # painel React + Vite
│   └── TELAS/                     # telas e identidade visual
├── DB - SQL SERVER/               # scripts auxiliares de banco
└── LOGS/                          # área para logs locais
```

---

## Observações de desenvolvimento

- O arquivo `estoque.db` e as pastas de build (`bin`, `obj`, `build`, `.gradle`, `node_modules`, `dist`) não são versionados — veja `.gitignore`.
- A chave JWT em `appsettings.json` é apenas para desenvolvimento.
- O APK de debug é gerado em `ANDROID/app/build/outputs/apk/debug/app-debug.apk`.
- Configuração de porta e connection string ficam em `BACKEND/C#/EstoqueAPI/EstoqueAPI/appsettings.json`.
