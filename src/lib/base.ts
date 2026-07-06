/* Base path for URL writes done outside Next's router (history.replaceState,
   fallback hrefs). Inlined at build; '' in dev and on Vercel. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
