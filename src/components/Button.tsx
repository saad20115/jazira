import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

import { CmsLink } from '@/components/CmsLink'
import { ArrowRightIcon } from '@/components/icons'
import type { SupportedLocale } from '@/i18n'
import type { CmsLinkDataLike } from '@/lib/link-safety'

import styles from './Button.module.css'

export const BUTTON_VARIANTS = ['Gold', 'Dark', 'Glass', 'Outline'] as const
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

export const BUTTON_STATES = ['Default', 'Hover', 'FocusVisible', 'Disabled'] as const
export type ButtonState = (typeof BUTTON_STATES)[number]

export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const
export type ButtonSize = (typeof BUTTON_SIZES)[number]

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children?: ReactNode
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  href?: string | null | undefined
  label?: string
  link?: CmsLinkDataLike | null | undefined
  locale?: SupportedLocale | undefined
  newTab?: boolean | null | undefined
  showArrow?: boolean
  size?: ButtonSize
  state?: ButtonState
  variant?: ButtonVariant
}

const VARIANT_CLASS_MAP: Record<ButtonVariant, string> = {
  Gold: styles.variantGold,
  Dark: styles.variantDark,
  Glass: styles.variantGlass,
  Outline: styles.variantOutline,
}

const SIZE_CLASS_MAP: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
}

const STATE_CLASS_MAP: Record<ButtonState, string> = {
  Default: '',
  Hover: styles.stateHover,
  FocusVisible: styles.stateFocusVisible,
  Disabled: styles.stateDisabled,
}

export function Button({
  variant = 'Gold',
  state = 'Default',
  size = 'md',
  fullWidth = false,
  showArrow = true,
  disabled = false,
  href,
  link,
  locale,
  newTab,
  label,
  children,
  className,
  type = 'button',
  ...buttonProps
}: ButtonProps): ReactElement {
  const isDisabled = disabled || state === 'Disabled'
  const content = children ?? label ?? link?.label ?? null

  const classes = [
    styles.button,
    VARIANT_CLASS_MAP[variant],
    SIZE_CLASS_MAP[size],
    STATE_CLASS_MAP[state],
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const innerContent = (
    <>
      <span className={styles.label}>{content}</span>
      {showArrow ? <ArrowRightIcon className={styles.icon} size={18} /> : null}
    </>
  )

  if ((href || link) && !isDisabled) {
    return (
      <CmsLink
        className={classes}
        data-button-size={size}
        data-button-state={state}
        data-button-variant={variant}
        data-component="button"
        href={href}
        link={link}
        locale={locale}
        newTab={newTab}
      >
        {innerContent}
      </CmsLink>
    )
  }

  return (
    <button
      {...buttonProps}
      aria-disabled={isDisabled || undefined}
      className={classes}
      data-button-size={size}
      data-button-state={state}
      data-button-variant={variant}
      data-component="button"
      disabled={isDisabled}
      type={type}
    >
      {innerContent}
    </button>
  )
}
