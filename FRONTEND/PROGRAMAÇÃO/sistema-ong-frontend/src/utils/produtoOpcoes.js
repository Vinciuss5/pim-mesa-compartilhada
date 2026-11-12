// src/utils/produtoOpcoes.js
// Os valores (value) precisam ser idênticos aos aceitos pela API (ProdutoDTO).

export const CATEGORIAS = [
  { value: 'ALIMENTO_NAO_PERECIVEL', label: 'Alimento não perecível' },
  { value: 'ALIMENTO_PERECIVEL', label: 'Alimento perecível' },
  { value: 'BEBIDA', label: 'Bebida' },
  { value: 'HIGIENE', label: 'Higiene pessoal' },
  { value: 'LIMPEZA', label: 'Limpeza' },
  { value: 'OUTROS', label: 'Outros' },
];

export const TIPOS_UNIDADE = [
  { value: 'MASSA', label: 'Peso (kg, g...)' },
  { value: 'VOLUME', label: 'Volume (L, ml...)' },
  { value: 'CONTAGEM', label: 'Contagem (un, pct, cx...)' },
];

export const rotuloCategoria = (value) =>
  CATEGORIAS.find((c) => c.value === value)?.label ?? '—';

// Antecedência do alerta de validade, em dias. O mesmo padrão existe no backend (RegrasValidade).
export const DIAS_ALERTA_PADRAO = 30;

// Sugestão ao escolher a categoria. É só um ponto de partida: ajuste conforme o giro real da ONG.
export const DIAS_ALERTA_SUGERIDOS = {
  ALIMENTO_PERECIVEL: 15,
  ALIMENTO_NAO_PERECIVEL: 90,
  BEBIDA: 60,
  HIGIENE: 90,
  LIMPEZA: 90,
  OUTROS: 30,
};