package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.SolicitacaoCreateRequest
import br.org.mesacompartilhada.app.data.model.SolicitacaoResponse
import br.org.mesacompartilhada.app.data.model.StatusUpdateRequest
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

class SolicitacaoRepository(private val api: ApiService) {

    suspend fun listar(): Resource<List<SolicitacaoResponse>> = try {
        Resource.Success(api.getSolicitacoes())
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun criar(request: SolicitacaoCreateRequest): Resource<SolicitacaoResponse> = try {
        Resource.Success(api.createSolicitacao(request))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    /** Atualiza o status: PENDENTE | ENTREGUE | CANCELADO. */
    suspend fun atualizarStatus(id: Int, novoStatus: String): Resource<Unit> = try {
        api.updateSolicitacaoStatus(id, StatusUpdateRequest(novoStatus))
        Resource.Success(Unit)
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }
}
