package br.org.mesacompartilhada.app.data.model

/** Unidade de medida (`UnidadeMedidaResponseDTO`). */
data class UnidadeMedidaResponse(
    val id: Int = 0,
    val nome: String = "",
    val sigla: String = "",
    val tipo: String = ""
)

/** Resposta de um produto (`ProdutoResponseDTO`). */
data class ProdutoResponse(
    val id: Int = 0,
    val nome: String = "",
    val pesoKg: Double? = null,
    val unidadeMedidaId: Int = 0,
    val unidadeSigla: String = "",
    val unidadeNome: String = "",
    val unidadeTipo: String = "",
    val categoria: String? = null,
    val controlaValidade: Boolean = true,
    val estoqueMinimo: Double? = null,
    val diasAlertaValidade: Int = 30
)

/** Corpo de criação de produto (`ProdutoCreateDTO`). */
data class ProdutoCreateRequest(
    val nome: String,
    val unidadeMedidaId: Int,
    val categoria: String? = null,
    val controlaValidade: Boolean = true,
    val estoqueMinimo: Double? = null,
    val pesoKg: Double? = null,
    val diasAlertaValidade: Int = 30
)
