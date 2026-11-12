package br.org.mesacompartilhada.app.data.remote

import br.org.mesacompartilhada.app.data.model.*
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Contrato HTTP completo com a API EstoqueAPI (ASP.NET Core).
 * Os caminhos são relativos a `Constants.BASE_URL` (que já termina em `/api`).
 */
interface ApiService {

    // ---------------------------------------------------------------
    // Autenticação
    // ---------------------------------------------------------------
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    // ---------------------------------------------------------------
    // Usuários / Funcionários
    // ---------------------------------------------------------------
    @GET("usuario")
    suspend fun getUsuarios(): List<UsuarioResponse>

    @POST("usuario")
    suspend fun createUsuario(@Body body: UsuarioCreateRequest): UsuarioResponse

    @PUT("usuario/{id}")
    suspend fun updateUsuario(@Path("id") id: Int, @Body body: UsuarioUpdateRequest): UsuarioResponse

    @DELETE("usuario/{id}")
    suspend fun deleteUsuario(@Path("id") id: Int)

    // ---------------------------------------------------------------
    // Doadores
    // ---------------------------------------------------------------
    @GET("doador")
    suspend fun getDoadores(@Query("filtro") filtro: String? = null): List<DoadorResponse>

    @POST("doador")
    suspend fun createDoador(@Body body: DoadorCreateRequest): DoadorResponse

    @PUT("doador/{id}")
    suspend fun updateDoador(@Path("id") id: Int, @Body body: DoadorCreateRequest): DoadorResponse

    @DELETE("doador/{id}")
    suspend fun deleteDoador(@Path("id") id: Int)

    // ---------------------------------------------------------------
    // Solicitantes
    // ---------------------------------------------------------------
    @GET("solicitante")
    suspend fun getSolicitantes(@Query("search") search: String? = null): List<SolicitanteResponse>

    @POST("solicitante")
    suspend fun createSolicitante(@Body body: SolicitanteCreateRequest): SolicitanteResponse

    // ---------------------------------------------------------------
    // Produtos e unidades de medida
    // ---------------------------------------------------------------
    @GET("produto")
    suspend fun getProdutos(): List<ProdutoResponse>

    @POST("produto")
    suspend fun createProduto(@Body body: ProdutoCreateRequest): ProdutoResponse

    @GET("unidades-medida")
    suspend fun getUnidadesMedida(): List<UnidadeMedidaResponse>

    // ---------------------------------------------------------------
    // Estoque
    // ---------------------------------------------------------------
    @GET("estoque")
    suspend fun getEstoque(): List<EstoqueResponse>

    // ---------------------------------------------------------------
    // Doações (entrada)
    // ---------------------------------------------------------------
    @GET("doacao")
    suspend fun getDoacoes(): List<DoacaoResponse>

    @POST("doacao")
    suspend fun createDoacao(@Body body: DoacaoCreateRequest): DoacaoResponse

    // ---------------------------------------------------------------
    // Solicitações (saída)
    // ---------------------------------------------------------------
    @GET("solicitacao")
    suspend fun getSolicitacoes(): List<SolicitacaoResponse>

    @POST("solicitacao")
    suspend fun createSolicitacao(@Body body: SolicitacaoCreateRequest): SolicitacaoResponse

    @PATCH("solicitacao/{id}/status")
    suspend fun updateSolicitacaoStatus(@Path("id") id: Int, @Body body: StatusUpdateRequest)

    @PATCH("solicitacao/{id}/previsao")
    suspend fun reagendarSolicitacao(@Path("id") id: Int, @Body body: ReagendarRequest): SolicitacaoResponse
}
