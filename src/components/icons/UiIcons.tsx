import type { ReactElement, SVGProps } from 'react'

export interface UiIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function ArrowRightIcon({ size = 18, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-directional-icon="true"
      data-icon="ui-arrow-right"
      {...svgProps}
    >
      <path d="M3.75 9H14.25M10.5 5.25L14.25 9L10.5 12.75" />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 18, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-directional-icon="true"
      data-icon="ui-arrow-left"
      {...svgProps}
    >
      <path d="M14.25 9H3.75M7.5 5.25L3.75 9L7.5 12.75" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 18, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-chevron-down"
      {...svgProps}
    >
      <path d="M4.5 6.75L9 11.25L13.5 6.75" />
    </svg>
  )
}

export function ChevronUpIcon({ size = 18, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-chevron-up"
      {...svgProps}
    >
      <path d="M4.5 11.25L9 6.75L13.5 11.25" />
    </svg>
  )
}

export function PhoneIcon({ size = 18, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-phone"
      {...svgProps}
    >
      <path d="M16.5 12.69V14.94C16.5008 15.1489 16.4581 15.3556 16.3744 15.547C16.2907 15.7384 16.168 15.9102 16.0141 16.0514C15.8601 16.1926 15.6784 16.3001 15.4806 16.367C15.2827 16.434 15.073 16.4588 14.865 16.44C12.5571 16.1892 10.3402 15.4006 8.3925 14.1375C6.58037 12.986 5.044 11.4496 3.8925 9.6375C2.62498 7.6809 1.83618 5.45325 1.59 3.135C1.57126 2.9276 1.59591 2.71857 1.66238 2.52122C1.72885 2.32387 1.83568 2.14252 1.97607 1.98872C2.11647 1.83491 2.28735 1.71203 2.47785 1.62789C2.66834 1.54375 2.87426 1.5002 3.0825 1.5H5.3325C5.69648 1.49642 6.04934 1.62531 6.32532 1.86265C6.6013 2.09999 6.78156 2.42959 6.8325 2.79C6.92747 3.51005 7.10358 4.21705 7.3575 4.8975C7.45841 5.16594 7.48025 5.45769 7.42043 5.73816C7.36061 6.01863 7.22165 6.27608 7.02 6.48L6.0675 7.4325C7.13517 9.31016 8.68984 10.8648 10.5675 11.9325L11.52 10.98C11.7239 10.7784 11.9814 10.6394 12.2618 10.5796C12.5423 10.5198 12.8341 10.5416 13.1025 10.6425C13.783 10.8964 14.49 11.0725 15.21 11.1675C15.5743 11.2189 15.907 11.4024 16.1449 11.6831C16.3828 11.9638 16.5091 12.3222 16.5 12.69Z" />
    </svg>
  )
}

export function MailIcon({ size = 18, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-mail"
      {...svgProps}
    >
      <path d="M3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5C1.5 3.675 2.175 3 3 3Z" />
      <path d="M16.5 4.5L9 9.75L1.5 4.5" />
    </svg>
  )
}

export function MapPinIcon({ size = 18, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-map-pin"
      {...svgProps}
    >
      <path d="M15.75 7.5C15.75 12.75 9 17.25 9 17.25C9 17.25 2.25 12.75 2.25 7.5C2.25 5.70979 2.96116 3.9929 4.22703 2.72703C5.4929 1.46116 7.20979 0.75 9 0.75C10.7902 0.75 12.5071 1.46116 13.773 2.72703C15.0388 3.9929 15.75 5.70979 15.75 7.5Z" />
      <path d="M9 9.75C10.2426 9.75 11.25 8.74264 11.25 7.5C11.25 6.25736 10.2426 5.25 9 5.25C7.75736 5.25 6.75 6.25736 6.75 7.5C6.75 8.74264 7.75736 9.75 9 9.75Z" />
    </svg>
  )
}

export function WhatsAppFilledIcon({ size = 30, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-whatsapp-filled"
      {...svgProps}
    >
      <path d="M21.8438 17.9688C21.4688 17.7812 19.625 16.875 19.2812 16.75C18.9375 16.625 18.6875 16.5625 18.4375 16.9375C18.1875 17.3125 17.4688 18.1562 17.25 18.4062C17.0312 18.6562 16.8125 18.6875 16.4375 18.5C16.0625 18.3125 14.8438 17.9062 13.4062 16.625C12.2812 15.625 11.5312 14.375 11.3125 14C11.0938 13.625 11.2812 13.4375 11.4688 13.25C11.625 13.0938 11.8438 12.8125 12.0312 12.5938C12.2188 12.375 12.2812 12.2188 12.4062 11.9688C12.5312 11.7188 12.4688 11.5 12.375 11.3125C12.2812 11.125 11.5312 9.28125 11.2188 8.53125C10.9062 7.8125 10.5938 7.90625 10.375 7.90625C10.1562 7.90625 9.90625 7.875 9.65625 7.875C9.40625 7.875 9 7.96875 8.65625 8.34375C8.3125 8.71875 7.34375 9.625 7.34375 11.4688C7.34375 13.3125 8.6875 15.0938 8.875 15.3438C9.0625 15.5938 11.5312 19.4062 15.3125 21.0312C16.2188 21.4062 16.9062 21.6562 17.4688 21.8438C18.375 22.125 19.1875 22.0938 19.8438 22C20.5625 21.9062 22.0938 21.0938 22.4062 20.2188C22.7188 19.3438 22.7188 18.5938 22.625 18.4062C22.5312 18.2188 22.2188 18.1562 21.8438 17.9688ZM15.0625 26.875C12.8125 26.875 10.625 26.2812 8.71875 25.125L8.25 24.8438L3.5625 26.0625L4.8125 21.5L4.5 21C3.25 19.0312 2.59375 16.75 2.59375 14.4062C2.59375 7.5625 8.1875 1.96875 15.0625 1.96875C18.4062 1.96875 21.5312 3.25 23.875 5.625C26.2188 8 27.5312 11.125 27.5312 14.4375C27.5312 21.2812 21.9375 26.875 15.0625 26.875Z" />
    </svg>
  )
}

export function MenuIcon({ size = 22, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-menu"
      {...svgProps}
    >
      <path d="M3.5 6.5H18.5M3.5 11H18.5M3.5 15.5H18.5" />
    </svg>
  )
}

export function CloseIcon({ size = 22, ...svgProps }: UiIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="ui-close"
      {...svgProps}
    >
      <path d="M5.5 5.5L16.5 16.5M16.5 5.5L5.5 16.5" />
    </svg>
  )
}
