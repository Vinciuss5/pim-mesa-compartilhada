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