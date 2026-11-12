// src/hooks/useFuncionarios.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../services/api';

const ENDPOINT = '/usuario';

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Listar (GET)
  const fetchFuncionarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(ENDPOINT);
      setFuncionarios(data);
    } catch (err) {
      setError(extrairErro(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Criar (POST)
  const createFuncionario = async (formData) => {
    setIsLoading(true);
    setError(null);

    const payload = {
      Nome: formData.nome.trim(),
      Email: formData.email.toLowerCase().trim(),
      CPF: formData.cpf.replace(/\D/g, ''),
      Telefone: formData.telefone?.replace(/\D/g, ''),
      Senha: formData.senha,
      Tipo: String(formData.tipo).toUpperCase(),
      DataAdmissao: formData.dataAdmissao
    };

    try {
      const { data: novoUsuario } = await api.post(ENDPOINT, payload);

      // Atualiza a lista local imediatamente, sem novo GET
      setFuncionarios((prev) => [...prev, novoUsuario]);

      return { success: true, data: novoUsuario };
    } catch (err) {
      const message = extrairErro(err);
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Atualizar (PUT)
  const updateFuncionario = async (id, UsuarioDTO) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        Nome: UsuarioDTO.nome,
        Email: UsuarioDTO.email,
        Telefone: UsuarioDTO.telefone,
        Tipo: UsuarioDTO.tipo,
        Ativo: UsuarioDTO.ativo
      };

      await api.put(`${ENDPOINT}/${id}`, payload);

      // CORREÇÃO: o estado local usa chaves em minúsculo (nome, email...). A versão anterior
      // mesclava o payload em PascalCase (Nome, Email...), então a lista não refletia a edição.
      setFuncionarios((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...UsuarioDTO } : f))
      );

      return { success: true };
    } catch (err) {
      const message = extrairErro(err);
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Alternar Status (DELETE para desativar / PUT para reativar)
  const toggleStatus = async (funcionario) => {
    setIsLoading(true);
    setError(null);
    const novoStatus = !funcionario.ativo;

    try {
      if (!novoStatus) {
        await api.delete(`${ENDPOINT}/${funcionario.id}`);
      } else {
        await api.put(`${ENDPOINT}/${funcionario.id}`, {
          Nome: funcionario.nome,
          Email: funcionario.email,
          Telefone: funcionario.telefone,
          Tipo: funcionario.tipo,
          Ativo: true
        });
      }

      setFuncionarios((prev) =>
        prev.map((f) => (f.id === funcionario.id ? { ...f, ativo: novoStatus } : f))
      );

      return { success: true };
    } catch (err) {
      const message = extrairErro(err);
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    funcionarios,
    isLoading,
    error,
    fetchFuncionarios,
    createFuncionario,
    updateFuncionario,
    toggleStatus,
  };
}