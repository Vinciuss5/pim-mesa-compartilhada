package br.org.mesacompartilhada.app

import android.app.Application
import br.org.mesacompartilhada.app.di.AppContainer

/**
 * Classe Application: ponto de inicialização do app.
 * Cria o [AppContainer] (dependências) uma única vez.
 */
class MesaApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
