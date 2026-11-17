import { site } from './site.config.js';

const modules = import.meta.glob('../content/**/*.mdx', { eager: true });

function resolveSection(folder) {
  if (!folder) return null;
  const match = site.sections.find(
    (s) => s.id === folder || s.groups?.some((g) => g.folder === folder),
  );
  return match?.id ?? folder;
}

function toPage(file, mod) {
  const rel = file.replace('../content/', '').replace(/\.mdx$/, '');
  const fm = mod.frontmatter ?? {};
  const parts = rel.split('/');
  const folder = parts.length > 1 ? parts[0] : null;
  const section = resolveSection(folder);
  let path = fm.slug ?? '/' + rel.replace(/\/index$/, '');
  if (path === '') path = '/';
  return {
    path,
    folder,
    section,
    title: fm.title ?? parts.at(-1),
    label: fm.sidebar_label ?? fm.title ?? parts.at(-1),
    position: fm.sidebar_position ?? Infinity,
    // リポジトリ上は docs/content/ 配下(editUrl は docs/ 起点)
    file,
    editPath: `content/${rel}.mdx`,
    Component: mod.default,
  };
}

export const pages = Object.entries(modules)
  .map(([file, mod]) => toPage(file, mod))
  .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, 'ja'));

const seen = new Map();
for (const p of pages) {
  if (seen.has(p.path)) throw new Error(`Duplicate route ${p.path}: ${seen.get(p.path)} / ${p.editPath}`);
  seen.set(p.path, p.editPath);
}

export const pageByPath = new Map(pages.map((p) => [p.path, p]));
export const sectionGroups = (id) => {
  const sec = site.sections.find((s) => s.id === id);
  if (sec?.groups) {
    return sec.groups
      .map((g) => ({ label: g.label, pages: pages.filter((p) => p.folder === g.folder) }))
      .filter((g) => g.pages.length > 0);
  }
  const items = pages.filter((p) => p.section === id);
  return items.length > 0 ? [{ label: null, pages: items }] : [];
};
export const sectionPages = (id) => sectionGroups(id).flatMap((g) => g.pages);
export const sectionStart = (id) => sectionPages(id)[0]?.path ?? '/';
export const editUrl = (p) => site.editUrl + p.editPath;
