package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.DoacaoCreateRequest
import br.org.mesacompartilhada.app.data.model.DoacaoResponse
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

class DoacaoRepository(private val api: ApiService) {

    suspend fun listar(): Resource<List<DoacaoResponse>> = try {
        Resource.Success(api.getDoacoes())
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun criar(request: DoacaoCreateRequest): Resource<DoacaoResponse> = try {
        Resource.Success(api.createDoacao(request))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }
}
