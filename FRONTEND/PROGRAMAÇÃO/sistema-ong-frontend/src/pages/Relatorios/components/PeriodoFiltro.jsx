// src/pages/Relatorios/components/PeriodoFiltro.jsx
import { useState } from 'react';
import { PRESETS_PERIODO, periodoDoPreset, rotuloPeriodo } from '../../../utils/periodo';
import { hojeISO } from '../../../utils/format';

const inputClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#007F45] focus:ring-1 focus:ring-[#007F45]';

/**
 * Props:
 *  - periodo: { de, ate } ("AAAA-MM-DD") em uso nos relatórios
 *  - onChange(novoPeriodo): chamado só quando o período é válido (de <= ate)
 */
export default function PeriodoFiltro({ periodo, onChange }) {
  const [preset, setPreset] = useState('30dias');
  const [rascunho, setRascunho] = useState(periodo); // o que está nos campos de data (modo personalizado)

  const invalido = Boolean(rascunho.de && rascunho.ate && rascunho.de > rascunho.ate);

  const escolherPreset = (id) => {
    setPreset(id);

    if (id !== 'personalizado') {
      const novo = periodoDoPreset(id);
      setRascunho(novo);
      onChange(novo);
    }
  };

  const alterarData = (campo) => (e) => {
    const novo = { ...rascunho, [campo]: e.target.value };
    setRascunho(novo);

    // Só dispara a busca quando as duas datas existem e fazem sentido
    if (novo.de && novo.ate && novo.de <= novo.ate) onChange(novo);
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
          {PRESETS_PERIODO.map(({ id, rotulo }) => (
            <button
              key={id}
              onClick={() => escolherPreset(id)}
              aria-pressed={preset === id}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                preset === id
                  ? 'border-[#007F45] bg-[#007F45] text-white'
                  : 'border-gray-200 bg-white text-[#4A5568] hover:border-[#007F45] hover:text-[#007F45]'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {preset === 'personalizado' ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="rel-de" className="text-xs font-medium text-[#718096]">De</label>
              <input id="rel-de" type="date" value={rascunho.de} max={hojeISO()} onChange={alterarData('de')} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rel-ate" className="text-xs font-medium text-[#718096]">Até</label>
              <input id="rel-ate" type="date" value={rascunho.ate} max={hojeISO()} onChange={alterarData('ate')} className={inputClass} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#718096]">
            Período: <strong className="text-[#2D3748]">{rotuloPeriodo(periodo)}</strong>
          </p>
        )}
      </div>

      {invalido && (
        <p className="mt-3 text-xs font-medium text-red-600">
          A data inicial não pode ser posterior à data final. O relatório continua mostrando o período anterior.
        </p>
      )}
    </div>
  );
}