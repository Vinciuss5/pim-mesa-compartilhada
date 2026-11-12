package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.DoadorCreateRequest
import br.org.mesacompartilhada.app.data.model.DoadorResponse
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

class DoadorRepository(private val api: ApiService) {

    suspend fun listar(filtro: String? = null): Resource<List<DoadorResponse>> = try {
        Resource.Success(api.getDoadores(filtro?.takeIf { it.isNotBlank() }))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun criar(request: DoadorCreateRequest): Resource<DoadorResponse> = try {
        Resource.Success(api.createDoador(request))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }
}
