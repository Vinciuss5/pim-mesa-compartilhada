package br.org.mesacompartilhada.app.presentation.navigation

import android.widget.Toast
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import br.org.mesacompartilhada.app.di.AppContainer
import br.org.mesacompartilhada.app.presentation.auth.AuthViewModel
import br.org.mesacompartilhada.app.presentation.auth.LoginScreen
import br.org.mesacompartilhada.app.presentation.doacoes.DoacoesScreen
import br.org.mesacompartilhada.app.presentation.doadores.DoadoresScreen
import br.org.mesacompartilhada.app.presentation.estoque.EstoqueScreen
import br.org.mesacompartilhada.app.presentation.funcionarios.FuncionariosScreen
import br.org.mesacompartilhada.app.presentation.relatorios.RelatoriosScreen
import br.org.mesacompartilhada.app.presentation.solicitacoes.SolicitacoesScreen
import br.org.mesacompartilhada.app.presentation.solicitantes.SolicitantesScreen
import br.org.mesacompartilhada.app.presentation.theme.FundoApp
import br.org.mesacompartilhada.app.presentation.theme.VerdeEscuro
import br.org.mesacompartilhada.app.presentation.theme.VerdePrimario
import kotlinx.coroutines.launch

/**
 * Shell principal: drawer de navegação + top bar + NavHost de telas.
 * Espelha a sidebar do sistema web.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MesaApp(container: AppContainer) {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    val authViewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
        factory = container.viewModelFactory
    )

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val isLogin = currentRoute == Routes.LOGIN

    // Sessão reativa: se o token cair (logout ou 401), a UI volta ao login.
    val context = LocalContext.current
    val token by container.session.token.collectAsState()
    val sessaoExpirada by container.session.sessaoExpirada.collectAsState()

    LaunchedEffect(token, sessaoExpirada) {
        if (token != null) return@LaunchedEffect
        if (sessaoExpirada) {
            Toast.makeText(
                context,
                "Sessão expirada. Faça login novamente.",
                Toast.LENGTH_LONG
            ).show()
            container.session.consumirAvisoExpiracao()
        }
        if (isLogin) return@LaunchedEffect
        navController.navigate(Routes.LOGIN) {
            popUpTo(0) { inclusive = true }
        }
    }

    fun irPara(rota: String) {
        navController.navigate(rota) {
            popUpTo(Routes.FUNCIONARIOS) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    fun sairDoSistema() {
        authViewModel.logout()
        navController.navigate(Routes.LOGIN) {
            popUpTo(0) { inclusive = true }
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        gesturesEnabled = !isLogin,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = VerdeEscuro
            ) {
                DrawerCabecalho()
                HorizontalDivider(color = Color.White.copy(alpha = 0.15f))
                androidx.compose.foundation.layout.Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "PRINCIPAL",
                        color = Color.White.copy(alpha = 0.5f),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                    MenuDrawerItems(
                        rotaAtual = currentRoute,
                        aoSelecionar = { rota ->
                            scope.launch { drawerState.close() }
                            irPara(rota)
                        }
                    )
                }
                HorizontalDivider(color = Color.White.copy(alpha = 0.15f))
                androidx.compose.foundation.layout.Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "CONTA",
                        color = Color.White.copy(alpha = 0.5f),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                    NavigationDrawerItem(
                        label = { Text("Sair do Sistema", color = Color.White.copy(alpha = 0.85f)) },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            sairDoSistema()
                        },
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }
    ) {
        Scaffold(
            containerColor = FundoApp,
            topBar = {
                if (!isLogin) {
                    CenterAlignedTopAppBar(
                        title = {
                            Text(
                                text = tituloDaRota(currentRoute),
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        },
                        navigationIcon = {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(
                                    imageVector = Icons.Filled.Menu,
                                    contentDescription = "Abrir menu",
                                    tint = Color.White
                                )
                            }
                        },
                        colors = androidx.compose.material3.TopAppBarDefaults.centerAlignedTopAppBarColors(
                            containerColor = VerdeEscuro
                        )
                    )
                }
            }
        ) { padding ->
            AppNavGraph(
                navController = navController,
                container = container,
                authViewModel = authViewModel,
                modifier = Modifier.padding(padding)
            )
        }
    }
}

@Composable
private fun AppNavGraph(
    navController: NavHostController,
    container: AppContainer,
    authViewModel: AuthViewModel,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = if (container.session.isLoggedIn) Routes.FUNCIONARIOS else Routes.LOGIN,
        modifier = modifier
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Routes.FUNCIONARIOS) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }
        composable(Routes.FUNCIONARIOS) { FuncionariosScreen(container) }
        composable(Routes.DOADORES) { DoadoresScreen(container) }
        composable(Routes.SOLICITANTES) { SolicitantesScreen(container) }
        composable(Routes.ESTOQUE) { EstoqueScreen(container) }
        composable(Routes.DOACOES) { DoacoesScreen(container) }
        composable(Routes.SOLICITACOES) { SolicitacoesScreen(container) }
        composable(Routes.RELATORIOS) { RelatoriosScreen(container) }
    }
}

private fun tituloDaRota(rota: String?): String = when (rota) {
    Routes.FUNCIONARIOS -> "Funcionários"
    Routes.DOADORES -> "Doadores"
    Routes.SOLICITANTES -> "Solicitantes"
    Routes.ESTOQUE -> "Controle de Estoque"
    Routes.DOACOES -> "Entrada de Doações"
    Routes.SOLICITACOES -> "Saída de Solicitações"
    Routes.RELATORIOS -> "Relatórios"
    else -> "Mesa Compartilhada"
}
