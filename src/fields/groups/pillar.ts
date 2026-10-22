import type { Field, NamedGroupField } from 'payload'

export interface PillarFieldOptions {
  textLabel?: { ar: string; en: string }
  textMaxLength?: number
  titleLabel?: { ar: string; en: string }
  titleMaxLength?: number
}

/**
 * Reusable `pillar` field pair (`title` (L) + `text` (L)) defined once in `src/fields/groups/`
 * per `docs/02-content-model.md` Addendum.
 * Used in `projects.details`, `services-page.process.steps`, `about-page.strengths.items`,
 * and `about-page.missionVision.{mission,vision}.pillars`.
 */
export function pillarFields(options: PillarFieldOptions = {}): Field[] {
  const {
    textLabel = {
      ar: 'النص التفصيلي',
      en: 'Text',
    },
    textMaxLength = 1000,
    titleLabel = {
      ar: 'العنوان',
      en: 'Title',
    },
    titleMaxLength = 200,
  } = options

  return [
    {
      name: 'title',
      type: 'text',
      label: titleLabel,
      localized: true,
      required: true,
      maxLength: titleMaxLength,
    },
    {
      name: 'text',
      type: 'textarea',
      label: textLabel,
      localized: true,
      required: true,
      maxLength: textMaxLength,
    },
  ]
}

export interface PillarGroupOptions extends PillarFieldOptions {
  label?: { ar: string; en: string }
  name?: string
}

export function pillarGroup(options: PillarGroupOptions = {}): NamedGroupField {
  const {
    label = {
      ar: 'محور / بند (Pillar)',
      en: 'Pillar',
    },
    name = 'pillar',
    ...fieldOptions
  } = options

  return {
    name,
    type: 'group',
    label,
    fields: pillarFields(fieldOptions),
  }
}
