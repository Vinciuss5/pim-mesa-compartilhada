// src/hooks/useSolicitacao.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';

export const useSolicitacao = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET: Lista todas as solicitações (Histórico)
  const fetchSolicitacoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/solicitacao');
      setSolicitacoes(data);
    } catch (err) {
      console.error(err);
      setError(extrairErro(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // POST: Cria uma nova solicitação
  const criarSolicitacao = useCallback(async (novaSolicitacao) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/solicitacao', novaSolicitacao);

      // Atualiza a lista local adicionando a nova solicitação no topo
      setSolicitacoes((prev) => [data, ...prev]);
      return { sucesso: true, data };
    } catch (err) {
      console.error(err);
      // Traz a mensagem de regra de negócio do C# (ex.: saldo insuficiente)
      const erro = extrairErro(err);
      setError(erro);
      return { sucesso: false, erro };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH: Atualiza o status (PENDENTE, ENTREGUE, CANCELADO)
  const atualizarStatus = useCallback(async (id, novoStatus) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/solicitacao/${id}/status`, { novoStatus });

      // Atualiza o status localmente para evitar um novo GET
      setSolicitacoes((prev) =>
        prev.map((sol) => (sol.id === id ? { ...sol, status: novoStatus } : sol))
      );

      return { sucesso: true };
    } catch (err) {
      console.error(err);
      const erro = extrairErro(err);
      setError(erro);
      return { sucesso: false, erro };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    solicitacoes,
    loading,
    error,
    fetchSolicitacoes,
    criarSolicitacao,
    atualizarStatus
  };
};