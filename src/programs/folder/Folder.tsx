'use client'

import { getProgram } from '@/programs/registry'
import { getViz } from '@/programs/visualizers/vizRegistry'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { useWindowChrome } from '@/components/shell/windowChrome'
import { programName } from '@/lib/skinVocab'
import { sfx } from '@/lib/sound'
import { Icon, type IconName } from '@/components/shell/Icon'
import { MEDIA, type MediaKind } from '@/components/shell/mediaSprites'
import styles from '../programs.module.css'

/* A folder window — the desktop's second storey. Consolidating the
   launcher meant the desktop stopped being a flat list of every program;
   MUSIC / FUN are drawers, and this is what a drawer looks like when you
   open it.

   Desk vs case: desktop icons are objects on the desk; the things inside a
   drawer are the media you load. A folder with `case` in the registry
   shows each program as a piece of media standing in a slot — MUSIC is a
   tape rack, FUN a cartridge shelf — with the program's pixel icon as the
   label art, so the two storeys stay one system while reading as
   different depths. Hover pulls the media out of its slot (the slot's
   front lip hides the bottom of the sprite at rest); the icon's own hover
   cycle plays on the label meanwhile. Click seats it back and opens the
   window. Without `case` a drawer is the plain icon grid.

   Contents come from `folder` on the program's own registry entry, found
   via the window id this component is mounted inside — so one component
   serves every drawer and adding one is a registry line. Entries are
   window ids: a program id, or `viz:<id>`; names and icons come from
   whichever registry owns the id, which means a rename or a skin's
   vocabulary lands here for free. */

type Entry = { id: string; icon: IconName; name: string }

function lookup(id: string): Entry | null {
  if (id.startsWith('viz:')) {
    const v = getViz(id.slice(4))
    return v ? { id, icon: v.icon, name: v.name } : null
  }
  const p = getProgram(id)
  return p ? { id, icon: p.icon, name: p.name } : null
}

/* what a case holds, and what the head counts them as */
const CASES = {
  rack: { media: 'tape' as MediaKind, unit: 'tape' },
  shelf: { media: 'cart' as MediaKind, unit: 'cart' },
}

function Media({ kind, icon }: { kind: MediaKind; icon: IconName }) {
  const m = MEDIA[kind]
  return (
    <span className={styles.media} style={{ width: m.w, height: m.h }}>
      <svg
        width={m.w}
        height={m.h}
        viewBox={`0 0 ${m.w} ${m.h}`}
        aria-hidden="true"
        className={styles.mediaSprite}
        shapeRendering="crispEdges"
      >
        <path d={m.ink} fill="currentColor" />
      </svg>
      <span className={styles.mediaLabel} style={{ left: m.label.x, top: m.label.y }}>
        <Icon name={icon} />
      </span>
    </span>
  )
}

export default function Folder() {
  const { id } = useWindowChrome()
  const open = useWindows((s) => s.open)
  const skin = useSettings((s) => s.skin)

  const program = getProgram(id)
  const items = program?.folder ?? []
  const entries = items.map(lookup).filter((e): e is Entry => e !== null)
  // medieval keeps the plain grid: the sprites are the classic skin's
  // 1-bit language (same gap as the pixel icons' medieval fallback)
  const kase = program?.case && skin !== 'medieval' ? CASES[program.case] : null
  const unit = kase?.unit ?? 'item'

  return (
    <div className={styles.folder}>
      <div className={styles.folderHead}>
        <span>
          {entries.length} {unit}
          {entries.length === 1 ? '' : 's'}
        </span>
      </div>
      <nav className={styles.folderGrid} aria-label="Programs" data-case={program?.case}>
        {entries.map((e) => (
          <button
            key={e.id}
            className={styles.folderItem}
            onClick={() => {
              sfx.open()
              open(e.id)
            }}
          >
            {kase ? (
              <span className={styles.slot}>
                <Media kind={kase.media} icon={e.icon} />
              </span>
            ) : (
              <Icon name={e.icon} />
            )}
            <span className={styles.folderLabel} data-copy-id={`program.${e.id}.name`}>
              {programName(e.id, e.name, skin)}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
