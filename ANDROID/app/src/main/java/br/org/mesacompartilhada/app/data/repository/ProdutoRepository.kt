package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.ProdutoCreateRequest
import br.org.mesacompartilhada.app.data.model.ProdutoResponse
import br.org.mesacompartilhada.app.data.model.UnidadeMedidaResponse
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

class ProdutoRepository(private val api: ApiService) {

    suspend fun listar(): Resource<List<ProdutoResponse>> = try {
        Resource.Success(api.getProdutos())
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun listarUnidades(): Resource<List<UnidadeMedidaResponse>> = try {
        Resource.Success(api.getUnidadesMedida())
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun criar(request: ProdutoCreateRequest): Resource<ProdutoResponse> = try {
        Resource.Success(api.createProduto(request))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }
}
