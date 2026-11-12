package br.org.mesacompartilhada.app.data.model

/** Resposta de uma solicitação (`SolicitacaoResponseDTO`). */
data class SolicitacaoResponse(
    val id: Int = 0,
    val solicitanteId: Int = 0,
    val nomeSolicitante: String = "",
    val dataSolicitacao: String? = null,
    val status: String = "",
    val observacao: String? = null,
    val dataPrevisaoEntrega: String? = null,
    val dataEntrega: String? = null,
    val itens: List<SolicitacaoItemResponse> = emptyList(),
    val reagendamentos: List<ReagendamentoResponse> = emptyList()
)

/** Item de uma solicitação na resposta. */
data class SolicitacaoItemResponse(
    val id: Int = 0,
    val produtoId: Int = 0,
    val nomeProduto: String = "",
    val quantidade: Double = 0.0,
    val unidade: String = ""
)

/** Registro de troca de previsão de entrega (`ReagendamentoResponseDTO`). */
data class ReagendamentoResponse(
    val id: Int = 0,
    val dataAnterior: String? = null,
    val dataNova: String? = null,
    val motivo: String? = null,
    val observacao: String? = null,
    val usuarioNome: String? = null,
    val dataHora: String? = null
)

/** Corpo de criação de solicitação (`SolicitacaoCreateDTO`). */
data class SolicitacaoCreateRequest(
    val solicitanteId: Int,
    val itens: List<SolicitacaoItemCreateRequest>,
    val observacao: String? = null,
    val dataPrevisaoEntrega: String? = null
)

/** Item de solicitação na criação (`SolicitacaoItemCreateDTO`). */
data class SolicitacaoItemCreateRequest(
    val produtoId: Int,
    val quantidade: Double
)

/** Corpo de atualização de status (`SolicitacaoStatusUpdateDTO`). */
data class StatusUpdateRequest(
    val novoStatus: String
)

/** Corpo de reagendamento (`SolicitacaoReagendarDTO`). */
data class ReagendarRequest(
    val novaData: String,
    val motivo: String? = null,
    val observacao: String? = null
)
