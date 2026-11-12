import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './StatusBadge/contexts/AuthContext';

import Login from './pages/Login/Login';
import Sidebar from './components/Sidebar';
import Funcionarios from './pages/Funcionarios/Funcionarios';
import Estoque from './pages/Estoque/Estoque';
import Doador from './pages/Doador/Doador';
import Solicitante from './pages/Solicitante/Solicitante';
import Doacao from './pages/Doacao/Doacao';
import Solicitacao from './pages/Solicitacao/Solicitacao';
import Relatorios from './pages/Relatorios/Relatorios';


const Placeholder = ({ title }) => (
  <div className="flex-1 p-10">
    <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
    <p className="mt-4 text-gray-600">Esta tela será desenvolvida em breve.</p>
  </div>
);

function App() {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!signed ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="flex h-screen bg-[#F8F9FA] text-gray-900">
          <Sidebar />
          
          <main className="flex-1 overflow-y-auto">
            <Routes>
              {/* 2. SUBSTITUIÇÃO: Trocamos o Placeholder pela tela real que codificamos */}
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
              <Route path="/doador" element={<Doador />} />
              <Route path="/solicitante" element={<Solicitante />} />
              <Route path="/doacao" element={<Doacao />} />
              <Route path="/solicitacao" element={<Solicitacao />} />
              <Route path="/relatorios" element={<Relatorios />} />
              {/* Redirecionamento padrão para logados */}
              <Route path="*" element={<Navigate to="/estoque" />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;