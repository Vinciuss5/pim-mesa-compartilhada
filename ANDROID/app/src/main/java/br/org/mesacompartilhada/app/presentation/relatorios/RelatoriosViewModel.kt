package br.org.mesacompartilhada.app.presentation.relatorios

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.DoacaoResponse
import br.org.mesacompartilhada.app.data.model.EstoqueResponse
import br.org.mesacompartilhada.app.data.model.SolicitacaoResponse
import br.org.mesacompartilhada.app.data.repository.DoacaoRepository
import br.org.mesacompartilhada.app.data.repository.EstoqueRepository
import br.org.mesacompartilhada.app.data.repository.SolicitacaoRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate

/** Indicadores do painel de relatórios. */
data class RelatorioKpis(
    val solicitacoesPendentes: Int = 0,
    val produtosProximosVencimento: Int = 0,
    val doacoesMes: Int = 0,
    val estoqueTotal: String = "0"
)

/** Item em risco de vencimento (janelade 3 meses). */
data class AlertaValidade(
    val produto: String,
    val origem: String,
    val validade: String,
    val quantidade: Double
)

data class RelatoriosUiState(
    val kpis: RelatorioKpis = RelatorioKpis(),
    val alertasValidade: List<AlertaValidade> = emptyList(),
    val ultimasSolicitacoes: List<SolicitacaoResponse> = emptyList(),
    val carregando: Boolean = true,
    val erro: String? = null
)

class RelatoriosViewModel(
    private val estoqueRepository: EstoqueRepository,
    private val doacaoRepository: DoacaoRepository,
    private val solicitacaoRepository: SolicitacaoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RelatoriosUiState())
    val uiState: StateFlow<RelatoriosUiState> = _uiState.asStateFlow()

    init {
        carregar()
    }

    /** Carrega estoque, doações e solicitações em paralelo. */
    fun carregar() {
        _uiState.update { it.copy(carregando = true, erro = null) }
        viewModelScope.launch {
            val estoque = estoqueRepository.listar()
            val doacoes = doacaoRepository.listar()
            val solicitacoes = solicitacaoRepository.listar()

            val estoqueData = (estoque as? Resource.Success)?.data
            if (estoqueData == null) {
                val erro = (estoque as? Resource.Error)?.message ?: "Erro ao carregar dados."
                _uiState.update { it.copy(erro = erro, carregando = false) }
                return@launch
            }

            val doacoesData = (doacoes as? Resource.Success)?.data ?: emptyList()
            val solicitacoesData = (solicitacoes as? Resource.Success)?.data ?: emptyList()

            val kpis = calcularKpis(estoqueData, doacoesData, solicitacoesData)
            val alertas = calcularAlertas(estoqueData)
            val ultimas = solicitacoesData
                .sortedByDescending { it.dataSolicitacao ?: "" }
                .take(5)

            _uiState.update {
                it.copy(kpis = kpis, alertasValidade = alertas, ultimasSolicitacoes = ultimas, carregando = false)
            }
        }
    }

    private fun calcularKpis(
        estoque: List<EstoqueResponse>,
        doacoes: List<DoacaoResponse>,
        solicitacoes: List<SolicitacaoResponse>
    ): RelatorioKpis {
        val hoje = LocalDate.now()

        val pendentes = solicitacoes.count {
            it.status.equals("PENDENTE", ignoreCase = true)
        }

        val doacoesMes = doacoes.count { doacao ->
            val data = Formatters.parseData(doacao.data)
            data != null && data.month == hoje.month && data.year == hoje.year
        }

        val vencimentoProximo = estoque.count { item ->
            val validade = Formatters.parseData(item.validade)
            validade != null && item.quantidade > 0 &&
                !validade.isBefore(hoje) &&
                !validade.isAfter(hoje.plusMonths(3))
        }

        // Soma peso x quantidade (quando há peso cadastrado).
        var total = 0.0
        estoque.forEach { item ->
            val peso = item.peso
            total += if (peso > 0) peso * item.quantidade else item.quantidade
        }

        return RelatorioKpis(
            solicitacoesPendentes = pendentes,
            produtosProximosVencimento = vencimentoProximo,
            doacoesMes = doacoesMes,
            estoqueTotal = Formatters.formatarNumero(total)
        )
    }

    /** Itens com validade entre hoje e 3 meses, ordenados do mais próximo. */
    private fun calcularAlertas(estoque: List<EstoqueResponse>): List<AlertaValidade> {
        val hoje = LocalDate.now()
        return estoque.mapNotNull { item ->
            val validade = Formatters.parseData(item.validade) ?: return@mapNotNull null
            if (item.quantidade > 0 && !validade.isBefore(hoje) && !validade.isAfter(hoje.plusMonths(3))) {
                AlertaValidade(
                    produto = item.produtoNome,
                    origem = item.origem.ifBlank { "N/D" },
                    validade = Formatters.formatarData(item.validade),
                    quantidade = item.quantidade
                )
            } else null
        }.sortedBy { it.validade }
    }
}
