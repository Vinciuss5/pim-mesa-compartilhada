package br.org.mesacompartilhada.app.data.model

/** Resposta de um solicitante (`SolicitanteResponseDTO`). */
data class SolicitanteResponse(
    val id: Int = 0,
    val nome: String = "",
    val cpf: String = "",
    val telefone: String? = null,
    val enderecoEntrega: String = "",
    val email: String? = null,
    val dataCadastro: String? = null
)

/** Corpo de criação de solicitante (`SolicitanteCreateDTO`). */
data class SolicitanteCreateRequest(
    val nome: String,
    val cpf: String,
    val telefone: String? = null,
    val enderecoEntrega: String,
    val email: String? = null
)
