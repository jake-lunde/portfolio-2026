import styles from './viz.module.css'

/* Shared chrome for a visualizer window body (CRT plate + glow). */

export function VizShell({ children }: { children: React.ReactNode }) {
  return <div className={`${styles.viz} crt-glow`}>{children}</div>
}
