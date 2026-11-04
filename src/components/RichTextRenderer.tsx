import React, { type JSX, type ReactNode } from 'react'

import { CmsLink } from '@/components/CmsLink'
import { CspSafeImage } from '@/components/CspSafeImage'
import { extractMediaDisplay } from '@/components/CtaBand'
import type { SupportedLocale } from '@/i18n'
import type { CmsLinkDataLike } from '@/lib/link-safety'
import type { Media } from '@/payload-types'

import styles from './RichTextRenderer.module.css'

export interface LexicalNode {
  type?: string
  tag?: string
  text?: string
  format?: number | string
  listType?: string
  url?: string
  newTab?: boolean
  fields?: {
    url?: string
    newTab?: boolean
    linkType?: 'custom' | 'internal'
    doc?: {
      relationTo?: string
      value?: unknown
    }
  }
  relationTo?: string
  value?: unknown
  children?: LexicalNode[]
}

export interface LexicalSerializedState {
  root?: {
    type?: string
    children?: LexicalNode[]
  } | null
}

function collectNodeText(node: LexicalNode | null | undefined): string {
  if (!node || typeof node !== 'object') {
    return ''
  }
  if (node.type === 'linebreak') {
    return '\n'
  }
  if (typeof node.text === 'string') {
    return node.text
  }
  if (!Array.isArray(node.children)) {
    return ''
  }
  return node.children.map((child) => collectNodeText(child)).join('')
}

export function extractLexicalParagraphStrings(state: unknown): string[] {
  if (!state || typeof state !== 'object') {
    return []
  }
  const root = (state as LexicalSerializedState).root
  if (!root || !Array.isArray(root.children)) {
    return []
  }
  const paragraphs: string[] = []
  for (const child of root.children) {
    const text = collectNodeText(child).trim()
    if (text.length > 0) {
      paragraphs.push(text)
    }
  }
  return paragraphs
}

export function hasLexicalContent(state: unknown): boolean {
  if (!state || typeof state !== 'object') {
    return false
  }
  const root = (state as LexicalSerializedState).root
  if (!root || !Array.isArray(root.children)) {
    return false
  }
  return root.children.some((node) => {
    if (node.type === 'upload' && node.value && typeof node.value === 'object') {
      return true
    }
    return collectNodeText(node).trim().length > 0
  })
}

const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKETHROUGH = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16

function renderFormattedText(text: string, formatMask: number, key: string): ReactNode {
  let content: ReactNode = text
  if (formatMask & FORMAT_CODE) {
    content = <code className={styles.code}>{content}</code>
  }
  if (formatMask & FORMAT_UNDERLINE) {
    content = <u>{content}</u>
  }
  if (formatMask & FORMAT_STRIKETHROUGH) {
    content = <s>{content}</s>
  }
  if (formatMask & FORMAT_ITALIC) {
    content = <em>{content}</em>
  }
  if (formatMask & FORMAT_BOLD) {
    content = <strong>{content}</strong>
  }
  return <React.Fragment key={key}>{content}</React.Fragment>
}

function resolveLinkPropsFromNode(node: LexicalNode): {
  href?: string | null
  link?: CmsLinkDataLike | null
  newTab?: boolean
} {
  const fields = node.fields
  if (fields) {
    const rel = fields.doc?.relationTo
    if (
      fields.linkType === 'internal' &&
      fields.doc &&
      typeof fields.doc === 'object' &&
      (rel === 'services' || rel === 'projects')
    ) {
      return {
        link: {
          type: 'internal',
          reference: {
            relationTo: rel,
            value: fields.doc.value as number | string | { slug?: string | null },
          },
          newTab: Boolean(fields.newTab),
        },
        newTab: Boolean(fields.newTab),
      }
    }
    return {
      href: fields.url ?? node.url ?? null,
      newTab: Boolean(fields.newTab ?? node.newTab),
    }
  }
  return {
    href: node.url ?? null,
    newTab: Boolean(node.newTab),
  }
}

export interface RichTextRendererProps {
  content: unknown
  locale?: SupportedLocale
  className?: string
  paragraphTypographyClass?: 't-body-l' | 't-body-m'
}

/**
 * Safe Lexical AST -> React JSX renderer (`docs/03-security.md` §I3).
 * Never uses `dangerouslySetInnerHTML`. Supports headings (`h2`–`h4`), paragraphs,
 * bold/italic/underline/code text, ordered/unordered lists, blockquotes, links validated
 * through `<CmsLink>`, and uploaded `media` images rendered via `<CspSafeImage>`.
 */
export function RichTextRenderer({
  content,
  locale,
  className,
  paragraphTypographyClass = 't-body-m',
}: RichTextRendererProps): JSX.Element | null {
  if (!content || typeof content !== 'object') {
    return null
  }
  const root = (content as LexicalSerializedState).root
  if (!root || !Array.isArray(root.children) || root.children.length === 0) {
    return null
  }

  const renderNode = (node: LexicalNode | null | undefined, keyPrefix: string): ReactNode => {
    if (!node || typeof node !== 'object') {
      return null
    }

    const nodeType = node.type ?? ''

    if (nodeType === 'text') {
      const text = typeof node.text === 'string' ? node.text : ''
      if (!text) return null
      const formatMask = typeof node.format === 'number' ? node.format : 0
      return renderFormattedText(text, formatMask, keyPrefix)
    }

    if (nodeType === 'linebreak') {
      return <br key={keyPrefix} />
    }

    if (nodeType === 'horizontalrule') {
      return <hr key={keyPrefix} className={styles.divider} />
    }

    const children = Array.isArray(node.children)
      ? node.children.map((child, idx) => renderNode(child, `${keyPrefix}-${String(idx)}`))
      : null

    if (nodeType === 'link' || nodeType === 'autolink') {
      const linkProps = resolveLinkPropsFromNode(node)
      return (
        <CmsLink
          key={keyPrefix}
          href={linkProps.href}
          link={linkProps.link}
          locale={locale}
          newTab={linkProps.newTab}
          className={styles.link}
        >
          {children}
        </CmsLink>
      )
    }

    if (nodeType === 'heading') {
      const tag = node.tag === 'h2' || node.tag === 'h3' || node.tag === 'h4' ? node.tag : 'h3'
      if (tag === 'h2') {
        return (
          <h2 key={keyPrefix} className={`${styles.headingH2} t-h2`}>
            {children}
          </h2>
        )
      }
      if (tag === 'h4') {
        return (
          <h4 key={keyPrefix} className={`${styles.headingH4} t-h4`}>
            {children}
          </h4>
        )
      }
      return (
        <h3 key={keyPrefix} className={`${styles.headingH3} t-h3`}>
          {children}
        </h3>
      )
    }

    if (nodeType === 'paragraph') {
      if (
        collectNodeText(node).trim().length === 0 &&
        (!node.children || node.children.length === 0)
      ) {
        return null
      }
      return (
        <p key={keyPrefix} className={`${styles.paragraph} ${paragraphTypographyClass}`}>
          {children}
        </p>
      )
    }

    if (nodeType === 'list') {
      const isOrdered = node.listType === 'number' || node.tag === 'ol'
      const ListTag = isOrdered ? 'ol' : 'ul'
      return (
        <ListTag key={keyPrefix} className={styles.list}>
          {children}
        </ListTag>
      )
    }

    if (nodeType === 'listitem') {
      return (
        <li key={keyPrefix} className={`${styles.listItem} ${paragraphTypographyClass}`}>
          {children}
        </li>
      )
    }

    if (nodeType === 'quote') {
      return (
        <blockquote key={keyPrefix} className={`${styles.quote} t-body-quote`}>
          {children}
        </blockquote>
      )
    }

    if (nodeType === 'upload') {
      const mediaDoc =
        node.value && typeof node.value === 'object' ? (node.value as Media) : undefined
      const display = extractMediaDisplay(mediaDoc, '', 1160, 650)
      if (!display) {
        return null
      }
      return (
        <figure key={keyPrefix} className={styles.figure}>
          <div className={styles.imageWrap}>
            <CspSafeImage
              src={display.url}
              alt={display.alt}
              width={display.width}
              height={display.height}
              sizes="(min-width: 1280px) 760px, 100vw"
              loading="lazy"
              className={styles.uploadImage}
            />
          </div>
          {display.alt ? (
            <figcaption className={`${styles.figcaption} t-caption`}>{display.alt}</figcaption>
          ) : null}
        </figure>
      )
    }

    if (children) {
      return <React.Fragment key={keyPrefix}>{children}</React.Fragment>
    }

    return null
  }

  const renderedBlocks = root.children
    .map((child, idx) => renderNode(child, `rt-${String(idx)}`))
    .filter((item) => item !== null && item !== undefined)

  if (renderedBlocks.length === 0) {
    return null
  }

  const wrapperClass = [styles.richText, className].filter(Boolean).join(' ')
  return <div className={wrapperClass}>{renderedBlocks}</div>
}
