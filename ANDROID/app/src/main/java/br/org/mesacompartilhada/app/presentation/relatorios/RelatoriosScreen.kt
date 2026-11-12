package br.org.mesacompartilhada.app.presentation.relatorios

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
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import br.org.mesacompartilhada.app.presentation.components.EstadoCarregando
import br.org.mesacompartilhada.app.presentation.components.EstadoErro
import br.org.mesacompartilhada.app.presentation.components.EstadoVazio
import br.org.mesacompartilhada.app.presentation.theme.AzulInfo
import br.org.mesacompartilhada.app.presentation.theme.BordaCard
import br.org.mesacompartilhada.app.presentation.theme.LaranjaAlerta
import br.org.mesacompartilhada.app.presentation.theme.TextoPrincipal
import br.org.mesacompartilhada.app.presentation.theme.TextoSecundario
import br.org.mesacompartilhada.app.presentation.theme.VerdePrimario

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RelatoriosScreen(container: AppContainer) {
    val viewModel: RelatoriosViewModel = viewModel(factory = container.viewModelFactory)
    val state by viewModel.uiState.collectAsState()

    when {
        state.carregando -> EstadoCarregando()
        state.erro != null -> EstadoErro(mensagem = state.erro!!, onTentarNovamente = viewModel::carregar)
        else -> {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Cabeçalho com ação de atualizar
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Visão geral",
                            style = MaterialTheme.typography.titleLarge,
                            color = TextoPrincipal
                        )
                        IconButton(onClick = viewModel::carregar) {
                            Icon(Icons.Filled.Refresh, contentDescription = "Atualizar", tint = VerdePrimario)
                        }
                    }
                }

                // KPIs
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        CardKpi("Doações no mês", state.kpis.doacoesMes.toString(), VerdePrimario, Modifier.weight(1f))
                        CardKpi("Pendentes", state.kpis.solicitacoesPendentes.toString(), LaranjaAlerta, Modifier.weight(1f))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        CardKpi(
                            "Vencem em 3 meses",
                            state.kpis.produtosProximosVencimento.toString(),
                            LaranjaAlerta,
                            Modifier.weight(1f)
                        )
                        CardKpi("Estoque total", state.kpis.estoqueTotal, AzulInfo, Modifier.weight(1f))
                    }
                }

                // Alertas de validade
                item {
                    Text(
                        text = "Itens próximos ao vencimento",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextoPrincipal
                    )
                }
                if (state.alertasValidade.isEmpty()) {
                    item { EstadoVazio(texto = "Nenhum item em risco de vencimento.") }
                } else {
                    items(state.alertasValidade, key = { it.produto + it.validade }) { alerta ->
                        CardAlerta(alerta)
                    }
                }

                // Últimas solicitações
                item {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Últimas solicitações",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextoPrincipal
                    )
                }
                if (state.ultimasSolicitacoes.isEmpty()) {
                    item { EstadoVazio(texto = "Nenhuma solicitação registrada.") }
                } else {
                    items(state.ultimasSolicitacoes, key = { it.id }) { sol ->
                        CardUltimaSolicitacao(sol)
                    }
                }
            }
        }
    }
}

@Composable
private fun CardKpi(titulo: String, valor: String, cor: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BordaCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(titulo.uppercase(), style = MaterialTheme.typography.bodySmall, color = TextoSecundario)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                valor,
                style = MaterialTheme.typography.headlineMedium,
                color = cor,
                fontWeight = FontWeight.ExtraBold
            )
        }
    }
}

@Composable
private fun CardAlerta(alerta: AlertaValidade) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BordaCard)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = alerta.produto,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextoPrincipal
                )
                Text(
                    text = alerta.validade,
                    style = MaterialTheme.typography.bodySmall,
                    color = LaranjaAlerta,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(
                text = "Origem: ${alerta.origem}  •  Saldo: ${Formatters.formatarNumero(alerta.quantidade)} un",
                style = MaterialTheme.typography.bodySmall,
                color = TextoSecundario
            )
        }
    }
}

@Composable
private fun CardUltimaSolicitacao(sol: SolicitacaoResponse) {
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
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = sol.nomeSolicitante,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextoPrincipal
                )
                Text(
                    text = "#${sol.id}  •  ${Formatters.formatarData(sol.dataSolicitacao)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextoSecundario
                )
            }
            ChipStatus(texto = sol.status, cor = corStatus)
        }
    }
}
