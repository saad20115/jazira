/**
 * UI Chrome Dictionary Interface (`handoff/tasks/P3-T1.md` §4, `handoff/PLAN.md` §"Phase 3 rules", `R-5`).
 *
 * Strictly typed so a missing key in either `src/i18n/ar.ts` or `src/i18n/en.ts` is a compile-time
 * TypeScript error. Contains ONLY UI chrome (button verbs, aria labels, form messages, step counters,
 * error chrome, and draft-mode banner chrome) — never business content, fallback marketing copy,
 * or business numbers.
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
  nav: {
    brandName: string
    home: string
    services: string
    about: string
    aboutUs: string
    projects: string
    contact: string
    contactUs: string
    privacy: string
    getAQuote: string
    requestQuote: string
    languageSwitcherShort: string
    languageSwitcherLabel: string
    languageSwitcherAriaLabel: string
    openMenu: string
    closeMenu: string
    mainNavAriaLabel: string
    mobileDrawerAriaLabel: string
    whatsappChatTooltip: string
    whatsappFabAriaLabel: string
  }
  footer: {
    quickLinksHeading: string
    quickLinksTitle: string
    contactInfoHeading: string
    contactInfoTitle: string
    ctaButton: string
    chatOnWhatsapp: string
    ctaWhatsappLink: string
    socialLinkedin: string
    socialX: string
    socialInstagram: string
    socialFacebook: string
    socialYoutube: string
    socialTiktok: string
    socialSnapchat: string
    socialWhatsapp: string
    socialAriaLinkedin: string
    socialAriaX: string
    socialAriaInstagram: string
    socialAriaFacebook: string
    socialAriaYoutube: string
    socialAriaTiktok: string
    socialAriaSnapchat: string
    socialAriaWhatsapp: string
    privacyPolicy: string
    languageToggle: string
  }
  accordion: {
    showDetails: string
    hideDetails: string
  }
  cards: {
    learnMore: string
    viewAllServices: string
    viewAllServicesButton: string
    viewProject: string
    linkedinProfile: string
    projectCategories: {
      mep: string
      'fire-fighting': string
      'low-current': string
      'data-center': string
      'civil-mep': string
    }
    projectStatus: {
      completed: string
      'in-progress': string
    }
  }
  carousel: {
    regionLabel: string
    carouselRoleDescription: string
    slideRoleDescription: string
    slideOfTotal: string
    previousSlide: string
    nextSlide: string
    pauseAutoPlay: string
    playAutoPlay: string
  }
  marquee: {
    partnersRegionLabel: string
    teamRegionLabel: string
    pauseMarquee: string
    playMarquee: string
  }
  draftMode: {
    bannerText: string
    exitPreviewLabel: string
  }
  home: {
    scrollToExplore: string
    interactive3dBadge: string
    relatedProjectsHeading: string
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
}

export const arDictionary = {
  a11y: {
    skipToMainContent: 'انتقل إلى المحتوى الرئيسي',
    mainNavigation: 'التنقل الرئيسي',
    footerNavigation: 'روابط تذييل الصفحة',
    mobileMenuOpen: 'فتح القائمة',
    mobileMenuClose: 'إغلاق القائمة',
    languageSwitcherLabel: 'EN English — Switch language to English',
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
  nav: {
    brandName: 'شعار الموقع',
    home: 'الرئيسية',
    services: 'خدماتنا',
    about: 'من نحن',
    aboutUs: 'من نحن',
    projects: 'مشاريعنا',
    contact: 'تواصل معنا',
    contactUs: 'تواصل معنا',
    privacy: 'سياسة الخصوصية',
    getAQuote: 'اطلب عرض سعر',
    requestQuote: 'اطلب عرض سعر',
    languageSwitcherShort: 'EN',
    languageSwitcherLabel: 'English (EN)',
    languageSwitcherAriaLabel: 'EN — التبديل إلى اللغة الإنجليزية (Switch to English)',
    openMenu: 'فتح قائمة التنقل',
    closeMenu: 'إغلاق قائمة التنقل',
    mainNavAriaLabel: 'القائمة الرئيسية',
    mobileDrawerAriaLabel: 'قائمة التنقل للأجهزة المحمولة',
    whatsappChatTooltip: 'تواصل معنا عبر واتساب',
    whatsappFabAriaLabel: 'تواصل معنا عبر واتساب',
  },
  footer: {
    quickLinksHeading: 'روابط سريعة',
    quickLinksTitle: 'روابط سريعة',
    contactInfoHeading: 'معلومات التواصل',
    contactInfoTitle: 'معلومات التواصل',
    ctaButton: 'اطلب عرض سعر',
    chatOnWhatsapp: 'تحدث عبر واتساب',
    ctaWhatsappLink: 'أو تحدث عبر واتساب ←',
    socialLinkedin: 'لينكد إن',
    socialX: 'منصة إكس',
    socialInstagram: 'إنستغرام',
    socialFacebook: 'فيسبوك',
    socialYoutube: 'يوتيوب',
    socialTiktok: 'تيك توك',
    socialSnapchat: 'سناب شات',
    socialWhatsapp: 'واتساب',
    socialAriaLinkedin: 'لينكدإن',
    socialAriaX: 'منصة إكس',
    socialAriaInstagram: 'إنستغرام',
    socialAriaFacebook: 'فيسبوك',
    socialAriaYoutube: 'يوتيوب',
    socialAriaTiktok: 'تيك توك',
    socialAriaSnapchat: 'سناب شات',
    socialAriaWhatsapp: 'واتساب',
    privacyPolicy: 'سياسة الخصوصية',
    languageToggle: 'عربي | EN',
  },
  accordion: {
    showDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
  },
  cards: {
    learnMore: 'اعرف المزيد',
    viewAllServices: 'عرض جميع الخدمات',
    viewAllServicesButton: 'عرض جميع الخدمات',
    viewProject: 'عرض المشروع',
    linkedinProfile: 'حساب لينكدإن',
    projectCategories: {
      mep: 'الأعمال الكهروميكانيكية',
      'fire-fighting': 'مكافحة الحريق',
      'low-current': 'التيار الخفيف',
      'data-center': 'مراكز البيانات',
      'civil-mep': 'الأعمال المدنية والكهروميكانيكية',
    },
    projectStatus: {
      completed: 'مكتمل',
      'in-progress': 'قيد التنفيذ',
    },
  },
  carousel: {
    regionLabel: 'الخدمات',
    carouselRoleDescription: 'معرض متحرك',
    slideRoleDescription: 'شريحة',
    slideOfTotal: '{current} من {total}',
    previousSlide: 'الخدمة السابقة',
    nextSlide: 'الخدمة التالية',
    pauseAutoPlay: 'إيقاف العرض التلقائي مؤقتاً',
    playAutoPlay: 'تشغيل العرض التلقائي',
  },
  marquee: {
    partnersRegionLabel: 'العلامات التجارية الشريكة',
    teamRegionLabel: 'أعضاء الفريق الهندسي',
    pauseMarquee: 'إيقاف الشريط المتحرك مؤقتاً',
    playMarquee: 'تشغيل الشريط المتحرك',
  },
  draftMode: {
    bannerText: 'وضع المعاينة المباشرة (مسودة غير منشورة للزوار)',
    exitPreviewLabel: 'إنهاء المعاينة',
  },
  home: {
    scrollToExplore: 'مرر للاستكشاف',
    interactive3dBadge: 'نموذج ثلاثي الأبعاد · العرض المباشر متاح',
    relatedProjectsHeading: 'مشاريع ذات صلة',
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
} satisfies UiDictionary
