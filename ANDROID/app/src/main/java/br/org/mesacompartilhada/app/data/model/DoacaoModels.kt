package br.org.mesacompartilhada.app.data.model

/** Resposta de uma doação (`DoacaoResponseDTO`). */
data class DoacaoResponse(
    val id: Int = 0,
    val doadorId: Int = 0,
    val nomeDoador: String = "",
    val data: String? = null,
    val itens: List<DoacaoItemResponse> = emptyList()
)

/** Item de uma doação na resposta. */
data class DoacaoItemResponse(
    val id: Int = 0,
    val produtoId: Int = 0,
    val nomeProduto: String = "",
    val quantidade: Double = 0.0,
    val dataValidade: String? = null,
    val unidade: String = ""
)

/** Corpo de criação de doação (`DoacaoCreateDTO`). */
data class DoacaoCreateRequest(
    val doadorId: Int,
    val data: String,
    val itens: List<DoacaoItemCreateRequest>
)

/** Item de doação na criação (`DoacaoItemCreateDTO`). */
data class DoacaoItemCreateRequest(
    val produtoId: Int,
    val quantidade: Double,
    val dataValidade: String? = null
)
