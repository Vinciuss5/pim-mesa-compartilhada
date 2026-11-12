package br.org.mesacompartilhada.app.presentation.solicitantes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.SolicitanteCreateRequest
import br.org.mesacompartilhada.app.data.model.SolicitanteResponse
import br.org.mesacompartilhada.app.data.repository.SolicitanteRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SolicitanteForm(
    val nome: String = "",
    val cpf: String = "",
    val telefone: String = "",
    val email: String = "",
    val enderecoEntrega: String = ""
)

data class SolicitantesUiState(
    val lista: List<SolicitanteResponse> = emptyList(),
    val busca: String = "",
    val carregando: Boolean = true,
    val erro: String? = null,
    val dialogAberto: Boolean = false,
    val salvando: Boolean = false,
    val erroForm: String? = null,
    val form: SolicitanteForm = SolicitanteForm(),
    val mensagem: String? = null
)

class SolicitantesViewModel(
    private val repository: SolicitanteRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SolicitantesUiState())
    val uiState: StateFlow<SolicitantesUiState> = _uiState.asStateFlow()

    private var buscaJob: Job? = null

    init {
        carregar()
    }

    fun carregar(search: String? = null) {
        _uiState.update { it.copy(carregando = true, erro = null) }
        viewModelScope.launch {
            when (val resultado = repository.listar(search)) {
                is Resource.Success ->
                    _uiState.update { it.copy(lista = resultado.data, carregando = false) }

                is Resource.Error ->
                    _uiState.update { it.copy(erro = resultado.message, carregando = false) }

                Resource.Loading -> Unit
            }
        }
    }

    fun onBuscaChange(valor: String) {
        _uiState.update { it.copy(busca = valor) }
        buscaJob?.cancel()
        buscaJob = viewModelScope.launch {
            delay(500)
            carregar(valor.takeIf { it.isNotBlank() })
        }
    }

    fun abrirDialog() {
        _uiState.update { it.copy(dialogAberto = true, erroForm = null, form = SolicitanteForm()) }
    }

    fun fecharDialog() {
        if (_uiState.value.salvando) return
        _uiState.update { it.copy(dialogAberto = false, erroForm = null) }
    }

    fun onFormChange(campo: String, valor: String) {
        _uiState.update { estado ->
            val form = when (campo) {
                "nome" -> estado.form.copy(nome = valor)
                "cpf" -> estado.form.copy(cpf = Formatters.formatarCpf(valor))
                "telefone" -> estado.form.copy(telefone = Formatters.formatarTelefone(valor))
                "email" -> estado.form.copy(email = valor)
                "enderecoEntrega" -> estado.form.copy(enderecoEntrega = valor)
                else -> estado.form
            }
            estado.copy(form = form, erroForm = null)
        }
    }

    fun salvar() {
        val form = _uiState.value.form
        if (form.nome.isBlank()) {
            _uiState.update { it.copy(erroForm = "O nome do solicitante é obrigatório.") }
            return
        }
        if (Formatters.somenteDigitos(form.cpf).length != 11) {
            _uiState.update { it.copy(erroForm = "O CPF deve ter exatamente 11 dígitos.") }
            return
        }
        if (form.enderecoEntrega.isBlank()) {
            _uiState.update { it.copy(erroForm = "O endereço de entrega é obrigatório.") }
            return
        }

        _uiState.update { it.copy(salvando = true, erroForm = null) }
        viewModelScope.launch {
            val request = SolicitanteCreateRequest(
                nome = form.nome.trim(),
                cpf = Formatters.somenteDigitos(form.cpf),
                telefone = Formatters.somenteDigitos(form.telefone).takeIf { it.isNotEmpty() },
                enderecoEntrega = form.enderecoEntrega.trim(),
                email = form.email.trim().takeIf { it.isNotBlank() }
            )
            when (val resultado = repository.criar(request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            salvando = false,
                            dialogAberto = false,
                            lista = it.lista + resultado.data,
                            mensagem = "Solicitante cadastrado com sucesso."
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

    fun filtrar(): List<SolicitanteResponse> {
        val busca = _uiState.value.busca.lowercase().trim()
        val digitos = Formatters.somenteDigitos(busca)
        if (busca.isEmpty()) return _uiState.value.lista
        return _uiState.value.lista.filter { sol ->
            sol.nome.lowercase().contains(busca) ||
                (sol.email?.lowercase()?.contains(busca) == true) ||
                (digitos.isNotEmpty() && Formatters.somenteDigitos(sol.cpf).contains(digitos))
        }
    }
}
