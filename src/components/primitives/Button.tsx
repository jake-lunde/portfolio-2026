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
  if (href) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
