/* TOKEN BRIDGE — is the bundle Figma is running built from current source?
 *
 * dist/ is gitignored and built by hand, so Figma can happily run a bundle
 * from weeks ago while src/ carries the fix. That happened on 2026-08-21: an
 * Aug-11 bundle re-logged eleven alias warnings PR #57 had already killed and
 * minted eleven junk component variables Jake deleted by hand. The source was
 * right the whole time and nothing said a word.
 *
 * So build.mjs bakes a stamp into the bundle (the HEAD commit touching
 * figma-plugin/ at build time), and before every PULL/PUSH the plugin asks
 * GitHub for that path's commit list on the pull branch. If the stamped commit
 * sits behind the newest one, the bundle is old and we say so.
 *
 * Kept figma-global-free so the verdict is exercised in test/freshness.test.mjs.
 *
 * One gap this cannot close: source edited after the last build, never
 * committed. The stamp still matches the branch, so it reads as fresh. Use
 * `npm run plugin:watch` while working on the bridge.
 */

export type BuildStamp = {
  /** Full SHA of the newest commit touching figma-plugin/ when the bundle was built. */
  sha: string
  /** Branch checked out at build time, for the log line. */
  branch: string
  /** Working tree carried uncommitted figma-plugin changes at build time. */
  dirty: boolean
  /** ISO build time. */
  at: string
}

export type Verdict =
  /** Stamp matches the newest figma-plugin commit on the branch. */
  | { kind: 'fresh'; stamp: BuildStamp }
  /** Stamp is an older commit on the branch: the bundle is behind by `behind` commits. */
  | { kind: 'stale'; stamp: BuildStamp; behind: number; latest: string }
  /** Stamp is not in the branch's recent history: built from a feature branch. */
  | { kind: 'off-branch'; stamp: BuildStamp; latest: string }
  /** Built on top of uncommitted local edits, so the branch says nothing useful. */
  | { kind: 'dirty'; stamp: BuildStamp }
  /** No stamp at all, which means a bundle built before stamping existed. */
  | { kind: 'unstamped' }
  /** GitHub would not answer, so freshness is simply unknown. */
  | { kind: 'unknown'; stamp: BuildStamp | null; reason: string }

export function short(sha: string): string {
  return sha.slice(0, 7)
}

/**
 * Compare the baked stamp against the branch's commits for figma-plugin/,
 * newest first (what GET /commits?path=figma-plugin returns).
 */
export function judge(stamp: BuildStamp | null, pathCommits: string[]): Verdict {
  if (!stamp) return { kind: 'unstamped' }
  // Built outside a git checkout (a tarball, say): there is nothing to compare.
  if (!stamp.sha) return { kind: 'unknown', stamp, reason: 'the bundle was built outside git.' }
  if (stamp.dirty) return { kind: 'dirty', stamp }
  // No commit has ever touched figma-plugin/ on this branch: nothing to be
  // behind, so the bundle cannot be stale.
  if (pathCommits.length === 0) return { kind: 'fresh', stamp }

  const latest = pathCommits[0]
  if (stamp.sha === latest) return { kind: 'fresh', stamp }

  const behind = pathCommits.indexOf(stamp.sha)
  if (behind > 0) return { kind: 'stale', stamp, behind, latest }
  return { kind: 'off-branch', stamp, latest }
}

/** Only a proven-behind bundle blocks the run. Everything else is advisory. */
export function blocks(v: Verdict): boolean {
  return v.kind === 'stale' || v.kind === 'unstamped'
}

/** The badge under the log: what Figma is running right now. */
export function stampLabel(stamp: BuildStamp | null): string {
  if (!stamp) return 'BUNDLE unstamped'
  const when = stamp.at.slice(5, 16).replace('T', ' ')
  if (!stamp.sha) return `BUNDLE untracked · ${when}`
  return `BUNDLE ${short(stamp.sha)}${stamp.dirty ? '+local' : ''} · ${when}`
}

const REBUILD = 'Run `npm run plugin:build`, then re-run the plugin.'

/** Log lines for a verdict, in order. */
export function lines(v: Verdict, branch: string): { level: string; text: string }[] {
  switch (v.kind) {
    case 'fresh':
      return [{ level: 'info', text: `Bundle is current with ${branch} (${short(v.stamp.sha)}).` }]
    case 'stale':
      return [
        {
          level: 'error',
          text:
            `STALE BUNDLE. Figma is running ${short(v.stamp.sha)}, ` +
            `${v.behind} commit${v.behind === 1 ? '' : 's'} behind ${branch} ` +
            `(${short(v.latest)}) for figma-plugin/. ${REBUILD}`,
        },
        { level: 'info', text: 'Stopped before touching anything.' },
      ]
    case 'unstamped':
      return [
        {
          level: 'error',
          text: `This bundle carries no build stamp, so it predates stamping. ${REBUILD}`,
        },
        { level: 'info', text: 'Stopped before touching anything.' },
      ]
    case 'off-branch':
      return [
        {
          level: 'warn',
          text:
            `Bundle was built from ${short(v.stamp.sha)} on ${v.stamp.branch}, which is not in ` +
            `${branch}'s recent history. Fine while you work on the bridge, worth knowing otherwise.`,
        },
      ]
    case 'dirty':
      return [
        {
          level: 'warn',
          text:
            `Bundle was built on top of uncommitted changes (${v.stamp.branch}, ` +
            `${short(v.stamp.sha)}), so it cannot be checked against ${branch}.`,
        },
      ]
    case 'unknown':
      return [{ level: 'warn', text: `Freshness check skipped: ${v.reason}` }]
  }
}

// build.mjs replaces this identifier with a JSON literal at bundle time. A
// bundle built before stamping existed leaves it undefined, and `typeof` on an
// undeclared global is safe in both the sandbox and the UI iframe.
declare const __BUILD_STAMP__: BuildStamp | undefined

export const STAMP: BuildStamp | null =
  typeof __BUILD_STAMP__ === 'undefined' ? null : __BUILD_STAMP__
