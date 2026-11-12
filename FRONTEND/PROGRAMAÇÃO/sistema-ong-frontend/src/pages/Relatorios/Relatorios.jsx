import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { periodoDoPreset } from '../../utils/periodo';
import PeriodoFiltro from './components/PeriodoFiltro';
import VisaoGeralTab from './components/VisaoGeralTab';
import DoacoesTab from './components/DoacoesTab';
import SolicitacoesTab from './components/SolicitacoesTab';
import EstoqueTab from './components/EstoqueTab';
import SolicitanteTab from './components/SolicitanteTab';

const ABAS = [
  { id: 'geral', rotulo: 'Visão geral' },
  { id: 'doacoes', rotulo: 'Doações' },
  { id: 'solicitacoes', rotulo: 'Solicitações e entregas' },
  { id: 'estoque', rotulo: 'Estoque crítico' },
  { id: 'solicitante', rotulo: 'Por solicitante' },
];

export default function Relatorios() {
  const [aba, setAba] = useState('geral');
  const [periodo, setPeriodo] = useState(() => periodoDoPreset('30dias'));
  const [solicitanteId, setSolicitanteId] = useState('');

  // Do ranking de solicitantes para o histórico de um deles
  const verSolicitante = (id) => {
    setSolicitanteId(String(id));
    setAba('solicitante');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans text-[#2D3748]">
      <PageHeader
        title="Relatórios"
        subtitle="Números calculados no servidor, prontos para prestação de contas. Cada tabela pode ser exportada em CSV."
      />

      <PeriodoFiltro periodo={periodo} onChange={setPeriodo} />

      {/* ABAS */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200" role="tablist">
        {ABAS.map(({ id, rotulo }) => {
          const ativa = aba === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                ativa
                  ? 'border-[#007F45] text-[#007F45]'
                  : 'border-transparent text-[#718096] hover:text-[#2D3748]'
              }`}
            >
              {rotulo}
            </button>
          );
        })}
      </div>

      {/* Só a aba ativa é montada: cada uma busca os próprios dados quando aparece */}
      {aba === 'geral' && <VisaoGeralTab periodo={periodo} />}
      {aba === 'doacoes' && <DoacoesTab periodo={periodo} />}
      {aba === 'solicitacoes' && <SolicitacoesTab periodo={periodo} onVerSolicitante={verSolicitante} />}
      {aba === 'estoque' && <EstoqueTab periodo={periodo} />}
      {aba === 'solicitante' && (
        <SolicitanteTab
          periodo={periodo}
          solicitanteId={solicitanteId}
          onEscolherSolicitante={setSolicitanteId}
        />
      )}
    </div>
  );
}