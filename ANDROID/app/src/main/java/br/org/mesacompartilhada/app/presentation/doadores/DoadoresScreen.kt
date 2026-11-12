package br.org.mesacompartilhada.app.presentation.doadores

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
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
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.data.model.DoadorResponse
import br.org.mesacompartilhada.app.di.AppContainer
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
fun DoadoresScreen(container: AppContainer) {
    val viewModel: DoadoresViewModel = viewModel(factory = container.viewModelFactory)
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
            OutlinedTextField(
                value = state.busca,
                onValueChange = viewModel::onBuscaChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("Buscar por nome, CPF ou e-mail…") },
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
                state.erro != null -> EstadoErro(mensagem = state.erro!!, onTentarNovamente = { viewModel.carregar() })
                state.lista.isEmpty() -> EstadoVazio(texto = "Nenhum doador cadastrado.")
                else -> {
                    val filtrados = viewModel.filtrar()
                    if (filtrados.isEmpty()) {
                        EstadoVazio(texto = "Nenhum doador corresponde à busca.")
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                start = 16.dp, end = 16.dp, top = 8.dp, bottom = 96.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(filtrados, key = { it.id }) { doador ->
                                CardDoador(doador)
                            }
                        }
                    }
                }
            }
        }
    }

    if (state.dialogAberto) {
        DialogFormularioDoador(
            state = state,
            onCampo = viewModel::onFormChange,
            onFechar = viewModel::fecharDialog,
            onSalvar = viewModel::salvar
        )
    }
}

@Composable
private fun CardDoador(doador: DoadorResponse) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BordaCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = doador.nome,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextoPrincipal
            )
            Spacer(modifier = Modifier.height(6.dp))
            doador.email?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = TextoSecundario)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "CPF ${Formatters.formatarCpf(doador.cpf)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextoSecundario
                )
                Text(
                    Formatters.formatarTelefone(doador.telefone),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextoSecundario
                )
            }
            doador.endereco?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextoSecundario
                )
            }
        }
    }
}

@Composable
private fun DialogFormularioDoador(
    state: DoadoresUiState,
    onCampo: (String, String) -> Unit,
    onFechar: () -> Unit,
    onSalvar: () -> Unit
) {
    val form = state.form
    DialogoFormulario(
        titulo = "Cadastrar Doador",
        aoFechar = onFechar,
        aoSalvar = onSalvar,
        salvando = state.salvando
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
        CampoTexto(form.email, { onCampo("email", it) }, "E-mail", placeholder = "doador@exemplo.com")
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(form.cpf, { onCampo("cpf", it) }, "CPF", placeholder = "000.000.000-00")
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(form.telefone, { onCampo("telefone", it) }, "Telefone", placeholder = "(00) 00000-0000")
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(form.endereco, { onCampo("endereco", it) }, "Endereço completo")
    }
}
