import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, HeartHandshake, ClipboardList, Package, 
  ArrowDownToLine, ArrowUpFromLine, FileText, LogOut 
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useContext(AuthContext);

  // Mapeamos o nome do menu para a rota real
  const menuItems = [
    { name: 'Funcionários', icon: Users, path: '/funcionarios' },
    { name: 'Doadores', icon: HeartHandshake, path: '/doador' },
    { name: 'Solicitantes', icon: ClipboardList, path: '/solicitante' },
    { type: 'divider' },
    { name: 'Controle de Estoque', icon: Package, path: '/estoque' },
    { type: 'divider' },
    { name: 'Entrada de Doações', icon: ArrowDownToLine, path: '/doacao' },
    { name: 'Saída de Solicitações', icon: ArrowUpFromLine, path: '/solicitacao' },
    { name: 'Relatórios', icon: FileText, path: '/relatorios' },
  ];

const handleLogout = () => {
    // 1. Alteramos o estado global da aplicação (Removemos o usuário logado)
    // Isso fará o App.jsx re-renderizar e mudar a variável 'signed' para false.
    signOut(); 
    
    // 2. Não precisamos dar um navigate() manual aqui se o seu App.jsx 
    // já troca o bloco de rotas quando signed é false.
  };

  return (
    <div className="w-62 min-h-screen bg-[#007b3e] flex flex-col justify-between py-6">
      
      {/* CABEÇALHO */}
      <div className="px-6 mb-8">
        <h1 className="text-1xl font-black text-white italic leading-tight tracking-wider uppercase">
          Mesa<br />Compartilhada
        </h1>
        <div className="w-10 h-1 bg-white/30 mt-4 rounded-full"></div>
      </div>

      {/* MENU */}
      <div className="flex-1 px-4">
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 px-2">
          Principal
        </p>
        
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={index} className="h-px bg-white/10 my-4 mx-2"></div>;
            }

            // Verifica se a rota atual é a deste botão
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                  isActive 
                    ? 'bg-white text-[#007b3e] shadow-md shadow-black/10' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#007b3e]" : "text-white/70"} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SAIR */}
      <div className="px-4 mt-8">
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 px-2">
          Conta
        </p>
        <button 
          onClick={signOut} // Chama a função de sair do contexto de autenticação
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={20} className="text-white/70" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}