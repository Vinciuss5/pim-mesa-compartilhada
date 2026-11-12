package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.core.SessionManager
import br.org.mesacompartilhada.app.data.model.LoginRequest
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

/**
 * Responsável pela autenticação e pela manutenção da sessão.
 */
class AuthRepository(
    private val api: ApiService,
    private val session: SessionManager
) {

    /** Realiza o login e persiste o token em caso de sucesso. */
    suspend fun login(email: String, senha: String): Resource<Unit> = try {
        val resposta = api.login(LoginRequest(email = email, senha = senha))
        val token = resposta.token
        if (token.isNullOrBlank()) {
            Resource.Error(resposta.message ?: "Credenciais inválidas.")
        } else {
            session.saveToken(token)
            Resource.Success(Unit)
        }
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    /** Encerra a sessão limpando o token salvo. */
    fun logout() {
        session.clear()
    }
}
