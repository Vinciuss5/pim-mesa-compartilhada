package br.org.mesacompartilhada.app.presentation.doadores

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.DoadorCreateRequest
import br.org.mesacompartilhada.app.data.model.DoadorResponse
import br.org.mesacompartilhada.app.data.repository.DoadorRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DoadorForm(
    val nome: String = "",
    val email: String = "",
    val cpf: String = "",
    val telefone: String = "",
    val endereco: String = ""
)

data class DoadoresUiState(
    val lista: List<DoadorResponse> = emptyList(),
    val busca: String = "",
    val carregando: Boolean = true,
    val erro: String? = null,
    val dialogAberto: Boolean = false,
    val salvando: Boolean = false,
    val erroForm: String? = null,
    val form: DoadorForm = DoadorForm(),
    val mensagem: String? = null
)

class DoadoresViewModel(
    private val repository: DoadorRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DoadoresUiState())
    val uiState: StateFlow<DoadoresUiState> = _uiState.asStateFlow()

    private var buscaJob: Job? = null

    init {
        carregar()
    }

    fun carregar(filtro: String? = null) {
        _uiState.update { it.copy(carregando = true, erro = null) }
        viewModelScope.launch {
            when (val resultado = repository.listar(filtro)) {
                is Resource.Success ->
                    _uiState.update { it.copy(lista = resultado.data, carregando = false) }

                is Resource.Error ->
                    _uiState.update { it.copy(erro = resultado.message, carregando = false) }

                Resource.Loading -> Unit
            }
        }
    }

    /** Busca com debounce de 500 ms, igual ao front web. */
    fun onBuscaChange(valor: String) {
        _uiState.update { it.copy(busca = valor) }
        buscaJob?.cancel()
        buscaJob = viewModelScope.launch {
            delay(500)
            carregar(valor.takeIf { it.isNotBlank() })
        }
    }

    fun abrirDialog() {
        _uiState.update { it.copy(dialogAberto = true, erroForm = null, form = DoadorForm()) }
    }

    fun fecharDialog() {
        if (_uiState.value.salvando) return
        _uiState.update { it.copy(dialogAberto = false, erroForm = null) }
    }

    fun onFormChange(campo: String, valor: String) {
        _uiState.update { estado ->
            val form = when (campo) {
                "nome" -> estado.form.copy(nome = valor)
                "email" -> estado.form.copy(email = valor)
                "cpf" -> estado.form.copy(cpf = Formatters.formatarCpf(valor))
                "telefone" -> estado.form.copy(telefone = Formatters.formatarTelefone(valor))
                "endereco" -> estado.form.copy(endereco = valor)
                else -> estado.form
            }
            estado.copy(form = form, erroForm = null)
        }
    }

    fun salvar() {
        val form = _uiState.value.form
        if (form.nome.isBlank()) {
            _uiState.update { it.copy(erroForm = "O nome do doador é obrigatório.") }
            return
        }
        val cpf = Formatters.somenteDigitos(form.cpf)
        if (cpf.isNotEmpty() && cpf.length != 11) {
            _uiState.update { it.copy(erroForm = "O CPF deve ter 11 dígitos.") }
            return
        }

        _uiState.update { it.copy(salvando = true, erroForm = null) }
        viewModelScope.launch {
            val request = DoadorCreateRequest(
                nome = form.nome.trim(),
                email = form.email.trim().takeIf { it.isNotBlank() },
                telefone = Formatters.somenteDigitos(form.telefone).takeIf { it.isNotEmpty() },
                cpf = cpf.takeIf { it.isNotEmpty() },
                endereco = form.endereco.trim().takeIf { it.isNotBlank() }
            )
            when (val resultado = repository.criar(request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            salvando = false,
                            dialogAberto = false,
                            lista = it.lista + resultado.data,
                            mensagem = "Doador cadastrado com sucesso."
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

    /** Filtra localmente por nome, CPF ou e-mail (complemento à busca da API). */
    fun filtrar(): List<DoadorResponse> {
        val busca = _uiState.value.busca.lowercase().trim()
        val digitos = Formatters.somenteDigitos(busca)
        if (busca.isEmpty()) return _uiState.value.lista
        return _uiState.value.lista.filter { doador ->
            doador.nome.lowercase().contains(busca) ||
                (doador.email?.lowercase()?.contains(busca) == true) ||
                (digitos.isNotEmpty() && Formatters.somenteDigitos(doador.cpf).contains(digitos))
        }
    }
}
