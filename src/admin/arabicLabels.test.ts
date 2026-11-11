import type { Field } from 'payload'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import payloadConfig from '../payload.config'

/**
 * P2-T7 §1 — "No English-only label left in the Arabic admin". Walks every collection and global
 * the staff can open and lists each label, group, option or description that has no Arabic text.
 */
type Labelled =
  Record<string, unknown> | string | undefined | false | null | ((...a: never[]) => unknown)

function missingArabic(value: Labelled): boolean {
  if (typeof value === 'function') {
    return false
  }
  // `label: false` shows no label at all (a group inside a labelled collapsible).
  if (value === false) {
    return false
  }
  if (value === undefined || value === null) {
    return true
  }
  if (typeof value === 'string') {
    return true
  }
  return typeof value.ar !== 'string' || value.ar.trim().length === 0
}

function walk(fields: readonly Field[], path: string, out: string[]): void {
  for (const field of fields) {
    const name = 'name' in field ? field.name : field.type
    const here = `${path}.${name}`
    // Not shown to staff: hidden fields, and Payload's own internals (`admin.disabled`, e.g. sessions).
    const admin =
      'admin' in field
        ? (field.admin as { disabled?: boolean; hidden?: boolean } | undefined)
        : undefined
    const hidden = admin?.hidden === true || admin?.disabled === true
    if (field.type === 'ui' || ('hidden' in field && field.hidden) || hidden) {
      continue
    }
    if ('name' in field && missingArabic(field.label)) {
      out.push(`${here} (label)`)
    }
    if ((field.type === 'select' || field.type === 'radio') && Array.isArray(field.options)) {
      for (const option of field.options) {
        if (typeof option === 'string' || missingArabic(option.label as Labelled)) {
          out.push(`${here} option ${typeof option === 'string' ? option : option.value}`)
        }
      }
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (missingArabic(tab.label)) {
          out.push(`${here} tab ${'name' in tab && tab.name ? tab.name : '?'}`)
        }
        walk(tab.fields, here, out)
      }
    } else if (field.type === 'blocks') {
      for (const block of field.blocks) {
        walk(block.fields, `${here}.${block.slug}`, out)
      }
    } else if ('fields' in field) {
      if ((field.type === 'collapsible' || field.type === 'group') && missingArabic(field.label)) {
        out.push(`${here} (${field.type} label)`)
      }
      walk(field.fields, here, out)
    }
  }
}

describe('P2-T7 §1 Arabic labels', () => {
  it('every collection, global, field and option the staff see has an Arabic label', async () => {
    const config = await payloadConfig
    const offenders: string[] = []
    const internal = new Set([
      'payload-jobs',
      'payload-locked-documents',
      'payload-preferences',
      'payload-migrations',
      'payload-kv',
      'payload-jobs-stats',
    ])
    for (const collection of config.collections) {
      if (internal.has(collection.slug) || collection.admin.hidden === true) {
        continue
      }
      if (missingArabic(collection.labels.plural) || missingArabic(collection.labels.singular)) {
        offenders.push(`${collection.slug} (collection label)`)
      }
      if (missingArabic(collection.admin.group)) {
        offenders.push(`${collection.slug} (group)`)
      }
      walk(collection.fields, collection.slug, offenders)
    }
    for (const global of config.globals) {
      if (internal.has(global.slug)) {
        continue
      }
      if (missingArabic(global.label)) {
        offenders.push(`${global.slug} (global label)`)
      }
      if (missingArabic(global.admin.group)) {
        offenders.push(`${global.slug} (group)`)
      }
      walk(global.fields, global.slug, offenders)
    }
    expect(offenders).toEqual([])
  })
})
