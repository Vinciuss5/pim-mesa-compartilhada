package br.org.mesacompartilhada.app.data.remote

import br.org.mesacompartilhada.app.core.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Anexa o token JWT (Bearer) em todas as requisições autenticadas.
 * O login é a única chamada que sai sem Authorization.
 *
 * Também encerra a sessão quando a API responde 401 para uma requisição
 * autenticada: o token venceu ou foi invalidado e a UI volta para o login.
 */
class AuthInterceptor(private val session: SessionManager) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = session.token.value
        val request = if (token.isNullOrBlank()) {
            chain.request()
        } else {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }
        val response = chain.proceed(request)
        if (response.code == 401 && !token.isNullOrBlank()) {
            session.expirar()
        }
        return response
    }
}
