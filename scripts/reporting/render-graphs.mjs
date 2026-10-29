/** Render editable Graphviz sources with the separately installed Viz.js runtime. */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const { instance } = await import(process.env.SWP_VIZ_MODULE || '@viz-js/viz');
const viz = await instance();
const directory = process.argv[2];
for (const file of (await readdir(directory)).filter((name) => name.endsWith('.dot'))) {
  const source = await readFile(join(directory, file), 'utf8');
  const svg = viz.renderString(source, { format: 'svg' });
  await writeFile(join(directory, file.replace(/\.dot$/, '.svg')), svg);
}
