import { DefaultNavClient, NavHamburger, NavWrapper } from '@payloadcms/next/client'
import { Logout } from '@payloadcms/ui'
import { getNavGroups } from '@payloadcms/ui/shared'
import type { NavPreferences, PayloadRequest, ServerProps } from 'payload'
import React from 'react'

import { sortAdminNavGroups } from './navGroups'

/** Payload's preference key for the sidebar's open and closed groups (`NAV_PREFERENCE_KEY`). */
const NAV_PREFERENCE_KEY = 'nav'

type AdminNavProps = { req?: PayloadRequest } & ServerProps

async function readNavPreferences(req: PayloadRequest | undefined): Promise<NavPreferences | null> {
  const user = req?.user
  if (!req || !user) {
    return null
  }
  const result = await req.payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req,
    user,
    where: {
      and: [
        { key: { equals: NAV_PREFERENCE_KEY } },
        { 'user.relationTo': { equals: user.collection } },
        { 'user.value': { equals: user.id } },
      ],
    },
  })
  return (result.docs[0]?.value as NavPreferences | undefined) ?? null
}

/**
 * P2-T7 §2 — the admin sidebar with its groups in the card order (Content, Pages, Company, Media,
 * Sales, Settings, System). It is Payload's default nav (same client pieces, same markup and
 * classes) with one change: the groups are sorted. See `src/admin/navGroups.ts` for why
 * configuration alone cannot do it.
 */
export async function AdminNav(props: AdminNavProps): Promise<React.ReactElement | null> {
  const { i18n, payload, permissions, req, visibleEntities } = props
  if (!permissions || !visibleEntities) {
    return null
  }
  const groups = sortAdminNavGroups(
    getNavGroups(permissions, visibleEntities, payload.config, i18n),
  )
  const navPreferences = await readNavPreferences(req)

  return (
    <NavWrapper baseClass="nav">
      <nav className="nav__wrap">
        {/* The client nav reads `navPreferences?.groups`, so an absent preference is fine. */}
        <DefaultNavClient groups={groups} navPreferences={navPreferences as NavPreferences} />
        <div className="nav__controls">
          <Logout />
        </div>
      </nav>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  )
}
