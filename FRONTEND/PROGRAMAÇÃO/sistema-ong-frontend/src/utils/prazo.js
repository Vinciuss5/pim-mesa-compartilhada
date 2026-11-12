// src/utils/prazo.js
// Regras de prazo de entrega das solicitações (atrasada, hoje, amanhã...).
// Tudo é calculado em DATA LOCAL, sem horário: evita o "um dia a menos" que o fuso horário causa.

const MS_DIA = 24 * 60 * 60 * 1000;

// "2026-10-20" ou "2026-10-20T00:00:00" -> Date local à meia-noite (sem converter fuso)
const paraDataLocal = (valor) => {
  if (!valor) return null;
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-').map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
};

/** Dias entre hoje e a data (negativo = já passou). Devolve null se não houver data. */
export const diasParaPrazo = (valor, hoje = new Date()) => {
  const alvo = paraDataLocal(valor);
  if (!alvo) return null;
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo - inicioHoje) / MS_DIA);
};

/**
 * Classifica uma solicitação pelo prazo. Só solicitações PENDENTES têm prazo a cobrar;
 * as demais (entregue/cancelada) ficam em ENCERRADA.
 *
 * grupo: ATRASADA | HOJE | AMANHA | SEMANA (2 a 7 dias) | FUTURA (mais de 7) | SEM_PREVISAO | ENCERRADA
 */
export const classificarPrazo = (solicitacao, hoje = new Date()) => {
  if (solicitacao.status !== 'PENDENTE') {
    return { grupo: 'ENCERRADA', dias: null, rotulo: '' };
  }

  const dias = diasParaPrazo(solicitacao.dataPrevisaoEntrega, hoje);

  if (dias === null) return { grupo: 'SEM_PREVISAO', dias: null, rotulo: 'Sem previsão' };
  if (dias < 0) {
    return { grupo: 'ATRASADA', dias, rotulo: `Atrasada há ${-dias} ${-dias === 1 ? 'dia' : 'dias'}` };
  }
  if (dias === 0) return { grupo: 'HOJE', dias, rotulo: 'Hoje' };
  if (dias === 1) return { grupo: 'AMANHA', dias, rotulo: 'Amanhã' };
  if (dias <= 7) return { grupo: 'SEMANA', dias, rotulo: `Em ${dias} dias` };
  return { grupo: 'FUTURA', dias, rotulo: `Em ${dias} dias` };
};

/**
 * Ordem da fila de trabalho: pendentes primeiro, do prazo mais urgente para o mais folgado
 * (atrasadas no topo, sem previsão no fim); depois as encerradas, da mais recente para a mais antiga.
 */
export const compararPorUrgencia = (a, b) => {
  const aPendente = a.status === 'PENDENTE';
  const bPendente = b.status === 'PENDENTE';

  if (aPendente !== bPendente) return aPendente ? -1 : 1;

  if (aPendente) {
    const diasA = a.prazo.dias ?? Infinity;
    const diasB = b.prazo.dias ?? Infinity;
    if (diasA !== diasB) return diasA < diasB ? -1 : 1;
    // Mesmo prazo: a mais antiga primeiro
    return new Date(a.dataSolicitacao) - new Date(b.dataSolicitacao);
  }

  return new Date(b.dataSolicitacao) - new Date(a.dataSolicitacao);
};