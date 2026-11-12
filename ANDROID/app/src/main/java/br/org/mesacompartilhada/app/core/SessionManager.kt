package br.org.mesacompartilhada.app.core

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Guarda o token JWT da sessão.
 *
 * Usa SharedPreferences porque o token é lido de forma síncrona pelo
 * [br.org.mesacompartilhada.app.data.remote.AuthInterceptor]. O [StateFlow]
 * permite que a UI reaja a login/logout.
 */
class SessionManager(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _token = MutableStateFlow(prefs.getString(KEY_TOKEN, null))

    private val _sessaoExpirada = MutableStateFlow(false)

    /** Token atual (nulo quando deslogado). */
    val token: StateFlow<String?> = _token.asStateFlow()

    /** Verdadeiro quando a sessão foi encerrada porque o servidor recusou o token (401). */
    val sessaoExpirada: StateFlow<Boolean> = _sessaoExpirada.asStateFlow()

    /** Verdadeiro quando existe um token salvo. */
    val isLoggedIn: Boolean
        get() = _token.value != null

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
        _token.value = token
        _sessaoExpirada.value = false
    }

    fun clear() {
        prefs.edit().remove(KEY_TOKEN).apply()
        _token.value = null
    }

    /**
     * Descarta o token porque a API respondeu 401 (token vencido ou inválido).
     * Diferente de [clear], sinaliza a expiração para a UI avisar o usuário.
     */
    fun expirar() {
        if (_token.value == null) return
        prefs.edit().remove(KEY_TOKEN).apply()
        _token.value = null
        _sessaoExpirada.value = true
    }

    /** Marca o aviso de expiração como já exibido. */
    fun consumirAvisoExpiracao() {
        _sessaoExpirada.value = false
    }

    private companion object {
        const val PREFS_NAME = "mesa_session"
        const val KEY_TOKEN = "token"
    }
}
