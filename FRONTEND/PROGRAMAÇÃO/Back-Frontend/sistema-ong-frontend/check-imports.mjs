// check-imports.mjs
// Lista TODOS os imports quebrados em src/ de uma vez e sugere o caminho correto.
//
// Uso (na raiz do projeto, onde fica o package.json):
//   node check-imports.mjs          -> só mostra os problemas (não altera nada)
//   node check-imports.mjs --fix    -> corrige automaticamente os que têm UM único candidato
//
// Dica: faça commit (ou uma cópia da pasta) antes de usar --fix.

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname, basename, sep } from 'node:path';

const SRC = join(process.cwd(), 'src');
const FIX = process.argv.includes('--fix');
const EXTS = ['.js', '.jsx', '.json'];

if (!existsSync(SRC)) {
  console.error('Pasta "src" não encontrada. Rode este script na raiz do projeto.');
  process.exit(1);
}

// ---------- 1. Lista todos os arquivos de src ----------
function walk(dir) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) out.push(...walk(caminho));
    else out.push(caminho);
  }
  return out;
}

const todos = walk(SRC);
const codigo = todos.filter((f) => ['.js', '.jsx'].includes(extname(f)));

// Índice: nome do arquivo sem extensão -> caminhos possíveis
const porNome = new Map();
for (const f of todos) {
  const ext = extname(f);
  const nome = basename(f, ext);
  // arquivos "index.jsx" são importados pelo nome da pasta
  const chave = nome === 'index' ? basename(dirname(f)) : nome;
  if (!porNome.has(chave)) porNome.set(chave, []);
  porNome.get(chave).push(f);
}

// ---------- 2. Resolução de um import ----------
function resolverImport(arquivoOrigem, spec) {
  let base;
  if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = join(dirname(arquivoOrigem), spec);
  else return { ignorar: true }; // pacote externo (react, axios...)

  const candidatos = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => join(base, 'index' + e))];
  const achou = candidatos.find((c) => existsSync(c) && statSync(c).isFile());
  return { achou };
}

// ---------- 3. Varre os imports ----------
const REGEX = /(?:import\s+(?:[^'"]*?\s+from\s+)?|import\(\s*|export\s+[^'"]*?\s+from\s+)(['"])([^'"]+)\1/g;

let totalQuebrados = 0;
let totalCorrigidos = 0;

for (const arquivo of codigo) {
  let conteudo = readFileSync(arquivo, 'utf8');
  const quebrados = [];

  for (const m of conteudo.matchAll(REGEX)) {
    const spec = m[2];
    const r = resolverImport(arquivo, spec);
    if (r.ignorar || r.achou) continue;
    quebrados.push(spec);
  }

  if (quebrados.length === 0) continue;

  console.log(`\n${relative(process.cwd(), arquivo)}`);

  for (const spec of quebrados) {
    totalQuebrados++;

    const ultimo = spec.split('/').pop().replace(/\.(jsx?|json)$/, '');
    const candidatos = (porNome.get(ultimo) || []).filter((c) => c !== arquivo);

    if (candidatos.length === 0) {
      console.log(`  ✗ ${spec}\n      nenhum arquivo chamado "${ultimo}" encontrado em src/`);
      continue;
    }

    // Caminho relativo sugerido para cada candidato
    const sugestoes = candidatos.map((c) => {
      let rel = relative(dirname(arquivo), c).split(sep).join('/');
      if (!rel.startsWith('.')) rel = './' + rel;
      // mantém o estilo do import original (sem extensão, a não ser que ela existisse)
      if (!/\.(jsx?|json)$/.test(spec)) rel = rel.replace(/\.(jsx?|json)$/, '').replace(/\/index$/, '');
      return rel;
    });

    if (sugestoes.length === 1) {
      console.log(`  ✗ ${spec}\n      → ${sugestoes[0]}`);
      if (FIX) {
        conteudo = conteudo.split(`'${spec}'`).join(`'${sugestoes[0]}'`).split(`"${spec}"`).join(`"${sugestoes[0]}"`);
        totalCorrigidos++;
      }
    } else {
      console.log(`  ✗ ${spec}\n      vários candidatos (corrija manualmente):`);
      sugestoes.forEach((s) => console.log(`        - ${s}`));
    }
  }

  if (FIX) writeFileSync(arquivo, conteudo, 'utf8');
}

console.log('\n----------------------------------------');
if (totalQuebrados === 0) {
  console.log('Nenhum import quebrado. Tudo certo!');
} else if (FIX) {
  console.log(`${totalQuebrados} import(s) quebrado(s); ${totalCorrigidos} corrigido(s) automaticamente.`);
  console.log('Rode o script de novo para ver o que sobrou.');
} else {
  console.log(`${totalQuebrados} import(s) quebrado(s). Rode com --fix para corrigir os que têm um único candidato.`);
}
