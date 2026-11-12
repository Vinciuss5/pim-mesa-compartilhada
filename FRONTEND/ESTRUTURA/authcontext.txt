import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assim que o app inicia, verificamos se já existe um token salvo
  useEffect(() => {
    const token = localStorage.getItem('@MesaCompartilhada:token');
    if (token) {
      setUser({ token });
    }
    setLoading(false);
  }, []);

  async function signIn(email, senha) {
    try {
      // Fazemos a requisição para o endpoint do AuthController[cite: 2]
      const response = await fetch('http://localhost:5235/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // O corpo da requisição mapeia perfeitamente para o LoginDTO[cite: 3]
        body: JSON.stringify({ email, senha }), 
      });

      const data = await response.json();

      // Tratamento de erro retornado pela API (Ex: 401 Unauthorized)[cite: 2]
      if (!response.ok) {
        return { success: false, message: data.message || 'Erro ao autenticar. Verifique suas credenciais.' };
      }

      // Sucesso: Salvamos o token no LocalStorage e atualizamos o estado
      localStorage.setItem('@MesaCompartilhada:token', data.token);
      setUser({ token: data.token });

      return { success: true };
    } catch (error) {
      console.error("Erro no login:", error);
      return { success: false, message: 'Erro de conexão com o servidor. Verifique se a API está rodando.' };
    }
  }

  // Função para fazer logout e limpar a sessão
  function signOut() {
    localStorage.removeItem('@MesaCompartilhada:token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}