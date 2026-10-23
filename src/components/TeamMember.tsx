import type { ReactElement } from 'react'

import { Avatar, type AvatarFallbackMode } from '@/components/Avatar'
import type { Team } from '@/payload-types'

import styles from './TeamMember.module.css'

export interface TeamMemberProps {
  avatarFallbackMode?: AvatarFallbackMode
  className?: string
  member: Pick<Team, 'name' | 'position' | 'photo'>
}

/**
 * Figma component `TeamMember` (`150:603`, `design/context/components/team-member.md`).
 * Renders a `270×80` staff marquee card (`Avatar` `52×52` + `name` + `position`) from CMS `Team` data.
 */
export function TeamMember({
  member,
  avatarFallbackMode = 'silhouette',
  className,
}: TeamMemberProps): ReactElement {
  const cardClasses = [styles.memberCard, className ?? ''].filter(Boolean).join(' ')

  return (
    <article className={cardClasses} data-component="team-member">
      <Avatar member={member} size={52} fallbackMode={avatarFallbackMode} />
      <div className={styles.info}>
        <p className={`${styles.name} t-body-m-strong`}>{member.name}</p>
        <p className={`${styles.position} t-caption`}>{member.position}</p>
      </div>
    </article>
  )
}
