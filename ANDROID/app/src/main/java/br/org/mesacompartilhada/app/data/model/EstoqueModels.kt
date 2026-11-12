package br.org.mesacompartilhada.app.data.model

/** Linha de estoque (`EstoqueResponseDTO`). */
data class EstoqueResponse(
    val id: Int = 0,
    val produtoId: Int = 0,
    val produtoNome: String = "",
    val quantidade: Double = 0.0,
    val status: String = "",
    val peso: Double = 0.0,
    val origem: String = "",
    val validade: String? = null,
    val loteCodigo: String? = null,
    val dataEntrada: String? = null,
    val unidade: String = ""
)
