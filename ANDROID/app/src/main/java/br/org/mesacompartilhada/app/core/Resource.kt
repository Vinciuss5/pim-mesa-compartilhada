package br.org.mesacompartilhada.app.core

/**
 * Envelope de estado usado pelas camadas Repository -> ViewModel -> UI.
 *
 * - [Loading]: requisição em andamento.
 * - [Success]: requisição concluída com dados.
 * - [Error]: falha com mensagem amigável para o usuário.
 */
sealed class Resource<out T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val message: String) : Resource<Nothing>()
    data object Loading : Resource<Nothing>()
}
