// /mcp に Streamable HTTP の MCP サーバ(ステートレス・読み取り専用)を提供する Worker。
// それ以外のパスは run_worker_first の対象外なので、静的アセットがそのまま配信される。
import MiniSearch from 'minisearch';
import { searchOptions } from '../src/text.js';
import docs from './docs.json';

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER = { name: 'technotut-network-docs', version: '1.0.0' };

const byPath = new Map(docs.map((d) => [d.path, d]));
let index;
function search(query, limit) {
  index ??= (() => {
    const mini = new MiniSearch({ ...searchOptions, storeFields: ['title', 'path'] });
    mini.addAll(docs.map((d) => ({ id: d.path, path: d.path, title: d.title, body: d.text })));
    return mini;
  })();
  return index.search(query).slice(0, limit).map((r) => {
    const d = byPath.get(r.id);
    const i = d.text.toLowerCase().indexOf(query.trim().toLowerCase().split(/\s+/)[0]);
    const start = Math.max(0, i - 60);
    return { path: d.path, title: d.title, url: d.url, excerpt: d.text.slice(start, start + 200) };
  });
}

const text = (t, isError = false) => ({ content: [{ type: 'text', text: t }], isError });

const tools = {
  list_docs: {
    description: 'List every page of the TechnoTUT network docs (path, title, section).',
    inputSchema: { type: 'object', properties: {} },
    run: () => text(docs.map((d) => `${d.path}\t${d.section ?? '-'}\t${d.title}`).join('\n')),
  },
  search_docs: {
    description: 'Full-text search over the docs (Japanese and English). Returns matching pages with an excerpt.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search words, e.g. "VXLAN" or "VLAN 設計"' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
      },
      required: ['query'],
    },
    run: ({ query, limit = 5 }) => {
      if (typeof query !== 'string' || !query.trim()) return text('query is required', true);
      const hits = search(query, Math.min(Math.max(Number(limit) || 5, 1), 20));
      if (!hits.length) return text('No results.');
      return text(hits.map((h) => `# ${h.title}\npath: ${h.path}\nurl: ${h.url}\n${h.excerpt}`).join('\n\n'));
    },
  },
  read_doc: {
    description: 'Read one docs page as Markdown. Use a path from list_docs or search_docs, e.g. "/network/fw".',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Page path, e.g. "/network/fw"' } },
      required: ['path'],
    },
    run: ({ path }) => {
      const d = byPath.get(typeof path === 'string' ? path.replace(/(.)\/$/, '$1') : path);
      if (!d) return text(`Not found: ${path}. Use list_docs to see available paths.`, true);
      return text(`# ${d.title}\nurl: ${d.url}\n\n${d.body}`);
    },
  },
};

function handle(msg) {
  const { id, method, params } = msg;
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  switch (method) {
    case 'initialize': {
      const v = params?.protocolVersion;
      return ok({
        protocolVersion: PROTOCOL_VERSIONS.includes(v) ? v : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: SERVER,
        instructions: 'Documentation of the TechnoTUT event network. Start with search_docs, then read_doc.',
      });
    }
    case 'ping':
      return ok({});
    case 'tools/list':
      return ok({
        tools: Object.entries(tools).map(([name, t]) => ({
          name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { readOnlyHint: true },
        })),
      });
    case 'tools/call': {
      const tool = tools[params?.name];
      if (!tool) return err(-32602, `Unknown tool: ${params?.name}`);
      return ok(tool.run(params.arguments ?? {}));
    }
    default:
      return err(-32601, `Method not found: ${method}`);
  }
}

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

export default {
  async fetch(request) {
    const cors = { 'access-control-allow-origin': '*' };
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type, mcp-protocol-version, mcp-session-id, accept',
        },
      });
    }
    // ステートレスなのでサーバ→クライアントの SSE ストリームは提供しない
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST', ...cors } });

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400, cors);
    }
    const msgs = Array.isArray(body) ? body : [body];
    // id を持たないもの(notification / response)には応答しない
    const replies = msgs.filter((m) => m && m.method && m.id !== undefined).map(handle);
    if (!replies.length) return new Response(null, { status: 202, headers: cors });
    return json(Array.isArray(body) ? replies : replies[0], 200, cors);
  },
};
