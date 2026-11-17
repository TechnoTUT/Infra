import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentDir = join(root, 'content');
const outFile = join(root, 'src', 'data', 'repos.json');

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  CSS: '#663399',
  HTML: '#e34c26',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Clojure: '#db5855',
  Java: '#b07219',
  Go: '#00ADD8',
  Python: '#3572A5',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  Ruby: '#701516',
  Nix: '#7e7eff',
  Makefile: '#427819',
  MDX: '#fcb32c',
  Jinja: '#a52a22',
  PowerShell: '#012456',
  PHP: '#4F5D95',
  Lua: '#000080',
  Batchfile: '#C1F12E',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  XSLT: '#EB8CEB',
};

async function collectMdxFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMdxFiles(full)));
    } else if (entry.name.endsWith('.mdx')) {
      files.push(full);
    }
  }
  return files;
}

async function extractRepos() {
  const files = await collectMdxFiles(contentDir);
  const repos = new Set();
  const re = /<RepoCard\b[^>]*\brepo=["']([^"']+)["']/g;
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const match of text.matchAll(re)) {
      repos.add(match[1]);
    }
  }
  return [...repos].sort();
}

async function fetchGitHubJson(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'technotut-docs-fetch-repos',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function main() {
  const repos = await extractRepos();
  let existing = {};
  try {
    existing = JSON.parse(await readFile(outFile, 'utf8'));
  } catch {
    // ignore missing or invalid existing file
  }
  const result = { ...existing };

  for (const repo of repos) {
    try {
      const [meta, langs] = await Promise.all([
        fetchGitHubJson(`https://api.github.com/repos/${repo}`),
        fetchGitHubJson(`https://api.github.com/repos/${repo}/languages`),
      ]);

      const total = Object.values(langs).reduce((sum, n) => sum + n, 0);
      const languages = total > 0
        ? Object.entries(langs)
            .map(([name, bytes]) => ({
              name,
              color: LANG_COLORS[name] ?? '#8b949e',
              pct: Math.round((bytes / total) * 1000) / 10,
            }))
            .filter((l) => l.pct > 0)
        : [];

      result[repo] = {
        description: meta.description ?? '',
        languages,
      };
      console.log(`Fetched ${repo}: ${languages.map((l) => `${l.name} ${l.pct}%`).join(', ') || 'no languages'}`);
    } catch (err) {
      console.warn(`Skipped ${repo}: ${err.message}`);
    }
  }

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
