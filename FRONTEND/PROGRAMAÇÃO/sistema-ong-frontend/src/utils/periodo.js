// src/utils/periodo.js
// Períodos prontos dos relatórios. Tudo em data LOCAL ("AAAA-MM-DD"), sem horário nem fuso.
import { isoParaBR } from './format';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const PRESETS_PERIODO = [
  { id: 'mes', rotulo: 'Este mês' },
  { id: '30dias', rotulo: 'Últimos 30 dias' },
  { id: 'ano', rotulo: 'Este ano' },
  { id: 'personalizado', rotulo: 'Personalizado' },
];

/** { de, ate } do período pronto escolhido (o fim é sempre hoje). */
export const periodoDoPreset = (id, hoje = new Date()) => {
  const ate = iso(hoje);

  if (id === 'mes') return { de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate };
  if (id === 'ano') return { de: `${hoje.getFullYear()}-01-01`, ate };

  // Últimos 30 dias, contando hoje
  return { de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29)), ate };
};

/** "01/10/2026 a 18/10/2026" */
export const rotuloPeriodo = ({ de, ate }) => `${isoParaBR(de)} a ${isoParaBR(ate)}`;