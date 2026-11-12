// src/pages/Solicitante/components/SolicitanteFormModal.jsx
// Formulário de solicitante: serve para CADASTRAR (solicitante = null) e para CORRIGIR (solicitante = objeto).
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Campo, { inputClass } from '../../../components/ui/Campo';
import CampoCpf from '../../../components/ui/CampoCpf';
import { useToast } from '../../../components/contexts/ToastContext';
import { apenasDigitos, formatCPF, formatTelefone } from '../../../utils/masks';
import { erroCpf } from '../../../utils/cpf';

const FORM_INICIAL = { nome: '', cpf: '', telefone: '', enderecoEntrega: '', email: '' };

// Transforma o solicitante vindo da API nos campos do formulário (já com máscara)
const formDoSolicitante = (s) => ({
  nome: s.nome ?? '',
  cpf: formatCPF(s.cpf),
  telefone: formatTelefone(s.telefone),
  enderecoEntrega: s.enderecoEntrega ?? '',
  email: s.email ?? '',
});

/**
 * Props:
 *  - open / onClose
 *  - solicitante: null (cadastrar) ou o solicitante a corrigir
 *  - onSubmit(dto) -> Promise<{ success, message? }>   (quem salva é a tela)
 */
export default function SolicitanteFormModal({ open, onClose, solicitante = null, onSubmit }) {
  const toast = useToast();
  const editando = Boolean(solicitante);

  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(solicitante ? formDoSolicitante(solicitante) : FORM_INICIAL);
    setTentouSalvar(false);
  }, [open, solicitante]);

  const alterar = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }));
  const alterarTelefone = (e) => setForm((atual) => ({ ...atual, telefone: formatTelefone(e.target.value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTentouSalvar(true);

    const problemaCpf = erroCpf(form.cpf, { obrigatorio: true });
    if (problemaCpf) {
      toast.error(problemaCpf);
      return;
    }

    const telefone = apenasDigitos(form.telefone);
    if (telefone && telefone.length < 10) {
      toast.error('Telefone incompleto: informe o DDD e o número.');
      return;
    }

    setSalvando(true);
    const resultado = await onSubmit({
      Nome: form.nome.trim(),
      CPF: apenasDigitos(form.cpf),
      Telefone: telefone || null,
      EnderecoEntrega: form.enderecoEntrega.trim(),
      Email: form.email.trim() || null,
    });
    setSalvando(false);

    if (resultado.success) {
      onClose();
    } else {
      toast.error(resultado.message || 'Não foi possível salvar o solicitante.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Corrigir dados do solicitante' : 'Cadastrar solicitante'}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-medium text-[#718096] hover:text-[#2D3748]">
            Cancelar
          </button>
          <button
            type="submit"
            form="solicitante-form"
            disabled={salvando}
            className="rounded-md bg-[#007F45] px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006838] disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar solicitante'}
          </button>
        </div>
      }
    >
      <form id="solicitante-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <Campo id="sol-nome" label="Nome completo" obrigatorio className="sm:col-span-2">
          <input id="sol-nome" value={form.nome} onChange={alterar('nome')} required maxLength={80} className={inputClass} placeholder="Nome do beneficiário" />
        </Campo>

        <CampoCpf id="sol-cpf" value={form.cpf} onChange={(cpf) => setForm((a) => ({ ...a, cpf }))} obrigatorio mostrarErro={tentouSalvar} />

        <Campo id="sol-telefone" label="Telefone" opcional>
          <input id="sol-telefone" value={form.telefone} onChange={alterarTelefone} inputMode="tel" className={inputClass} placeholder="(11) 91234-5678" />
        </Campo>

        <Campo id="sol-endereco" label="Endereço de entrega" obrigatorio className="sm:col-span-2" dica="Usado para organizar a entrega das solicitações.">
          <input id="sol-endereco" value={form.enderecoEntrega} onChange={alterar('enderecoEntrega')} required maxLength={200} className={inputClass} placeholder="Rua, número, bairro, cidade" />
        </Campo>

        <Campo id="sol-email" label="E-mail" opcional className="sm:col-span-2">
          <input id="sol-email" type="email" value={form.email} onChange={alterar('email')} maxLength={120} className={inputClass} placeholder="contato@exemplo.com" />
        </Campo>
      </form>
    </Modal>
  );
}