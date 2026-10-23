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

export function ServiceIcon({ name, size = 22, ...svgProps }: ServiceIconProps): ReactElement {
  const baseProps: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...svgProps,
  }

  switch (name) {
    case 'contracting':
      return (
        <svg {...baseProps}>
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-5h6v5" />
          <path d="M9 10h.01M15 10h.01M9 13h.01M15 13h.01" />
        </svg>
      )
    case 'mep':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" />
        </svg>
      )
    case 'fire':
      return (
        <svg {...baseProps}>
          <path d="M12 3c1.5 2.5 4.5 4.5 4.5 8.5a4.5 4.5 0 1 1-9 0c0-2 1-3.8 2.2-5.2.4 1.3 1.3 2.2 2.3 2.2 0-2-.5-3.8 0-5.5Z" />
          <path d="M10 16.5a2 2 0 1 0 4 0c0-1.2-1-2.2-2-3.2-1 1-2 2-2 3.2Z" />
        </svg>
      )
    case 'smart':
      return (
        <svg {...baseProps}>
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M10 10h4v4h-4z" />
          <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
        </svg>
      )
    case 'hvac':
      return (
        <svg {...baseProps}>
          <path d="M12 2v20M2 12h20" />
          <path d="m9 5 3 3 3-3M15 19l-3-3-3 3M5 9l3 3-3 3M19 9l-3 3 3 3" />
        </svg>
      )
    case 'plumbing':
      return (
        <svg {...baseProps}>
          <path d="M12 3.5c-3.5 4.5-6 7.5-6 11a6 6 0 0 0 12 0c0-3.5-2.5-6.5-6-11Z" />
          <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
        </svg>
      )
    case 'electrical':
      return (
        <svg {...baseProps}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        </svg>
      )
    case 'supply':
      return (
        <svg {...baseProps}>
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        </svg>
      )
    case 'testing':
      return (
        <svg {...baseProps}>
          <path d="M9 3h6l1 7H8L9 3Z" />
          <path d="M6 10h12v4a6 6 0 0 1-12 0v-4Z" />
          <path d="m9.5 14.5 1.8 1.8 3.5-3.5" />
        </svg>
      )
    case 'maintenance':
    default:
      return (
        <svg {...baseProps}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
        </svg>
      )
  }
}
