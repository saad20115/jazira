import fs from 'node:fs'
import path from 'node:path'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  ApprovedMaterialsTable,
  type ApprovedMaterialRow,
} from './components/ApprovedMaterialsTable'
import { CtaBand } from './components/CtaBand'
import { PageHeader } from './components/PageHeader'
import {
  extractLexicalParagraphStrings,
  hasLexicalContent,
  RichTextRenderer,
} from './components/RichTextRenderer'
import { getDictionary } from './i18n'
import { buildMaterialsSeedPlan } from './seed/materials'

describe('P3-T6 — Services page, Service detail, shared PageHeader, and ApprovedMaterialsTable', () => {
  it('renders shared PageHeader with h1, subtitle, breadcrumbs (aria-current="page"), and wave SVG', () => {
    const dict = getDictionary('en')
    const html = renderToStaticMarkup(
      React.createElement(PageHeader, {
        title: 'Our Services',
        subtitle: 'Integrated engineering and contracting solutions.',
        backgroundImageSrc: '/images/seed/hero-project.jpg',
        breadcrumbAriaLabel: dict.a11y.breadcrumbNav,
        breadcrumbs: [
          { label: dict.nav.home, href: '/en' },
          { label: 'Our Services', href: '/en/services' },
          { label: 'MEP Contracting' },
        ],
        waveFill: 'surface',
      }),
    )

    expect(html).toContain('<h1')
    expect(html).toContain('Our Services')
    expect(html).toContain('Integrated engineering and contracting solutions.')
    expect(html).toContain(`aria-label="${dict.a11y.breadcrumbNav}"`)
    expect(html).toContain('href="/en"')
    expect(html).toContain('href="/en/services"')
    expect(html).toContain('aria-current="page">MEP Contracting</span>')
    expect(html).toContain('<svg')
  })

  it('verifies getMaterials sorts by itemNo (fixing D-04) and ApprovedMaterialsTable renders all 73 materials with WAI-ARIA tablist and semantic table', () => {
    const collectionsSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/lib/cms/collections.ts'),
      'utf8',
    )
    expect(collectionsSrc).toContain("collection: 'materials'")
    expect(collectionsSrc).toContain("sort: 'itemNo'")

    const plan = buildMaterialsSeedPlan()
    const brandMap = new Map(plan.brands.map((b, idx) => [b.name, { id: idx + 1, ...b }]))

    const rows: ApprovedMaterialRow[] = plan.materials
      .map((m) => ({
        id: m.itemNo,
        itemNo: m.itemNo,
        system: m.system,
        description: m.descriptionEn,
        brands: m.brandNames.map((bName, bIdx) => {
          const found = brandMap.get(bName)
          return {
            id: found?.id ?? `${String(m.itemNo)}-${String(bIdx)}`,
            name: bName,
            origin: found?.originEn ?? null,
          }
        }),
      }))
      .reverse() // Pass reversed to verify component sorts ascending by itemNo

    const dictEn = getDictionary('en')
    const htmlEn = renderToStaticMarkup(
      React.createElement(ApprovedMaterialsTable, {
        eyebrow: 'Approved list',
        title: 'Approved Materials & Brands',
        intro: 'Every material we install is sourced from an approved manufacturer.',
        materials: rows,
        dict: dictEn.services,
      }),
    )

    expect(htmlEn).toContain('role="tablist"')
    expect(htmlEn).toContain('role="tab"')
    expect(htmlEn).toContain('aria-selected="true"')
    expect(htmlEn).toContain(dictEn.services.materialsTableCaption)
    expect(htmlEn).toContain('<th scope="col"')
    expect(htmlEn).toContain(dictEn.services.colNumber)
    expect(htmlEn).toContain(dictEn.services.colMaterial)
    expect(htmlEn).toContain(dictEn.services.colBrand)
    expect(htmlEn).toContain(dictEn.services.colOrigin)
    expect(htmlEn).toContain('Showing 73 of 73 items')

    // Verify ascending itemNo order: 01 appears before 73 in the table body
    const idx01 = htmlEn.indexOf('>01<')
    const idx73 = htmlEn.lastIndexOf('>73<')
    expect(idx01).toBeGreaterThan(-1)
    expect(idx73).toBeGreaterThan(idx01)

    // Verify Arabic rendering
    const dictAr = getDictionary('ar')
    const htmlAr = renderToStaticMarkup(
      React.createElement(ApprovedMaterialsTable, {
        eyebrow: 'القائمة المعتمدة',
        title: 'المواد والعلامات التجارية المعتمدة',
        materials: rows.slice(0, 5),
        dict: dictAr.services,
      }),
    )
    expect(htmlAr).toContain(dictAr.services.tabAll)
    expect(htmlAr).toContain(dictAr.services.colMaterial)
  })

  it('renders Lexical AST via RichTextRenderer without dangerouslySetInnerHTML and sanitizes links via CmsLink', () => {
    const sampleAst = {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Scope of Engineering' }],
          },
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Full turnkey ' },
              { type: 'text', text: 'MEP delivery', format: 1 },
              { type: 'text', text: ' with ' },
              {
                type: 'link',
                fields: { url: 'https://example.com/spec', newTab: true },
                children: [{ type: 'text', text: 'technical specs' }],
              },
              { type: 'text', text: ' and ' },
              {
                type: 'link',
                fields: { url: 'javascript:alert(1)' },
                children: [{ type: 'text', text: 'unsafe link' }],
              },
            ],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Chilled water plants' }],
              },
            ],
          },
          {
            type: 'quote',
            children: [{ type: 'text', text: 'Precision in every system.' }],
          },
        ],
      },
    }

    expect(hasLexicalContent(sampleAst)).toBe(true)
    expect(extractLexicalParagraphStrings(sampleAst)).toHaveLength(4)

    const html = renderToStaticMarkup(
      React.createElement(RichTextRenderer, {
        content: sampleAst,
        locale: 'en',
      }),
    )

    expect(html).toContain('<h2')
    expect(html).toContain('Scope of Engineering')
    expect(html).toContain('<strong>MEP delivery</strong>')
    expect(html).toContain('href="https://example.com/spec"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('data-cms-link-fallback="plain-text">unsafe link</span>')
    expect(html).not.toContain('javascript:alert')
    expect(html).toContain('<ul')
    expect(html).toContain('Chilled water plants')
    expect(html).toContain('<blockquote')
  })

  it('renders CtaBand when enabled and returns null when disabled', () => {
    const enabledHtml = renderToStaticMarkup(
      React.createElement(CtaBand, {
        locale: 'en',
        cta: {
          enabled: true,
          title: 'Request a Quote',
          titleAccent: 'From Our Engineers',
          text: 'Share your drawings or BOQ.',
          button: {
            label: 'Request a Quote',
            link: {
              type: 'internal',
              internalRoute: 'contact',
            },
          },
        },
      }),
    )
    expect(enabledHtml).toContain('Request a Quote')
    expect(enabledHtml).toContain('From Our Engineers')

    const disabledHtml = renderToStaticMarkup(
      React.createElement(CtaBand, {
        locale: 'en',
        cta: {
          enabled: false,
          title: 'Hidden CTA',
        },
      }),
    )
    expect(disabledHtml).toBe('')
  })
})
