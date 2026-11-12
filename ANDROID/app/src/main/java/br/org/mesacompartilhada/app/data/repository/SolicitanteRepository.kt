package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.SolicitanteCreateRequest
import br.org.mesacompartilhada.app.data.model.SolicitanteResponse
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

class SolicitanteRepository(private val api: ApiService) {

    suspend fun listar(search: String? = null): Resource<List<SolicitanteResponse>> = try {
        Resource.Success(api.getSolicitantes(search?.takeIf { it.isNotBlank() }))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun criar(request: SolicitanteCreateRequest): Resource<SolicitanteResponse> = try {
        Resource.Success(api.createSolicitante(request))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }
}
