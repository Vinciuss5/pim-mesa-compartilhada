package br.org.mesacompartilhada.app.presentation.doacoes

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
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
import br.org.mesacompartilhada.app.data.model.DoacaoResponse
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
fun DoacoesScreen(container: AppContainer) {
    val viewModel: DoacoesViewModel = viewModel(factory = container.viewModelFactory)
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
                text = { Text("Registrar") },
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
                placeholder = { Text("Buscar pelo nome do doador…") },
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
                state.doacoes.isEmpty() -> EstadoVazio(texto = "Nenhuma doação registrada.")
                else -> {
                    val historico = viewModel.agrupar()
                    if (historico.isEmpty()) {
                        EstadoVazio(texto = "Nenhuma doação corresponde à busca.")
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                start = 16.dp, end = 16.dp, top = 8.dp, bottom = 96.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(historico, key = { it.id }) { doacao ->
                                CardDoacao(doacao)
                            }
                        }
                    }
                }
            }
        }
    }

    if (state.dialogAberto) {
        DialogRegistroDoacao(
            state = state,
            onDoador = viewModel::onDoadorChange,
            onItemForm = viewModel::onItemFormChange,
            onAdicionarItem = viewModel::adicionarItem,
            onRemoverItem = viewModel::removerItem,
            onFechar = viewModel::fecharDialog,
            onConcluir = viewModel::concluirRecebimento
        )
    }
}

@Composable
private fun CardDoacao(doacao: DoacaoResponse) {
    var expandida by remember { mutableStateOf(false) }

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
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "ENT-${doacao.id.toString().padStart(4, '0')}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextoSecundario
                    )
                    Text(
                        text = doacao.nomeDoador,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextoPrincipal
                    )
                    Text(
                        text = Formatters.formatarData(doacao.data),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextoSecundario
                    )
                }
                TextButtonToggle(expandida) { expandida = !expandida }
            }

            if (expandida) {
                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDividerSimulado()
                doacao.itens.forEach { item ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = item.nomeProduto,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextoPrincipal,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "${Formatters.formatarNumero(item.quantidade)} ${item.unidade}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextoSecundario
                        )
                        Text(
                            text = Formatters.formatarData(item.dataValidade),
                            style = MaterialTheme.typography.bodySmall,
                            color = TextoSecundario
                        )
                    }
                }
            } else {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "${doacao.itens.size} item(ns)",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextoSecundario
                )
            }
        }
    }
}

@Composable
private fun TextButtonToggle(expandida: Boolean, onClick: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = if (expandida) "Ocultar" else "Ver itens",
            style = MaterialTheme.typography.bodySmall,
            color = VerdePrimario,
            fontWeight = FontWeight.SemiBold
        )
        Icon(
            imageVector = if (expandida) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
            contentDescription = null,
            tint = VerdePrimario
        )
    }
}

@Composable
private fun HorizontalDividerSimulado() {
    androidx.compose.material3.HorizontalDivider(color = BordaCard)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DialogRegistroDoacao(
    state: DoacoesUiState,
    onDoador: (Int) -> Unit,
    onItemForm: (String, String) -> Unit,
    onAdicionarItem: () -> Unit,
    onRemoverItem: (Long) -> Unit,
    onFechar: () -> Unit,
    onConcluir: () -> Unit
) {
    var doadorExpandido by remember { mutableStateOf(false) }
    var produtoExpandido by remember { mutableStateOf(false) }
    val doadorSelecionado = state.doadores.find { it.id == state.doadorId }
    val produtoSelecionado = state.produtos.find { it.id == state.itemForm.produtoId }

    DialogoFormulario(
        titulo = "Registrar Nova Entrada",
        aoFechar = onFechar,
        aoSalvar = onConcluir,
        textoSalvar = "Concluir Recebimento",
        salvando = state.salvando,
        habilitadoSalvar = state.doadorId > 0 && state.carrinho.isNotEmpty()
    ) {
        if (state.erroForm != null) {
            Text(
                text = state.erroForm ?: "",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

        // 1. Doador
        Text("1. Doador *", style = MaterialTheme.typography.labelLarge, color = TextoPrincipal)
        Spacer(modifier = Modifier.height(4.dp))
        ExposedDropdownMenuBox(expanded = doadorExpandido, onExpandedChange = { doadorExpandido = it }) {
            OutlinedTextField(
                value = doadorSelecionado?.nome ?: "Selecione um doador…",
                onValueChange = {},
                readOnly = true,
                singleLine = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = doadorExpandido) },
                modifier = Modifier.fillMaxWidth().menuAnchor(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = VerdePrimario,
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                )
            )
            ExposedDropdownMenu(expanded = doadorExpandido, onDismissRequest = { doadorExpandido = false }) {
                state.doadores.forEach { doador ->
                    DropdownMenuItem(
                        text = { Text(doador.nome) },
                        onClick = {
                            onDoador(doador.id)
                            doadorExpandido = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 2. Adicionar produto
        Text("2. Adicionar produto", style = MaterialTheme.typography.labelLarge, color = TextoPrincipal)
        Spacer(modifier = Modifier.height(4.dp))
        ExposedDropdownMenuBox(expanded = produtoExpandido, onExpandedChange = { produtoExpandido = it }) {
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
            ExposedDropdownMenu(expanded = produtoExpandido, onDismissRequest = { produtoExpandido = false }) {
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
        Spacer(modifier = Modifier.height(10.dp))
        // Validade em formato AAAA-MM-DD (padrão do date picker nativo)
        CampoTexto(
            state.itemForm.validade, { onItemForm("validade", it) },
            "Validade (AAAA-MM-DD)", obrigatorio = true,
            placeholder = "2026-12-31"
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedButton(
            onClick = onAdicionarItem,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Inserir item", color = VerdePrimario)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 3. Carrinho
        Text(
            "3. Itens desta doação (${state.carrinho.size})",
            style = MaterialTheme.typography.labelLarge,
            color = TextoPrincipal
        )
        Spacer(modifier = Modifier.height(6.dp))
        if (state.carrinho.isEmpty()) {
            Text(
                "Nenhum item adicionado ainda.",
                style = MaterialTheme.typography.bodySmall,
                color = TextoSecundario
            )
        } else {
            state.carrinho.forEach { item ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(item.nome, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                        Text(
                            "Validade: ${Formatters.formatarData(item.validade)}  •  " +
                                "${Formatters.formatarNumero(item.quantidade)} un",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextoSecundario
                        )
                    }
                    IconButton(onClick = { onRemoverItem(item.idTemp) }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Remover", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}
