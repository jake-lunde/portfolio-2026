'use client'

import { getProgram } from '@/programs/registry'
import { getViz } from '@/programs/visualizers/vizRegistry'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { useWindowChrome } from '@/components/shell/windowChrome'
import { programName } from '@/lib/skinVocab'
import { sfx } from '@/lib/sound'
import { Icon, type IconName } from '@/components/shell/Icon'
import styles from '../programs.module.css'

/* A folder window — the desktop's second storey. Consolidating the
   launcher meant the desktop stopped being a flat list of every program;
   MUSIC / FUN are drawers, and this is what a drawer looks like when you
   open it. Same icon + label vocabulary as the desktop, so the two read
   as one system.

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

export default function Folder() {
  const { id } = useWindowChrome()
  const open = useWindows((s) => s.open)
  const skin = useSettings((s) => s.skin)

  const items = getProgram(id)?.folder ?? []
  const entries = items.map(lookup).filter((e): e is Entry => e !== null)

  return (
    <div className={styles.folder}>
      <div className={styles.folderHead}>
        <span>
          {entries.length} item{entries.length === 1 ? '' : 's'}
        </span>
      </div>
      <nav className={styles.folderGrid} aria-label="Programs">
        {entries.map((e) => (
          <button
            key={e.id}
            className={styles.folderItem}
            onClick={() => {
              sfx.open()
              open(e.id)
            }}
          >
            <Icon name={e.icon} />
            <span className={styles.folderLabel} data-copy-id={`program.${e.id}.name`}>
              {programName(e.id, e.name, skin)}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
