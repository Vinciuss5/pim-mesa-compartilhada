// src/pages/Solicitacao/components/ReagendarModal.jsx
// Troca (ou define) a previsão de entrega de uma solicitação pendente, guardando o motivo.
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/contexts/ToastContext';
import { formatarData, hojeISO } from '../../../utils/format';

export const MOTIVOS_REAGENDAMENTO = [
  { value: 'IMPREVISTO_SOLICITANTE', label: 'Imprevisto do solicitante' },
  { value: 'TRANSPORTE', label: 'Falta de transporte / logística' },
  { value: 'AGUARDANDO_DOACAO', label: 'Aguardando nova doação' },
  { value: 'OUTRO', label: 'Outro motivo' },
];

export const rotuloMotivoReagendamento = (valor) =>
  MOTIVOS_REAGENDAMENTO.find((m) => m.value === valor)?.label ?? null;

const inputClass =
  'w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#007F45] focus:border-[#007F45] outline-none transition-all bg-white';

const FORM_INICIAL = { novaData: '', motivo: '', observacao: '' };

/**
 * Props:
 *  - open / onClose
 *  - solicitacao: a solicitação a reagendar (ou null)
 *  - onSubmit({ novaData, motivo, observacao }) -> Promise<{ sucesso, erro? }>
 */
export default function ReagendarModal({ open, onClose, solicitacao, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) setForm(FORM_INICIAL);
  }, [open, solicitacao]);

  if (!solicitacao) return null;

  const previsaoAtual = solicitacao.dataPrevisaoEntrega;
  const definindo = !previsaoAtual; // ainda não tinha previsão
  const hoje = hojeISO();
  const alterar = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.novaData) {
      toast.error('Informe a nova data de entrega.');
      return;
    }
    if (form.novaData < hoje) {
      toast.error('A nova data não pode ser anterior a hoje.');
      return;
    }
    if (previsaoAtual && form.novaData === previsaoAtual.slice(0, 10)) {
      toast.error('A nova data é igual à previsão atual.');
      return;
    }
    if (form.motivo === 'OUTRO' && !form.observacao.trim()) {
      toast.error('Explique o motivo no campo de observação.');
      return;
    }

    setSalvando(true);
    const resultado = await onSubmit({
      novaData: form.novaData,
      motivo: form.motivo,
      observacao: form.observacao,
    });
    setSalvando(false);

    if (resultado.sucesso) {
      onClose();
    } else {
      toast.error(resultado.erro || 'Não foi possível reagendar a entrega.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={definindo ? 'Definir previsão de entrega' : 'Reagendar entrega'}
      size="sm"
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-medium text-[#718096] hover:text-[#2D3748]">
            Cancelar
          </button>
          <button
            type="submit"
            form="reagendar-form"
            disabled={salvando}
            className="rounded-md bg-[#007F45] px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006838] disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : definindo ? 'Definir data' : 'Reagendar'}
          </button>
        </div>
      }
    >
      <form id="reagendar-form" onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="font-bold text-[#2D3748]">
            Solicitação #{solicitacao.id} — {solicitacao.nomeSolicitante}
          </p>
          <p className="text-xs text-[#718096]">
            Previsão atual:{' '}
            <strong className="text-[#4A5568]">
              {previsaoAtual ? formatarData(previsaoAtual) : 'não informada'}
            </strong>
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="reag-data">
            {definindo ? 'Previsão de entrega' : 'Nova data de entrega'} <span className="text-red-500">*</span>
          </label>
          <input
            id="reag-data"
            type="date"
            min={hoje}
            value={form.novaData}
            onChange={alterar('novaData')}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="reag-motivo">
            Motivo <span className="font-normal text-gray-400">— opcional, mas ajuda no histórico</span>
          </label>
          <select id="reag-motivo" value={form.motivo} onChange={alterar('motivo')} className={inputClass}>
            <option value="">Não informar</option>
            {MOTIVOS_REAGENDAMENTO.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="reag-obs">
            Observação{' '}
            {form.motivo === 'OUTRO' ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="font-normal text-gray-400">— opcional</span>
            )}
          </label>
          <input
            id="reag-obs"
            type="text"
            maxLength={255}
            value={form.observacao}
            onChange={alterar('observacao')}
            placeholder="Ex: família viajou, retorna dia 20"
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
}