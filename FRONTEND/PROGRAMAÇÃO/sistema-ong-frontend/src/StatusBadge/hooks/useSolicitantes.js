// src/hooks/useSolicitantes.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';

// Cache em módulo: sobrevive entre montagens da página (mas some se recarregar o navegador)
let cacheSolicitantes = [];

// Chamado no logout, para outro usuário não ver a lista do anterior
export const limparCacheSolicitantes = () => {
  cacheSolicitantes = [];
};

export const useSolicitantes = () => {
  const [solicitantes, setSolicitantes] = useState(cacheSolicitantes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSolicitantes = useCallback(async (search = '') => {
    if (cacheSolicitantes.length === 0) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/solicitante', {
        params: search ? { search } : undefined,
      });

      if (!Array.isArray(data)) throw new Error('Resposta inesperada ao listar solicitantes.');

      cacheSolicitantes = data;
      setSolicitantes(data);
    } catch (err) {
      setError(extrairErro(err));
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cadastrar: dto = { Nome, CPF, Telefone, EnderecoEntrega, Email }
  const createSolicitante = async (dto) => {
    try {
      const { data: novo } = await api.post('/solicitante', dto);
      cacheSolicitantes = [novo, ...cacheSolicitantes];
      setSolicitantes(cacheSolicitantes);
      return { success: true, data: novo };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  // Corrigir um cadastro existente (inclusive o CPF)
  const updateSolicitante = async (id, dto) => {
    try {
      await api.put(`/solicitante/${id}`, dto);
      return { success: true };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  return { solicitantes, loading, error, fetchSolicitantes, createSolicitante, updateSolicitante };
};