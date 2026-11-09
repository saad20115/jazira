/**
 * The shareable URL hash of an entered system (`handoff/tasks/P3-T5.md` §5, E4): only
 * `#systems-hvac|fire|plumbing|power|smart` is recognised; anything else means "no system".
 */

import { SYSTEM_IDS, type SystemId } from './contract'

const HASH_PATTERN = new RegExp(`^#systems-(${SYSTEM_IDS.join('|')})$`)

export function systemFromHash(hash: string): SystemId | null {
  const match = HASH_PATTERN.exec(hash)
  const id = match?.[1]
  return SYSTEM_IDS.find((system) => system === id) ?? null
}

export function hashForSystem(system: SystemId | null): string {
  return system ? `#systems-${system}` : ''
}
