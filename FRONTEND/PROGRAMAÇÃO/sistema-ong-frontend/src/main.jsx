import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Importamos o Provedor que criamos no passo anterior
import { AuthProvider } from './StatusBadge/contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos o App com o AuthProvider. 
      Isso permite que qualquer tela dentro do App 
      tenha acesso às funções de login e logout.
    */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)