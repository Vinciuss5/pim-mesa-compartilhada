# Mesa Compartilhada — App Android

Versão Android do sistema **Mesa Compartilhada** (gestão de doações de ONG),
construída no padrão do **Android Studio** com **Kotlin + Jetpack Compose**.

O app consome a mesma API C# (`EstoqueAPI`) do projeto.

---

## 1. Como abrir e rodar

> Pré-requisitos: **Android Studio** instalado (ele já traz JDK, SDK e emulador).
> Baixe em <https://developer.android.com/studio> — é gratuito e pesa ~1,2 GB.

1. Abra o **Android Studio**.
2. `File > Open` e selecione a pasta **`ANDROID`** (a raiz do projeto Android).
3. Aguarde o **Gradle sync** terminar (banner `Sync Now` no topo). Na primeira vez o
   Android Studio baixa o Gradle 8.10.2, as dependências e o SDK — pode levar alguns minutos.
   - Se aparecer `SDK not found`, aceite o prompt para instalar o SDK automaticamente.
   - Se aparecer erro de JDK, em `File > Settings > Build Tools > Gradle > Gradle JDK`
     escolha o **JBR (JetBrains Runtime)** embutido do Android Studio.
4. Crie/abrir um **emulador** (API 26+) ou conecte um **aparelho físico** com
   *Depuração USB* ativada.
5. Inicie a **API C#** (item 3 abaixo).
6. Clique em **Run ▶** (ou `Shift + F10`) e escolha o emulador/aparelho.

### Verificação rápida sem emulador (build apenas)

No terminal da pasta `ANDROID`:

```powershell
.\gradlew.bat assembleDebug
```

Se o APK gerar em `app/build/outputs/apk/debug/app-debug.apk`, o projeto compila.

---

## 2. Configurar a URL da API

A URL fica em:

```
app/src/main/java/br/org/mesacompartilhada/app/core/Constants.kt
```

| Ambiente           | Valor a usar                          |
|--------------------|---------------------------------------|
| Emulador Android   | `http://10.0.2.2:5235/api/` (padrão)  |
| Aparelho físico    | `http://IP_DA_MAQUINA:5235/api/`      |

> `10.0.2.2` é o alias do `localhost` da sua máquina visto pelo emulador.

---

## 3. Rodar a API C# (obrigatório antes de testar o app)

O login e todos os dados vêm da `EstoqueAPI`. Em um **PowerShell**:

```powershell
cd "BACKEND\C#\EstoqueAPI\EstoqueAPI"
dotnet run
```

A API sobe em **`http://localhost:5235`** (perfil `http` do `launchSettings.json`).

Confirme com um navegador: <http://localhost:5235/swagger/index.html> (ou `/api/...`).

**Checklist de teste:**

1. API rodando (`dotnet run`).
2. Emulador ou aparelho conectado no Android Studio.
3. `Run ▶` → app abre no login.
4. Faça login com um usuário existente no banco.

> **Aparelho físico:** o emulador usa `10.0.2.2`, mas o celular não. Troque em
> `Constants.kt` para o IP da sua máquina na rede, ex.: `http://192.168.0.10:5235/api/`
> (veja o IP com `ipconfig`) e libere a porta 5235 no Firewall do Windows.

---

## 4. Arquitetura

Padrão **MVVM + Repository**, separado em camadas:

```
app/src/main/java/br/org/mesacompartilhada/app/
├── core/                  # Constants, Resource, SessionManager, Formatters
├── data/
│   ├── model/             # DTOs (espelham os records da API C#)
│   ├── remote/            # Retrofit, ApiService, AuthInterceptor
│   └── repository/        # Regras de acesso a dados
├── di/                    # AppContainer + fábrica de ViewModels
├── presentation/
│   ├── components/        # Componentes reutilizáveis (campos, botões, estados)
│   ├── theme/             # Cores, tipografia e tema
│   ├── navigation/        # Rotas, drawer e NavHost
│   ├── auth/              # Login
│   ├── funcionarios/      # Gestão de funcionários
│   ├── doadores/          # Gestão de doadores
│   ├── solicitantes/      # Gestão de solicitantes
│   ├── estoque/           # Controle de estoque + KPIs
│   ├── doacoes/           # Entrada de doações (carrinho de itens)
│   ├── solicitacoes/      # Saída de solicitações + status
│   └── relatorios/        # Painel de indicadores
├── MainActivity.kt
└── MesaApplication.kt
```

### Boas práticas aplicadas

- **MVVM**: `ViewModel` expõe `StateFlow<UiState>`; a tela apenas observa.
- **Repository**: a UI nunca chama o Retrofit diretamente.
- **Injeção manual** via `AppContainer` (fácil de migrar para Hilt depois).
- **Coroutines** para assíncrono; erros convertidos em mensagens amigáveis (`Resource`).
- **Componentes reutilizáveis** (`CampoTexto`, `BotaoPrimario`, `DialogoFormulario`…).
- **Máscaras** de CPF/telefone aplicadas na digitação e removidas antes de enviar.
- **Sessão** isolada em `SessionManager` (token fora do escopo da UI).
- **Cores/strings** centralizadas em recursos (`colors.xml`, `strings.xml`).

---

## 5. Funcionalidades

| Tela                  | O que faz                                                        |
|-----------------------|------------------------------------------------------------------|
| Login                 | Autentica e guarda o token JWT                                   |
| Funcionários          | Lista, busca, cadastro (ADMIN/FUNCIONARIO) e ativar/desativar    |
| Doadores              | Lista com busca (debounce) e cadastro com máscaras               |
| Solicitantes          | Lista com busca e cadastro (nome, CPF, endereço de entrega)      |
| Controle de Estoque   | KPIs, filtro por status, busca e cadastro de produto             |
| Entrada de Doações    | Histórico agrupado + registro com carrinho de itens              |
| Saída de Solicitações | Histórico, filtro, criação com carrinho e mudança de status      |
| Relatórios            | KPIs do mês, alertas de validade e últimas solicitações          |

---

## 6. Regras de negócio mantidas

- Validade de doação **não pode ser anterior a hoje**.
- Solicitação exige **pelo menos um item** e um solicitante.
- Status de solicitação: `PENDENTE | ENTREGUE | CANCELADO`.
- Alerta de vencimento em até **90 dias** (estoque) e **3 meses** (relatórios).
- Senha de funcionário com **mínimo de 8 caracteres** e CPF com **11 dígitos**.

---

## 7. Problemas comuns no primeiro teste

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Build falha com `25.0.4` em `JavaVersion.parse` | O JBR do Android Studio 2026 é **JDK 25**, novo demais p/ Kotlin 2.0.21 | Instale o **JDK 21** e use-o no `Gradle JDK` (ver nota abaixo) |
| `Your project path contains non-ASCII characters` | Pasta com acento (`Área de Trabalho`) | Resolvido com `android.overridePathCheck=true` no `gradle.properties` |
| `baseUrl must end in /` (crash ao abrir) | Retrofit exige barra final na URL | Use `http://10.0.2.2:5235/api/` (com `/` no fim) |
| `Failed to find target with hash string` | SDK antigo/ausente | `Tools > SDK Manager > SDK Platforms` → instale a API 35 |
| `Could not resolve com.android.tools.build:gradle` | Sem internet/proxy | Configure proxy em `File > Settings > HTTP Proxy` |
| Tela de login com erro de rede | API desligada | `dotnet run` na pasta da `EstoqueAPI` |
| `Cleartext HTTP traffic not permitted` | URL `http://` bloqueada | Já resolvido pelo `network_security_config.xml` |
| Emulador não abre | Sem VT-x no BIOS | Ative *Virtualization Technology* na BIOS ou use aparelho físico |
| App não acha o celular | Depuração USB desligada | `Configurações > Opções do desenvolvedor > Depuração USB` |
| Login 401/erro de autenticação | URL errada no aparelho físico | Troque `10.0.2.2` pelo IP da máquina em `Constants.kt` |
| Tela em branco nos primeiros segundos | Emulador lento no primeiro boot (JIT) | Aguarde; nas próximas vezes abre rápido |

### Nota sobre o JDK (importante)

O Android Studio 2026 vem com **JDK 25**, que ainda não é compatível com o
Kotlin 2.0.21 usado aqui. Instale o JDK 21 e aponte o Gradle para ele:

```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK -e
```

Depois, no Android Studio: `File > Settings > Build Tools > Gradle > Gradle JDK`
→ **Java 21 (Temurin)**.

Nesta máquina o caminho global já está em `C:\Users\<usuario>\.gradle\gradle.properties`
(`org.gradle.java.home`), então o build de linha de comando funciona sem configuração extra.

### Credenciais de teste

Usuário seed da API:

| Campo | Valor |
|-------|-------|
| E-mail | `admin@mesa.com` |
| Senha | `admin123` |

### Limpar e reconstruir (quando algo ficar estranho)

```powershell
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

Ou no Android Studio: `File > Invalidate Caches > Invalidate and Restart`.

---

## 8. Como rodar os testes

```powershell
.\gradlew.bat testDebugUnitTest
```
