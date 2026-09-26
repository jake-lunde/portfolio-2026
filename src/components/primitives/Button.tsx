import styles from './primitives.module.css'

/* The system's button, finally a primitive — consolidates the per-program
 * button styles (gate dialogOk, paint doneBtn) onto design tokens:
 * radius-btn, border-rule/heavy, text-chrome-*, space-*. Change the token,
 * every button in the OS follows — that's the whole demo.
 *
 * tone: which accent answers on hover — system (blue) or expressive (pink).
 * size: md = dialog weight (2px border), sm = chrome weight (1.5px border).
 * variant: solid = system-accent fill at rest (Jake's hub-player Figma
 *   pass; hover spec still open, so solid holds its rest colors).
 * href: same dress on an external-link anchor (hub-player's VIEW SITE).
 */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'system' | 'expressive'
  size?: 'sm' | 'md'
  variant?: 'outline' | 'solid'
  href?: string
}

export function Button({
  tone = 'expressive',
  size = 'sm',
  variant = 'outline',
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    size === 'md' ? styles.btnMd : styles.btnSm,
    tone === 'system' ? styles.btnSystem : styles.btnExpressive,
    variant === 'solid' ? styles.btnSolid : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  /* The label is its own span so STYLER's bench has something to direct-select
     — the button's two text rows paint it and nothing else (lib/stylerAnatomy
     .ts). An inline span inside an inline-flex box, inheriting the face from
     the size class above it: it is a flex item where a bare text node was an
     anonymous one, and .btn sets no gap and names no child, so nothing moves. */
  const label = <span data-part="label">{children}</span>
  if (href) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer" data-component="button">
        {label}
      </a>
    )
  }
  return (
    <button className={cls} data-component="button" {...rest}>
      {label}
    </button>
  )
}
