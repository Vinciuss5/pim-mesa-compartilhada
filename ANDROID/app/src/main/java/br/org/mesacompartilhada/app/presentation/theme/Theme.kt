package br.org.mesacompartilhada.app.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val MesaLightColors = lightColorScheme(
    primary = VerdePrimario,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    secondary = VerdeEscuro,
    onSecondary = androidx.compose.ui.graphics.Color.White,
    background = FundoApp,
    onBackground = TextoPrincipal,
    surface = androidx.compose.ui.graphics.Color.White,
    onSurface = TextoPrincipal,
    surfaceVariant = androidx.compose.ui.graphics.Color(0xFFF1F5F9),
    onSurfaceVariant = TextoSecundario,
    outline = BordaCard,
    error = VermelhoAlerta
)

/**
 * Tema do app. Mantém a paleta do sistema web mesmo em modo escuro,
 * pois o painel administrativo é pensado para uso em ambiente claro.
 */
@Composable
fun MesaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MesaLightColors,
        typography = MesaTypography,
        content = content
    )
}
