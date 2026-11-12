// src/utils/cpf.js
// Validação de CPF pelos dois dígitos verificadores (a mesma regra do backend: Models/Cpf.cs).
import { apenasDigitos } from './masks';

/** Verdadeiro se o CPF (com ou sem máscara) tem 11 dígitos, não é sequência repetida e os dígitos verificadores conferem. */
export const cpfValido = (valor) => {
  const d = apenasDigitos(valor);

  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // 000.000.000-00, 111.111.111-11...

  const digito = (quantidade) => {
    let soma = 0;
    for (let i = 0; i < quantidade; i++) soma += Number(d[i]) * (quantidade + 1 - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
};

/**
 * Mensagem de erro para o campo, ou null quando está tudo certo.
 * Campo vazio só é erro se for obrigatório.
 */
export const erroCpf = (valor, { obrigatorio = false } = {}) => {
  const d = apenasDigitos(valor);

  if (d.length === 0) return obrigatorio ? 'Informe o CPF.' : null;
  if (d.length < 11) return 'CPF incompleto: faltam dígitos.';

  return cpfValido(d) ? null : 'CPF inválido: confira os números digitados.';
};