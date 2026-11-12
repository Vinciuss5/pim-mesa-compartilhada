package br.org.mesacompartilhada.app.data.model

/** Corpo do login (`POST /api/auth/login`). */
data class LoginRequest(
    val email: String,
    val senha: String
)

/** Resposta do login. A API retorna apenas `{ token }`. */
data class LoginResponse(
    val token: String? = null,
    val message: String? = null
)
