// src/hooks/useDoadores.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';

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

  const fetchDoadores = useCallback(async (search = '') => {
    // Só mostra o loading se não tivermos nada em cache ainda
    if (cacheDoadores.length === 0) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/doador', {
        params: search ? { filtro: search } : undefined,
      });

      if (!Array.isArray(data)) throw new Error('Resposta inesperada ao listar doadores.');

      cacheDoadores = data;
      setDoadores(data);
    } catch (err) {
      setError(extrairErro(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Cadastrar: dto = { Nome, Email, CPF, Telefone, Endereco }
  const createDoador = async (dto) => {
    try {
      const { data } = await api.post('/doador', dto);
      return { success: true, data };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  // Corrigir um cadastro existente (inclusive o CPF)
  const updateDoador = async (id, dto) => {
    try {
      await api.put(`/doador/${id}`, dto);
      return { success: true };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  return { doadores, loading, error, fetchDoadores, createDoador, updateDoador };
};