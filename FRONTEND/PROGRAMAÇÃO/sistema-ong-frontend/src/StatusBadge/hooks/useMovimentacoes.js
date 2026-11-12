// src/hooks/useMovimentacoes.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';

export const useMovimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * filtros (todos opcionais): { produtoId, tipo, de, ate, limite }
   * `de` e `ate` no formato "AAAA-MM-DD" (o mesmo do <input type="date">).
   */
  const fetchMovimentacoes = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filtros.produtoId) params.produtoId = filtros.produtoId;
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.de) params.de = filtros.de;
      if (filtros.ate) params.ate = filtros.ate;
      if (filtros.limite) params.limite = filtros.limite;

      const { data } = await api.get('/movimentacao', { params });
      setMovimentacoes(data);
    } catch (err) {
      setError(extrairErro(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { movimentacoes, loading, error, fetchMovimentacoes };
};