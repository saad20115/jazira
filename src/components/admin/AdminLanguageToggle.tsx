'use client'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

/**
 * P2-T7 §1 (owner 2026-11-11: the Arabic dashboard "does not work") — the dashboard language
 * switch, always visible in the header. Payload's own switch is on the Account page only, where
 * the owner did not find it. The button names the language it switches to, in that language.
 */
export const AdminLanguageToggle: React.FC = () => {
  const { i18n, switchLanguage } = useTranslation()
  const target = i18n.language === 'ar' ? 'en' : 'ar'
  if (!switchLanguage) {
    return null
  }
  return (
    <button
      type="button"
      className="admin-language-toggle"
      data-testid="admin-language-toggle"
      lang={target}
      onClick={() => {
        void switchLanguage(target)
      }}
    >
      {target === 'ar' ? 'العربية' : 'English'}
    </button>
  )
}
