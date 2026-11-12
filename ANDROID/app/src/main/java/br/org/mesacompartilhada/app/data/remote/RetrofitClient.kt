package br.org.mesacompartilhada.app.data.remote

import br.org.mesacompartilhada.app.core.Constants
import br.org.mesacompartilhada.app.core.SessionManager
import com.google.gson.Gson
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Ponto único de criação do cliente HTTP (singleton).
 *
 * - [AuthInterceptor] injeta o token da sessão.
 * - [HttpLoggingInterceptor] registra as chamadas no Logcat (apenas debug).
 */
object RetrofitClient {

    private val gson = Gson()

    fun createApi(session: SessionManager): ApiService {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(session))
            .addInterceptor(logging)
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(Constants.BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(ApiService::class.java)
    }

    /**
     * Extrai a mensagem amigável de um erro HTTP no formato `{ "message": "..." }`.
     * Usada pelos repositórios para devolver um erro legível à UI.
     */
    fun mensagemDeErro(throwable: Throwable): String {
        if (throwable is HttpException) {
            val corpo = try {
                throwable.response()?.errorBody()?.string()
            } catch (e: Exception) {
                null
            }
            if (!corpo.isNullOrBlank()) {
                val mensagem = try {
                    com.google.gson.JsonParser.parseString(corpo).asJsonObject
                        .get("message")?.asString
                } catch (e: Exception) {
                    null
                }
                if (!mensagem.isNullOrBlank()) return mensagem
            }
            return when (throwable.code()) {
                401 -> "Sessão expirada. Faça login novamente."
                404 -> "Registro não encontrado."
                in 400..499 -> "Dados inválidos. Verifique os campos."
                else -> "Erro no servidor (${throwable.code()})."
            }
        }
        return "Falha de conexão com o servidor. Verifique se a API está rodando."
    }
}
