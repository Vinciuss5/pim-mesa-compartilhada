// src/hooks/useDoadores.js
import { useState, useCallback, useRef } from 'react';
import api, { extrairErro } from '../services/api';

// Cache em módulo: sobrevive entre montagens da página (mas some se recarregar o navegador)
let cacheDoadores = [];

// Chamado no logout, para outro usuário não ver a lista do anterior
export const limparCacheDoadores = () => {
  cacheDoadores = [];
};

export const useDoadores = () => {
  const [doadores, setDoadores] = useState(cacheDoadores);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const primeiraExecucao = useRef(true);

  const fetchDoadores = useCallback(async (search = '') => {
    // Só mostra o loading se não tivermos nada em cache ainda
    if (cacheDoadores.length === 0) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/doador', {
        params: search ? { filtro: search } : undefined,
      });
      cacheDoadores = data;
      setDoadores(data);
    } catch (err) {
      setError(extrairErro(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Mantém o contrato anterior: lança Error em caso de falha (a tela usa try/catch)
  const createDoador = async (DoadorDTO) => {
    try {
      const { data } = await api.post('/doador', DoadorDTO);
      return data;
    } catch (err) {
      throw new Error(extrairErro(err));
    }
  };

  return { doadores, loading, error, fetchDoadores, createDoador, primeiraExecucao };
};