package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.EstoqueResponse
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

class EstoqueRepository(private val api: ApiService) {

    suspend fun listar(): Resource<List<EstoqueResponse>> = try {
        Resource.Success(api.getEstoque())
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }
}
