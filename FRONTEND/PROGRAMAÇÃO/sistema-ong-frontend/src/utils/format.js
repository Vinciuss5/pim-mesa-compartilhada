// src/utils/format.js
// Funções de formatação compartilhadas (evita repetir toLocaleDateString e `${qtd} un` em cada tela).

const formatadorNumero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/** 1234.5 -> "1.234,5" */
export const formatarNumero = (valor) => formatadorNumero.format(Number(valor) || 0);

/** (12.5, 'kg') -> "12,5 kg" */
export const formatarQuantidade = (valor, sigla) =>
  `${formatarNumero(valor)} ${sigla ?? ''}`.trim();

/** '2026-12-10T00:00:00' -> "10/12/2026" (ou "N/A" quando vazio) */
export const formatarData = (valor) =>
  valor ? new Date(valor).toLocaleDateString('pt-BR') : 'N/A';

/**
 * Data de HOJE no fuso do usuário, no formato "AAAA-MM-DD" (o que o <input type="date"> usa).
 * Atenção: new Date().toISOString() devolve a data em UTC, que à noite (no Brasil) já é "amanhã".
 */
export const hojeISO = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

/** '2026-12-10' -> "10/12/2026" (troca o texto, sem criar Date: não sofre com fuso horário) */
export const isoParaBR = (iso) => {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
};