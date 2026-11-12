package br.org.mesacompartilhada.app.presentation.estoque

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
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
import br.org.mesacompartilhada.app.data.model.EstoqueResponse
import br.org.mesacompartilhada.app.di.AppContainer
import br.org.mesacompartilhada.app.presentation.components.ChipStatus
import br.org.mesacompartilhada.app.presentation.components.CoresStatus
import br.org.mesacompartilhada.app.presentation.components.CampoTexto
import br.org.mesacompartilhada.app.presentation.components.DialogoFormulario
import br.org.mesacompartilhada.app.presentation.components.EstadoCarregando
import br.org.mesacompartilhada.app.presentation.components.EstadoErro
import br.org.mesacompartilhada.app.presentation.components.EstadoVazio
import br.org.mesacompartilhada.app.presentation.theme.BordaCard
import br.org.mesacompartilhada.app.presentation.theme.LaranjaAlerta
import br.org.mesacompartilhada.app.presentation.theme.TextoPrincipal
import br.org.mesacompartilhada.app.presentation.theme.TextoSecundario
import br.org.mesacompartilhada.app.presentation.theme.VerdePrimario

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EstoqueScreen(container: AppContainer) {
    val viewModel: EstoqueViewModel = viewModel(factory = container.viewModelFactory)
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
                text = { Text("Produto") },
                icon = { Icon(Icons.Filled.Add, contentDescription = null) }
            )
        },
        containerColor = Color.Transparent
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Indicadores (KPIs)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                CardKpi("Itens", state.metrics.skusAtivos.toString(), "SKUs ativos", VerdePrimario, Modifier.weight(1f))
                CardKpi("Baixo", state.metrics.baixoEstoque.toString(), "Ação preventiva", LaranjaAlerta, Modifier.weight(1f))
                CardKpi("Vencimento", state.metrics.vencimentoProximo.toString(), "Próx. 90 dias", LaranjaAlerta, Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Busca + filtro de status (empilhados: o dropdown do filtro tem largura
            // mínima própria e, lado a lado, esmagava o campo de busca)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                OutlinedTextField(
                    value = state.busca,
                    onValueChange = viewModel::onBuscaChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Filtrar por nome ou origem…") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VerdePrimario,
                        unfocusedContainerColor = Color.White,
                        focusedContainerColor = Color.White
                    )
                )
                Spacer(modifier = Modifier.height(8.dp))
                FiltroStatus(
                    valor = state.filtroStatus,
                    aoMudar = viewModel::onFiltroStatusChange,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            when {
                state.carregando -> EstadoCarregando()
                state.erro != null -> EstadoErro(mensagem = state.erro!!, onTentarNovamente = viewModel::carregar)
                state.lista.isEmpty() -> EstadoVazio(texto = "Nenhum item em estoque.")
                else -> {
                    val itens = viewModel.filtrar()
                    if (itens.isEmpty()) {
                        EstadoVazio(texto = "Nenhum produto corresponde ao filtro.")
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                start = 16.dp, end = 16.dp, top = 8.dp, bottom = 96.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(itens, key = { it.id }) { item ->
                                CardEstoque(item)
                            }
                        }
                    }
                }
            }
        }
    }

    if (state.dialogAberto) {
        DialogCadastroProduto(
            state = state,
            onCampo = viewModel::onFormChange,
            onFechar = viewModel::fecharDialog,
            onSalvar = viewModel::salvarProduto
        )
    }
}

@Composable
private fun CardKpi(
    titulo: String,
    valor: String,
    subtitulo: String,
    cor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BordaCard)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(titulo.uppercase(), style = MaterialTheme.typography.bodySmall, color = TextoSecundario)
            Text(
                valor,
                style = MaterialTheme.typography.headlineMedium,
                color = cor,
                fontWeight = FontWeight.ExtraBold
            )
            Text(subtitulo, style = MaterialTheme.typography.bodySmall, color = cor)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FiltroStatus(
    valor: String,
    aoMudar: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var expandido by remember { mutableStateOf(false) }
    val opcoes = listOf("Todos os Status", "Disponível", "Baixo Estoque", "Esgotado")

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
                DropdownMenuItem(
                    text = { Text(opcao) },
                    onClick = {
                        aoMudar(opcao)
                        expandido = false
                    }
                )
            }
        }
    }
}

@Composable
private fun CardEstoque(item: EstoqueResponse) {
    val statusNormal = item.status.lowercase()
    val corStatus = when {
        statusNormal.contains("dispon") -> CoresStatus.disponivel
        statusNormal.contains("baixo") -> CoresStatus.baixoEstoque
        statusNormal.contains("esgot") -> CoresStatus.esgotado
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
                    text = item.produtoNome,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextoPrincipal,
                    modifier = Modifier.weight(1f)
                )
                ChipStatus(texto = item.status, cor = corStatus)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Column {
                    Text("Estoque", style = MaterialTheme.typography.bodySmall, color = TextoSecundario)
                    Text(
                        "${Formatters.formatarNumero(item.quantidade)} ${item.unidade}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextoPrincipal
                    )
                }
                Column {
                    Text("Origem", style = MaterialTheme.typography.bodySmall, color = TextoSecundario)
                    Text(
                        item.origem.ifBlank { "N/D" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextoPrincipal
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Entrada: ${Formatters.formatarData(item.dataEntrada)}  •  " +
                    "Validade: ${Formatters.formatarData(item.validade)}",
                style = MaterialTheme.typography.bodySmall,
                color = TextoSecundario
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DialogCadastroProduto(
    state: EstoqueUiState,
    onCampo: (String, String) -> Unit,
    onFechar: () -> Unit,
    onSalvar: () -> Unit
) {
    var unidadeExpandida by remember { mutableStateOf(false) }
    val unidadeSelecionada = state.unidades.find { it.id == state.form.unidadeMedidaId }

    DialogoFormulario(
        titulo = "Cadastrar Produto",
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
        CampoTexto(
            state.form.nome, { onCampo("nome", it) },
            "Nome do produto", obrigatorio = true,
            placeholder = "Ex: Arroz tipo 1 (5kg)"
        )
        Spacer(modifier = Modifier.height(10.dp))
        CampoTexto(
            state.form.pesoKg, { onCampo("pesoKg", it) },
            "Peso por unidade (kg) — opcional"
        )
        Spacer(modifier = Modifier.height(10.dp))

        Text("Unidade de medida *", style = MaterialTheme.typography.labelLarge, color = TextoPrincipal)
        Spacer(modifier = Modifier.height(4.dp))
        ExposedDropdownMenuBox(
            expanded = unidadeExpandida,
            onExpandedChange = { unidadeExpandida = it }
        ) {
            OutlinedTextField(
                value = unidadeSelecionada?.let { "${it.nome} (${it.sigla})" } ?: "Selecione…",
                onValueChange = {},
                readOnly = true,
                singleLine = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = unidadeExpandida) },
                modifier = Modifier.fillMaxWidth().menuAnchor(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = VerdePrimario,
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                )
            )
            ExposedDropdownMenu(
                expanded = unidadeExpandida,
                onDismissRequest = { unidadeExpandida = false }
            ) {
                state.unidades.forEach { unidade ->
                    DropdownMenuItem(
                        text = { Text("${unidade.nome} (${unidade.sigla})") },
                        onClick = {
                            onCampo("unidadeMedidaId", unidade.id.toString())
                            unidadeExpandida = false
                        }
                    )
                }
            }
        }
    }
}
