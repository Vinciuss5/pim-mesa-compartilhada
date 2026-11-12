package br.org.mesacompartilhada.app.data.repository

import br.org.mesacompartilhada.app.core.Resource
import br.org.mesacompartilhada.app.data.model.UsuarioCreateRequest
import br.org.mesacompartilhada.app.data.model.UsuarioResponse
import br.org.mesacompartilhada.app.data.model.UsuarioUpdateRequest
import br.org.mesacompartilhada.app.data.remote.ApiService
import br.org.mesacompartilhada.app.data.remote.RetrofitClient

class UsuarioRepository(private val api: ApiService) {

    suspend fun listar(): Resource<List<UsuarioResponse>> = try {
        Resource.Success(api.getUsuarios())
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun criar(request: UsuarioCreateRequest): Resource<UsuarioResponse> = try {
        Resource.Success(api.createUsuario(request))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun atualizar(id: Int, request: UsuarioUpdateRequest): Resource<UsuarioResponse> = try {
        Resource.Success(api.updateUsuario(id, request))
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }

    suspend fun alternarStatus(funcionario: UsuarioResponse): Resource<Unit> = try {
        if (funcionario.ativo) {
            api.deleteUsuario(funcionario.id)
        } else {
            api.updateUsuario(
                id = funcionario.id,
                body = UsuarioUpdateRequest(
                    nome = funcionario.nome,
                    email = funcionario.email,
                    telefone = funcionario.telefone,
                    tipo = funcionario.tipo,
                    ativo = true,
                    cpf = funcionario.cpf,
                    dataAdmissao = funcionario.dataAdmissao
                )
            )
        }
        Resource.Success(Unit)
    } catch (e: Exception) {
        Resource.Error(RetrofitClient.mensagemDeErro(e))
    }
}
