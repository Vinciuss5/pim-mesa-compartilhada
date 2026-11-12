// src/hooks/useRelatorio.js
// Busca UM relatório no backend e o refaz sempre que o caminho ou os filtros mudam.
//
// Uso: const { dados, loading, error, recarregar } = useRelatorio('/relatorio/doacoes', { de, ate });
import { useState, useEffect, useCallback, useRef } from 'react';
import api, { extrairErro } from '../../services/api';

export function useRelatorio(caminho, params, { ativo = true } = {}) {
  const [dados, setDados] = useState(null);
  // Começa "carregando" quando o relatório está ativo: evita um instante de tela vazia antes da primeira busca
  const [loading, setLoading] = useState(ativo);
  const [error, setError] = useState(null);

  // Só a resposta da ÚLTIMA busca vale: se o filtro mudar rápido, uma resposta lenta e antiga não sobrescreve a nova
  const ultimaBusca = useRef(0);

  // Chave estável: o objeto `params` muda de identidade a cada render, mas o conteúdo não
  const chave = JSON.stringify(params ?? {});

  const carregar = useCallback(async () => {
    const minhaBusca = ++ultimaBusca.current;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get(caminho, { params: JSON.parse(chave) });
      if (minhaBusca !== ultimaBusca.current) return;
      setDados(data);
    } catch (err) {
      if (minhaBusca !== ultimaBusca.current) return;
      setDados(null);
      setError(extrairErro(err));
    } finally {
      if (minhaBusca === ultimaBusca.current) setLoading(false);
    }
  }, [caminho, chave]);

  useEffect(() => {
    if (ativo) carregar();
  }, [ativo, carregar]);

  return { dados, loading, error, recarregar: carregar };
}