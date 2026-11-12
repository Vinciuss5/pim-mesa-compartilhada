// src/hooks/useProdutos.js
// Tudo que é CRUD de produto fica aqui (listar, criar, atualizar).
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';

const temValor = (v) => v !== '' && v !== null && v !== undefined;

// Monta o corpo que a API espera. ProdutoCreateDTO e ProdutoUpdateDTO têm os mesmos campos.
const montarPayload = (form) => ({
  Nome: form.nome.trim(),
  UnidadeMedidaId: Number(form.unidadeId),
  Categoria: form.categoria || null,
  ControlaValidade: form.controlaValidade,
  EstoqueMinimo: temValor(form.estoqueMinimo) ? parseFloat(form.estoqueMinimo) : null,
  PesoKg: temValor(form.peso) ? parseFloat(form.peso) : null,
  DiasAlertaValidade: temValor(form.diasAlertaValidade) ? parseInt(form.diasAlertaValidade, 10) : 30,
});

export const useProdutos = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/produto');
      // Defesa: a tela usa produtos.find/map, que só existem em listas
      if (!Array.isArray(data)) {
        console.error('Resposta inesperada de /produto (era esperada uma lista):', data);
        setProdutos([]);
        return;
      }

      setProdutos(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Não mexe em `loading`: ele pertence à listagem.
  const createProduto = async (form) => {
    try {
      const { data } = await api.post('/produto', montarPayload(form));
      return { success: true, data };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  // A API devolve 400 com a mensagem quando, por exemplo, se tenta trocar a unidade
  // de um produto que já tem estoque, doações ou solicitações.
  const updateProduto = async (id, form) => {
    try {
      await api.put(`/produto/${id}`, montarPayload(form));
      return { success: true };
    } catch (err) {
      return { success: false, message: extrairErro(err) };
    }
  };

  return { produtos, loading, fetchProdutos, createProduto, updateProduto };
};