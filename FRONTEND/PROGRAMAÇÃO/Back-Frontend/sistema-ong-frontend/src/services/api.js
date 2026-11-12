// src/services/api.js
import axios from 'axios';

// ÚNICA fonte da chave do token: o AuthContext importa esta constante.
// (Antes, o AuthContext gravava em '@MesaCompartilhada:token' e este arquivo lia '@ONG:token',
//  então a requisição nunca levava o token.)
export const TOKEN_KEY = '@MesaCompartilhada:token';

const api = axios.create({
  // Sem barra no final
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5235/api',
  headers: { 'Content-Type': 'application/json' },
});

// Antes de cada chamada: anexa o token, se existir
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Depois de cada resposta: sessão expirada/token inválido volta para o login.
// A própria chamada de login fica de fora (lá, 401 significa "senha incorreta").
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const ehLogin = error.config?.url?.toLowerCase().includes('login');
    if (error.response?.status === 401 && !ehLogin) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login'; // AJUSTE para a rota real da sua tela de Login
    }
    return Promise.reject(error);
  }
);

// Mensagem de erro amigável (substitui o handleResponse dos hooks que usavam fetch)
export function extrairErro(err) {
  const data = err.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(', ');
  if (!err.response) return 'Sem conexão com o servidor. Verifique se a API está rodando.';
  return 'Erro de comunicação com o servidor.';
}

export default api;