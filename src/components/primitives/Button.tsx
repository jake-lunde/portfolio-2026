import styles from './primitives.module.css'

/* The system's button, finally a primitive — consolidates the per-program
 * button styles (gate dialogOk, paint doneBtn) onto design tokens:
 * radius-btn, border-rule/heavy, text-chrome-*, space-*. Change the token,
 * every button in the OS follows — that's the whole demo.
 *
 * tone: which accent answers on hover — system (blue) or expressive (pink).
 * size: md = dialog weight (2px border), sm = chrome weight (1.5px border).
 */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'system' | 'expressive'
  size?: 'sm' | 'md'
}

export function Button({
  tone = 'expressive',
  size = 'sm',
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    size === 'md' ? styles.btnMd : styles.btnSm,
    tone === 'system' ? styles.btnSystem : styles.btnExpressive,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
