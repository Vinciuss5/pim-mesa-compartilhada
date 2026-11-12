// src/pages/Estoque/components/ProdutoModal.jsx
// Formulário de produto: serve para CADASTRAR (produto = null) e para EDITAR (produto = objeto).
import { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/contexts/ToastContext';
import { useUnidades } from '../../../StatusBadge/hooks/useUnidades';
import {
  CATEGORIAS,
  TIPOS_UNIDADE,
  DIAS_ALERTA_PADRAO,
  DIAS_ALERTA_SUGERIDOS,
} from '../../../utils/produtoOpcoes';

const FORM_INICIAL = {
  nome: '',
  unidadeId: '',
  categoria: '',
  peso: '',
  estoqueMinimo: '',
  controlaValidade: true,
  diasAlertaValidade: DIAS_ALERTA_PADRAO,
};

const NOVA_UNIDADE_INICIAL = { nome: '', sigla: '', tipo: 'CONTAGEM' };

// Transforma o produto vindo da API nos campos do formulário
const formDoProduto = (p) => ({
  nome: p.nome ?? '',
  unidadeId: String(p.unidadeMedidaId ?? ''),
  categoria: p.categoria ?? '',
  peso: p.pesoKg ?? '',
  estoqueMinimo: p.estoqueMinimo ?? '',
  controlaValidade: p.controlaValidade ?? true,
  diasAlertaValidade: p.diasAlertaValidade ?? DIAS_ALERTA_PADRAO,
});

const inputClass =
  'w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-[#007F45] focus:outline-none bg-white';

/**
 * Props:
 *  - open / onClose
 *  - produto: null (cadastrar) ou o produto a editar
 *  - onSubmit(formData) -> Promise<{ success, message? }>   (quem salva é a tela)
 */
export default function ProdutoModal({ open, onClose, produto = null, onSubmit }) {
  const toast = useToast();
  const { unidades, fetchUnidades, criarUnidade } = useUnidades();

  const editando = Boolean(produto);

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  // Enquanto a pessoa não mexer no campo de dias, a categoria escolhida sugere o valor.
  // Depois que ela digita, o valor passa a ser dela e não é mais sobrescrito.
  const [diasEditadoPeloUsuario, setDiasEditadoPeloUsuario] = useState(false);

  const [novaUnidadeAberta, setNovaUnidadeAberta] = useState(false);
  const [novaUnidade, setNovaUnidade] = useState(NOVA_UNIDADE_INICIAL);
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);

  // Ao abrir: carrega as unidades e preenche o formulário (vazio ou com o produto)
  useEffect(() => {
    if (!open) return;
    fetchUnidades();
    setFormData(produto ? formDoProduto(produto) : FORM_INICIAL);
    setDiasEditadoPeloUsuario(Boolean(produto)); // produto existente: o valor salvo é respeitado
    setNovaUnidadeAberta(false);
    setNovaUnidade(NOVA_UNIDADE_INICIAL);
  }, [open, produto, fetchUnidades]);

  const unidadeSelecionada = useMemo(
    () => unidades.find((u) => String(u.id) === String(formData.unidadeId)),
    [unidades, formData.unidadeId]
  );

  // Peso por unidade só faz sentido para unidades de contagem (pct, cx, un...)
  const mostrarPeso = unidadeSelecionada?.tipo === 'CONTAGEM';

  const diasSugeridos = DIAS_ALERTA_SUGERIDOS[formData.categoria] ?? null;
  const podeUsarSugestao = diasSugeridos !== null && Number(formData.diasAlertaValidade) !== diasSugeridos;

  const fechar = () => {
    setFormData(FORM_INICIAL);
    setNovaUnidadeAberta(false);
    setNovaUnidade(NOVA_UNIDADE_INICIAL);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCategoriaChange = (e) => {
    const categoria = e.target.value;
    const sugerido = DIAS_ALERTA_SUGERIDOS[categoria];

    setFormData((prev) => ({
      ...prev,
      categoria,
      // Só preenche sozinho se a pessoa ainda não escolheu um valor
      diasAlertaValidade:
        !diasEditadoPeloUsuario && sugerido !== undefined ? sugerido : prev.diasAlertaValidade,
    }));
  };

  const handleDiasChange = (e) => {
    setDiasEditadoPeloUsuario(true);
    setFormData((prev) => ({ ...prev, diasAlertaValidade: e.target.value }));
  };

  const usarSugestao = () => {
    setDiasEditadoPeloUsuario(false);
    setFormData((prev) => ({ ...prev, diasAlertaValidade: diasSugeridos }));
  };

  const handleUnidadeChange = (e) => {
    const unidadeId = e.target.value;
    const unidade = unidades.find((u) => String(u.id) === String(unidadeId));
    setFormData((prev) => ({
      ...prev,
      unidadeId,
      // Se a nova unidade não for de contagem, o peso por unidade deixa de existir
      peso: unidade?.tipo === 'CONTAGEM' ? prev.peso : '',
    }));
  };

  const handleCriarUnidade = async () => {
    if (!novaUnidade.nome.trim() || !novaUnidade.sigla.trim()) {
      toast.error('Informe o nome e a sigla da nova unidade.');
      return;
    }

    setSalvandoUnidade(true);
    const result = await criarUnidade(novaUnidade);
    setSalvandoUnidade(false);

    if (result.success) {
      // Já deixa a unidade recém-criada selecionada
      setFormData((prev) => ({
        ...prev,
        unidadeId: String(result.data.id),
        peso: result.data.tipo === 'CONTAGEM' ? prev.peso : '',
      }));
      setNovaUnidade(NOVA_UNIDADE_INICIAL);
      setNovaUnidadeAberta(false);
      toast.success(`Unidade "${result.data.nome}" criada.`);
    } else {
      toast.error(`Erro ao criar unidade: ${result.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dias = Number(formData.diasAlertaValidade);
    if (formData.controlaValidade && (!Number.isInteger(dias) || dias < 1 || dias > 365)) {
      toast.error('A antecedência do alerta de validade deve ser um número inteiro entre 1 e 365 dias.');
      return;
    }

    setSalvando(true);
    const result = await onSubmit(formData);
    setSalvando(false);

    if (result.success) {
      fechar();
    } else {
      toast.error(
        `${editando ? 'Erro ao salvar alterações' : 'Erro ao cadastrar produto'}: ${result.message}`
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={fechar}
      title={editando ? 'Editar Produto' : 'Cadastrar Produto'}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={fechar}
            className="text-sm font-medium text-[#718096] hover:text-[#2D3748]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="produto-form"
            disabled={salvando}
            className="rounded-md bg-[#007F45] px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006838] disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar Produto'}
          </button>
        </div>
      }
    >
      <form id="produto-form" onSubmit={handleSubmit} className="grid grid-cols-12 gap-4 p-6">
        {/* Nome */}
        <div className="col-span-12">
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="produto-nome">
            Nome do Produto
          </label>
          <input
            id="produto-nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            required
            maxLength={80}
            type="text"
            placeholder="Ex: Arroz tipo 1 (pacote 5 kg)"
            className={inputClass}
          />
        </div>

        {/* Unidade de medida */}
        <div className="col-span-12 sm:col-span-6">
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="produto-unidade">
            Unidade de medida
          </label>
          <select
            id="produto-unidade"
            name="unidadeId"
            value={formData.unidadeId}
            onChange={handleUnidadeChange}
            required
            className={inputClass}
          >
            <option value="">Selecione...</option>
            {TIPOS_UNIDADE.map((tipo) => (
              <optgroup key={tipo.value} label={tipo.label}>
                {unidades
                  .filter((u) => u.tipo === tipo.value)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.sigla})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {editando ? (
            <p className="mt-1 text-[11px] text-[#718096]">
              A unidade só pode ser trocada em produtos sem estoque, doações ou solicitações.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setNovaUnidadeAberta((aberta) => !aberta)}
            className="mt-1 block text-xs font-medium text-[#007F45] hover:underline"
          >
            {novaUnidadeAberta ? 'Cancelar nova unidade' : '+ Nova unidade'}
          </button>
        </div>

        {/* Categoria */}
        <div className="col-span-12 sm:col-span-6">
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="produto-categoria">
            Categoria <span className="font-normal text-[#A0AEC0]">— opcional</span>
          </label>
          <select
            id="produto-categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleCategoriaChange}
            className={inputClass}
          >
            <option value="">Sem categoria</option>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mini formulário: nova unidade */}
        {novaUnidadeAberta && (
          <div className="col-span-12 grid grid-cols-12 gap-3 rounded-lg border border-dashed border-[#007F45]/40 bg-[#007F45]/5 p-4">
            <p className="col-span-12 text-xs text-[#4A5568]">
              Crie uma unidade que ainda não existe na lista (ex.: Bandeja — bdj).
            </p>
            <div className="col-span-12 sm:col-span-5">
              <input
                value={novaUnidade.nome}
                onChange={(e) => setNovaUnidade((p) => ({ ...p, nome: e.target.value }))}
                maxLength={40}
                placeholder="Nome (ex.: Bandeja)"
                aria-label="Nome da nova unidade"
                className={inputClass}
              />
            </div>
            <div className="col-span-5 sm:col-span-3">
              <input
                value={novaUnidade.sigla}
                onChange={(e) => setNovaUnidade((p) => ({ ...p, sigla: e.target.value }))}
                maxLength={10}
                placeholder="Sigla"
                aria-label="Sigla da nova unidade"
                className={inputClass}
              />
            </div>
            <div className="col-span-7 sm:col-span-4">
              <select
                value={novaUnidade.tipo}
                onChange={(e) => setNovaUnidade((p) => ({ ...p, tipo: e.target.value }))}
                aria-label="Tipo da nova unidade"
                className={inputClass}
              >
                {TIPOS_UNIDADE.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-12 flex justify-end">
              <button
                type="button"
                onClick={handleCriarUnidade}
                disabled={salvandoUnidade}
                className="rounded-md bg-[#007F45] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#006838] disabled:opacity-60"
              >
                {salvandoUnidade ? 'Criando...' : 'Criar unidade'}
              </button>
            </div>
          </div>
        )}

        {/* Peso por unidade: só para unidades de contagem */}
        {mostrarPeso && (
          <div className="col-span-12 sm:col-span-6">
            <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="produto-peso">
              Peso de 1 {unidadeSelecionada.sigla} (kg){' '}
              <span className="font-normal text-[#A0AEC0]">— opcional</span>
            </label>
            <input
              id="produto-peso"
              name="peso"
              value={formData.peso}
              onChange={handleInputChange}
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 5.00"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-[#718096]">Permite estimar o total em kg no estoque.</p>
          </div>
        )}

        {/* Estoque mínimo */}
        <div className={`col-span-12 ${mostrarPeso ? 'sm:col-span-6' : ''}`}>
          <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="produto-minimo">
            Estoque mínimo{unidadeSelecionada ? ` (${unidadeSelecionada.sigla})` : ''}{' '}
            <span className="font-normal text-[#A0AEC0]">— opcional</span>
          </label>
          <input
            id="produto-minimo"
            name="estoqueMinimo"
            value={formData.estoqueMinimo}
            onChange={handleInputChange}
            type="number"
            step={unidadeSelecionada?.tipo === 'CONTAGEM' ? '1' : '0.01'}
            min="0"
            placeholder="Ex: 20"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-[#718096]">Usado nos alertas de estoque baixo.</p>
        </div>

        {/* Controla validade */}
        <div className="col-span-12">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="controlaValidade"
              checked={formData.controlaValidade}
              onChange={handleInputChange}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#007F45]"
            />
            <span className="text-sm text-[#4A5568]">
              <span className="font-medium">Controlar validade</span>
              <span className="block text-[11px] text-[#718096]">
                Exige a data de validade em toda doação deste produto.
              </span>
            </span>
          </label>
        </div>

        {/* Antecedência do alerta de validade: só quando o produto controla validade */}
        {formData.controlaValidade && (
          <div className="col-span-12 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
            <label className="mb-1 block text-sm font-medium text-[#4A5568]" htmlFor="produto-dias-alerta">
              Alertar com quantos dias de antecedência?
            </label>
            <div className="flex items-center gap-3">
              <input
                id="produto-dias-alerta"
                name="diasAlertaValidade"
                type="number"
                min="1"
                max="365"
                step="1"
                value={formData.diasAlertaValidade}
                onChange={handleDiasChange}
                className={`${inputClass} max-w-[120px]`}
              />
              <span className="text-sm text-[#4A5568]">dias antes de vencer</span>
              {podeUsarSugestao && (
                <button
                  type="button"
                  onClick={usarSugestao}
                  className="ml-auto text-xs font-medium text-[#007F45] hover:underline"
                >
                  Usar sugestão da categoria ({diasSugeridos} dias)
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#718096]">
              Pense no tempo que a ONG leva para fazer este produto chegar a uma família. Produtos de giro lento ou
              muito perecíveis pedem um aviso mais cedo. O lote aparece como &quot;Vence em breve&quot; a partir deste
              prazo, e como urgente nos últimos 7 dias. Também avisamos na entrada de uma doação cuja validade já esteja
              dentro deste prazo.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}