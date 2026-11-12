package br.org.mesacompartilhada.app.di

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import br.org.mesacompartilhada.app.presentation.auth.AuthViewModel
import br.org.mesacompartilhada.app.presentation.doacoes.DoacoesViewModel
import br.org.mesacompartilhada.app.presentation.doadores.DoadoresViewModel
import br.org.mesacompartilhada.app.presentation.estoque.EstoqueViewModel
import br.org.mesacompartilhada.app.presentation.funcionarios.FuncionariosViewModel
import br.org.mesacompartilhada.app.presentation.relatorios.RelatoriosViewModel
import br.org.mesacompartilhada.app.presentation.solicitacoes.SolicitacoesViewModel
import br.org.mesacompartilhada.app.presentation.solicitantes.SolicitantesViewModel

/**
 * Fábrica de ViewModels com injeção manual dos repositórios do [AppContainer].
 */
class MesaViewModelFactory(private val container: AppContainer) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when {
        modelClass.isAssignableFrom(AuthViewModel::class.java) ->
            AuthViewModel(container.authRepository) as T

        modelClass.isAssignableFrom(FuncionariosViewModel::class.java) ->
            FuncionariosViewModel(container.usuarioRepository) as T

        modelClass.isAssignableFrom(DoadoresViewModel::class.java) ->
            DoadoresViewModel(container.doadorRepository) as T

        modelClass.isAssignableFrom(SolicitantesViewModel::class.java) ->
            SolicitantesViewModel(container.solicitanteRepository) as T

        modelClass.isAssignableFrom(EstoqueViewModel::class.java) ->
            EstoqueViewModel(container.estoqueRepository, container.produtoRepository) as T

        modelClass.isAssignableFrom(DoacoesViewModel::class.java) ->
            DoacoesViewModel(container.doacaoRepository, container.doadorRepository, container.produtoRepository) as T

        modelClass.isAssignableFrom(SolicitacoesViewModel::class.java) ->
            SolicitacoesViewModel(container.solicitacaoRepository, container.solicitanteRepository, container.produtoRepository) as T

        modelClass.isAssignableFrom(RelatoriosViewModel::class.java) ->
            RelatoriosViewModel(container.estoqueRepository, container.doacaoRepository, container.solicitacaoRepository) as T

        else -> throw IllegalArgumentException("ViewModel desconhecida: ${modelClass.name}")
    }
}
