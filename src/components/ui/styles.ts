// Classes partagées : les composants n'utilisent que les jetons de src/styles/index.css.

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'outline' | 'danger' | 'ghost'

const buttonBase =
  'inline-flex min-h-touch items-center justify-center gap-2 rounded-field px-4 font-medium transition ' +
  'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  brand: 'bg-brand text-white shadow-card enabled:hover:-translate-y-0.5 enabled:hover:shadow-lift',
  secondary: 'border border-primary bg-white text-primary hover:bg-primary-tint',
  outline: 'border border-line bg-white text-ink-soft enabled:hover:border-primary enabled:hover:text-primary',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'text-ink-soft hover:bg-nav-hover',
}

export function buttonClass(variant: ButtonVariant = 'primary', extra = '') {
  return `${buttonBase} ${buttonVariants[variant]} ${extra}`
}

export const cardClass = 'rounded-card bg-white shadow-card'

export const fieldClass =
  'min-h-touch w-full rounded-field border border-line bg-white px-3 text-ink placeholder:text-muted focus:border-primary'

export const sectionTitleClass = 'text-lg font-bold text-ink'
