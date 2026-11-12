// src/pages/Relatorios/relatorioUtils.js
import { formatarQuantidade } from '../../utils/format';
import { rotuloMotivoReagendamento } from '../Solicitacao/components/ReagendarModal';

/** [{ unidade: 'kg', quantidade: 12.5 }, ...] -> "12,5 kg · 30 un" */
export const textoQuantidades = (lista) =>
  lista && lista.length > 0
    ? lista.map((q) => formatarQuantidade(q.quantidade, q.unidade)).join(' · ')
    : '—';

export const ROTULO_MOTIVO_PERDA = {
  PERDA: 'Perda',
  VENCIMENTO: 'Produto vencido',
  AVARIA: 'Avaria / danificado',
  NAO_INFORMADO: 'Não informado',
};

export const rotuloMotivoReag = (valor) =>
  valor === 'NAO_INFORMADO' ? 'Não informado' : rotuloMotivoReagendamento(valor) ?? valor;

/** "doacoes_2026-10-01_a_2026-10-18" */
export const nomeArquivo = (base, periodo) => `${base}_${periodo.de}_a_${periodo.ate}`;

/** Percentual inteiro, sem dividir por zero */
export const percentual = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);