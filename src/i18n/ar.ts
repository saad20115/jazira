/**
 * UI Chrome Dictionary Interface (`handoff/tasks/P3-T1.md` §4, `handoff/PLAN.md` §"Phase 3 rules").
 *
 * Strictly typed so a missing key in either `src/i18n/ar.ts` or `src/i18n/en.ts` is a compile-time
 * TypeScript error. Contains ONLY UI chrome (button verbs, aria labels, form messages, step counters,
 * error chrome, and dev specimen chrome) — never business content.
 */
export interface UiDictionary {
  a11y: {
    skipToMainContent: string
    mainNavigation: string
    footerNavigation: string
    mobileMenuOpen: string
    mobileMenuClose: string
    languageSwitcherLabel: string
    whatsappChatLabel: string
    carouselPrev: string
    carouselNext: string
    lightboxClose: string
    lightboxPrev: string
    lightboxNext: string
    dialogClose: string
  }
  localeSwitcher: {
    targetCode: string
    targetName: string
  }
  draftMode: {
    bannerText: string
    exitPreviewLabel: string
  }
  actions: {
    learnMore: string
    viewAll: string
    showAll: string
    readMore: string
    backToHome: string
    backToProjects: string
    backToServices: string
    openInGoogleMaps: string
    openLive3dModel: string
    exitLive3dModel: string
    skipIntro: string
    retry: string
    close: string
  }
  filters: {
    all: string
    completed: string
    inProgress: string
    searchPlaceholder: string
    noResultsTitle: string
    noResultsText: string
  }
  quoteForm: {
    stepOfTotal: string
    nextStep: string
    previousStep: string
    submitRequest: string
    submitting: string
    requiredField: string
    invalidEmail: string
    invalidPhone: string
  }
  errors: {
    notFoundCode: string
    notFoundTitle: string
    notFoundDescription: string
    serverErrorTitle: string
    serverErrorDescription: string
  }
  specimen: {
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
}

export const arDictionary = {
  a11y: {
    skipToMainContent: 'انتقل إلى المحتوى الرئيسي',
    mainNavigation: 'التنقل الرئيسي',
    footerNavigation: 'روابط تذييل الصفحة',
    mobileMenuOpen: 'فتح القائمة',
    mobileMenuClose: 'إغلاق القائمة',
    languageSwitcherLabel: 'Switch language to English',
    whatsappChatLabel: 'تواصل معنا عبر واتساب',
    carouselPrev: 'الشريحة السابقة',
    carouselNext: 'الشريحة التالية',
    lightboxClose: 'إغلاق عارض الصور',
    lightboxPrev: 'الصورة السابقة',
    lightboxNext: 'الصورة التالية',
    dialogClose: 'إغلاق النافذة',
  },
  localeSwitcher: {
    targetCode: 'EN',
    targetName: 'English',
  },
  draftMode: {
    bannerText: 'وضع المعاينة المباشرة (مسودة غير منشورة للزوار)',
    exitPreviewLabel: 'إنهاء المعاينة',
  },
  actions: {
    learnMore: 'اعرف المزيد',
    viewAll: 'عرض الكل',
    showAll: 'إظهار الكل',
    readMore: 'اقرأ المزيد',
    backToHome: 'العودة إلى الرئيسية',
    backToProjects: 'العودة إلى المشاريع',
    backToServices: 'العودة إلى الخدمات',
    openInGoogleMaps: 'فتح في خرائط Google',
    openLive3dModel: 'افتح النموذج ثلاثي الأبعاد المباشر',
    exitLive3dModel: 'العودة إلى العرض العام',
    skipIntro: 'تخطي المقدمة',
    retry: 'إعادة المحاولة',
    close: 'إغلاق',
  },
  filters: {
    all: 'الكل',
    completed: 'مكتمل',
    inProgress: 'قيد التنفيذ',
    searchPlaceholder: 'ابحث في المواد أو العلامات التجارية...',
    noResultsTitle: 'لا توجد نتائج مطابقة',
    noResultsText: 'لم يتم العثور على عناصر تطابق عوامل التصفية المحددة.',
  },
  quoteForm: {
    stepOfTotal: '{current} / {total}',
    nextStep: 'التالي',
    previousStep: 'السابق',
    submitRequest: 'إرسال الطلب',
    submitting: 'جارٍ الإرسال...',
    requiredField: 'هذا الحقل مطلوب.',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
    invalidPhone: 'يرجى إدخال رقم جوال صحيح.',
  },
  errors: {
    notFoundCode: '404',
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundDescription: 'عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.',
    serverErrorTitle: 'حدث خطأ غير متوقع',
    serverErrorDescription: 'يرجى المحاولة مرة أخرى بعد قليل.',
  },
  specimen: {
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
    sampleDisplayXl: 'التميز الهندسي في أنظمة الكهروميكانيك الذكية',
    sampleDisplayL: 'حلول متكاملة للمشاريع الكبرى في مكة المكرمة',
    sampleH2: 'أنظمة التكييف والتهوية ومكافحة الحريق والجهد المنخفض',
    sampleH3: 'تنفيذ واختبار وتشغيل الأنظمة الهندسية وفق أعلى المعايير',
    sampleH4: 'إدارة المشاريع الكهروميكانيكية والأنظمة الذكية للمباني',
    sampleH5: 'اعتماد المواد والموردين وفق المواصفات الفنية المعتمدة',
    sampleBodyL:
      'تقدم شركة الجزيرة الإمداد الذكي حلولاً هندسية متكاملة تشمل التصميم والتوريد والتركيب والفحص والتشغيل للمشاريع الفندقية والتجارية والمؤسسية.',
    sampleBodyM:
      'نلتزم بتطبيق أعلى معايير الجودة والسلامة المهنية في جميع مراحل التنفيذ لضمان كفاءة التشغيل واستدامة الأصول.',
    sampleBodyMMedium: 'فريق هندسي وفني متخصص بخبرة ميدانية واسعة في المشاريع الحيوية.',
    sampleBodyMStrong: 'التزام تام بالجداول الزمنية وجودة المخرجات الهندسية المعتمدة.',
    sampleBodyQuote:
      '«إن الجودة الهندسية تبدأ من دقة التخطيط واختيار الأنظمة المعتمدة وتنتهي بتشغيل موثوق يدوم لعقود.»',
    sampleBodyS: 'تشمل خدماتنا أنظمة التكييف المركزي، شبكات الإطفاء، اللوحات الكهربائية، وأنظمة التحكم الذكي.',
    sampleBodySMedium: 'معتمدون لدى كبرى الجهات الاستشارية والمطورين العقاريين.',
    sampleCaption: 'توثيق مراحل التركيب والاختبار الميداني لأنظمة التبريد.',
    sampleCaptionS: 'جميع القياسات والمواصفات خاضعة لاشتراطات الكود السعودي للمباني.',
    sampleLabelButton: 'اطلب عرض سعر',
    sampleLabelCaps: 'أنظمة المباني الذكية',
    sampleLabelEyebrow: 'خدماتنا الهندسية',
    sampleLabelLink: 'استعرض تفاصيل المشروع',
    sampleLabelNav: 'المشاريع المنفذة',
    sampleLabelTag: 'كهروميكانيك MEP',
    sampleStatM: '+120',
    sampleStatNumber: '+250',
  },
} satisfies UiDictionary
