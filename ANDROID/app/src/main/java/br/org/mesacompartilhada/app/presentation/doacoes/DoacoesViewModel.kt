package br.org.mesacompartilhada.app.presentation.doacoes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.DoacaoCreateRequest
import br.org.mesacompartilhada.app.data.model.DoacaoItemCreateRequest
import br.org.mesacompartilhada.app.data.model.DoacaoResponse
import br.org.mesacompartilhada.app.data.model.DoadorResponse
import br.org.mesacompartilhada.app.data.model.ProdutoResponse
import br.org.mesacompartilhada.app.data.repository.DoacaoRepository
import br.org.mesacompartilhada.app.data.repository.DoadorRepository
import br.org.mesacompartilhada.app.data.repository.ProdutoRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** Item temporário do carrinho de recebimento. */
data class ItemCarrinho(
    val idTemp: Long,
    val produtoId: Int,
    val nome: String,
    val quantidade: Double,
    val validade: String?
)

/** Formulário do item sendo adicionado ao carrinho. */
data class ItemForm(
    val produtoId: Int = 0,
    val quantidade: String = "",
    val validade: String = ""
)

data class DoacoesUiState(
    val doacoes: List<DoacaoResponse> = emptyList(),
    val doadores: List<DoadorResponse> = emptyList(),
    val produtos: List<ProdutoResponse> = emptyList(),
    val busca: String = "",
    val carregando: Boolean = true,
    val erro: String? = null,
    val dialogAberto: Boolean = false,
    val doadorId: Int = 0,
    val carrinho: List<ItemCarrinho> = emptyList(),
    val itemForm: ItemForm = ItemForm(),
    val salvando: Boolean = false,
    val erroForm: String? = null,
    val mensagem: String? = null
)

class DoacoesViewModel(
    private val doacaoRepository: DoacaoRepository,
    private val doadorRepository: DoadorRepository,
    private val produtoRepository: ProdutoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DoacoesUiState())
    val uiState: StateFlow<DoacoesUiState> = _uiState.asStateFlow()

    init {
        carregar()
    }

    /** Carrega em paralelo histórico, doadores e produtos. */
    fun carregar() {
        _uiState.update { it.copy(carregando = true, erro = null) }
        viewModelScope.launch {
            val doacoes = doacaoRepository.listar()
            val doadores = doadorRepository.listar()
            val produtos = produtoRepository.listar()

            when (doacoes) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            doacoes = doacoes.data,
                            doadores = (doadores as? Resource.Success)?.data ?: emptyList(),
                            produtos = (produtos as? Resource.Success)?.data ?: emptyList(),
                            carregando = false
                        )
                    }
                }

                is Resource.Error ->
                    _uiState.update { it.copy(erro = doacoes.message, carregando = false) }

                Resource.Loading -> Unit
            }
        }
    }

    fun onBuscaChange(valor: String) = _uiState.update { it.copy(busca = valor) }

    fun abrirDialog() {
        _uiState.update {
            it.copy(
                dialogAberto = true,
                erroForm = null,
                doadorId = 0,
                carrinho = emptyList(),
                itemForm = ItemForm()
            )
        }
    }

    fun fecharDialog() {
        if (_uiState.value.salvando) return
        _uiState.update {
            it.copy(
                dialogAberto = false,
                erroForm = null,
                doadorId = 0,
                carrinho = emptyList(),
                itemForm = ItemForm()
            )
        }
    }

    fun onDoadorChange(id: Int) = _uiState.update { it.copy(doadorId = id, erroForm = null) }

    fun onItemFormChange(campo: String, valor: String) {
        _uiState.update { estado ->
            val form = when (campo) {
                "produtoId" -> estado.itemForm.copy(produtoId = valor.toIntOrNull() ?: 0)
                "quantidade" -> estado.itemForm.copy(quantidade = valor)
                "validade" -> estado.itemForm.copy(validade = valor)
                else -> estado.itemForm
            }
            estado.copy(itemForm = form, erroForm = null)
        }
    }

    /** Adiciona o item atual ao carrinho, validando a regra de validade. */
    fun adicionarItem() {
        val estado = _uiState.value
        val form = estado.itemForm

        if (form.produtoId <= 0 || form.quantidade.isBlank() || form.validade.isBlank()) {
            _uiState.update { it.copy(erroForm = "Preencha produto, quantidade e validade.") }
            return
        }
        val quantidade = form.quantidade.toDoubleOrNull() ?: 0.0
        if (quantidade <= 0) {
            _uiState.update { it.copy(erroForm = "A quantidade deve ser maior que zero.") }
            return
        }

        // Regra de negócio: validade não pode ser anterior a hoje.
        val validade = Formatters.parseData(form.validade)
        if (validade != null && validade.isBefore(LocalDateHoje())) {
            _uiState.update { it.copy(erroForm = "A validade não pode ser anterior a hoje.") }
            return
        }

        val produto = estado.produtos.find { it.id == form.produtoId }
        val novoItem = ItemCarrinho(
            idTemp = System.currentTimeMillis(),
            produtoId = form.produtoId,
            nome = produto?.nome ?: "Produto desconhecido",
            quantidade = quantidade,
            validade = form.validade
        )

        _uiState.update {
            it.copy(
                carrinho = it.carrinho + novoItem,
                itemForm = ItemForm(),
                erroForm = null
            )
        }
    }

    fun removerItem(idTemp: Long) =
        _uiState.update { it.copy(carrinho = it.carrinho.filterNot { item -> item.idTemp == idTemp }) }

    /** Conclui o recebimento enviando a doação completa para a API. */
    fun concluirRecebimento() {
        val estado = _uiState.value
        if (estado.doadorId <= 0 || estado.carrinho.isEmpty()) {
            _uiState.update { it.copy(erroForm = "Selecione um doador e adicione ao menos um item.") }
            return
        }

        _uiState.update { it.copy(salvando = true, erroForm = null) }
        viewModelScope.launch {
            val request = DoacaoCreateRequest(
                doadorId = estado.doadorId,
                data = java.time.LocalDateTime.now().toString(),
                itens = estado.carrinho.map { item ->
                    DoacaoItemCreateRequest(
                        produtoId = item.produtoId,
                        quantidade = item.quantidade,
                        dataValidade = item.validade
                    )
                }
            )
            when (val resultado = doacaoRepository.criar(request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(salvando = false, dialogAberto = false, mensagem = "Doação registrada com sucesso.")
                    }
                    carregar()
                }

                is Resource.Error ->
                    _uiState.update { it.copy(salvando = false, erroForm = resultado.message) }

                Resource.Loading -> Unit
            }
        }
    }

    fun limparMensagem() = _uiState.update { it.copy(mensagem = null) }

    /** Agrupa as doações por ID (como a tabela expansível do web). */
    fun agrupar(): List<DoacaoResponse> {
        val busca = _uiState.value.busca.lowercase().trim()
        return _uiState.value.doacoes.filter { doacao ->
            busca.isEmpty() || doacao.nomeDoador.lowercase().contains(busca)
        }
    }

    private fun LocalDateHoje() = java.time.LocalDate.now()
}
