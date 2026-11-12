  import { useState, useEffect, useMemo, useCallback } from 'react';
  import { useEstoque } from '../hooks/useEstoque';
  import { useDoacao } from '../hooks/useDoacao';
  import { useSolicitacao } from '../hooks/useSolicitacao';

  // Função auxiliar para converter 'DD/MM/YYYY' (gerado pelos seus hooks) em objeto Date
  const parseDataBR = (dataStr) => {
    if (!dataStr || dataStr === 'N/A') return null;
    if (dataStr.includes('/')) {
      const [dia, mes, ano] = dataStr.split('/');
      return new Date(ano, mes - 1, dia);
    }
    return new Date(dataStr); 
  };

  export const useRelatorios = () => {
    const [periodo, setPeriodo] = useState('MES_ATUAL'); // Valores possíveis: 'MES_ATUAL', 'ULTIMOS_30', 'ANO'
    const [isCarregandoInicial, setIsCarregandoInicial] = useState(true);

    // Importando seus hooks existentes
    const { estoque, fetchEstoque } = useEstoque();
    const { doacoesHistorico, fetchDoacoes } = useDoacao();
    const { solicitacoes, fetchSolicitacoes } = useSolicitacao();

    // Dispara as requisições em paralelo para carregar o Dashboard rápido
    const carregarDadosDashboard = useCallback(async () => {
      setIsCarregandoInicial(true);
      await Promise.all([
        fetchEstoque(),
        fetchDoacoes(),
        fetchSolicitacoes()
      ]);
      setIsCarregandoInicial(false);
    }, [fetchEstoque, fetchDoacoes, fetchSolicitacoes]);

    // Carrega ao montar o componente
    useEffect(() => {
      carregarDadosDashboard();
    }, [carregarDadosDashboard]);

    // ==========================================
    // LÓGICA DE NEGÓCIO E KPIs (Otimizado com useMemo)
    // ==========================================

    // 1. Alerta de Validade (Regra dos 3 Meses)
    const alertasValidade = useMemo(() => {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setMonth(hoje.getMonth() + 3);

    const itensEmRisco = estoque.filter(item => {
      const dataValidade = parseDataBR(item.validade);
      
      // Converte a quantidade para número para garantir a comparação
      const quantidadeDisponivel = parseFloat(item.qtd) || 0;

      if (!dataValidade) return false;

      // NOVA REGRA: Só entra no relatório se a data estiver no prazo E a quantidade for maior que zero
      return (
        dataValidade >= hoje && 
        dataValidade <= dataLimite && 
        quantidadeDisponivel > 0 // <--- A mágica acontece aqui
      );
    });

    return itensEmRisco
      .sort((a, b) => parseDataBR(a.validade) - parseDataBR(b.validade))
      .map(item => ({
        id: item.id,
        produto: item.nome,
        lote: item.origem || 'N/D',
        validade: item.validade,
        quantidade: item.qtd
      }));
  }, [estoque]);

    // 2. Solicitações Pendentes e Histórico Recente
  const { ultimasSolicitacoes, solicitacoesPendentes } = useMemo(() => {
      const pendentesCount = solicitacoes.filter(s => 
        (s.status || s.Status) === 'PENDENTE'
      ).length;
      
      // ORDENAÇÃO: Garanta que o mais novo venha primeiro por data ou ID
      const ordenadas = [...solicitacoes].sort((a, b) => {
        return new Date(b.data || b.Data) - new Date(a.data || a.Data);
      });

      // UX DECISION: Se for Relatório, não use .slice(0, 5). 
      // Se for Dashboard, use, mas saiba que ele limitará a visão.
      // Vou remover o slice para você ver todos os dados.
      const processadas = ordenadas.map(sol => {
          // Tenta pegar a data de múltiplas fontes possíveis do JSON
          const dataBruta = sol.data || sol.Data || sol.dataSolicitacao;
          
          return {
              id: sol.id || sol.Id,
              solicitante: sol.nomeSolicitante || sol.NomeSolicitante || 'N/A',
              // Correção de parsing de data
              data: dataBruta ? new Date(dataBruta).toLocaleDateString('pt-BR') : 'Data Inválida',
              status: sol.status || sol.Status
          };
      });

      return { ultimasSolicitacoes: processadas, solicitacoesPendentes: pendentesCount };
  }, [solicitacoes]);

    // 3. Calculadora de Estoque Total (Peso x Qtd)
    const estoqueTotalKg = useMemo(() => {
      const total = estoque.reduce((acumulador, item) => {
        const peso = parseFloat(item.peso) || 0;
        const qtd = parseFloat(item.qtd) || 0;
        // Se tem peso cadastrado, multiplica. Se não, soma apenas a unidade/qtd
        const valorSoma = peso > 0 ? (peso * qtd) : qtd;
        return acumulador + valorSoma;
      }, 0);
      
      // Formata no padrão numérico brasileiro: 2.450,50
      return total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }, [estoque]);

    // 4. Doações no Período Selecionado
    const doacoesFiltradasCount = useMemo(() => {
      const hoje = new Date();
      
      return doacoesHistorico.filter(doacao => {
        const dataDoacao = parseDataBR(doacao.data);
        if (!dataDoacao) return false;

        if (periodo === 'MES_ATUAL') {
          return dataDoacao.getMonth() === hoje.getMonth() && dataDoacao.getFullYear() === hoje.getFullYear();
        }
        if (periodo === 'ULTIMOS_30') {
          const trintaDiasAtras = new Date();
          trintaDiasAtras.setDate(hoje.getDate() - 30);
          return dataDoacao >= trintaDiasAtras && dataDoacao <= hoje;
        }
        if (periodo === 'ANO') {
          return dataDoacao.getFullYear() === hoje.getFullYear();
        }
        return true;
      }).length; 
    }, [doacoesHistorico, periodo]);

    // Objeto centralizado para o Dashboard
    const kpis = {
      solicitacoesPendentes,
      produtosProximosVencimento: alertasValidade.length,
      doacoesMes: doacoesFiltradasCount,
      estoqueTotalKg
    };

    return {
      kpis,
      alertasValidade,
      ultimasSolicitacoes,
      isLoading: isCarregandoInicial,
      periodo,
      setPeriodo,
      recarregarDados: carregarDadosDashboard
    };
  };