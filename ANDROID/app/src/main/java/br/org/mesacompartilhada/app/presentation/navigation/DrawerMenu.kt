package br.org.mesacompartilhada.app.presentation.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import br.org.mesacompartilhada.app.presentation.theme.VerdePrimario

/** Cabeçalho do drawer, espelhando o título da sidebar web. */
@Composable
fun DrawerCabecalho() {
    Column(modifier = Modifier.padding(24.dp)) {
        Text(
            text = "Mesa\nCompartilhada",
            color = Color.White,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black,
            fontStyle = FontStyle.Italic
        )
        Spacer(modifier = Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .width(40.dp)
                .height(4.dp)
                .background(Color.White.copy(alpha = 0.3f))
        )
    }
}

private class MenuItem(
    val rota: String,
    val rotulo: String,
    val icone: ImageVector
)

/** Itens de navegação do drawer, na mesma ordem da sidebar web. */
@Composable
fun MenuDrawerItems(rotaAtual: String?, aoSelecionar: (String) -> Unit) {
    val itens = listOf(
        MenuItem(Routes.FUNCIONARIOS, "Funcionários", Icons.Filled.People),
        MenuItem(Routes.DOADORES, "Doadores", Icons.Filled.Favorite),
        MenuItem(Routes.SOLICITANTES, "Solicitantes", Icons.Filled.Assignment),
        null, // divisor
        MenuItem(Routes.ESTOQUE, "Controle de Estoque", Icons.Filled.Inventory2),
        null, // divisor
        MenuItem(Routes.DOACOES, "Entrada de Doações", Icons.Filled.ArrowDownward),
        MenuItem(Routes.SOLICITACOES, "Saída de Solicitações", Icons.Filled.ArrowUpward),
        MenuItem(Routes.RELATORIOS, "Relatórios", Icons.Filled.Description)
    )

    itens.forEach { item ->
        if (item == null) {
            HorizontalDivider(
                color = Color.White.copy(alpha = 0.1f),
                modifier = Modifier.padding(vertical = 6.dp)
            )
        } else {
            val ativo = rotaAtual == item.rota
            NavigationDrawerItem(
                // Cor explícita: o fundo do drawer é verde escuro, então o item comum
                // usa branco e o selecionado usa verde (sobre a pílula branca).
                label = {
                    Text(
                        text = item.rotulo,
                        color = if (ativo) VerdePrimario else Color.White.copy(alpha = 0.9f)
                    )
                },
                selected = ativo,
                onClick = { aoSelecionar(item.rota) },
                icon = {
                    Icon(
                        imageVector = item.icone,
                        contentDescription = item.rotulo,
                        tint = if (ativo) VerdePrimario else Color.White.copy(alpha = 0.7f)
                    )
                },
                colors = NavigationDrawerItemDefaults.colors(
                    selectedContainerColor = Color.White,
                    selectedTextColor = VerdePrimario,
                    unselectedContainerColor = Color.Transparent,
                    unselectedTextColor = Color.White.copy(alpha = 0.9f)
                ),
                modifier = Modifier.padding(vertical = 2.dp)
            )
        }
    }
}
