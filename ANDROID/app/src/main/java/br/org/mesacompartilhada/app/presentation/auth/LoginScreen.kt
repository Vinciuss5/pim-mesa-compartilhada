package br.org.mesacompartilhada.app.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import br.org.mesacompartilhada.app.presentation.components.BotaoPrimario
import br.org.mesacompartilhada.app.presentation.components.CampoTexto
import br.org.mesacompartilhada.app.presentation.theme.FundoApp
import br.org.mesacompartilhada.app.presentation.theme.TextoSecundario
import br.org.mesacompartilhada.app.presentation.theme.VerdePrimario

/**
 * Tela de login (equivalente mobile da tela web).
 */
@Composable
fun LoginScreen(
    authViewModel: AuthViewModel,
    onLoginSuccess: () -> Unit
) {
    val state by authViewModel.uiState.collectAsState()

    // Navega para a área logada assim que o token é obtido.
    LaunchedEffect(state.logado) {
        if (state.logado) onLoginSuccess()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FundoApp)
            // Ajusta o conteúdo quando o teclado abre, mantendo o botão visível.
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Identidade visual
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(VerdePrimario, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.Favorite,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(36.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Mesa Compartilhada",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Acesse sua conta para gerenciar as doações.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextoSecundario,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                if (state.error != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                MaterialTheme.colorScheme.error.copy(alpha = 0.1f),
                                RoundedCornerShape(8.dp)
                            )
                            .padding(12.dp)
                    ) {
                        Text(
                            text = state.error ?: "",
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                CampoTexto(
                    valor = state.email,
                    aoMudar = authViewModel::onEmailChange,
                    rotulo = "E-mail corporativo",
                    obrigatorio = true,
                    habilitado = !state.isLoading,
                    placeholder = "nome@ong.org"
                )
                Spacer(modifier = Modifier.height(16.dp))
                CampoTexto(
                    valor = state.senha,
                    aoMudar = authViewModel::onSenhaChange,
                    rotulo = "Sua senha",
                    obrigatorio = true,
                    senha = true,
                    habilitado = !state.isLoading,
                    placeholder = "••••••••",
                    aoConfirmar = authViewModel::login
                )
                Spacer(modifier = Modifier.height(24.dp))
                BotaoPrimario(
                    texto = "Entrar no Sistema",
                    onClick = authViewModel::login,
                    habilitado = !state.isLoading,
                    carregando = state.isLoading
                )
            }
        }
    }
}
