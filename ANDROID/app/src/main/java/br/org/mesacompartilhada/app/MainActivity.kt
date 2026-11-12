package br.org.mesacompartilhada.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import br.org.mesacompartilhada.app.presentation.navigation.MesaApp
import br.org.mesacompartilhada.app.presentation.theme.MesaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MesaTheme {
                val container = (application as MesaApplication).container
                MesaApp(container)
            }
        }
    }
}
