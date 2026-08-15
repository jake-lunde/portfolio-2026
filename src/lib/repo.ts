/* WHERE THIS REPO LIVES, in one place.
 *
 * Three callers: INSPECT's SOURCE rows, which turn every path they can name
 * into a link, and the two commit routes, which fall back to the slug when
 * GITHUB_COPY_REPO is unset.
 *
 * The link goes to GitHub's own web editor rather than the file view,
 * because that is Jake's editing loop: open the file on main, type, and
 * GitHub offers a branch and a pull request on the way out. Vercel builds
 * the preview from the branch and merging it ships.
 *
 * Nothing here reads a secret or writes anything, so it is safe on the
 * client. The repo is public, which is what makes the editor reachable at
 * all: a visitor who is not a collaborator lands on the same page with the
 * fork offered instead.
 */

/** owner/name, the same shape parseRepo() takes. */
export const REPO_SLUG = 'jake-lunde/portfolio-2026'

/** The branch the site ships from, and the one the editor opens against. */
export const REPO_BRANCH = 'main'

/** GitHub's web editor for a repo-relative path. */
export function editUrl(path: string): string {
  const clean = path
    .replace(/^\/+/, '')
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `https://github.com/${REPO_SLUG}/edit/${REPO_BRANCH}/${clean}`
}
