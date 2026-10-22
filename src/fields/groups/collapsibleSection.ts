import type { CollapsibleField, GroupField, NamedGroupField } from 'payload'

export interface CollapsibleSectionOptions {
  /**
   * Whether the section starts collapsed in the Admin UI.
   * Defaults to `true` per `handoff/tasks/P2-T5.md`.
   */
  initCollapsed?: boolean
}

/**
 * Wraps a named `GroupField` in a Payload `CollapsibleField` (`type: 'collapsible'`)
 * so that each page section renders as a collapsible accordion card in the Admin UI
 * (`initCollapsed: true` by default) while keeping the exact same data model and SQL columns.
 */
export function collapsibleSection(
  group: GroupField,
  options: CollapsibleSectionOptions = {},
): CollapsibleField {
  const namedGroup = group as NamedGroupField
  const { initCollapsed = true } = options
  const label = namedGroup.label ? namedGroup.label : namedGroup.name
  const description = namedGroup.admin?.description

  return {
    type: 'collapsible',
    label,
    admin: {
      initCollapsed,
      ...(description ? { description } : {}),
    },
    fields: [
      {
        ...namedGroup,
        label: false,
        admin: {
          ...namedGroup.admin,
          description: undefined,
          hideGutter: true,
        },
      },
    ],
  }
}
