'use client'

import type { JSX } from 'react'
import { useSettings } from '@/store/settings'
import { t } from './copy'

/** Renders a copy string and stamps data-copy-id so EDIT.MODE can
    find the node. Use for visible text; attribute strings (aria-label,
    title) call t() directly and stay uneditable in v1.
    (Named CopyText, not Copy: `Copy.tsx` collides with `copy.ts` on
    case-insensitive filesystems under moduleResolution "bundler".) */
export function CopyText({
  k,
  as: Tag = 'span',
  className,
}: {
  k: string
  as?: keyof JSX.IntrinsicElements
  className?: string
}) {
  const skin = useSettings((s) => s.skin)
  return (
    <Tag data-copy-id={k} className={className}>
      {t(k, skin)}
    </Tag>
  )
}
