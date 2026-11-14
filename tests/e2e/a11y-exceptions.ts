/**
 * Owner decision 2026-11-10 (docs/05-design.md decision 19): these exact Figma text colours stay on
 * these light backgrounds although they fail WCAG 1.4.3. Only these pairs are exempt. Any other
 * contrast failure, and every other axe rule, still fails the P3-T10 a11y test.
 */
export const OWNER_APPROVED_CONTRAST_FG: readonly string[] = ['#dfa82a', '#c38f1c', '#8a93a3']
export const OWNER_APPROVED_CONTRAST_BG: readonly string[] = ['#ffffff', '#f6f8fb', '#e3e7ee']

export interface AxeNodeLike {
  target: unknown[]
  any: { data?: unknown }[]
}

export interface AxeViolationLike {
  id: string
  impact?: string | null
  nodes: AxeNodeLike[]
}

function contrastColours(node: AxeNodeLike): { fg: string; bg: string } | null {
  for (const check of node.any) {
    const data = check.data
    if (data && typeof data === 'object' && 'fgColor' in data && 'bgColor' in data) {
      const { fgColor, bgColor } = data
      if (typeof fgColor === 'string' && typeof bgColor === 'string') {
        return { fg: fgColor.toLowerCase(), bg: bgColor.toLowerCase() }
      }
    }
  }
  return null
}

/** True only for a color-contrast node whose exact fg/bg pair the owner approved. */
export function isOwnerApprovedContrast(ruleId: string, node: AxeNodeLike): boolean {
  if (ruleId !== 'color-contrast') return false
  const colours = contrastColours(node)
  if (!colours) return false
  return (
    OWNER_APPROVED_CONTRAST_FG.includes(colours.fg) &&
    OWNER_APPROVED_CONTRAST_BG.includes(colours.bg)
  )
}

/**
 * Serious/critical violations left after removing only the owner-approved contrast nodes.
 * A rule whose nodes are all approved disappears; any other node keeps its rule in the result.
 */
export function blockingViolations(violations: AxeViolationLike[]): string[] {
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      violation,
      nodes: violation.nodes.filter((node) => !isOwnerApprovedContrast(violation.id, node)),
    }))
    .filter(({ nodes }) => nodes.length > 0)
    .map(
      ({ violation, nodes }) =>
        `${String(violation.impact)} ${violation.id}: ${nodes
          .slice(0, 3)
          .map((node) => node.target.map(String).join(' '))
          .join(' | ')}`,
    )
}
