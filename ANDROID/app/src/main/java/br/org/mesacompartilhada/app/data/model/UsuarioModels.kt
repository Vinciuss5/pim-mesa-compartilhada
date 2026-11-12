package br.org.mesacompartilhada.app.data.model

/**
 * Resposta de um usuário/funcionário (`UsuarioResponseDTO`).
 * Campos com valor padrão evitam NPE quando o JSON omitir propriedades.
 */
data class UsuarioResponse(
    val id: Int = 0,
    val nome: String = "",
    val email: String = "",
    val cpf: String = "",
    val telefone: String? = null,
    val tipo: String = "",
    val ativo: Boolean = false,
    val dataAdmissao: String? = null
)

/** Corpo de criação (`UsuarioCreateDTO`). */
data class UsuarioCreateRequest(
    val nome: String,
    val email: String,
    val cpf: String,
    val telefone: String? = null,
    val senha: String,
    val tipo: String,
    val dataAdmissao: String
)

/** Corpo de atualização (`UsuarioUpdateDTO`). */
data class UsuarioUpdateRequest(
    val nome: String,
    val email: String,
    val telefone: String? = null,
    val tipo: String,
    val ativo: Boolean,
    val cpf: String? = null,
    val dataAdmissao: String? = null
)
