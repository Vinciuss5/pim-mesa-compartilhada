// src/hooks/useEstoque.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../services/api';
import { formatarData } from '../utils/format';

export function useEstoque() {
  const [estoque, setEstoque] = useState([]);
  const [alertasBaixoEstoque, setAlertasBaixoEstoque] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Listar Estoque Geral
  const fetchEstoque = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/estoque');

      // FILTRO: Removemos itens com quantidade 0 para não ocuparem espaço no relatório/lista
      const estoqueFormatado = data
        .filter(item => item.quantidade > 0)
        .map(item => ({
          id: item.id,
          produtoId: item.produtoId,
          nome: item.produtoNome,
          qtd: item.quantidade,
          unidade: item.unidade,          // sigla da unidade (kg, L, un, pct...)
          status: item.status,
          peso: item.peso,                // peso de UMA unidade, em kg (0 se não informado)
          origem: item.origem,
          validade: formatarData(item.validade),
          lote: item.loteCodigo || 'N/A',
          entrada: formatarData(item.dataEntrada)
        }));

      setEstoque(estoqueFormatado);
    } catch (err) {
      setError(extrairErro(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Buscar Alertas de Baixo Estoque
  const fetchBaixoEstoque = useCallback(async (limite = 5) => {
    try {
      const { data } = await api.get('/estoque/baixo-estoque', { params: { limite } });

      // Baixo estoque significa que tem POUCO, não que tem ZERO.
      const apenasComAlgumaQuantidade = data.filter(item => item.quantidade > 0);

      setAlertasBaixoEstoque(apenasComAlgumaQuantidade);
    } catch (err) {
      console.error('Erro ao buscar alertas de estoque:', err);
    }
  }, []);

  // 3. Cadastrar Novo Produto
  // Não mexe em isLoading/error: eles pertencem à LISTAGEM. Antes, um erro ao cadastrar
  // fazia a tela trocar a tabela por "Erro ao carregar dados". A tela controla o próprio 'salvando'.
  const createProduto = async (produtoData) => {
    try {
      const payload = {
        Nome: produtoData.nome.trim(),
        UnidadeMedidaId: Number(produtoData.unidadeId),
        Categoria: produtoData.categoria || null,
        ControlaValidade: produtoData.controlaValidade,
        EstoqueMinimo: produtoData.estoqueMinimo !== '' ? parseFloat(produtoData.estoqueMinimo) : null,
        PesoKg: produtoData.peso ? parseFloat(produtoData.peso) : null
      };

      const { data: novoProduto } = await api.post('/produto', payload);
      return { success: true, data: novoProduto };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  return {
    estoque,
    alertasBaixoEstoque,
    isLoading,
    error,
    fetchEstoque,
    fetchBaixoEstoque,
    createProduto,
  };
}