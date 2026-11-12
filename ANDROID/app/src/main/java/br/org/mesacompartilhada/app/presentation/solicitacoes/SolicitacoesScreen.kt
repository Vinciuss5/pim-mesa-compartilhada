package br.org.mesacompartilhada.app.presentation.solicitacoes

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
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import br.org.mesacompartilhada.app.core.Formatters
import br.org.mesacompartilhada.app.data.model.SolicitacaoResponse
import br.org.mesacompartilhada.app.di.AppContainer
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
fun SolicitacoesScreen(container: AppContainer) {
    val viewModel: SolicitacoesViewModel = viewModel(factory = container.viewModelFactory)
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
                text = { Text("Nova") },
                icon = { Icon(Icons.Filled.Add, contentDescription = null) }
            )
        },
        containerColor = Color.Transparent
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Busca + filtro de status (empilhados: o dropdown do filtro tem largura
            // mínima própria e, lado a lado, esmagava o campo de busca)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
            ) {
                OutlinedTextField(
                    value = state.busca,
                    onValueChange = viewModel::onBuscaChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Buscar solicitante…") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VerdePrimario,
                        unfocusedContainerColor = Color.White,
                        focusedContainerColor = Color.White
                    )
                )
                Spacer(modifier = Modifier.height(8.dp))
                FiltroStatusSolicitacoes(
                    valor = state.filtroStatus,
                    aoMudar = viewModel::onFiltroStatusChange,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            when {
                state.carregando -> EstadoCarregando()
                state.erro != null -> EstadoErro(mensagem = state.erro!!, onTentarNovamente = viewModel::carregar)
                state.lista.isEmpty() -> EstadoVazio(texto = "Nenhuma solicitação registrada.")
                else -> {
                    val itens = viewModel.filtrar()
                    if (itens.isEmpty()) {
                        EstadoVazio(texto = "Nenhuma solicitação corresponde ao filtro.")
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                start = 16.dp, end = 16.dp, top = 8.dp, bottom = 96.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(itens, key = { it.id }) { sol ->
                                CardSolicitacao(
                                    sol = sol,
                                    onStatus = { novo -> viewModel.atualizarStatus(sol.id, novo) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (state.dialogAberto) {
        DialogNovaSolicitacao(
            state = state,
            onSolicitante = viewModel::onSolicitanteChange,
            onObservacao = viewModel::onObservacaoChange,
            onItemForm = viewModel::onItemFormChange,
            onAdicionarItem = viewModel::adicionarItem,
            onRemoverItem = viewModel::removerItem,
            onFechar = viewModel::fecharDialog,
            onCriar = viewModel::criarSolicitacao
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FiltroStatusSolicitacoes(
    valor: String,
    aoMudar: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var expandido by remember { mutableStateOf(false) }
    val opcoes = listOf("Todos", "PENDENTE", "ENTREGUE", "CANCELADO")

    ExposedDropdownMenuBox(
        expanded = expandido,
        onExpandedChange = { expandido = it },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = valor,
            onValueChange = {},
            readOnly = true,
            singleLine = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandido) },
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VerdePrimario,
                unfocusedContainerColor = Color.White,
                focusedContainerColor = Color.White
            )
        )
        ExposedDropdownMenu(expanded = expandido, onDismissRequest = { expandido = false }) {
            opcoes.forEach { opcao ->
                DropdownMenuItem(text = { Text(opcao) }, onClick = {
                    aoMudar(opcao)
                    expandido = false
                })
            }
        }
    }
}

@Composable
private fun CardSolicitacao(sol: SolicitacaoResponse, onStatus: (String) -> Unit) {
    val corStatus = when (sol.status.uppercase()) {
        "PENDENTE" -> CoresStatus.pendente
        "ENTREGUE" -> CoresStatus.entregue
        "CANCELADO" -> CoresStatus.cancelado
        else -> TextoSecundario
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BordaCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = sol.nomeSolicitante,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextoPrincipal,
                    modifier = Modifier.weight(1f)
                )
                ChipStatus(texto = sol.status, cor = corStatus)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Solicitação #${sol.id}  •  ${Formatters.formatarData(sol.dataSolicitacao)}",
                style = MaterialTheme.typography.bodySmall,
                color = TextoSecundario
            )
            sol.observacao?.takeIf { it.isNotBlank() }?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(it, style = MaterialTheme.typography.bodySmall, color = TextoSecundario)
            }

            Spacer(modifier = Modifier.height(8.dp))
            sol.itens.forEach { item ->
                Text(
                    text = "• ${item.nomeProduto} — ${Formatters.formatarNumero(item.quantidade)} ${item.unidade}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextoPrincipal
                )
            }

            // Ações de status (apenas para pendentes)
            if (sol.status.equals("PENDENTE", ignoreCase = true)) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { onStatus("ENTREGUE") }) {
                        Text("Entregar", color = VerdePrimario)
                    }
                    OutlinedButton(onClick = { onStatus("CANCELADO") }) {
                        Text("Cancelar", color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DialogNovaSolicitacao(
    state: SolicitacoesUiState,
    onSolicitante: (Int) -> Unit,
    onObservacao: (String) -> Unit,
    onItemForm: (String, String) -> Unit,
    onAdicionarItem: () -> Unit,
    onRemoverItem: (Long) -> Unit,
    onFechar: () -> Unit,
    onCriar: () -> Unit
) {
    var solicitanteExpandido by remember { mutableStateOf(false) }
    var produtoExpandido by remember { mutableStateOf(false) }
    val solicitanteSelecionado = state.solicitantes.find { it.id == state.solicitanteId }
    val produtoSelecionado = state.produtos.find { it.id == state.itemForm.produtoId }

    DialogoFormulario(
        titulo = "Nova Solicitação",
        aoFechar = onFechar,
        aoSalvar = onCriar,
        textoSalvar = "Criar Solicitação",
        salvando = state.salvando,
        habilitadoSalvar = state.solicitanteId > 0 && state.carrinho.isNotEmpty()
    ) {
        if (state.erroForm != null) {
            Text(
                text = state.erroForm ?: "",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

        Text("1. Solicitante *", style = MaterialTheme.typography.labelLarge, color = TextoPrincipal)
        Spacer(modifier = Modifier.height(4.dp))
        ExposedDropdownMenuBox(
            expanded = solicitanteExpandido,
            onExpandedChange = { solicitanteExpandido = it }
        ) {
            OutlinedTextField(
                value = solicitanteSelecionado?.nome ?: "Selecione um solicitante…",
                onValueChange = {},
                readOnly = true,
                singleLine = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = solicitanteExpandido) },
                modifier = Modifier.fillMaxWidth().menuAnchor(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = VerdePrimario,
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                )
            )
            ExposedDropdownMenu(
                expanded = solicitanteExpandido,
                onDismissRequest = { solicitanteExpandido = false }
            ) {
                state.solicitantes.forEach { sol ->
                    DropdownMenuItem(
                        text = { Text(sol.nome) },
                        onClick = {
                            onSolicitante(sol.id)
                            solicitanteExpandido = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("2. Itens", style = MaterialTheme.typography.labelLarge, color = TextoPrincipal)
        Spacer(modifier = Modifier.height(4.dp))
        ExposedDropdownMenuBox(
            expanded = produtoExpandido,
            onExpandedChange = { produtoExpandido = it }
        ) {
            OutlinedTextField(
                value = produtoSelecionado?.nome ?: "Selecione…",
                onValueChange = {},
                readOnly = true,
                singleLine = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = produtoExpandido) },
                modifier = Modifier.fillMaxWidth().menuAnchor(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = VerdePrimario,
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                )
            )
            ExposedDropdownMenu(
                expanded = produtoExpandido,
                onDismissRequest = { produtoExpandido = false }
            ) {
                state.produtos.forEach { produto ->
                    DropdownMenuItem(
                        text = { Text(produto.nome) },
                        onClick = {
                            onItemForm("produtoId", produto.id.toString())
                            produtoExpandido = false
                        }
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(
            state.itemForm.quantidade, { onItemForm("quantidade", it) },
            "Quantidade", placeholder = "0.00"
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedButton(onClick = onAdicionarItem, modifier = Modifier.fillMaxWidth()) {
            Text("Inserir item", color = VerdePrimario)
        }

        Spacer(modifier = Modifier.height(12.dp))
        if (state.carrinho.isNotEmpty()) {
            Text(
                "Itens (${state.carrinho.size})",
                style = MaterialTheme.typography.labelLarge,
                color = TextoPrincipal
            )
            state.carrinho.forEach { item ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "${item.nome} — ${Formatters.formatarNumero(item.quantidade)} un",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = { onRemoverItem(item.idTemp) }) {
                        Icon(
                            Icons.Filled.Delete,
                            contentDescription = "Remover",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        CampoTexto(state.observacao, onObservacao, "Observação (opcional)")
    }
}
