// src/hooks/useEstoque.js
// Consultas de estoque: lotes, resumo por produto, e o ajuste manual de lote.
// (Cadastro e edição de produto ficam em useProdutos.)
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';
import { formatarData } from '../../utils/format';

export function useEstoque() {
  // --- LOTES (uma linha por lote com saldo) ---
  const [estoque, setEstoque] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- RESUMO (uma linha por produto, somando os lotes) ---
  const [resumo, setResumo] = useState([]);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [errorResumo, setErrorResumo] = useState(null);

  // 1. Lotes
  const fetchEstoque = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/estoque');

      // Lotes zerados não aparecem na lista
      const estoqueFormatado = data
        .filter((item) => item.quantidade > 0)
        .map((item) => ({
          id: item.id,
          produtoId: item.produtoId,
          nome: item.produtoNome,
          qtd: item.quantidade,
          unidade: item.unidade,          // sigla da unidade (kg, L, un, pct...)
          status: item.status,            // Disponível | Vence em breve | Vencido (calculado no backend)
          peso: item.peso,                // peso de UMA unidade, em kg (0 se não informado)
          origem: item.origem,
          validade: formatarData(item.validade),
          lote: item.loteCodigo || 'N/A',
          entrada: formatarData(item.dataEntrada),
        }));

      setEstoque(estoqueFormatado);
    } catch (err) {
      setError(extrairErro(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Resumo por produto (inclui produtos sem nenhum lote, que aparecem como "Zerado")
  const fetchResumo = useCallback(async () => {
    setLoadingResumo(true);
    setErrorResumo(null);
    try {
      const { data } = await api.get('/estoque/resumo');
      setResumo(data);
    } catch (err) {
      setErrorResumo(extrairErro(err));
    } finally {
      setLoadingResumo(false);
    }
  }, []);

  // 3. Ajuste manual de um lote (perda, vencimento, avaria, correção).
  // Não mexe nos estados de listagem; a tela decide o que fazer com o resultado.
  const ajustarEstoque = async ({ estoqueId, variacao, motivo, observacao }) => {
    try {
      await api.post('/estoque/ajuste', {
        EstoqueId: estoqueId,
        Variacao: variacao,
        Motivo: motivo,
        Observacao: observacao?.trim() || null,
      });
      return { success: true };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  return {
    estoque,
    isLoading,
    error,
    fetchEstoque,
    resumo,
    loadingResumo,
    errorResumo,
    fetchResumo,
    ajustarEstoque,
  };
}