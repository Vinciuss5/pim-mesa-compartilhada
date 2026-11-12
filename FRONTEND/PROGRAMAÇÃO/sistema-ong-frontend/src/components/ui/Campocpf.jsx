// src/components/ui/CampoCpf.jsx
// Campo de CPF: aplica a máscara enquanto digita e avisa na hora se o CPF não é válido.
import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCPF, apenasDigitos } from '../../utils/masks';
import { erroCpf } from '../../utils/cpf';

const inputBase =
  'w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-1';

/**
 * Props:
 *  - id, label
 *  - value: o CPF como está no formulário (com ou sem máscara)
 *  - onChange(valorComMascara)
 *  - obrigatorio: vazio vira erro
 *  - mostrarErro: força a exibição do erro (a tela usa depois de uma tentativa de salvar)
 */
export default function CampoCpf({
  id,
  label = 'CPF',
  value,
  onChange,
  obrigatorio = false,
  mostrarErro = false,
  disabled = false,
}) {
  const [tocado, setTocado] = useState(false);

  const digitos = apenasDigitos(value);
  const erro = erroCpf(value, { obrigatorio });

  // Enquanto digita não incomoda: o erro aparece ao completar os 11 dígitos, ao sair do campo ou ao tentar salvar
  const exibirErro = Boolean(erro) && (tocado || mostrarErro || digitos.length === 11);
  const valido = digitos.length === 11 && !erro;

  const borda = exibirErro
    ? 'border-red-400 focus:border-red-500 focus:ring-red-300'
    : valido
      ? 'border-green-400 focus:border-green-500 focus:ring-green-300'
      : 'border-gray-300 focus:border-[#007F45] focus:ring-[#007F45]';

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor={id}>
        {label} {obrigatorio && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        maxLength={14}
        disabled={disabled}
        value={formatCPF(value)}
        onChange={(e) => onChange(formatCPF(e.target.value))}
        onBlur={() => setTocado(true)}
        aria-invalid={exibirErro}
        aria-describedby={`${id}-msg`}
        className={`${inputBase} ${borda}`}
      />
      <p id={`${id}-msg`} className="mt-1 min-h-[16px] text-[11px]" role={exibirErro ? 'alert' : undefined}>
        {exibirErro ? (
          <span className="flex items-center gap-1 font-medium text-red-600">
            <AlertCircle size={12} /> {erro}
          </span>
        ) : valido ? (
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 size={12} /> CPF válido
          </span>
        ) : null}
      </p>
    </div>
  );
}