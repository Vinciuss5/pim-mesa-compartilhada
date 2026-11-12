package br.org.mesacompartilhada.app.presentation.estoque

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Constants
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.EstoqueResponse
import br.org.mesacompartilhada.app.data.model.ProdutoCreateRequest
import br.org.mesacompartilhada.app.data.model.UnidadeMedidaResponse
import br.org.mesacompartilhada.app.data.repository.EstoqueRepository
import br.org.mesacompartilhada.app.data.repository.ProdutoRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate

/** Indicadores calculados no topo da tela de estoque. */
data class EstoqueMetrics(
    val skusAtivos: Int = 0,
    val baixoEstoque: Int = 0,
    val vencimentoProximo: Int = 0
)

data class ProdutoForm(
    val nome: String = "",
    val pesoKg: String = "",
    val unidadeMedidaId: Int = 0
)

data class EstoqueUiState(
    val lista: List<EstoqueResponse> = emptyList(),
    val unidades: List<UnidadeMedidaResponse> = emptyList(),
    val busca: String = "",
    val filtroStatus: String = "Todos os Status",
    val carregando: Boolean = true,
    val erro: String? = null,
    val metrics: EstoqueMetrics = EstoqueMetrics(),
    val dialogAberto: Boolean = false,
    val salvando: Boolean = false,
    val erroForm: String? = null,
    val form: ProdutoForm = ProdutoForm(),
    val mensagem: String? = null
)

class EstoqueViewModel(
    private val estoqueRepository: EstoqueRepository,
    private val produtoRepository: ProdutoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(EstoqueUiState())
    val uiState: StateFlow<EstoqueUiState> = _uiState.asStateFlow()

    init {
        carregar()
    }

    fun carregar() {
        _uiState.update { it.copy(carregando = true, erro = null) }
        viewModelScope.launch {
            val estoque = estoqueRepository.listar()
            when (estoque) {
                is Resource.Success -> {
                    val unidades = produtoRepository.listarUnidades()
                    _uiState.update {
                        it.copy(
                            lista = estoque.data,
                            unidades = (unidades as? Resource.Success)?.data ?: emptyList(),
                            carregando = false,
                            metrics = calcularMetrics(estoque.data)
                        )
                    }
                }

                is Resource.Error ->
                    _uiState.update { it.copy(erro = estoque.message, carregando = false) }

                Resource.Loading -> Unit
            }
        }
    }

    fun onBuscaChange(valor: String) = _uiState.update { it.copy(busca = valor) }

    fun onFiltroStatusChange(valor: String) = _uiState.update { it.copy(filtroStatus = valor) }

    fun abrirDialog() {
        _uiState.update {
            it.copy(dialogAberto = true, erroForm = null, form = ProdutoForm())
        }
    }

    fun fecharDialog() {
        if (_uiState.value.salvando) return
        _uiState.update { it.copy(dialogAberto = false, erroForm = null) }
    }

    fun onFormChange(campo: String, valor: String) {
        _uiState.update { estado ->
            val form = when (campo) {
                "nome" -> estado.form.copy(nome = valor)
                "pesoKg" -> estado.form.copy(pesoKg = valor)
                "unidadeMedidaId" -> estado.form.copy(unidadeMedidaId = valor.toIntOrNull() ?: 0)
                else -> estado.form
            }
            estado.copy(form = form, erroForm = null)
        }
    }

    fun salvarProduto() {
        val form = _uiState.value.form
        if (form.nome.isBlank()) {
            _uiState.update { it.copy(erroForm = "O nome do produto é obrigatório.") }
            return
        }
        if (form.unidadeMedidaId <= 0) {
            _uiState.update { it.copy(erroForm = "Selecione a unidade de medida.") }
            return
        }

        _uiState.update { it.copy(salvando = true, erroForm = null) }
        viewModelScope.launch {
            val request = ProdutoCreateRequest(
                nome = form.nome.trim(),
                unidadeMedidaId = form.unidadeMedidaId,
                pesoKg = form.pesoKg.toDoubleOrNull()
            )
            when (val resultado = produtoRepository.criar(request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            salvando = false,
                            dialogAberto = false,
                            mensagem = "Produto cadastrado com sucesso."
                        )
                    }
                }

                is Resource.Error ->
                    _uiState.update { it.copy(salvando = false, erroForm = resultado.message) }

                Resource.Loading -> Unit
            }
        }
    }

    fun limparMensagem() = _uiState.update { it.copy(mensagem = null) }

    /** KPIs: SKUs ativos, baixo estoque e vencimento em até 90 dias. */
    private fun calcularMetrics(lista: List<EstoqueResponse>): EstoqueMetrics {
        val hoje = LocalDate.now()
        var skusAtivos = 0
        var baixoEstoque = 0
        var vencimentoProximo = 0

        lista.forEach { item ->
            if (item.quantidade > 0) skusAtivos++
            if (item.status.equals("baixo estoque", ignoreCase = true)) baixoEstoque++

            val validade = Formatters.parseData(item.validade)
            if (validade != null && item.quantidade > 0) {
                val dias = java.time.temporal.ChronoUnit.DAYS.between(hoje, validade)
                if (dias in 1..Constants.DIAS_ALERTA_VALIDADE) vencimentoProximo++
            }
        }
        return EstoqueMetrics(skusAtivos, baixoEstoque, vencimentoProximo)
    }

    /** Aplica busca (nome, origem) e filtro de status, como no front web. */
    fun filtrar(): List<EstoqueResponse> {
        val estado = _uiState.value
        val busca = estado.busca.lowercase().trim()
        val statusFiltro = estado.filtroStatus

        return estado.lista.filter { item ->
            val nome = item.produtoNome.lowercase()
            val origem = item.origem.lowercase()
            val status = item.status.lowercase()

            val matchBusca = nome.contains(busca) || origem.contains(busca)
            val matchStatus = statusFiltro == "Todos os Status" ||
                status == statusFiltro.lowercase()

            matchBusca && matchStatus
        }
    }
}
