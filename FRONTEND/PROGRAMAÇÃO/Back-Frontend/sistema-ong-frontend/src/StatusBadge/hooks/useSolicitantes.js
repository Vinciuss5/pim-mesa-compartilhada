// src/hooks/useSolicitantes.js
import { useState, useCallback, useRef } from 'react';
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
  const primeiraExecucao = useRef(true);

  const fetchSolicitantes = useCallback(async (search = '') => {
    if (cacheSolicitantes.length === 0) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/solicitante', {
        params: search ? { search } : undefined,
      });
      cacheSolicitantes = data;
      setSolicitantes(data);
    } catch (err) {
      setError(extrairErro(err));
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSolicitante = async (SolicitanteDTO) => {
    setLoading(true);
    setError(null);
    try {
      const { data: novoSolicitante } = await api.post('/solicitante', SolicitanteDTO);
      cacheSolicitantes = [novoSolicitante, ...cacheSolicitantes];
      setSolicitantes(cacheSolicitantes);

      return { success: true, data: novoSolicitante };
    } catch (err) {
      const message = extrairErro(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    solicitantes,
    loading,
    error,
    fetchSolicitantes,
    createSolicitante,
    primeiraExecucao
  };
};