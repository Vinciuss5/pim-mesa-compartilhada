// src/pages/Doador/components/DoadorFormModal.jsx
// Formulário de doador: serve para CADASTRAR (doador = null) e para CORRIGIR (doador = objeto).
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Campo, { inputClass } from '../../../components/ui/Campo';
import CampoCpf from '../../../components/ui/CampoCpf';
import { useToast } from '../../../components/contexts/ToastContext';
import { apenasDigitos, formatCPF, formatTelefone } from '../../../utils/masks';
import { erroCpf } from '../../../utils/cpf';

const FORM_INICIAL = { nome: '', email: '', cpf: '', telefone: '', endereco: '' };

// Transforma o doador vindo da API nos campos do formulário (já com máscara)
const formDoDoador = (d) => ({
  nome: d.nome ?? '',
  email: d.email ?? '',
  cpf: formatCPF(d.cpf),
  telefone: formatTelefone(d.telefone),
  endereco: d.endereco ?? '',
});

/**
 * Props:
 *  - open / onClose
 *  - doador: null (cadastrar) ou o doador a corrigir
 *  - onSubmit(dto) -> Promise<{ success, message? }>   (quem salva é a tela)
 */
export default function DoadorFormModal({ open, onClose, doador = null, onSubmit }) {
  const toast = useToast();
  const editando = Boolean(doador);

  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  // Ao abrir: vazio (cadastro) ou preenchido com o doador (correção)
  useEffect(() => {
    if (!open) return;
    setForm(doador ? formDoDoador(doador) : FORM_INICIAL);
    setTentouSalvar(false);
  }, [open, doador]);

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
      Email: form.email.trim() || null,
      CPF: apenasDigitos(form.cpf),
      Telefone: telefone || null,
      Endereco: form.endereco.trim() || null,
    });
    setSalvando(false);

    if (resultado.success) {
      onClose();
    } else {
      toast.error(resultado.message || 'Não foi possível salvar o doador.');
    }
  };

  // No cadastro novo todos os campos continuam obrigatórios; ao corrigir um cadastro antigo,
  // só nome e CPF (um doador antigo pode não ter e-mail ou endereço).
  const exigir = !editando;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Corrigir dados do doador' : 'Cadastrar doador'}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-medium text-[#718096] hover:text-[#2D3748]">
            Cancelar
          </button>
          <button
            type="submit"
            form="doador-form"
            disabled={salvando}
            className="rounded-md bg-[#007F45] px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006838] disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar doador'}
          </button>
        </div>
      }
    >
      <form id="doador-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <Campo id="doador-nome" label="Nome completo" obrigatorio className="sm:col-span-2">
          <input id="doador-nome" value={form.nome} onChange={alterar('nome')} required maxLength={80} className={inputClass} placeholder="Ex: Maria Aparecida Souza" />
        </Campo>

        <CampoCpf id="doador-cpf" value={form.cpf} onChange={(cpf) => setForm((a) => ({ ...a, cpf }))} obrigatorio mostrarErro={tentouSalvar} />

        <Campo id="doador-telefone" label="Telefone" obrigatorio={exigir} opcional={!exigir}>
          <input id="doador-telefone" value={form.telefone} onChange={alterarTelefone} required={exigir} inputMode="tel" className={inputClass} placeholder="(11) 91234-5678" />
        </Campo>

        <Campo id="doador-email" label="E-mail" obrigatorio={exigir} opcional={!exigir} className="sm:col-span-2">
          <input id="doador-email" type="email" value={form.email} onChange={alterar('email')} required={exigir} maxLength={120} className={inputClass} placeholder="doador@exemplo.com" />
        </Campo>

        <Campo id="doador-endereco" label="Endereço" obrigatorio={exigir} opcional={!exigir} className="sm:col-span-2">
          <input id="doador-endereco" value={form.endereco} onChange={alterar('endereco')} required={exigir} maxLength={150} className={inputClass} placeholder="Rua, número, bairro, cidade" />
        </Campo>
      </form>
    </Modal>
  );
}