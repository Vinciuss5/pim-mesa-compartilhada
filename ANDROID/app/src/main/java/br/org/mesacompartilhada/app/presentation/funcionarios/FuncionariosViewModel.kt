package br.org.mesacompartilhada.app.presentation.funcionarios

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.UsuarioCreateRequest
import br.org.mesacompartilhada.app.data.model.UsuarioResponse
import br.org.mesacompartilhada.app.data.repository.UsuarioRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FuncionarioForm(
    val nome: String = "",
    val email: String = "",
    val cpf: String = "",
    val telefone: String = "",
    val senha: String = "",
    val tipo: String = "FUNCIONARIO",
    val dataAdmissao: String = Formatters.hojeIso()
)

data class FuncionariosUiState(
    val lista: List<UsuarioResponse> = emptyList(),
    val busca: String = "",
    val carregando: Boolean = true,
    val erro: String? = null,
    val dialogAberto: Boolean = false,
    val salvando: Boolean = false,
    val erroForm: String? = null,
    val form: FuncionarioForm = FuncionarioForm(),
    val mensagem: String? = null
)

class FuncionariosViewModel(
    private val repository: UsuarioRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FuncionariosUiState())
    val uiState: StateFlow<FuncionariosUiState> = _uiState.asStateFlow()

    init {
        carregar()
    }

    fun carregar() {
        _uiState.update { it.copy(carregando = true, erro = null) }
        viewModelScope.launch {
            when (val resultado = repository.listar()) {
                is Resource.Success ->
                    _uiState.update { it.copy(lista = resultado.data, carregando = false) }

                is Resource.Error ->
                    _uiState.update { it.copy(erro = resultado.message, carregando = false) }

                Resource.Loading -> Unit
            }
        }
    }

    fun onBuscaChange(valor: String) = _uiState.update { it.copy(busca = valor) }

    fun abrirDialog() {
        _uiState.update {
            it.copy(dialogAberto = true, erroForm = null, form = FuncionarioForm())
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
                "email" -> estado.form.copy(email = valor)
                "cpf" -> estado.form.copy(cpf = Formatters.formatarCpf(valor))
                "telefone" -> estado.form.copy(telefone = Formatters.formatarTelefone(valor))
                "senha" -> estado.form.copy(senha = valor)
                "tipo" -> estado.form.copy(tipo = valor)
                "dataAdmissao" -> estado.form.copy(dataAdmissao = valor)
                else -> estado.form
            }
            estado.copy(form = form, erroForm = null)
        }
    }

    fun salvar() {
        val form = _uiState.value.form
        if (form.nome.isBlank() || form.email.isBlank() || form.senha.isBlank()) {
            _uiState.update { it.copy(erroForm = "Nome, e-mail e senha são obrigatórios.") }
            return
        }
        if (Formatters.somenteDigitos(form.cpf).length != 11) {
            _uiState.update { it.copy(erroForm = "O CPF deve ter 11 dígitos.") }
            return
        }
        if (form.senha.length < 8) {
            _uiState.update { it.copy(erroForm = "A senha deve ter no mínimo 8 caracteres.") }
            return
        }

        _uiState.update { it.copy(salvando = true, erroForm = null) }
        viewModelScope.launch {
            val request = UsuarioCreateRequest(
                nome = form.nome.trim(),
                email = form.email.trim().lowercase(),
                cpf = Formatters.somenteDigitos(form.cpf),
                telefone = Formatters.somenteDigitos(form.telefone).takeIf { it.isNotEmpty() },
                senha = form.senha,
                tipo = form.tipo.uppercase(),
                dataAdmissao = form.dataAdmissao
            )
            when (val resultado = repository.criar(request)) {
                is Resource.Success -> {
                    _uiState.update {
                        it.copy(
                            salvando = false,
                            dialogAberto = false,
                            lista = it.lista + resultado.data,
                            mensagem = "Funcionário cadastrado com sucesso."
                        )
                    }
                }

                is Resource.Error ->
                    _uiState.update { it.copy(salvando = false, erroForm = resultado.message) }

                Resource.Loading -> Unit
            }
        }
    }

    /** Ativa/desativa o funcionário, igual ao botão de status do web. */
    fun alternarStatus(funcionario: UsuarioResponse) {
        viewModelScope.launch {
            when (val resultado = repository.alternarStatus(funcionario)) {
                is Resource.Success -> carregar()
                is Resource.Error ->
                    _uiState.update { it.copy(mensagem = resultado.message) }
                Resource.Loading -> Unit
            }
        }
    }

    fun limparMensagem() = _uiState.update { it.copy(mensagem = null) }

    /** Filtra por nome, e-mail, CPF ou telefone (como no front web). */
    fun filtrar(): List<UsuarioResponse> {
        val busca = _uiState.value.busca.lowercase().trim()
        val digitos = Formatters.somenteDigitos(busca)
        if (busca.isEmpty()) return _uiState.value.lista
        return _uiState.value.lista.filter { func ->
            func.nome.lowercase().contains(busca) ||
                func.email.lowercase().contains(busca) ||
                (digitos.isNotEmpty() && Formatters.somenteDigitos(func.cpf).contains(digitos)) ||
                (digitos.isNotEmpty() && Formatters.somenteDigitos(func.telefone).contains(digitos))
        }
    }
}
