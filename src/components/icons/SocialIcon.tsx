import type { ReactElement, SVGProps } from 'react'

export const SOCIAL_ICON_KEYS = ['linkedin', 'x', 'instagram', 'facebook', 'whatsapp'] as const

export type SocialIconKey = (typeof SOCIAL_ICON_KEYS)[number]

export interface SocialIconProps extends SVGProps<SVGSVGElement> {
  name: SocialIconKey | (string & {})
  size?: number
}

export type SingleSocialIconProps = Omit<SocialIconProps, 'name'>

export function isSocialIconKey(value: unknown): value is SocialIconKey {
  return typeof value === 'string' && (SOCIAL_ICON_KEYS as readonly string[]).includes(value)
}

export function SocialIcon({ name, size = 20, ...svgProps }: SocialIconProps): ReactElement {
  const baseProps: SVGProps<SVGSVGElement> & { 'data-icon'?: string } = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.67,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: 'false',
    'data-icon': `social-${name}`,
    ...svgProps,
  }

  switch (name) {
    case 'linkedin':
      return (
        <svg {...baseProps}>
          <path d="M13.3333 6.66663C14.6593 6.66663 15.9311 7.19341 16.8688 8.13109C17.8065 9.06877 18.3333 10.3405 18.3333 11.6666V17.5H14.9999V11.6666C14.9999 11.2246 14.8243 10.8007 14.5118 10.4881C14.1992 10.1756 13.7753 9.99996 13.3333 9.99996C12.8912 9.99996 12.4673 10.1756 12.1547 10.4881C11.8422 10.8007 11.6666 11.2246 11.6666 11.6666V17.5H8.33325V11.6666C8.33325 10.3405 8.86004 9.06877 9.79772 8.13109C10.7354 7.19341 12.0072 6.66663 13.3333 6.66663Z" />
          <path d="M5.00008 7.5H1.66675V17.5H5.00008V7.5Z" />
          <path d="M3.33341 4.99996C4.25389 4.99996 5.00008 4.25377 5.00008 3.33329C5.00008 2.41282 4.25389 1.66663 3.33341 1.66663C2.41294 1.66663 1.66675 2.41282 1.66675 3.33329C1.66675 4.25377 2.41294 4.99996 3.33341 4.99996Z" />
        </svg>
      )
    case 'x':
      return (
        <svg {...baseProps}>
          <path d="M3.33325 3.33337L13.0833 16.6667H16.6666L6.91659 3.33337H3.33325Z" />
          <path d="M3.33325 16.6667L8.99992 11M10.9999 9.00004L16.6666 3.33337" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...baseProps}>
          <path d="M14.1667 1.66663H5.83341C3.53223 1.66663 1.66675 3.53211 1.66675 5.83329V14.1666C1.66675 16.4678 3.53223 18.3333 5.83341 18.3333H14.1667C16.4679 18.3333 18.3334 16.4678 18.3334 14.1666V5.83329C18.3334 3.53211 16.4679 1.66663 14.1667 1.66663Z" />
          <path d="M10.0001 13.3333C11.841 13.3333 13.3334 11.8409 13.3334 9.99996C13.3334 8.15901 11.841 6.66663 10.0001 6.66663C8.15913 6.66663 6.66675 8.15901 6.66675 9.99996C6.66675 11.8409 8.15913 13.3333 10.0001 13.3333Z" />
          <path d="M14.5833 5.41663H14.5916" />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...baseProps}>
          <path d="M14.9999 1.66663H12.4999C11.3948 1.66663 10.335 2.10561 9.55364 2.88701C8.77224 3.66842 8.33325 4.72822 8.33325 5.83329V8.33329H5.83325V11.6666H8.33325V18.3333H11.6666V11.6666H14.1666L14.9999 8.33329H11.6666V5.83329C11.6666 5.61228 11.7544 5.40032 11.9107 5.24404C12.0669 5.08776 12.2789 4.99996 12.4999 4.99996H14.9999V1.66663Z" />
        </svg>
      )
    case 'whatsapp':
    default:
      return (
        <svg {...baseProps}>
          <path d="M2.5 17.5L3.875 14.3333C2.82305 12.84 2.35222 11.0142 2.55087 9.1984C2.74952 7.38262 3.60399 5.70176 4.95392 4.47124C6.30386 3.24073 8.05646 2.54515 9.88282 2.51506C11.7092 2.48496 13.4837 3.12241 14.8735 4.30778C16.2632 5.49316 17.1726 7.14496 17.431 8.9532C17.6893 10.7614 17.2789 12.6018 16.2768 14.1289C15.2746 15.6561 13.7495 16.765 11.9878 17.2476C10.2261 17.7301 8.34885 17.5532 6.70833 16.75L2.5 17.5Z" />
          <path d="M7.5 8.33337C7.5 8.44388 7.5439 8.54986 7.62204 8.628C7.70018 8.70614 7.80616 8.75004 7.91667 8.75004C8.02717 8.75004 8.13315 8.70614 8.21129 8.628C8.28943 8.54986 8.33333 8.44388 8.33333 8.33337V7.50004C8.33333 7.38953 8.28943 7.28355 8.21129 7.20541C8.13315 7.12727 8.02717 7.08337 7.91667 7.08337C7.80616 7.08337 7.70018 7.12727 7.62204 7.20541C7.5439 7.28355 7.5 7.38953 7.5 7.50004V8.33337ZM7.5 8.33337C7.5 9.43844 7.93899 10.4983 8.72039 11.2797C9.50179 12.0611 10.5616 12.5 11.6667 12.5M11.6667 12.5H12.5C12.6105 12.5 12.7165 12.4561 12.7946 12.378C12.8728 12.2999 12.9167 12.1939 12.9167 12.0834C12.9167 11.9729 12.8728 11.8669 12.7946 11.7887C12.7165 11.7106 12.6105 11.6667 12.5 11.6667H11.6667C11.5562 11.6667 11.4502 11.7106 11.372 11.7887C11.2939 11.8669 11.25 11.9729 11.25 12.0834C11.25 12.1939 11.2939 12.2999 11.372 12.378C11.4502 12.4561 11.5562 12.5 11.6667 12.5Z" />
        </svg>
      )
  }
}

export function SocialLinkedinIcon(props: SingleSocialIconProps): ReactElement {
  return <SocialIcon {...props} name="linkedin" />
}

export function SocialXIcon(props: SingleSocialIconProps): ReactElement {
  return <SocialIcon {...props} name="x" />
}

export function SocialInstagramIcon(props: SingleSocialIconProps): ReactElement {
  return <SocialIcon {...props} name="instagram" />
}

export function SocialFacebookIcon(props: SingleSocialIconProps): ReactElement {
  return <SocialIcon {...props} name="facebook" />
}

export function SocialWhatsappIcon(props: SingleSocialIconProps): ReactElement {
  return <SocialIcon {...props} name="whatsapp" />
}
