// src/hooks/useDoacao.js
import { useState, useCallback } from 'react';
import api, { extrairErro } from '../../services/api';
import { formatarData, formatarQuantidade } from '../../utils/format';

export const useDoacao = () => {
    const [doacoesHistorico, setDoacoesHistorico] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // GET: Buscar histórico
    const fetchDoacoes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/doacao');

            // "Achatando" a resposta: cada item vira uma linha na tabela de histórico
            const historicoFormatado = [];
            data.forEach(doacao => {
                const dataFormatada = formatarData(doacao.data);
                doacao.itens.forEach(item => {
                    historicoFormatado.push({
                        idId: item.id, // ID interno do item (para chave do React)
                        idDisplay: `ENT-${doacao.id.toString().padStart(4, '0')}`, // Ex: ENT-0042
                        data: dataFormatada,
                        doador: doacao.nomeDoador,
                        produto: item.nomeProduto,
                        quantidade: formatarQuantidade(item.quantidade, item.unidade), // Ex: "12,5 kg"
                        validade: formatarData(item.dataValidade)
                    });
                });
            });

            setDoacoesHistorico(historicoFormatado);
        } catch (err) {
            setError(extrairErro(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // POST: Criar nova doação
    const createDoacao = async (payload) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/doacao', payload);
            return { success: true, data };
        } catch (err) {
            const message = extrairErro(err);
            setError(message);
            return { success: false, message };
        } finally {
            setIsLoading(false);
        }
    };

    return { doacoesHistorico, isLoading, error, fetchDoacoes, createDoacao };
};

