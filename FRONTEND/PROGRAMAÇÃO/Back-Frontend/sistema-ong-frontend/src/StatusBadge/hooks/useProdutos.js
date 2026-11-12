// src/hooks/useProdutos.js
import { useState, useCallback } from 'react';
import api from '../services/api';

export const useProdutos = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/produto');
      setProdutos(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { produtos, loading, fetchProdutos };
};