/**
 * UI strings of the live 3D card (CTO decision Q4 (b), 2026-10-25: kept here, not in the shared
 * dictionaries, until the R-3 merge). `en` and `ar` must have identical keys and no empty values
 * (`src/p3-t5-strings.test.ts`).
 *
 * Hotspot labels are keyed by the GLB `HOT_<s>_<n>.label` ids. They are generic equipment names
 * (no brands, no numbers). The Arabic is drafted and needs the owner's review.
 */

import type { SupportedLocale } from '@/i18n'

export interface Systems3dStrings {
  /** Card image alt when the CMS gives none. */
  posterAlt: string
  exploreIn3d: string
  loading: string
  dragHint: string
  done: string
  zoomIn: string
  zoomOut: string
  resetView: string
  exitSystem: string
  allProjects: string
  hotspots: Readonly<Record<HotspotLabelId, string>>
}

export const HOTSPOT_LABEL_IDS = [
  'chillers',
  'cooling_towers',
  'ahus_roof',
  'duct_riser',
  'fcus_L12',
  'fire_pumps',
  'jockey_pump',
  'sprinkler_riser',
  'floor_mains_L10',
  'alarm_panel',
  'break_tanks',
  'booster_pumps',
  'water_risers',
  'drainage_stacks',
  'roof_tank',
  'generator',
  'transformers',
  'mv_switchgear',
  'lv_panels',
  'cable_risers',
  'bms_data_room',
  'bms_console',
  'elv_riser',
  'cctv_entrance',
  'access_control',
] as const
export type HotspotLabelId = (typeof HOTSPOT_LABEL_IDS)[number]

export const SYSTEMS3D_STRINGS: Readonly<Record<SupportedLocale, Systems3dStrings>> = {
  en: {
    posterAlt: 'The tower and its MEP systems',
    exploreIn3d: 'Explore in 3D',
    loading: 'Loading the 3D model',
    dragHint: 'Drag to rotate',
    done: 'Done',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset view',
    exitSystem: 'Exit system',
    allProjects: 'All related projects',
    hotspots: {
      chillers: 'Chillers',
      cooling_towers: 'Cooling towers',
      ahus_roof: 'Rooftop air handling units',
      duct_riser: 'Duct riser',
      fcus_L12: 'Fan coil units',
      fire_pumps: 'Fire pumps',
      jockey_pump: 'Jockey pump',
      sprinkler_riser: 'Sprinkler riser',
      floor_mains_L10: 'Floor sprinkler mains',
      alarm_panel: 'Fire alarm panel',
      break_tanks: 'Break tanks',
      booster_pumps: 'Booster pumps',
      water_risers: 'Water risers',
      drainage_stacks: 'Drainage stacks',
      roof_tank: 'Roof water tank',
      generator: 'Standby generator',
      transformers: 'Transformers',
      mv_switchgear: 'Medium-voltage switchgear',
      lv_panels: 'Low-voltage panels',
      cable_risers: 'Cable risers',
      bms_data_room: 'BMS data room',
      bms_console: 'BMS console',
      elv_riser: 'ELV riser',
      cctv_entrance: 'Entrance CCTV',
      access_control: 'Access control',
    },
  },
  ar: {
    posterAlt: 'البرج وأنظمته الكهروميكانيكية',
    exploreIn3d: 'استكشف بالـ 3D',
    loading: 'جارٍ تحميل المجسم ثلاثي الأبعاد',
    dragHint: 'اسحب للتدوير',
    done: 'تم',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    resetView: 'إعادة ضبط العرض',
    exitSystem: 'الخروج من النظام',
    allProjects: 'كل المشاريع ذات الصلة',
    hotspots: {
      chillers: 'المبرّدات',
      cooling_towers: 'أبراج التبريد',
      ahus_roof: 'وحدات مناولة الهواء على السطح',
      duct_riser: 'الصاعد الرئيسي لمجاري الهواء',
      fcus_L12: 'وحدات ملفات المراوح',
      fire_pumps: 'مضخات الحريق',
      jockey_pump: 'مضخة حفظ الضغط',
      sprinkler_riser: 'صاعد الرشاشات',
      floor_mains_L10: 'خطوط الرشاشات الرئيسية للطابق',
      alarm_panel: 'لوحة إنذار الحريق',
      break_tanks: 'خزانات الفصل',
      booster_pumps: 'مضخات رفع الضغط',
      water_risers: 'صواعد المياه',
      drainage_stacks: 'أعمدة الصرف',
      roof_tank: 'خزان المياه العلوي',
      generator: 'المولد الاحتياطي',
      transformers: 'المحولات',
      mv_switchgear: 'لوحات توزيع الجهد المتوسط',
      lv_panels: 'لوحات الجهد المنخفض',
      cable_risers: 'صواعد الكابلات',
      bms_data_room: 'غرفة بيانات نظام إدارة المبنى',
      bms_console: 'وحدة تحكم نظام إدارة المبنى',
      elv_riser: 'صاعد أنظمة التيار الخفيف',
      cctv_entrance: 'كاميرات المراقبة عند المدخل',
      access_control: 'نظام التحكم في الدخول',
    },
  },
}

export function getSystems3dStrings(locale: SupportedLocale): Systems3dStrings {
  return SYSTEMS3D_STRINGS[locale]
}
