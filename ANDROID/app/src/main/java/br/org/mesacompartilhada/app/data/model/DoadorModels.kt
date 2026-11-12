package br.org.mesacompartilhada.app.data.model

/** Resposta de um doador (`DoadorResponseDTO`). */
data class DoadorResponse(
    val id: Int = 0,
    val nome: String = "",
    val email: String? = null,
    val telefone: String? = null,
    val cpf: String? = null,
    val endereco: String? = null
)

/** Corpo de criação de doador (`DoadorCreateDTO`). CPF apenas com dígitos. */
data class DoadorCreateRequest(
    val nome: String,
    val email: String? = null,
    val telefone: String? = null,
    val cpf: String? = null,
    val endereco: String? = null
)
