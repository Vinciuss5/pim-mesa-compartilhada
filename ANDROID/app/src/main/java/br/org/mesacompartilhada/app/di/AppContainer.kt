package br.org.mesacompartilhada.app.di

import android.content.Context
import br.org.mesacompartilhada.app.core.SessionManager
import br.org.mesacompartilhada.app.data.remote.RetrofitClient
import br.org.mesacompartilhada.app.data.repository.AuthRepository
import br.org.mesacompartilhada.app.data.repository.DoacaoRepository
import br.org.mesacompartilhada.app.data.repository.DoadorRepository
import br.org.mesacompartilhada.app.data.repository.EstoqueRepository
import br.org.mesacompartilhada.app.data.repository.ProdutoRepository
import br.org.mesacompartilhada.app.data.repository.SolicitacaoRepository
import br.org.mesacompartilhada.app.data.repository.SolicitanteRepository
import br.org.mesacompartilhada.app.data.repository.UsuarioRepository

/**
 * Contêiner de dependências (injeção manual).
 *
 * Centraliza a criação dos repositórios para que ViewModels não dependam
 * diretamente do Retrofit. Para um app maior, troque por Hilt.
 */
class AppContainer(context: Context) {

    val session: SessionManager = SessionManager(context)

    private val api = RetrofitClient.createApi(session)

    val authRepository = AuthRepository(api, session)
    val usuarioRepository = UsuarioRepository(api)
    val doadorRepository = DoadorRepository(api)
    val solicitanteRepository = SolicitanteRepository(api)
    val produtoRepository = ProdutoRepository(api)
    val estoqueRepository = EstoqueRepository(api)
    val doacaoRepository = DoacaoRepository(api)
    val solicitacaoRepository = SolicitacaoRepository(api)

    /** Fábrica única das ViewModels do app. */
    val viewModelFactory = MesaViewModelFactory(this)
}
