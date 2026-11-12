// src/utils/masks.js
// Máscaras de digitação e exibição (antes copiadas em cada tela).

/** Mantém só os dígitos. */
export const apenasDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

/** "52998224725" -> "529.982.247-25" (aceita digitação parcial) */
export const formatCPF = (valor) => {
  const d = apenasDigitos(valor).slice(0, 11);

  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/** "11912345678" -> "(11) 91234-5678"; fixo "1112345678" -> "(11) 1234-5678" (aceita digitação parcial) */
export const formatTelefone = (valor) => {
  const d = apenasDigitos(valor).slice(0, 11);

  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};