// src/hooks/useUnidades.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';

// Cache em módulo: as unidades são dados de referência (mudam raramente) e não dependem do usuário.
let cacheUnidades = [];

export const useUnidades = () => {
  const [unidades, setUnidades] = useState(cacheUnidades);
  const [loading, setLoading] = useState(false);

  const fetchUnidades = useCallback(async () => {
    if (cacheUnidades.length === 0) setLoading(true);
    try {
      const { data } = await api.get('/unidades-medida');
      cacheUnidades = data;
      setUnidades(data);
    } catch (err) {
      console.error('Erro ao carregar unidades de medida:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cria uma unidade nova (ex.: "Bandeja", "bdj", CONTAGEM)
  const criarUnidade = async ({ nome, sigla, tipo }) => {
    try {
      const { data } = await api.post('/unidades-medida', {
        Nome: nome.trim(),
        Sigla: sigla.trim(),
        Tipo: tipo,
      });
      cacheUnidades = [...cacheUnidades, data];
      setUnidades(cacheUnidades);
      return { success: true, data };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  return { unidades, loading, fetchUnidades, criarUnidade };
};