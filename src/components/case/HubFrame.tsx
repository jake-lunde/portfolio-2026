import styles from './case.module.css'

/* The device, as a seat. The hero's CSS bezel (case.module.css
   .hubDevice — three concentric bands around a 16:9 panel) was written
   once and nested by hand at each call site; s134-r2 put the prototype
   and the rein-in on the same hardware, so the nest is one piece now
   and HubModes, DemoReel's hub frame and ReinIn all consume it.

   Static markup on purpose: no state, no directive, so the client
   islands can import it without dragging anything across the boundary.
   The surround is the caller's — HubModes builds a wall for the ground
   shadow to land on, the other two take .hubStand's modest seat. */

export function HubFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.hubDevice}>
      <div className={styles.hubGap}>
        <div className={styles.hubGlass}>
          <div className={styles.hubPanel}>{children}</div>
        </div>
      </div>
    </div>
  )
}
