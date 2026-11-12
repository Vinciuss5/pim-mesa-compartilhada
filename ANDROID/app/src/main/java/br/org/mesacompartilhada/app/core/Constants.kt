package br.org.mesacompartilhada.app.core

/**
 * Constantes globais do app.
 *
 * A URL base aponta para a API EstoqueAPI (ASP.NET Core).
 * - Emulador Android: `10.0.2.2` é o alias do `localhost` da máquina.
 * - Dispositivo físico: substitua pelo IP da máquina na rede local
 *   (ex.: `http://192.168.0.10:5235/api/`).
 * - A barra final é obrigatória: o Retrofit exige `baseUrl` terminado em `/`.
 */
object Constants {
    const val BASE_URL = "http://10.0.2.2:5235/api/"

    /** Janela de alerta de validade usada nos indicadores (em dias). */
    const val DIAS_ALERTA_VALIDADE = 90
}
