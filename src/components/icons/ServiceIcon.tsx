import type { ReactElement, SVGProps } from 'react'

export const SERVICE_ICON_KEYS = [
  'contracting',
  'mep',
  'fire',
  'smart',
  'hvac',
  'plumbing',
  'electrical',
  'supply',
  'testing',
  'maintenance',
] as const

export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number]

export interface ServiceIconOptionMeta {
  label: {
    ar: string
    en: string
  }
  value: ServiceIconKey
}

export const SERVICE_ICON_OPTIONS: readonly ServiceIconOptionMeta[] = [
  {
    value: 'contracting',
    label: {
      ar: 'المقاولات العامة (Contracting)',
      en: 'General Contracting (contracting)',
    },
  },
  {
    value: 'mep',
    label: {
      ar: 'الأعمال الكهروميكانيكية (MEP)',
      en: 'MEP Works (mep)',
    },
  },
  {
    value: 'fire',
    label: {
      ar: 'أنظمة مكافحة الحريق (Fire)',
      en: 'Firefighting Systems (fire)',
    },
  },
  {
    value: 'smart',
    label: {
      ar: 'الأنظمة الذكية والتيار الخفيف (Smart)',
      en: 'Smart & Low-Current Systems (smart)',
    },
  },
  {
    value: 'hvac',
    label: {
      ar: 'التكييف والتهوية (HVAC)',
      en: 'HVAC Systems (hvac)',
    },
  },
  {
    value: 'plumbing',
    label: {
      ar: 'السباكة والصرف الصحي (Plumbing)',
      en: 'Plumbing & Drainage (plumbing)',
    },
  },
  {
    value: 'electrical',
    label: {
      ar: 'الأنظمة الكهربائية والطاقة (Electrical)',
      en: 'Electrical & Power Systems (electrical)',
    },
  },
  {
    value: 'supply',
    label: {
      ar: 'التوريد والمواد المعتمدة (Supply)',
      en: 'Equipment & Material Supply (supply)',
    },
  },
  {
    value: 'testing',
    label: {
      ar: 'الاختبار والتشغيل التجريبي (Testing)',
      en: 'Testing & Commissioning (testing)',
    },
  },
  {
    value: 'maintenance',
    label: {
      ar: 'التشغيل والصيانة (Maintenance)',
      en: 'Operation & Maintenance (maintenance)',
    },
  },
] as const

export interface ServiceIconProps extends SVGProps<SVGSVGElement> {
  name: ServiceIconKey | (string & {})
  size?: number
}

export type SingleIconProps = Omit<ServiceIconProps, 'name'>

export function isServiceIconKey(value: unknown): value is ServiceIconKey {
  return typeof value === 'string' && (SERVICE_ICON_KEYS as readonly string[]).includes(value)
}

export function ServiceIcon({ name, size = 20, ...svgProps }: ServiceIconProps): ReactElement {
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
    'data-icon': `service-${name}`,
    ...svgProps,
  }

  switch (name) {
    case 'contracting':
      return (
        <svg {...baseProps}>
          <path d="M2.5 17.5H17.5M4.16667 17.5V5.83333L10 2.5L15.8333 5.83333V17.5M7.5 7.5H7.50833M10 7.5H10.0083M12.5 7.5H12.5083M7.5 10.8333H7.50833M10 10.8333H10.0083M12.5 10.8333H12.5083" />
        </svg>
      )
    case 'mep':
      return (
        <svg {...baseProps}>
          <path d="M10.8334 1.66663L3.33337 11.6666H9.16671L8.33337 18.3333L15.8334 8.33329H10L10.8334 1.66663Z" />
        </svg>
      )
    case 'fire':
      return (
        <svg {...baseProps}>
          <path d="M9.99995 18.3333C13.3333 18.3333 15.8333 16.0833 15.8333 12.6666C15.8333 9.99996 14.1666 7.99996 12.8333 6.66663C12.5833 8.16663 11.8333 9.16663 10.8333 9.58329C11.3333 6.33329 9.83328 3.66663 7.49995 1.66663C7.83328 4.41663 6.08328 6.16663 4.83328 7.83329C3.83328 9.16663 4.16661 10.5833 4.16661 12.6666C4.16661 16.0833 6.66661 18.3333 9.99995 18.3333Z" />
        </svg>
      )
    case 'smart':
      return (
        <svg {...baseProps}>
          <path d="M6.66671 16.6667H13.3334M10 13.3334V16.6667M3.33337 3.33337H16.6667V13.3334H3.33337V3.33337Z" />
        </svg>
      )
    case 'hvac':
      return (
        <svg {...baseProps}>
          <path d="M10.0001 1.66663V18.3333M1.66675 9.99996H18.3334M4.08341 4.08329L15.9167 15.9166M15.9167 4.08329L4.08341 15.9166M7.50008 2.49996L10.0001 4.99996L12.5001 2.49996M7.50008 17.5L10.0001 15L12.5001 17.5M2.50008 7.49996L5.00008 9.99996L2.50008 12.5M17.5001 7.49996L15.0001 9.99996L17.5001 12.5" />
        </svg>
      )
    case 'plumbing':
      return (
        <svg {...baseProps}>
          <path d="M10.0001 18.3333C11.5472 18.3333 13.0309 17.7188 14.1249 16.6248C15.2188 15.5308 15.8334 14.0471 15.8334 12.5C15.8334 10.8333 15.0001 9.25 13.3334 7.91667C11.6667 6.58333 10.4167 4.58333 10.0001 2.5C9.58341 4.58333 8.33341 6.58333 6.66675 7.91667C5.00008 9.25 4.16675 10.8333 4.16675 12.5C4.16675 14.0471 4.78133 15.5308 5.87529 16.6248C6.96925 17.7188 8.45299 18.3333 10.0001 18.3333Z" />
        </svg>
      )
    case 'electrical':
      return (
        <svg {...baseProps}>
          <path d="M10.8333 1.66663L2.5 11.6666H10L9.16667 18.3333L17.5 8.33329H10L10.8333 1.66663Z" />
        </svg>
      )
    case 'supply':
      return (
        <svg {...baseProps}>
          <path d="M13.75 7.83332L6.25 3.49998M17.5 13.3333V6.66665C17.4954 6.37863 17.4162 6.09673 17.2701 5.84845C17.1241 5.60017 16.9162 5.39397 16.6667 5.24998L10.8333 1.91665C10.58 1.77037 10.2926 1.69336 10 1.69336C9.70744 1.69336 9.42003 1.77037 9.16667 1.91665L3.33333 5.24998C3.08385 5.39397 2.87594 5.60017 2.72989 5.84845C2.58384 6.09673 2.50464 6.37863 2.5 6.66665V13.3333C2.50464 13.6213 2.58384 13.9032 2.72989 14.1515C2.87594 14.3998 3.08385 14.606 3.33333 14.75L9.16667 18.0833C9.42003 18.2296 9.70744 18.3066 10 18.3066C10.2926 18.3066 10.58 18.2296 10.8333 18.0833L16.6667 14.75C16.9162 14.606 17.1241 14.3998 17.2701 14.1515C17.4162 13.9032 17.4954 13.6213 17.5 13.3333Z" />
          <path d="M2.75 5.83337L10 10M10 10L17.25 5.83337M10 10V18.3334" />
        </svg>
      )
    case 'testing':
      return (
        <svg {...baseProps}>
          <path d="M7.5 9.16671L10 11.6667L18.3333 3.33337" />
          <path d="M17.5 10V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H13.3333" />
        </svg>
      )
    case 'maintenance':
    default:
      return (
        <svg {...baseProps}>
          <path d="M12.2499 5.24994C12.0972 5.40572 12.0117 5.61515 12.0117 5.83328C12.0117 6.0514 12.0972 6.26083 12.2499 6.41661L13.5832 7.74994C13.739 7.90263 13.9484 7.98816 14.1665 7.98816C14.3847 7.98816 14.5941 7.90263 14.7499 7.74994L17.8915 4.60828C18.3106 5.53427 18.4374 6.56597 18.2553 7.5659C18.0731 8.56582 17.5905 9.48648 16.8718 10.2052C16.1531 10.9239 15.2324 11.4065 14.2325 11.5887C13.2326 11.7708 12.2009 11.644 11.2749 11.2249L5.51655 16.9833C5.18503 17.3148 4.73539 17.501 4.26655 17.501C3.79771 17.501 3.34807 17.3148 3.01655 16.9833C2.68503 16.6518 2.49878 16.2021 2.49878 15.7333C2.49878 15.2644 2.68503 14.8148 3.01655 14.4833L8.77488 8.72494C8.35585 7.79895 8.22898 6.76725 8.41116 5.76732C8.59335 4.7674 9.07595 3.84674 9.79465 3.12804C10.5133 2.40935 11.434 1.92675 12.4339 1.74456C13.4339 1.56237 14.4656 1.68925 15.3915 2.10828L12.2582 5.24161L12.2499 5.24994Z" />
        </svg>
      )
  }
}

export function ContractingIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="contracting" />
}

export function MepIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="mep" />
}

export function FireIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="fire" />
}

export function SmartIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="smart" />
}

export function HvacIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="hvac" />
}

export function PlumbingIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="plumbing" />
}

export function ElectricalIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="electrical" />
}

export function SupplyIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="supply" />
}

export function TestingIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="testing" />
}

export function MaintenanceIcon(props: SingleIconProps): ReactElement {
  return <ServiceIcon {...props} name="maintenance" />
}
