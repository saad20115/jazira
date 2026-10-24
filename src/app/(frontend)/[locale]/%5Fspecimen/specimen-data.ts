import type { SupportedLocale } from '@/i18n'

export interface SpecimenStrings {
  badge: string
  title: string
  subtitle: string
  colorsHeading: string
  extraColorsHeading: string
  typographyHeading: string
  shadowsHeading: string
  radiiHeading: string
  spacingHeading: string
  gridHeading: string
  colStyle: string
  colSpec: string
  colSample: string
  sampleDisplayXl: string
  sampleDisplayL: string
  sampleH2: string
  sampleH3: string
  sampleH4: string
  sampleH5: string
  sampleBodyL: string
  sampleBodyM: string
  sampleBodyMMedium: string
  sampleBodyMStrong: string
  sampleBodyQuote: string
  sampleBodyS: string
  sampleBodySMedium: string
  sampleCaption: string
  sampleCaptionS: string
  sampleLabelButton: string
  sampleLabelCaps: string
  sampleLabelEyebrow: string
  sampleLabelLink: string
  sampleLabelNav: string
  sampleLabelTag: string
  sampleStatM: string
  sampleStatNumber: string
}

const SPECIMEN_AR: SpecimenStrings = {
  badge: 'P3-T1 · مرجع الأنماط والخطوط (خاص ببيئة التطوير)',
  title: 'مرجع الرموز التصميمية والسلالم المطبعية (Noto Kufi Arabic · RTL)',
  subtitle:
    'مولّد آلياً من design/tokens.json مع تباعد أحرف 0px وارتفاع سطر +10% للغة العربية، وخصائص منطقية بالكامل.',
  colorsHeading: '1. ألوان الهوية والمتغيرات الأساسية (Brand & Semantic Colors)',
  extraColorsHeading: '2. ألوان الواجهة والشفافية الإضافية (Literal & State Colors)',
  typographyHeading: '3. السلم المطبعي الكامل — 23 نمطاً (Typography Scale)',
  shadowsHeading: '4. الظلال (Elevation & Drop Shadows)',
  radiiHeading: '5. أنصاف أقطار الحواف (Border Radii)',
  spacingHeading: '6. سلم المسافات (Spacing Scale)',
  gridHeading: '7. حاوية الشبكة (1160px Container · 4 / 3 / 2 الأعمدة المتجاوبة)',
  colStyle: 'الفئة والاسم (Style / Utility Class)',
  colSpec: 'المواصفات (Weight · Size / LH · LS)',
  colSample: 'النموذج النصي (Arabic Sample)',
  sampleDisplayXl: 'نموذج عرض العنوان الرئيسي الكبير (Display XL)',
  sampleDisplayL: 'نموذج عرض العنوان الفرعي الكبير (Display L)',
  sampleH2: 'نموذج عنوان القسم الرئيسي (Heading H2)',
  sampleH3: 'نموذج العنوان الفرعي للقسم (Heading H3)',
  sampleH4: 'نموذج عنوان البطاقة والوحدة (Heading H4)',
  sampleH5: 'نموذج العنوان المصغر (Heading H5)',
  sampleBodyL:
    'نموذج النص الأساسي الكبير (Body L) لاختبار وضوح القراءة وتناسق ارتفاع السطر في الفقرات العربية.',
  sampleBodyM: 'نموذج النص الأساسي القياسي (Body M) المستخدم في فقرات المحتوى العام ووصف العناصر.',
  sampleBodyMMedium: 'نموذج النص المتوسط السماكة (Body M Medium) لإبراز الجمل المهمة.',
  sampleBodyMStrong: 'نموذج النص العريض (Body M Strong) للتأكيد البصري داخل الفقرات.',
  sampleBodyQuote: '«نموذج نص الاقتباس (Body Quote) بخط مستقيم غير مائل في اللغة العربية.»',
  sampleBodyS: 'نموذج النص الصغير (Body S) للتفاصيل التكميلية والملاحظات الفرعية.',
  sampleBodySMedium: 'نموذج النص الصغير المتوسط (Body S Medium) للعناصر الوصفية.',
  sampleCaption: 'نموذج التسمية التوضيحية (Caption) أسفل الصور والجداول.',
  sampleCaptionS: 'نموذج التسمية التوضيحية المصغرة (Caption S) للبيانات الوصفية.',
  sampleLabelButton: 'تسمية الزر (Label Button)',
  sampleLabelCaps: 'تسمية بارزة (Label Caps)',
  sampleLabelEyebrow: 'شارة القسم (Label Eyebrow)',
  sampleLabelLink: 'رابط نصي (Label Link)',
  sampleLabelNav: 'عنصر تنقل (Label Nav)',
  sampleLabelTag: 'وسم تصنيف (Label Tag)',
  sampleStatM: '100%',
  sampleStatNumber: '0123',
}

const SPECIMEN_EN: SpecimenStrings = {
  badge: 'P3-T1 · Design Token & Type Specimen (Development Only)',
  title: 'Design Tokens & Typography Specimen (Poppins · LTR)',
  subtitle:
    'Generated automatically from design/tokens.json with exact Figma variables, responsive scale, and CSS logical properties.',
  colorsHeading: '1. Brand & Semantic Colors (Figma Variables)',
  extraColorsHeading: '2. Literal & State Colors (Reference Code + CTO §10)',
  typographyHeading: '3. Complete Typography Scale — 23 Styles (Poppins)',
  shadowsHeading: '4. Elevation & Drop Shadows',
  radiiHeading: '5. Border Radii',
  spacingHeading: '6. Spacing Scale',
  gridHeading: '7. Layout Container (1160px · Responsive 4 / 3 / 2 Columns)',
  colStyle: 'Style / Utility Class',
  colSpec: 'Weight · Size / LH · LS',
  colSample: 'English Sample',
  sampleDisplayXl: 'Display XL Type Specimen Sample',
  sampleDisplayL: 'Display L Type Specimen Sample',
  sampleH2: 'Heading H2 Section Title Specimen',
  sampleH3: 'Heading H3 Subsection Title Specimen',
  sampleH4: 'Heading H4 Card Header Specimen',
  sampleH5: 'Heading H5 Compact Header Specimen',
  sampleBodyL:
    'Body L lead paragraph specimen verifying line-height rhythm and measure across desktop, tablet, and mobile viewports.',
  sampleBodyM:
    'Body M standard paragraph specimen for primary reading flow and balanced typographic contrast.',
  sampleBodyMMedium: 'Body M Medium specimen for emphasized body copy and list lead-ins.',
  sampleBodyMStrong: 'Body M Strong specimen for bold inline callouts and key phrases.',
  sampleBodyQuote:
    '“Body Quote specimen rendered in italic style in English and upright normal style in Arabic.”',
  sampleBodyS: 'Body S compact paragraph specimen for secondary descriptions and metadata blocks.',
  sampleBodySMedium: 'Body S Medium specimen for structured metadata labels and compact rows.',
  sampleCaption: 'Caption specimen for figure annotations and supporting notes.',
  sampleCaptionS: 'Caption S micro-copy specimen for timestamps and badges.',
  sampleLabelButton: 'Button Label',
  sampleLabelCaps: 'LABEL CAPS SPECIMEN',
  sampleLabelEyebrow: 'EYEBROW LABEL SPECIMEN',
  sampleLabelLink: 'Inline Link Label',
  sampleLabelNav: 'Navigation Link',
  sampleLabelTag: 'TAG LABEL',
  sampleStatM: '100%',
  sampleStatNumber: '0123',
}

export function getSpecimenStrings(locale: SupportedLocale): SpecimenStrings {
  return locale === 'ar' ? SPECIMEN_AR : SPECIMEN_EN
}
