package br.org.mesacompartilhada.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val email: String = "",
    val senha: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val logado: Boolean = false
)

/**
 * ViewModel da tela de login.
 * Guarda o token via [AuthRepository] em caso de sucesso.
 */
class AuthViewModel(
    private val repository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun onEmailChange(valor: String) {
        _uiState.update { it.copy(email = valor, error = null) }
    }

    fun onSenhaChange(valor: String) {
        _uiState.update { it.copy(senha = valor, error = null) }
    }

    fun login() {
        val atual = _uiState.value
        if (atual.isLoading) return
        if (atual.email.isBlank() || atual.senha.isBlank()) {
            _uiState.update { it.copy(error = "Preencha o e-mail e a senha.") }
            return
        }

        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            when (val resultado = repository.login(atual.email.trim(), atual.senha)) {
                is Resource.Success ->
                    _uiState.update { it.copy(isLoading = false, logado = true) }

                is Resource.Error ->
                    _uiState.update { it.copy(isLoading = false, error = resultado.message) }

                Resource.Loading -> Unit
            }
        }
    }

    /** Limpa a sessão atual (usado pelo botão "Sair do Sistema"). */
    fun logout() {
        repository.logout()
        _uiState.update { it.copy(logado = false, senha = "") }
    }
}
