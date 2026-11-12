package br.org.mesacompartilhada.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import br.org.mesacompartilhada.app.presentation.theme.BordaCard
import br.org.mesacompartilhada.app.presentation.theme.LaranjaAlerta
import br.org.mesacompartilhada.app.presentation.theme.TextoPrincipal
import br.org.mesacompartilhada.app.presentation.theme.TextoSecundario
import br.org.mesacompartilhada.app.presentation.theme.VermelhoAlerta
import br.org.mesacompartilhada.app.presentation.theme.VerdePrimario

/** Indicador de carregamento centralizado. */
@Composable
fun EstadoCarregando(modifier: Modifier = Modifier, texto: String = "Carregando…") {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = VerdePrimario)
            Spacer(modifier = Modifier.height(12.dp))
            Text(texto, color = TextoSecundario, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

/** Mensagem de lista vazia. */
@Composable
fun EstadoVazio(modifier: Modifier = Modifier, texto: String = "Nenhum registro encontrado.") {
    Box(modifier = modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
        Text(
            text = texto,
            color = TextoSecundario,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
    }
}

/** Bloco de erro com botão de tentar novamente. */
@Composable
fun EstadoErro(
    mensagem: String,
    onTentarNovamente: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = mensagem,
            color = VermelhoAlerta,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedButton(onClick = onTentarNovamente) {
            Text("Tentar novamente", color = VerdePrimario)
        }
    }
}

/**
 * Campo de texto rotulado, reutilizado em todos os formulários.
 *
 * @param obrigatorio marca o campo com asterisco vermelho.
 * @param senha aplica transformação de senha.
 * @param aoConfirmar ação disparada pelo "✓"/Enter do teclado (ex.: enviar o login).
 */
@Composable
fun CampoTexto(
    valor: String,
    aoMudar: (String) -> Unit,
    rotulo: String,
    modifier: Modifier = Modifier,
    obrigatorio: Boolean = false,
    senha: Boolean = false,
    erro: String? = null,
    habilitado: Boolean = true,
    placeholder: String? = null,
    aoConfirmar: (() -> Unit)? = null
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row {
            Text(
                text = rotulo,
                style = MaterialTheme.typography.labelLarge,
                color = TextoPrincipal
            )
            if (obrigatorio) {
                Text(" *", color = VermelhoAlerta, style = MaterialTheme.typography.labelLarge)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedTextField(
            value = valor,
            onValueChange = aoMudar,
            modifier = Modifier.fillMaxWidth(),
            enabled = habilitado,
            isError = erro != null,
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                imeAction = if (aoConfirmar != null) ImeAction.Done else ImeAction.Unspecified
            ),
            keyboardActions = KeyboardActions(
                onDone = { aoConfirmar?.invoke() }
            ),
            placeholder = placeholder?.let { { Text(it, color = TextoSecundario) } },
            visualTransformation = if (senha) PasswordVisualTransformation() else VisualTransformation.None,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VerdePrimario,
                unfocusedBorderColor = BordaCard,
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White
            )
        )
        if (erro != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(erro, color = VermelhoAlerta, style = MaterialTheme.typography.bodySmall)
        }
    }
}

/** Botão principal (verde) com estado de carregamento. */
@Composable
fun BotaoPrimario(
    texto: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    habilitado: Boolean = true,
    carregando: Boolean = false
) {
    Button(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().height(48.dp),
        enabled = habilitado && !carregando,
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.buttonColors(containerColor = VerdePrimario)
    ) {
        if (carregando) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            Text(texto, fontWeight = FontWeight.SemiBold)
        }
    }
}

/** Chip colorido de status (disponível, pendente, ativo, etc.). */
@Composable
fun ChipStatus(texto: String, cor: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .background(cor.copy(alpha = 0.12f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = texto.uppercase(),
            color = cor,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold
        )
    }
}

/** Cor de status usada nos chips, centralizada para reuso. */
object CoresStatus {
    val disponivel = VerdePrimario
    val baixoEstoque = LaranjaAlerta
    val esgotado = VermelhoAlerta
    val pendente = LaranjaAlerta
    val entregue = VerdePrimario
    val cancelado = VermelhoAlerta
}

/** Diálogo padrão de formulário com ações Cancelar/Salvar. */
@Composable
fun DialogoFormulario(
    titulo: String,
    aoFechar: () -> Unit,
    aoSalvar: () -> Unit,
    textoSalvar: String = "Salvar",
    salvando: Boolean = false,
    habilitadoSalvar: Boolean = true,
    conteudo: @Composable () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!salvando) aoFechar() },
        title = { Text(titulo, fontWeight = FontWeight.Bold) },
        text = {
            Column { conteudo() }
        },
        confirmButton = {
            Button(
                onClick = aoSalvar,
                enabled = habilitadoSalvar && !salvando,
                colors = ButtonDefaults.buttonColors(containerColor = VerdePrimario)
            ) {
                if (salvando) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(textoSalvar)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = { if (!salvando) aoFechar() }) {
                Text("Cancelar", color = TextoSecundario)
            }
        }
    )
}
