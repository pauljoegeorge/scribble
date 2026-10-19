import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';

const root = resolve('src');
const extensions = new Set(['.ts', '.tsx', '.css']);
function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collect(path) : extensions.has(extname(path)) ? [path] : [];
  });
}
const files = collect(root);
const paths = new Set(files);
const graph = new Map();
const failures = [];
const layer = (path) => relative(root, path).split('/')[0];
const allowed = {
  app: ['app', 'components', 'types'],
  components: ['components', 'hooks', 'utils', 'constants', 'types'],
  hooks: ['hooks', 'utils', 'constants', 'types'],
  utils: ['utils', 'constants', 'types'],
  constants: ['constants', 'types'],
  types: ['types'],
};

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const lines = source.trimEnd().split('\n').length;
  if (lines > 250) failures.push(`${relative(root, file)}: ${lines} lines (limit 250)`);
  if (/excalidraw/i.test(source)) failures.push(`${relative(root, file)}: use Scribble product naming`);
  const imports = [...source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)];
  const dependencies = [];
  for (const [, specifier] of imports) {
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue;
    const base = specifier.startsWith('@/') ? resolve(root, specifier.slice(2)) : resolve(dirname(file), specifier);
    const target = [base, `${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts'), resolve(base, 'index.tsx')]
      .find((candidate) => paths.has(candidate));
    if (!target) continue;
    dependencies.push(target);
    if (!allowed[layer(file)]?.includes(layer(target))) {
      failures.push(`${relative(root, file)}: forbidden dependency on ${relative(root, target)}`);
    }
  }
  graph.set(file, dependencies);
}

const visited = new Set();
const active = new Set();
function visit(file, trail = []) {
  if (active.has(file)) {
    failures.push(`Circular dependency: ${[...trail, file].map((path) => relative(root, path)).join(' -> ')}`);
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency, [...trail, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of files) visit(file);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Scribble architecture checks passed (${files.length} source files).`);
}
