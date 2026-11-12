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