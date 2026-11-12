// src/pages/Estoque/components/AjusteModal.jsx
// Ajuste manual de UM lote: perda, vencimento, avaria ou correção.
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/contexts/ToastContext';
import { formatarQuantidade } from '../../../utils/format';

const MOTIVOS = [
  { value: 'PERDA', label: 'Perda' },
  { value: 'VENCIMENTO', label: 'Produto vencido' },
  { value: 'AVARIA', label: 'Avaria / danificado' },
  { value: 'CORRECAO', label: 'Correção de contagem' },
];

const inputClass =
  'w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none bg-white';

const FORM_INICIAL = { motivo: 'PERDA', direcao: 'REDUZIR', quantidade: '', observacao: '' };

/**
 * Props:
 *  - open / onClose
 *  - lote: item do estoque ({ id, nome, qtd, unidade, validade, ... }) ou null
 *  - contagem: true quando a unidade é de contagem (só aceita inteiros)
 *  - onSubmit({ estoqueId, variacao, motivo, observacao }) -> Promise<{ success, message? }>
 */
export default function AjusteModal({ open, onClose, lote, contagem = false, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) setForm(FORM_INICIAL);
  }, [open, lote]);

  if (!lote) return null;

  const correcao = form.motivo === 'CORRECAO';
  // Perda, vencimento e avaria sempre reduzem; só a correção pode aumentar
  const reduz = !correcao || form.direcao === 'REDUZIR';

  const quantidade = Number(form.quantidade);
  const variacao = reduz ? -quantidade : quantidade;
  const saldoApos = lote.qtd + (quantidade ? variacao : 0);
  const saldoInvalido = saldoApos < 0;

  const alterar = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quantidade || quantidade <= 0) {
      toast.error('Informe uma quantidade maior que zero.');
      return;
    }
    if (contagem && !Number.isInteger(quantidade)) {
      toast.error(`Este produto é contado em ${lote.unidade} e aceita apenas números inteiros.`);
      return;
    }
    if (saldoInvalido) {
      toast.error(`O lote tem apenas ${formatarQuantidade(lote.qtd, lote.unidade)}.`);
      return;
    }
    if (correcao && !form.observacao.trim()) {
      toast.error('Explique a correção no campo de observação.');
      return;
    }

    setSalvando(true);
    const result = await onSubmit({
      estoqueId: lote.id,
      variacao,
      motivo: form.motivo,
      observacao: form.observacao,
    });
    setSalvando(false);

    if (result.success) {
      onClose();
    } else {
      toast.error(result.message || 'Não foi possível registrar o ajuste.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar estoque"
      size="sm"
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-medium text-[#718096] hover:text-[#2D3748]">
            Cancelar
          </button>
          <button
            type="submit"
            form="ajuste-form"
            disabled={salvando || saldoInvalido}
            className="rounded-md bg-[#007F45] px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006838] disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Registrar ajuste'}
          </button>
        </div>
      }
    >
      <form id="ajuste-form" onSubmit={handleSubmit} className="space-y-4 p-6">
        {/* Lote */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="font-bold text-[#2D3748]">{lote.nome}</p>
          <p className="text-xs text-[#718096]">
            Lote com validade {lote.validade} · saldo atual{' '}
            <strong className="text-[#4A5568]">{formatarQuantidade(lote.qtd, lote.unidade)}</strong>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="ajuste-motivo">Motivo</label>
          <select id="ajuste-motivo" value={form.motivo} onChange={alterar('motivo')} className={inputClass}>
            {MOTIVOS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {correcao && (
          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-[#4A5568]">Tipo de correção</legend>
            <div className="flex gap-4 text-sm text-[#4A5568]">
              {[
                ['REDUZIR', 'Tirar do estoque'],
                ['AUMENTAR', 'Colocar no estoque'],
              ].map(([valor, rotulo]) => (
                <label key={valor} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="direcao"
                    value={valor}
                    checked={form.direcao === valor}
                    onChange={alterar('direcao')}
                    className="accent-[#007F45]"
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="ajuste-qtd">
            Quantidade ({lote.unidade})
          </label>
          <input
            id="ajuste-qtd"
            type="number"
            step={contagem ? '1' : '0.01'}
            min={contagem ? '1' : '0.01'}
            value={form.quantidade}
            onChange={alterar('quantidade')}
            placeholder={contagem ? '0' : '0,00'}
            className={inputClass}
          />
          {quantidade > 0 && (
            <p className={`mt-1 text-[11px] ${saldoInvalido ? 'text-red-600' : 'text-[#718096]'}`}>
              {saldoInvalido
                ? 'Isso deixaria o lote com saldo negativo.'
                : `Saldo do lote após o ajuste: ${formatarQuantidade(saldoApos, lote.unidade)}`}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="ajuste-obs">
            Observação{' '}
            {correcao ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="font-normal text-[#A0AEC0]">— opcional</span>
            )}
          </label>
          <input
            id="ajuste-obs"
            type="text"
            maxLength={255}
            value={form.observacao}
            onChange={alterar('observacao')}
            placeholder="Ex: caixa molhada na enchente"
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
}