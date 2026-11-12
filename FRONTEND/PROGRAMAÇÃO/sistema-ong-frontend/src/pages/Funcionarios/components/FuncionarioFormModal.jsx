// src/pages/Funcionarios/components/FuncionarioFormModal.jsx
// Formulário de funcionário: CADASTRAR (funcionario = null) ou CORRIGIR (funcionario = objeto).
// A senha só existe no cadastro; a correção nunca mexe nela.
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Campo, { inputClass } from '../../../components/ui/Campo';
import CampoCpf from '../../../components/ui/CampoCpf';
import { useToast } from '../../../components/contexts/ToastContext';
import { apenasDigitos, formatCPF, formatTelefone } from '../../../utils/masks';
import { erroCpf } from '../../../utils/cpf';
import { hojeISO } from '../../../utils/format';

const FORM_INICIAL = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  tipo: 'FUNCIONARIO',
  senha: '',
  dataAdmissao: '',
};

// Transforma o funcionário vindo da API nos campos do formulário (já com máscara)
const formDoFuncionario = (f) => ({
  nome: f.nome ?? '',
  email: f.email ?? '',
  cpf: formatCPF(f.cpf),
  telefone: formatTelefone(f.telefone),
  tipo: f.tipo ?? 'FUNCIONARIO',
  senha: '',
  dataAdmissao: f.dataAdmissao ? String(f.dataAdmissao).slice(0, 10) : '',
});

/**
 * Props:
 *  - open / onClose
 *  - funcionario: null (cadastrar) ou o funcionário a corrigir
 *  - onSubmit(dados) -> Promise<{ success, message? }>   (quem salva é a tela)
 */
export default function FuncionarioFormModal({ open, onClose, funcionario = null, onSubmit }) {
  const toast = useToast();
  const editando = Boolean(funcionario);

  const [form, setForm] = useState(FORM_INICIAL);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(funcionario ? formDoFuncionario(funcionario) : { ...FORM_INICIAL, dataAdmissao: hojeISO() });
    setMostrarSenha(false);
    setTentouSalvar(false);
  }, [open, funcionario]);

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

    if (!editando && form.senha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setSalvando(true);
    const resultado = await onSubmit({
      nome: form.nome,
      email: form.email,
      cpf: form.cpf,
      telefone: form.telefone,
      tipo: form.tipo,
      dataAdmissao: form.dataAdmissao,
      ...(editando ? { ativo: funcionario.ativo } : { senha: form.senha }),
    });
    setSalvando(false);

    if (resultado.success) {
      onClose();
    } else {
      toast.error(resultado.message || 'Não foi possível salvar o funcionário.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Corrigir dados do funcionário' : 'Cadastrar funcionário'}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-medium text-[#718096] hover:text-[#2D3748]">
            Cancelar
          </button>
          <button
            type="submit"
            form="funcionario-form"
            disabled={salvando}
            className="rounded-md bg-[#007F45] px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006838] disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar funcionário'}
          </button>
        </div>
      }
    >
      <form id="funcionario-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <Campo id="func-nome" label="Nome completo" obrigatorio className="sm:col-span-2">
          <input id="func-nome" value={form.nome} onChange={alterar('nome')} required maxLength={80} className={inputClass} placeholder="Ex: Carla Dias" />
        </Campo>

        <Campo id="func-email" label="E-mail (usado no login)" obrigatorio className="sm:col-span-2">
          <input id="func-email" type="email" value={form.email} onChange={alterar('email')} required maxLength={120} className={inputClass} placeholder="nome@exemplo.com" />
        </Campo>

        <CampoCpf id="func-cpf" value={form.cpf} onChange={(cpf) => setForm((a) => ({ ...a, cpf }))} obrigatorio mostrarErro={tentouSalvar} />

        <Campo id="func-telefone" label="Telefone" opcional>
          <input id="func-telefone" value={form.telefone} onChange={alterarTelefone} inputMode="tel" className={inputClass} placeholder="(11) 91234-5678" />
        </Campo>

        <Campo id="func-tipo" label="Cargo">
          <select id="func-tipo" value={form.tipo} onChange={alterar('tipo')} className={inputClass}>
            <option value="FUNCIONARIO">Funcionário (Estoque)</option>
            <option value="ADMIN">Administrador (Total)</option>
          </select>
        </Campo>

        <Campo id="func-admissao" label="Data de admissão" obrigatorio>
          <input id="func-admissao" type="date" value={form.dataAdmissao} onChange={alterar('dataAdmissao')} required max={hojeISO()} className={inputClass} />
        </Campo>

        {editando ? (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-[#718096] sm:col-span-2">
            A senha não é alterada por aqui. Para ativar ou desativar o acesso, use o botão de status na lista.
          </p>
        ) : (
          <Campo id="func-senha" label="Senha inicial" obrigatorio className="sm:col-span-2" dica="Mínimo de 8 caracteres.">
            <div className="relative">
              <input
                id="func-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={form.senha}
                onChange={alterar('senha')}
                required
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#4A5568]"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Campo>
        )}
      </form>
    </Modal>
  );
}