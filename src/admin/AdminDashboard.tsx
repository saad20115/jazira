import { getTranslation } from '@payloadcms/translations'
import { Gutter } from '@payloadcms/ui'
import type { groupNavItems } from '@payloadcms/ui/shared'
import Link from 'next/link'
import type { PayloadRequest, ServerProps } from 'payload'
import React from 'react'

import { loadDashboardData, QUOTE_WINDOW_DAYS } from './dashboardData'
import { sortAdminNavGroups } from './navGroups'

type AdminDashboardProps = {
  initPageResult?: { req: PayloadRequest }
  navGroups?: ReturnType<typeof groupNavItems>
} & ServerProps

const COPY = {
  ar: {
    welcome: 'أهلاً',
    quotes: 'طلبات عروض الأسعار',
    quotesWindow: `آخر ${String(QUOTE_WINDOW_DAYS)} أيام`,
    statusNew: 'جديد',
    statusContacted: 'تم التواصل',
    statusQuoted: 'أُرسل العرض',
    failedEmail: 'إشعارات بريد فشل إرسالها',
    drafts: 'مسودات تنتظر النشر',
    noDrafts: 'لا توجد مسودات.',
    scheduled: 'نشر مجدول',
    recent: 'آخر التعديلات',
    noRecent: 'لا توجد تعديلات بعد.',
    quick: 'روابط سريعة',
    addProject: 'أضف مشروعاً',
    editHome: 'عدّل الصفحة الرئيسية',
    siteSettings: 'إعدادات الموقع',
    sections: 'كل الأقسام',
    add: 'إضافة',
  },
  en: {
    welcome: 'Welcome',
    quotes: 'Quote requests',
    quotesWindow: `Last ${String(QUOTE_WINDOW_DAYS)} days`,
    statusNew: 'New',
    statusContacted: 'Contacted',
    statusQuoted: 'Quoted',
    failedEmail: 'E-mail notifications that failed',
    drafts: 'Drafts waiting to be published',
    noDrafts: 'No drafts.',
    scheduled: 'Scheduled publishes',
    recent: 'Last edited',
    noRecent: 'Nothing edited yet.',
    quick: 'Quick links',
    addProject: 'Add a project',
    editHome: 'Edit the home page',
    siteSettings: 'Site settings',
    sections: 'All sections',
    add: 'Add',
  },
} as const

/**
 * P2-T7 §4 — the dashboard home. It replaces Payload's default dashboard view: a summary of the
 * work waiting (quote requests, drafts, scheduled publishes), the last edited items, quick links,
 * then every section the viewer may open, in the card's group order. The data comes from
 * `loadDashboardData`, which reads with the viewer's own access.
 */
export async function AdminDashboard(props: AdminDashboardProps): Promise<React.ReactElement> {
  const { i18n, initPageResult, navGroups, payload, permissions, user } = props
  const copy = i18n.language === 'ar' ? COPY.ar : COPY.en
  const adminRoute = payload.config.routes.admin
  const url = (path: `/${string}`): string => `${adminRoute === '/' ? '' : adminRoute}${path}`
  const data = initPageResult ? await loadDashboardData(initPageResult.req) : null
  const groups = sortAdminNavGroups(navGroups ?? [])

  const collectionLabel = (slug: string): string => {
    const config = payload.config.collections.find((collection) => collection.slug === slug)
    return config ? getTranslation(config.labels.plural, i18n) : slug
  }
  const globalLabel = (slug: string): string => {
    const config = payload.config.globals.find((global) => global.slug === slug)
    return config ? getTranslation(config.label, i18n) : slug
  }
  const formatDate = (iso: string): string =>
    new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))

  const quoteList = url('/collections/quote-requests')
  const quoteCards = data?.quotes
    ? ([
        ['new', copy.statusNew, data.quotes.new],
        ['contacted', copy.statusContacted, data.quotes.contacted],
        ['quoted', copy.statusQuoted, data.quotes.quoted],
      ] as const)
    : null
  const draftRows = data?.drafts
    ? [
        ...data.drafts.collections
          .filter((entry) => entry.count > 0)
          .map((entry) => ({
            key: entry.slug,
            label: collectionLabel(entry.slug),
            count: entry.count,
            href: `${url(`/collections/${entry.slug}`)}?where[_status][equals]=draft`,
          })),
        ...data.drafts.globals.map((slug) => ({
          key: slug,
          label: globalLabel(slug),
          count: null,
          href: url(`/globals/${slug}`),
        })),
      ]
    : null

  const quickLinks = [
    permissions?.collections?.projects.create === true
      ? { key: 'add-project', label: copy.addProject, href: url('/collections/projects/create') }
      : null,
    permissions?.globals?.['home-page']?.update
      ? { key: 'edit-home', label: copy.editHome, href: url('/globals/home-page') }
      : null,
    permissions?.globals?.['site-settings']?.update
      ? { key: 'site-settings', label: copy.siteSettings, href: url('/globals/site-settings') }
      : null,
  ].filter((link) => link !== null)

  const userName =
    user && 'name' in user && typeof user.name === 'string' && user.name.length > 0
      ? user.name
      : null

  return (
    <Gutter className="admin-home">
      <h1 className="admin-home__title" data-testid="admin-home-title">
        {userName
          ? `${copy.welcome}${i18n.language === 'ar' ? '،' : ','} ${userName}`
          : copy.welcome}
      </h1>

      <div className="admin-home__summary">
        {quoteCards && data?.quotes ? (
          <section className="admin-home__card" data-admin-card="quotes">
            <h2 className="admin-home__card-title">{copy.quotes}</h2>
            <p className="admin-home__card-note">{copy.quotesWindow}</p>
            <ul className="admin-home__stats">
              {quoteCards.map(([status, label, count]) => (
                <li key={status}>
                  <Link
                    className="admin-home__stat"
                    href={`${quoteList}?where[status][equals]=${status}`}
                    data-quote-status={status}
                  >
                    <span className="admin-home__stat-number">{count}</span>
                    <span className="admin-home__stat-label">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {data.quotes.failedEmail > 0 ? (
              <Link
                className="admin-home__alert"
                href={`${quoteList}?where[emailStatus][equals]=failed`}
                data-quote-status="email-failed"
              >
                {copy.failedEmail}: {data.quotes.failedEmail}
              </Link>
            ) : null}
          </section>
        ) : null}

        {draftRows ? (
          <section className="admin-home__card" data-admin-card="drafts">
            <h2 className="admin-home__card-title">{copy.drafts}</h2>
            {draftRows.length > 0 ? (
              <ul className="admin-home__list">
                {draftRows.map((row) => (
                  <li key={row.key}>
                    <Link href={row.href}>{row.label}</Link>
                    {row.count !== null ? (
                      <span className="admin-home__count">{row.count}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-home__card-note">{copy.noDrafts}</p>
            )}
            {data?.scheduledPublishes !== null && data?.scheduledPublishes !== undefined ? (
              <p className="admin-home__card-note" data-admin-card="scheduled">
                {copy.scheduled}: {data.scheduledPublishes}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="admin-home__card" data-admin-card="recent">
          <h2 className="admin-home__card-title">{copy.recent}</h2>
          {data && data.recent.length > 0 ? (
            <ul className="admin-home__list">
              {data.recent.map((item) => (
                <li key={`${item.collection}-${String(item.id)}`}>
                  <Link href={url(`/collections/${item.collection}/${String(item.id)}`)}>
                    {item.title || `${collectionLabel(item.collection)} #${String(item.id)}`}
                  </Link>
                  <span className="admin-home__meta">
                    {collectionLabel(item.collection)} · {formatDate(item.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-home__card-note">{copy.noRecent}</p>
          )}
        </section>

        {quickLinks.length > 0 ? (
          <section className="admin-home__card" data-admin-card="quick-links">
            <h2 className="admin-home__card-title">{copy.quick}</h2>
            <ul className="admin-home__quick">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link className="admin-home__quick-link" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <h2 className="admin-home__sections-title">{copy.sections}</h2>
      {groups.map((group) => (
        <section className="admin-home__group" key={group.label} data-admin-group={group.label}>
          <h3 className="admin-home__group-title">{group.label}</h3>
          <ul className="admin-home__entities">
            {group.entities.map((entity) => {
              // `EntityType` is a string enum ('collections' | 'globals').
              const kind: string = entity.type
              const isCollection = kind === 'collections'
              const href = url(
                isCollection ? `/collections/${entity.slug}` : `/globals/${entity.slug}`,
              )
              const canCreate =
                isCollection && permissions?.collections?.[entity.slug]?.create === true
              return (
                <li className="admin-home__entity" key={`${entity.type}-${entity.slug}`}>
                  <Link className="admin-home__entity-link" href={href}>
                    {getTranslation(entity.label, i18n)}
                  </Link>
                  {canCreate ? (
                    <Link
                      className="admin-home__entity-add"
                      href={url(`/collections/${entity.slug}/create`)}
                      aria-label={`${copy.add}: ${getTranslation(entity.label, i18n)}`}
                    >
                      +
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </Gutter>
  )
}
