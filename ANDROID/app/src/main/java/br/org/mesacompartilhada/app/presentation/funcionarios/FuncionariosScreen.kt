package br.org.mesacompartilhada.app.presentation.funcionarios

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import br.org.mesacompartilhada.app.di.AppContainer
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.data.model.UsuarioResponse
import br.org.mesacompartilhada.app.presentation.components.ChipStatus
import br.org.mesacompartilhada.app.presentation.components.CoresStatus
import br.org.mesacompartilhada.app.presentation.components.CampoTexto
import br.org.mesacompartilhada.app.presentation.components.DialogoFormulario
import br.org.mesacompartilhada.app.presentation.components.EstadoCarregando
import br.org.mesacompartilhada.app.presentation.components.EstadoErro
import br.org.mesacompartilhada.app.presentation.components.EstadoVazio
import br.org.mesacompartilhada.app.presentation.theme.BordaCard
import br.org.mesacompartilhada.app.presentation.theme.TextoPrincipal
import br.org.mesacompartilhada.app.presentation.theme.TextoSecundario
import br.org.mesacompartilhada.app.presentation.theme.VerdePrimario

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FuncionariosScreen(container: AppContainer) {
    val viewModel: FuncionariosViewModel = viewModel(factory = container.viewModelFactory)
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.mensagem) {
        state.mensagem?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.limparMensagem()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = viewModel::abrirDialog,
                containerColor = VerdePrimario,
                text = { Text("Novo") },
                icon = { Icon(Icons.Filled.Add, contentDescription = null) }
            )
        },
        containerColor = Color.Transparent
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Busca
            OutlinedTextField(
                value = state.busca,
                onValueChange = viewModel::onBuscaChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("Filtrar por nome, CPF ou e-mail…") },
                leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = VerdePrimario,
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                )
            )

            when {
                state.carregando -> EstadoCarregando()
                state.erro != null -> EstadoErro(mensagem = state.erro!!, onTentarNovamente = viewModel::carregar)
                state.lista.isEmpty() -> EstadoVazio(texto = "Nenhum funcionário cadastrado.")
                else -> {
                    val filtrados = viewModel.filtrar()
                    if (filtrados.isEmpty()) {
                        EstadoVazio(texto = "Nenhum funcionário corresponde à busca.")
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                                start = 16.dp, end = 16.dp, top = 8.dp, bottom = 96.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(filtrados, key = { it.id }) { func ->
                                CardFuncionario(func, onAlternarStatus = { viewModel.alternarStatus(func) })
                            }
                        }
                    }
                }
            }
        }
    }

    if (state.dialogAberto) {
        DialogFormularioFuncionario(
            state = state,
            onCampo = viewModel::onFormChange,
            onFechar = viewModel::fecharDialog,
            onSalvar = viewModel::salvar
        )
    }
}

@Composable
private fun CardFuncionario(func: UsuarioResponse, onAlternarStatus: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, BordaCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = func.nome,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextoPrincipal,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                ChipStatus(
                    texto = func.tipo,
                    cor = if (func.tipo == "ADMIN") br.org.mesacompartilhada.app.presentation.theme.RoxoAdmin
                    else br.org.mesacompartilhada.app.presentation.theme.AzulInfo
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(func.email, style = MaterialTheme.typography.bodySmall, color = TextoSecundario)
            // O telefone é opcional: sem ele, o separador "•" não deve aparecer.
            val telefoneFormatado = Formatters.formatarTelefone(func.telefone)
            Text(
                text = if (telefoneFormatado.isEmpty()) {
                    "CPF ${Formatters.formatarCpf(func.cpf)}"
                } else {
                    "CPF ${Formatters.formatarCpf(func.cpf)}  •  $telefoneFormatado"
                },
                style = MaterialTheme.typography.bodySmall,
                color = TextoSecundario
            )
            Text(
                text = "Admissão: ${Formatters.formatarData(func.dataAdmissao)}",
                style = MaterialTheme.typography.bodySmall,
                color = TextoSecundario
            )
            Spacer(modifier = Modifier.height(12.dp))
            TextButton(onClick = onAlternarStatus) {
                Text(
                    text = if (func.ativo) "Desativar" else "Ativar",
                    color = if (func.ativo) br.org.mesacompartilhada.app.presentation.theme.VermelhoAlerta
                    else VerdePrimario
                )
            }
        }
    }
}

@Composable
private fun DialogFormularioFuncionario(
    state: FuncionariosUiState,
    onCampo: (String, String) -> Unit,
    onFechar: () -> Unit,
    onSalvar: () -> Unit
) {
    val form = state.form
    DialogoFormulario(
        titulo = "Novo Funcionário",
        aoFechar = onFechar,
        aoSalvar = onSalvar,
        salvando = state.salvando,
        habilitadoSalvar = true
    ) {
        if (state.erroForm != null) {
            Text(
                text = state.erroForm ?: "",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(12.dp))
        }
        CampoTexto(form.nome, { onCampo("nome", it) }, "Nome completo", obrigatorio = true)
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(form.email, { onCampo("email", it) }, "E-mail", obrigatorio = true)
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(
            form.cpf, { onCampo("cpf", it) }, "CPF", obrigatorio = true,
            placeholder = "000.000.000-00"
        )
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(
            form.telefone, { onCampo("telefone", it) }, "Telefone",
            placeholder = "(00) 00000-0000"
        )
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(form.senha, { onCampo("senha", it) }, "Senha", obrigatorio = true, senha = true)
        Spacer(modifier = Modifier.height(10.dp))
        // Perfil: ADMIN ou FUNCIONARIO
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TipoChip("FUNCIONARIO", form.tipo == "FUNCIONARIO") { onCampo("tipo", "FUNCIONARIO") }
            TipoChip("ADMIN", form.tipo == "ADMIN") { onCampo("tipo", "ADMIN") }
        }
    }
}

@Composable
private fun TipoChip(texto: String, selecionado: Boolean, onClick: () -> Unit) {
    TextButton(onClick = onClick) {
        Text(
            text = texto,
            color = if (selecionado) VerdePrimario else TextoSecundario,
            fontWeight = if (selecionado) FontWeight.Bold else FontWeight.Normal
        )
    }
}
