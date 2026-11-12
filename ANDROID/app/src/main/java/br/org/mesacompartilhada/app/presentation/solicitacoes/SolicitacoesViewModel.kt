package br.org.mesacompartilhada.app.presentation.solicitacoes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.ProdutoResponse
import br.org.mesacompartilhada.app.data.model.SolicitacaoCreateRequest
import br.org.mesacompartilhada.app.data.model.SolicitacaoItemCreateRequest
import br.org.mesacompartilhada.app.data.model.SolicitacaoResponse
import br.org.mesacompartilhada.app.data.model.SolicitanteResponse
import br.org.mesacompartilhada.app.data.repository.ProdutoRepository
import br.org.mesacompartilhada.app.data.repository.SolicitacaoRepository
import br.org.mesacompartilhada.app.data.repository.SolicitanteRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** Item do carrinho de saída. */
data class ItemSaida(
    val idTemp: Long,
    val produtoId: Int,
    val nome: String,
    val quantidade: Double
)

data class ItemSaidaForm(
    val produtoId: Int = 0,
    val quantidade: String = ""
)

data class SolicitacoesUiState(
    val lista: List<SolicitacaoResponse> = emptyList(),
    val solicitantes: List<SolicitanteResponse> = emptyList(),
    val produtos: List<ProdutoResponse> = emptyList(),
    val busca: String = "",
    val filtroStatus: String = "Todos",
    val carregando: Boolean = true,
    val erro: String? = null,
    val dialogAberto: Boolean = false,
    val solicitanteId: Int = 0,
    val observacao: String = "",
    val carrinho: List<ItemSaida> = emptyList(),
    val itemForm: ItemSaidaForm = ItemSaidaForm(),
    val salvando: Boolean = false,
    val erroForm: String? = null,
    val mensagem: String? = null
)

class SolicitacoesViewModel(
    private val solicitacaoRepository: SolicitacaoRepository,
    private val solicitanteRepository: SolicitanteRepository,
    private val produtoRepository: ProdutoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SolicitacoesUiState())
    val uiState: StateFlow<SolicitacoesUiState> = _uiState.asStateFlow()

    init {
        carregar()
    }

    fun carregar() {
        _uiState.update { it.copy(carregando = true, erro = null) }
        viewModelScope.launch {
            val solicitacoes = solicitacaoRepository.listar()
            val solicitantes = solicitanteRepository.listar()
            val produtos = produtoRepository.listar()

            when (solicitacoes) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            lista = solicitacoes.data,
                            solicitantes = (solicitantes as? Resource.Success)?.data ?: emptyList(),
                            produtos = (produtos as? Resource.Success)?.data ?: emptyList(),
                            carregando = false
                        )
                    }
                }

                is Resource.Error ->
                    _uiState.update { it.copy(erro = solicitacoes.message, carregando = false) }

                Resource.Loading -> Unit
            }
        }
    }

    fun onBuscaChange(valor: String) = _uiState.update { it.copy(busca = valor) }

    fun onFiltroStatusChange(valor: String) = _uiState.update { it.copy(filtroStatus = valor) }

    fun abrirDialog() {
        _uiState.update {
            it.copy(
                dialogAberto = true,
                erroForm = null,
                solicitanteId = 0,
                observacao = "",
                carrinho = emptyList(),
                itemForm = ItemSaidaForm()
            )
        }
    }

    fun fecharDialog() {
        if (_uiState.value.salvando) return
        _uiState.update {
            it.copy(
                dialogAberto = false,
                erroForm = null,
                solicitanteId = 0,
                observacao = "",
                carrinho = emptyList(),
                itemForm = ItemSaidaForm()
            )
        }
    }

    fun onSolicitanteChange(id: Int) = _uiState.update { it.copy(solicitanteId = id, erroForm = null) }

    fun onObservacaoChange(valor: String) = _uiState.update { it.copy(observacao = valor) }

    fun onItemFormChange(campo: String, valor: String) {
        _uiState.update { estado ->
            val form = when (campo) {
                "produtoId" -> estado.itemForm.copy(produtoId = valor.toIntOrNull() ?: 0)
                "quantidade" -> estado.itemForm.copy(quantidade = valor)
                else -> estado.itemForm
            }
            estado.copy(itemForm = form, erroForm = null)
        }
    }

    fun adicionarItem() {
        val estado = _uiState.value
        val form = estado.itemForm
        if (form.produtoId <= 0 || form.quantidade.isBlank()) {
            _uiState.update { it.copy(erroForm = "Selecione o produto e informe a quantidade.") }
            return
        }
        val quantidade = form.quantidade.toDoubleOrNull() ?: 0.0
        if (quantidade <= 0) {
            _uiState.update { it.copy(erroForm = "A quantidade deve ser maior que zero.") }
            return
        }

        val produto = estado.produtos.find { it.id == form.produtoId }
        val novoItem = ItemSaida(
            idTemp = System.currentTimeMillis(),
            produtoId = form.produtoId,
            nome = produto?.nome ?: "Produto desconhecido",
            quantidade = quantidade
        )
        _uiState.update {
            it.copy(carrinho = it.carrinho + novoItem, itemForm = ItemSaidaForm(), erroForm = null)
        }
    }

    fun removerItem(idTemp: Long) =
        _uiState.update { it.copy(carrinho = it.carrinho.filterNot { i -> i.idTemp == idTemp }) }

    /** Cria a solicitação (saída de estoque). */
    fun criarSolicitacao() {
        val estado = _uiState.value
        if (estado.solicitanteId <= 0 || estado.carrinho.isEmpty()) {
            _uiState.update { it.copy(erroForm = "Selecione o solicitante e adicione ao menos um item.") }
            return
        }

        _uiState.update { it.copy(salvando = true, erroForm = null) }
        viewModelScope.launch {
            val request = SolicitacaoCreateRequest(
                solicitanteId = estado.solicitanteId,
                itens = estado.carrinho.map {
                    SolicitacaoItemCreateRequest(produtoId = it.produtoId, quantidade = it.quantidade)
                },
                observacao = estado.observacao.trim().takeIf { it.isNotBlank() }
            )
            when (val resultado = solicitacaoRepository.criar(request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(salvando = false, dialogAberto = false, mensagem = "Solicitação criada com sucesso.")
                    }
                    carregar()
                }

                is Resource.Error ->
                    _uiState.update { it.copy(salvando = false, erroForm = resultado.message) }

                Resource.Loading -> Unit
            }
        }
    }

    /** Atualiza o status (PENDENTE / ENTREGUE / CANCELADO). */
    fun atualizarStatus(id: Int, novoStatus: String) {
        viewModelScope.launch {
            when (val resultado = solicitacaoRepository.atualizarStatus(id, novoStatus)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(mensagem = "Status atualizado para $novoStatus.")
                    }
                    carregar()
                }

                is Resource.Error ->
                    _uiState.update { it.copy(mensagem = resultado.message) }

                Resource.Loading -> Unit
            }
        }
    }

    fun limparMensagem() = _uiState.update { it.copy(mensagem = null) }

    /** Aplica busca por solicitante e filtro de status. */
    fun filtrar(): List<SolicitacaoResponse> {
        val estado = _uiState.value
        val busca = estado.busca.lowercase().trim()
        val filtro = estado.filtroStatus

        return estado.lista.filter { sol ->
            val matchBusca = busca.isEmpty() || sol.nomeSolicitante.lowercase().contains(busca)
            val matchStatus = filtro == "Todos" || sol.status.equals(filtro, ignoreCase = true)
            matchBusca && matchStatus
        }
    }
}
