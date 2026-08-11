/* MINIMAL GITHUB REST CLIENT — zero-dep, plain `fetch`, two callers.
 *
 * 1. TOKEN BRIDGE (figma-plugin/src/code.ts) — runs in the Figma plugin
 *    sandbox. Only api.github.com is contacted (the manifest's networkAccess
 *    whitelists exactly this host), so the PAT never leaves the sandbox for
 *    the UI iframe; it is read from clientStorage and passed here.
 * 2. INSPECT.MODE's token commit (src/app/api/token-commit/route.ts) — runs
 *    on the Node server, where the token is GITHUB_COPY_TOKEN.
 *
 * Both open the SAME kind of PR against tokens/*.json, so they share one
 * client rather than growing two drifting copies. Constraint that keeps it
 * shareable: no Node built-ins, no Figma globals, no React — `fetch` only.
 *
 * The token is never logged or echoed. Errors carry the GitHub status text;
 * the server route deliberately does NOT forward those bodies to the client.
 *
 * Uses the contents API (raw media type) for reads and the git data API
 * (blobs/trees/commits/refs) + pulls API for the push-as-PR flow.
 */

const API = 'https://api.github.com'
const API_VERSION = '2022-11-28'

export type Repo = { owner: string; name: string }

export function parseRepo(slug: string): Repo {
  const [owner, name] = slug.trim().split('/')
  if (!owner || !name) throw new Error(`Invalid repo "${slug}" — expected "owner/name".`)
  return { owner, name }
}

function encodePath(p: string): string {
  return p
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
}

export class GitHub {
  constructor(
    private pat: string,
    private repo: Repo
  ) {}

  private async req(
    method: string,
    path: string,
    opts: { body?: unknown; accept?: string; raw?: boolean } = {}
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.pat}`,
      Accept: opts.accept ?? 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
    }
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`GitHub ${method} ${path} → ${res.status} ${res.statusText} ${text}`)
    }
    return res
  }

  private base(): string {
    return `/repos/${this.repo.owner}/${this.repo.name}`
  }

  /** Fetch a repo file's raw text at a ref. Returns null on 404. */
  async getFileRaw(path: string, ref: string): Promise<string | null> {
    const url = `${this.base()}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`
    try {
      const res = await this.req('GET', url, { accept: 'application/vnd.github.raw+json' })
      return await res.text()
    } catch (e) {
      if (e instanceof Error && / → 404 /.test(e.message)) return null
      throw e
    }
  }

  /** Body AND blob sha of a repo file at a ref, in ONE call — the two have
      to come from the same response or the sha can describe a different
      revision than the text it is meant to guard.

      The body is handed back still base64-encoded, on purpose: decoding it
      needs Buffer or a TextDecoder dance, and this client is shared with the
      Figma plugin sandbox. The caller decodes with whatever its runtime has.
      Returns null on 404, or when GitHub declines to inline the content
      (files over ~1MB come back with encoding "none"). */
  async getFileBase64(
    path: string,
    ref: string,
  ): Promise<{ base64: string; sha: string } | null> {
    const url = `${this.base()}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`
    try {
      const res = await this.req('GET', url)
      const json = (await res.json()) as { sha?: string; content?: string; encoding?: string }
      if (!json.sha || typeof json.content !== 'string' || json.encoding !== 'base64') return null
      return { base64: json.content, sha: json.sha }
    } catch (e) {
      if (e instanceof Error && / → 404 /.test(e.message)) return null
      throw e
    }
  }

  /** Confirm the token/repo are reachable; returns the authed login. */
  async whoami(): Promise<string> {
    const res = await this.req('GET', '/user')
    const json = (await res.json()) as { login?: string }
    return json.login ?? 'unknown'
  }

  /** SHA the given branch currently points at. */
  async refSha(branch: string): Promise<string> {
    const res = await this.req('GET', `${this.base()}/git/ref/heads/${encodePath(branch)}`)
    const json = (await res.json()) as { object: { sha: string } }
    return json.object.sha
  }

  /** SHA the given branch points at, or null if the branch does not exist. */
  async refShaOrNull(branch: string): Promise<string | null> {
    try {
      return await this.refSha(branch)
    } catch (e) {
      if (e instanceof Error && / → 404 /.test(e.message)) return null
      throw e
    }
  }

  /** Tree SHA of a commit. */
  async commitTree(commitSha: string): Promise<string> {
    const res = await this.req('GET', `${this.base()}/git/commits/${commitSha}`)
    const json = (await res.json()) as { tree: { sha: string } }
    return json.tree.sha
  }

  /** Create a tree with inline file contents on top of base_tree. */
  async createTree(
    baseTree: string,
    files: Array<{ path: string; content: string }>
  ): Promise<string> {
    const res = await this.req('POST', `${this.base()}/git/trees`, {
      body: {
        base_tree: baseTree,
        tree: files.map((f) => ({
          path: f.path,
          mode: '100644',
          type: 'blob',
          content: f.content,
        })),
      },
    })
    const json = (await res.json()) as { sha: string }
    return json.sha
  }

  async createCommit(message: string, tree: string, parent: string): Promise<string> {
    const res = await this.req('POST', `${this.base()}/git/commits`, {
      body: { message, tree, parents: [parent] },
    })
    const json = (await res.json()) as { sha: string }
    return json.sha
  }

  async createBranch(branch: string, sha: string): Promise<void> {
    await this.req('POST', `${this.base()}/git/refs`, {
      body: { ref: `refs/heads/${branch}`, sha },
    })
  }

  async updateBranch(branch: string, sha: string, force = false): Promise<void> {
    await this.req('PATCH', `${this.base()}/git/refs/heads/${encodePath(branch)}`, {
      body: { sha, force },
    })
  }

  /** Delete a branch ref outright (used to reset a stale bot-owned scratch branch). */
  async deleteBranch(branch: string): Promise<void> {
    await this.req('DELETE', `${this.base()}/git/refs/heads/${encodePath(branch)}`)
  }

  /** Existing open PR (html_url + number) for head branch, or null. */
  async openPr(headBranch: string, base: string): Promise<{ html_url: string; number: number } | null> {
    const head = `${this.repo.owner}:${headBranch}`
    const res = await this.req(
      'GET',
      `${this.base()}/pulls?state=open&head=${encodeURIComponent(head)}&base=${encodeURIComponent(base)}`
    )
    const json = (await res.json()) as Array<{ html_url: string; number: number }>
    return json.length ? { html_url: json[0].html_url, number: json[0].number } : null
  }

  async createPr(
    headBranch: string,
    base: string,
    title: string,
    body: string
  ): Promise<{ html_url: string; number: number }> {
    const res = await this.req('POST', `${this.base()}/pulls`, {
      body: { title, head: headBranch, base, body },
    })
    const json = (await res.json()) as { html_url: string; number: number }
    return { html_url: json.html_url, number: json.number }
  }

  /** Post a comment on an issue/PR (POST /repos/{owner}/{repo}/issues/{number}/comments). */
  async createPrComment(number: number, body: string): Promise<void> {
    await this.req('POST', `${this.base()}/issues/${number}/comments`, {
      body: { body },
    })
  }
}
