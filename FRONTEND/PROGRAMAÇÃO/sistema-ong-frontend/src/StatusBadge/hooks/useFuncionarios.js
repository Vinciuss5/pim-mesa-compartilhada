// src/hooks/useFuncionarios.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';
import { apenasDigitos } from '../../utils/masks';

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

      if (!Array.isArray(data)) throw new Error('Resposta inesperada ao listar funcionários.');

      setFuncionarios(data);
    } catch (err) {
      setError(extrairErro(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Criar (POST)
  const createFuncionario = async (formData) => {
    const payload = {
      Nome: formData.nome.trim(),
      Email: formData.email.toLowerCase().trim(),
      CPF: apenasDigitos(formData.cpf),
      Telefone: apenasDigitos(formData.telefone) || null,
      Senha: formData.senha,
      Tipo: String(formData.tipo).toUpperCase(),
      DataAdmissao: formData.dataAdmissao,
    };

    try {
      const { data: novoUsuario } = await api.post(ENDPOINT, payload);

      // Atualiza a lista local imediatamente, sem novo GET
      setFuncionarios((prev) => [...prev, novoUsuario]);

      return { success: true, data: novoUsuario };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  // 3. Corrigir o cadastro (PUT): nome, e-mail, CPF, telefone, cargo e data de admissão.
  // A senha NÃO é alterada aqui. dto usa chaves em minúsculo (nome, email, ...).
  const updateFuncionario = async (id, dto) => {
    try {
      await api.put(`${ENDPOINT}/${id}`, {
        Nome: dto.nome.trim(),
        Email: dto.email.toLowerCase().trim(),
        Telefone: apenasDigitos(dto.telefone) || null,
        Tipo: String(dto.tipo).toUpperCase(),
        Ativo: dto.ativo,
        CPF: apenasDigitos(dto.cpf) || null,
        DataAdmissao: dto.dataAdmissao ? `${dto.dataAdmissao}T00:00:00` : null,
      });

      // Relê a lista: o servidor pode ter normalizado algum valor (ex.: e-mail)
      const { data } = await api.get(ENDPOINT);
      if (Array.isArray(data)) setFuncionarios(data);

      return { success: true };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  // 4. Alternar Status (DELETE para desativar / PUT para reativar)
  const toggleStatus = async (funcionario) => {
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
          Ativo: true,
        });
      }

      setFuncionarios((prev) =>
        prev.map((f) => (f.id === funcionario.id ? { ...f, ativo: novoStatus } : f))
      );

      return { success: true };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
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