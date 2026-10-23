import type { Field } from 'payload'

import {
  buttonGroup,
  ctaGroup,
  pageHeaderGroup,
  pillarGroup,
  sectionIntroGroup,
} from '../src/fields/groups/index'
import { ALL_GLOBALS } from '../src/globals/index'

function walkFields(fields: readonly Field[], prefix = ''): string[] {
  const lines: string[] = []
  for (const field of fields) {
    if (field.type === 'collapsible' || field.type === 'row') {
      lines.push(...walkFields(field.fields, prefix))
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const nextPrefix =
          'name' in tab && typeof tab.name === 'string'
            ? prefix
              ? `${prefix}.${tab.name}`
              : tab.name
            : prefix
        lines.push(...walkFields(tab.fields, nextPrefix))
      }
      continue
    }
    if (!('name' in field) || typeof field.name !== 'string') {
      continue
    }
    const path = prefix ? `${prefix}.${field.name}` : field.name
    const props: string[] = []
    if ('minLength' in field && typeof field.minLength === 'number') {
      props.push(`minLength=${String(field.minLength)}`)
    }
    if ('maxLength' in field && typeof field.maxLength === 'number') {
      props.push(`maxLength=${String(field.maxLength)}`)
    }
    if ('minRows' in field && typeof field.minRows === 'number') {
      props.push(`minRows=${String(field.minRows)}`)
    }
    if ('maxRows' in field && typeof field.maxRows === 'number') {
      props.push(`maxRows=${String(field.maxRows)}`)
    }
    if (props.length > 0) {
      lines.push(`${path} (${field.type}): ${props.join(', ')}`)
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      lines.push(...walkFields(field.fields, path))
    }
  }
  return lines
}

export function generateLimitsLogLines(): string[] {
  const out: string[] = ['=== REUSABLE FIELD GROUPS ===']
  const groups: ReadonlyArray<readonly [string, Field]> = [
    ['group:button', buttonGroup()],
    ['group:cta', ctaGroup({ includeSecondaryButton: true })],
    ['group:pageHeader', pageHeaderGroup()],
    ['group:sectionIntro', sectionIntroGroup()],
    ['group:pillar', pillarGroup()],
  ]

  for (const [label, groupField] of groups) {
    out.push(...walkFields([groupField], label))
  }

  out.push('', '=== GLOBALS ===')
  for (const globalConfig of ALL_GLOBALS) {
    out.push(`--- global:${globalConfig.slug} ---`)
    out.push(...walkFields(globalConfig.fields, globalConfig.slug))
  }

  return out
}

if (typeof process !== 'undefined' && !process.env.VITEST && process.env.NODE_ENV !== 'test') {
  for (const line of generateLimitsLogLines()) {
    process.stdout.write(`${line}\n`)
  }
  process.exit(0)
}
