// src/utils/exportarCsv.js
// Exporta uma tabela como CSV que abre direto no Excel em português (separador ";", acentos preservados).

const escapar = (valor) => {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  // Aspas, ponto e vírgula e quebras de linha exigem o campo entre aspas
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

/** 1234.5 -> "1234,5" (vírgula decimal, sem separador de milhar, para o Excel tratar como número) */
export const numeroCsv = (n) => (n === null || n === undefined ? '' : String(Number(n)).replace('.', ','));

/**
 * Monta o texto do CSV. colunas = [{ titulo, valor: (linha) => ... }]
 * (função pura, separada do download para poder ser testada)
 */
export const montarCsv = (colunas, linhas) => {
  const cabecalho = colunas.map((c) => escapar(c.titulo)).join(';');
  const corpo = linhas.map((linha) => colunas.map((c) => escapar(c.valor(linha))).join(';'));
  // BOM no início: sem ele o Excel mostra os acentos quebrados
  return '\uFEFF' + [cabecalho, ...corpo].join('\r\n');
};

/** Gera o arquivo e dispara o download no navegador. */
export const exportarCsv = (nomeArquivo, colunas, linhas) => {
  const blob = new Blob([montarCsv(colunas, linhas)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};