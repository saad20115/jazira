import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

import { runLighthouseAudit } from './run-lighthouse.mjs'

/**
 * Self-contained machine-captured evidence generator for `P3-T4`
 * ("Home page + intro splash", `handoff/tasks/P3-T4.md`, `R-17`..`R-27`).
 *
 * Usage:
 *   node scripts/evidence/p3-t4-evidence.mjs [baseUrl] [evidenceDir] [phase3Dir]
 */

function getRepoHeaderBlock() {
  const cwd = process.cwd()
  let head = 'unknown'
  try {
    head = execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim()
  } catch {
    // ignore
  }
  return [`$ pwd`, cwd, `$ git rev-parse HEAD`, head, ''].join('\n')
}

function makeLexical(paragraphs, direction = 'ltr') {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction,
        children: [
          { type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 },
        ],
      })),
    },
  }
}

async function saveCompressedPng(inputBuffer, outPath, maxWidth = 1440) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(inputBuffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 85 })
    .toFile(outPath)
}

async function createSideBySideImage(buffers, outPath) {
  const metas = await Promise.all(buffers.map((b) => sharp(b).metadata()))
  const gap = 24
  const pad = 24
  const widths = metas.map((m) => m.width ?? 400)
  const heights = metas.map((m) => m.height ?? 300)
  const totalW = pad * 2 + widths.reduce((a, b) => a + b, 0) + gap * (buffers.length - 1)
  const totalH = pad * 2 + Math.max(...heights)

  let left = pad
  const composites = buffers.map((input, idx) => {
    const item = { input, left, top: pad }
    left += (widths[idx] ?? 400) + gap
    return item
  })

  const rawCompositeBuffer = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 246, g: 248, b: 251, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer()

  await saveCompressedPng(rawCompositeBuffer, outPath, 1440)
}

async function ensureAdminAuthToken(baseUrl) {
  const email = process.env.EVIDENCE_ADMIN_EMAIL || 'admin@aljazira.local'
  const password = process.env.EVIDENCE_ADMIN_PASSWORD || 'Passw0rd!StrongAdmin2026'

  const loginRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (loginRes.ok) {
    const json = await loginRes.json()
    if (json.token) return json.token
  }

  // First-register if no user exists yet
  const regRes = await fetch(`${baseUrl}/api/users/first-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Admin' }),
  })
  if (regRes.ok) {
    const json = await regRes.json()
    if (json.token) return json.token
  }

  const retryRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!retryRes.ok) {
    throw new Error(`Failed to authenticate admin user (${retryRes.status})`)
  }
  const retryJson = await retryRes.json()
  return retryJson.token
}

async function apiRequest(baseUrl, token, endpoint, { method = 'GET', body, locale } = {}) {
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = locale
    ? `${baseUrl}${endpoint}${sep}locale=${locale}&depth=0`
    : `${baseUrl}${endpoint}`
  const headers = {
    Authorization: `JWT ${token}`,
  }
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${method} ${url} failed (${res.status}): ${errText.slice(0, 400)}`)
  }
  return res.json()
}

async function ensureMediaUploaded(baseUrl, token, filePath, altEn, altAr) {
  const filename = path.basename(filePath)
  const existing = await apiRequest(
    baseUrl,
    token,
    `/api/media?where[filename][equals]=${encodeURIComponent(filename)}&limit=1`,
  )
  if (existing.docs && existing.docs.length > 0) {
    return existing.docs[0].id
  }

  const fileBuffer = fs.readFileSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const form = new FormData()
  form.append('file', new Blob([fileBuffer], { type: mimeType }), filename)
  form.append('_payload', JSON.stringify({ alt: altAr }))

  const created = await apiRequest(baseUrl, token, '/api/media?locale=ar', {
    method: 'POST',
    body: form,
  })
  const docId = created.doc.id
  await apiRequest(baseUrl, token, `/api/media/${docId}`, {
    method: 'PATCH',
    locale: 'en',
    body: { alt: altEn },
  })
  return docId
}

async function seedHomePageData(baseUrl, token, { skipBrands = false } = {}) {
  const imagesDir = path.resolve(process.cwd(), 'design/assets/images')
  const mediaFiles = [
    ['hero-city.png', 'Riyadh skyline at dusk', 'أفق الرياض عند الغسق'],
    ['about-team.png', 'Al Jazira engineering team', 'الفريق الهندسي لشركة الجزيرة'],
    [
      'tower-render.png',
      '3D Building Systems Overview',
      'نظرة عامة على أنظمة المبنى ثلاثية الأبعاد',
    ],
    ['proj-tower.png', 'Stella Hotel (32 Floors)', 'فندق ستيلا (32 طابقاً)'],
    ['svc-smart.png', 'Smart Systems & Low Current', 'الأنظمة الذكية والتيار الخفيف'],
    ['svc-mep.png', 'MEP Works & Infrastructure', 'الأعمال الكهروميكانيكية والبنية التحتية'],
    ['svc-fire.png', 'Fire Fighting & Fire Alarm', 'أنظمة مكافحة الحريق والإنذار المبكر'],
    ['bg-pipes.png', 'MEP Piping & Plant Room', 'شبكات الأنابيب وغرف الماكينات'],
    ['header-office.png', 'Al Jazira Head Office', 'المقر الرئيسي لشركة الجزيرة'],
  ]

  const mediaIds = {}
  for (const [file, altEn, altAr] of mediaFiles) {
    const fullPath = path.join(imagesDir, file)
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing required design image: ${fullPath}`)
    }
    mediaIds[file] = await ensureMediaUploaded(baseUrl, token, fullPath, altEn, altAr)
  }

  // 1. Seed Stats (4 items matching design/copy/01-home.md `18:285` & `17:222`)
  const statsSpec = [
    { order: 1, value: '45+', labelEn: 'Years of Experience', labelAr: 'عاماً من الخبرة' },
    { order: 2, value: '100+', labelEn: 'Completed Projects', labelAr: 'مشروعاً منجزاً' },
    { order: 3, value: '85%', labelEn: 'Self-Performed Work', labelAr: 'أعمال منفذة ذاتياً' },
    { order: 4, value: '21+', labelEn: 'MEP Disciplines', labelAr: 'تخصصاً كهروميكانيكياً' },
  ]
  const statIds = []
  const existingStats = await apiRequest(baseUrl, token, '/api/stats?limit=20&sort=order')
  for (const item of statsSpec) {
    const found = (existingStats.docs || []).find((d) => d.order === item.order)
    if (found) {
      await apiRequest(baseUrl, token, `/api/stats/${found.id}`, {
        method: 'PATCH',
        locale: 'ar',
        body: { value: item.value, label: item.labelAr, order: item.order },
      })
      await apiRequest(baseUrl, token, `/api/stats/${found.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: { value: item.value, label: item.labelEn, order: item.order },
      })
      statIds.push(found.id)
    } else {
      const created = await apiRequest(baseUrl, token, '/api/stats', {
        method: 'POST',
        locale: 'ar',
        body: { value: item.value, label: item.labelAr, order: item.order },
      })
      await apiRequest(baseUrl, token, `/api/stats/${created.doc.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: { label: item.labelEn },
      })
      statIds.push(created.doc.id)
    }
  }

  // 2. Seed 8 Main Services (`design/copy/01-home.md` `17:254`, tile 1 featured = gold, tiles 2..8 = white)
  const servicesSpec = [
    {
      order: 1,
      slug: 'hvac-ventilation-refrigeration',
      icon: 'hvac',
      featured: true,
      image: 'svc-mep.png',
      titleEn: 'HVAC, Ventilation & Refrigeration',
      shortEn:
        'Chilled water & VRF systems, ventilation, smoke management, staircase pressurization, cold rooms and central refrigeration.',
      titleAr: 'التكييف والتهوية والتبريد',
      shortAr:
        'أنظمة المياه المبردة وVRF، التهوية، إدارة الدخان، تضغيط السلالم، غرف التبريد والتبريد المركزي.',
    },
    {
      order: 2,
      slug: 'fire-fighting-fire-alarm',
      icon: 'fire',
      featured: false,
      image: 'svc-fire.png',
      titleEn: 'Fire Fighting & Fire Alarm',
      shortEn:
        'Fire pumps, sprinklers and hose systems, clean-agent suppression, fire detection & alarm, and fire stopping.',
      titleAr: 'مكافحة الحريق والإنذار المبكر',
      shortAr:
        'مضخات الحريق، شبكات الرش الآلي وصناديق الإطفاء، الإطفاء بالغازات النظيفة، وأنظمة الكشف والإنذار المبكر.',
    },
    {
      order: 3,
      slug: 'plumbing-water-drainage',
      icon: 'plumbing',
      featured: false,
      image: 'svc-mep.png',
      titleEn: 'Plumbing, Water & Drainage',
      shortEn:
        'Water supply and booster sets, tanks, drainage and exhaust networks, and complete sanitary installations.',
      titleAr: 'السباكة والمياه والصرف الصحي',
      shortAr:
        'شبكات تغذية المياه ومضخات الرفع، الخزانات، شبكات الصرف والتهوية، وكافة التركيبات الصحية المتكاملة.',
    },
    {
      order: 4,
      slug: 'electrical-power-distribution',
      icon: 'electrical',
      featured: false,
      image: 'svc-mep.png',
      titleEn: 'Electrical & Power Distribution',
      shortEn:
        'Power distribution, small power and MV systems, lighting and cable networks — from main panel to final outlet.',
      titleAr: 'الكهرباء وتوزيع الطاقة',
      shortAr:
        'توزيع القوى الكهربائية، أنظمة الجهد المتوسط والمنخفض، شبكات الإنارة والكابلات — من اللوحة الرئيسية حتى المخرج النهائي.',
    },
    {
      order: 5,
      slug: 'smart-systems-elv-security',
      icon: 'smart',
      featured: false,
      image: 'svc-smart.png',
      titleEn: 'Smart Systems, ELV & Security',
      shortEn:
        'Structured cabling, data centers & NOC rooms, CCTV, access control, sound & AV, queue management and BMS.',
      titleAr: 'الأنظمة الذكية والتيار الخفيف والأمن',
      shortAr:
        'الشبكات الهيكلية، مراكز البيانات وغرف التحكم، كاميرات المراقبة، التحكم في الدخول، الأنظمة الصوتية والمرئية وBMS.',
    },
    {
      order: 6,
      slug: 'general-contracting',
      icon: 'contracting',
      featured: false,
      image: 'proj-tower.png',
      titleEn: 'General Contracting',
      shortEn:
        'New construction, project management from design to delivery, and upgrading of existing buildings.',
      titleAr: 'المقاولات العامة',
      shortAr:
        'الإنشاءات الجديدة، إدارة المشاريع من التصميم حتى التسليم، وتطوير وتأهيل المباني القائمة.',
    },
    {
      order: 7,
      slug: 'mep-equipment-supply',
      icon: 'supply',
      featured: false,
      image: 'svc-mep.png',
      titleEn: 'MEP Equipment Supply',
      shortEn:
        'Genuine equipment from our partner brands, with brand pricing, submittals and delivery to site.',
      titleAr: 'توريد المعدات الكهروميكانيكية',
      shortAr:
        'معدات أصلية من العلامات التجارية الشريكة لنا، مع التسعير المعتمد والاعتمادات الفنية والتوريد للموقع.',
    },
    {
      order: 8,
      slug: 'testing-commissioning-maintenance',
      icon: 'testing',
      featured: false,
      image: 'svc-mep.png',
      titleEn: 'Testing, Commissioning & Maintenance',
      shortEn:
        'Testing, adjusting & balancing, commissioning and handover — plus planned maintenance and upgrades.',
      titleAr: 'الفحص والتشغيل والصيانة',
      shortAr:
        'أعمال الفحص والضبط والموازنة (TAB)، التشغيل التجريبي والتسليم — بالإضافة إلى الصيانة الدورية والتحديثات.',
    },
  ]

  const existingServices = await apiRequest(baseUrl, token, '/api/services?limit=50')
  for (const svc of servicesSpec) {
    const heroImageId = mediaIds[svc.image]
    const found = (existingServices.docs || []).find((d) => d.slug === svc.slug)
    const arBody = {
      title: svc.titleAr,
      slug: svc.slug,
      tier: 'main',
      order: svc.order,
      featured: svc.featured,
      icon: svc.icon,
      shortDescription: svc.shortAr,
      image: heroImageId,
      _status: 'published',
    }
    const enBody = {
      title: svc.titleEn,
      shortDescription: svc.shortEn,
      _status: 'published',
    }
    if (found) {
      await apiRequest(baseUrl, token, `/api/services/${found.id}`, {
        method: 'PATCH',
        locale: 'ar',
        body: arBody,
      })
      await apiRequest(baseUrl, token, `/api/services/${found.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: enBody,
      })
    } else {
      const created = await apiRequest(baseUrl, token, '/api/services', {
        method: 'POST',
        locale: 'ar',
        body: arBody,
      })
      await apiRequest(baseUrl, token, `/api/services/${created.doc.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: enBody,
      })
    }
  }

  // 3. Seed 6 Featured Projects (`design/context/01-home/06-featured-projects.md` `18:308`)
  const projectsSpec = [
    {
      order: 1,
      slug: 'princess-noura-university-pnu',
      category: 'low-current',
      scope: ['low-current', 'hvac'],
      status: 'completed',
      image: 'svc-smart.png',
      titleEn: 'Princess Noura University (PNU)',
      locationEn: 'Riyadh, KSA',
      scopeSummaryEn: 'LOW CURRENT SCS',
      summaryEn:
        'Structured cabling and low-current smart systems across Princess Noura University campus in Riyadh.',
      titleAr: 'جامعة الأميرة نورة بنت عبدالرحمن',
      locationAr: 'الرياض، السعودية',
      scopeSummaryAr: 'أنظمة التيار الخفيف والشبكات',
      summaryAr:
        'تنفيذ شبكات التيار الخفيف والأنظمة الذكية والاتصالات في الحرم الجامعي لجامعة الأميرة نورة بالرياض.',
    },
    {
      order: 2,
      slug: 'sofitel-makkah-hotel',
      category: 'mep',
      scope: ['mep', 'hvac', 'fire-fighting', 'plumbing', 'electrical'],
      status: 'completed',
      image: 'about-team.png',
      titleEn: 'Sofitel Makkah Hotel',
      locationEn: 'Makkah, KSA',
      scopeSummaryEn: 'FULL MEP WORKS',
      summaryEn:
        'Complete mechanical, electrical, plumbing and firefighting works for Sofitel Makkah Hotel.',
      titleAr: 'فندق سوفيتيل مكة',
      locationAr: 'مكة المكرمة، السعودية',
      scopeSummaryAr: 'أعمال كهروميكانيكية متكاملة',
      summaryAr:
        'تنفيذ متكامل للأعمال الميكانيكية والكهربائية والصحية وأنظمة مكافحة الحريق لفندق سوفيتيل مكة.',
    },
    {
      order: 3,
      slug: 'stella-hotel-32-floors',
      category: 'mep',
      scope: ['mep', 'hvac', 'fire-fighting', 'plumbing', 'electrical'],
      status: 'in-progress',
      image: 'proj-tower.png',
      titleEn: 'Stella Hotel (32 Floors)',
      locationEn: 'Dubai, UAE',
      scopeSummaryEn: 'FULL MEP WORKS',
      summaryEn: 'Full-scope electromechanical package for a 32-storey luxury hospitality tower.',
      titleAr: 'فندق ستيلا (32 طابقاً)',
      locationAr: 'دبي، الإمارات',
      scopeSummaryAr: 'أعمال كهروميكانيكية متكاملة',
      summaryAr: 'حزمة الأعمال الكهروميكانيكية المتكاملة لبرج فندقي فاخر مكون من 32 طابقاً.',
    },
    {
      order: 4,
      slug: 'roads-transport-authority-rta',
      category: 'data-center',
      scope: ['data-center', 'low-current', 'electrical', 'hvac'],
      status: 'completed',
      image: 'svc-smart.png',
      titleEn: 'Roads & Transport Authority (RTA)',
      locationEn: 'Dubai, UAE',
      scopeSummaryEn: 'DATA CENTER MEP',
      summaryEn:
        'Mission-critical data center MEP, precision cooling, power distribution and structured cabling.',
      titleAr: 'هيئة الطرق والمواصلات (RTA)',
      locationAr: 'دبي، الإمارات',
      scopeSummaryAr: 'تجهيز مراكز البيانات',
      summaryAr:
        'تجهيز البنية التحتية الكهروميكانيكية لمراكز البيانات والتبريد الدقيق وتوزيع الطاقة.',
    },
    {
      order: 5,
      slug: 'king-salman-oasis-of-science',
      category: 'mep',
      scope: ['mep', 'hvac', 'fire-fighting', 'plumbing', 'electrical'],
      status: 'completed',
      image: 'svc-mep.png',
      titleEn: 'King Salman Oasis of Science',
      locationEn: 'Riyadh, KSA',
      scopeSummaryEn: 'FULL MEP WORKS',
      summaryEn:
        'Comprehensive MEP systems and smart building controls for King Salman Oasis of Science in Riyadh.',
      titleAr: 'واحة الملك سلمان للعلوم',
      locationAr: 'الرياض، السعودية',
      scopeSummaryAr: 'أعمال كهروميكانيكية متكاملة',
      summaryAr:
        'تنفيذ الأنظمة الكهروميكانيكية الشاملة وأنظمة التحكم الذكي لواحة الملك سلمان للعلوم بالرياض.',
    },
    {
      order: 6,
      slug: 'al-maqam-towers-makkah',
      category: 'mep',
      scope: ['mep', 'hvac', 'fire-fighting', 'plumbing', 'electrical'],
      status: 'completed',
      image: 'about-team.png',
      titleEn: 'Al Maqam Towers (A, B, C, D)',
      locationEn: 'Makkah, KSA',
      scopeSummaryEn: 'FULL MEP WORKS',
      summaryEn:
        'Full MEP construction and life-safety systems across four high-rise towers in Makkah.',
      titleAr: 'أبراج المقام (A, B, C, D)',
      locationAr: 'مكة المكرمة، السعودية',
      scopeSummaryAr: 'أعمال كهروميكانيكية متكاملة',
      summaryAr:
        'تنفيذ كامل للأعمال الكهروميكانيكية وأنظمة السلامة في أربعة أبراج عالية بمكة المكرمة.',
    },
  ]

  const existingProjects = await apiRequest(baseUrl, token, '/api/projects?limit=50')
  for (const proj of projectsSpec) {
    const coverImageId = mediaIds[proj.image]
    const found = (existingProjects.docs || []).find((d) => d.slug === proj.slug)
    const arBody = {
      title: proj.titleAr,
      slug: proj.slug,
      summary: proj.summaryAr,
      location: proj.locationAr,
      category: proj.category,
      scopeSummary: proj.scopeSummaryAr,
      scope: proj.scope,
      status: proj.status,
      featured: true,
      order: proj.order,
      coverImage: coverImageId,
      _status: 'published',
    }
    const enBody = {
      title: proj.titleEn,
      summary: proj.summaryEn,
      location: proj.locationEn,
      scopeSummary: proj.scopeSummaryEn,
      _status: 'published',
    }
    if (found) {
      await apiRequest(baseUrl, token, `/api/projects/${found.id}`, {
        method: 'PATCH',
        locale: 'ar',
        body: arBody,
      })
      await apiRequest(baseUrl, token, `/api/projects/${found.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: enBody,
      })
    } else {
      const created = await apiRequest(baseUrl, token, '/api/projects', {
        method: 'POST',
        locale: 'ar',
        body: arBody,
      })
      await apiRequest(baseUrl, token, `/api/projects/${created.doc.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: enBody,
      })
    }
  }

  // 4. Seed 20 Marquee Brands (`design/context/01-home/07-trusted-partners.md` `18:579`, wordmark + origin)
  const brandsSpec = [
    ['Alfanar', 'Saudi Arabia', 'المملكة العربية السعودية'],
    ['Legrand', 'France', 'فرنسا'],
    ['Belden', 'USA', 'الولايات المتحدة'],
    ['CommScope', 'USA', 'الولايات المتحدة'],
    ['Tridonic', 'Austria', 'النمسا'],
    ['Eaton Cooper', 'USA', 'الولايات المتحدة'],
    ['Tyco', 'USA', 'الولايات المتحدة'],
    ['Grohe', 'Germany', 'ألمانيا'],
    ['Ariston', 'Italy', 'إيطاليا'],
    ['Watts', 'USA', 'الولايات المتحدة'],
    ['Zamil', 'Saudi Arabia', 'المملكة العربية السعودية'],
    ['SKM', 'UAE', 'الإمارات العربية المتحدة'],
    ['Systemair', 'Sweden', 'السويد'],
    ['Hempel', 'Denmark', 'الدنمارك'],
    ['Jazeera Paints', 'Saudi Arabia', 'المملكة العربية السعودية'],
    ['Saudi Ceramics', 'Saudi Arabia', 'المملكة العربية السعودية'],
    ['Tahweel', 'Saudi Arabia', 'المملكة العربية السعودية'],
    ['Bahra Cables', 'Saudi Arabia', 'المملكة العربية السعودية'],
    ['Al Rajhi Steel', 'Saudi Arabia', 'المملكة العربية السعودية'],
    ['Obeikan Glass', 'Saudi Arabia', 'المملكة العربية السعودية'],
  ]
  if (!skipBrands) {
    const existingBrands = await apiRequest(baseUrl, token, '/api/brands?limit=50')
    for (let i = 0; i < brandsSpec.length; i++) {
      const [name, originEn, originAr] = brandsSpec[i]
      const order = i + 1
      const found = (existingBrands.docs || []).find((d) => d.name === name)
      if (found) {
        await apiRequest(baseUrl, token, `/api/brands/${found.id}`, {
          method: 'PATCH',
          locale: 'ar',
          body: { name, origin: originAr, logo: null, showInMarquee: true, order },
        })
        await apiRequest(baseUrl, token, `/api/brands/${found.id}`, {
          method: 'PATCH',
          locale: 'en',
          body: { name, origin: originEn, logo: null, showInMarquee: true, order },
        })
      } else {
        const created = await apiRequest(baseUrl, token, '/api/brands', {
          method: 'POST',
          locale: 'ar',
          body: { name, origin: originAr, logo: null, showInMarquee: true, order },
        })
        await apiRequest(baseUrl, token, `/api/brands/${created.doc.id}`, {
          method: 'PATCH',
          locale: 'en',
          body: { name, origin: originEn },
        })
      }
    }
  }

  // 5. Seed site-settings & navigation globals (`design/copy/01-home.md` & `overlays-and-intro.md`)
  await apiRequest(baseUrl, token, '/api/globals/site-settings', {
    method: 'POST',
    locale: 'ar',
    body: {
      companyName: 'شركة الجزيرة للإمداد الذكي',
      tagline: 'مقاولات الأعمال الكهروميكانيكية · مكافحة الحريق · الأنظمة الذكية',
      footerText:
        'شركة رائدة في مقاولات الأعمال الكهروميكانيكية في منطقة الخليج، نقدم حلولاً عالمية المستوى في الأنظمة الميكانيكية والكهربائية والصحية بخبرة تمتد لأكثر من 45 عاماً.',
      phone: '+966 57 353 4185',
      email: 'info@aljazira.co',
      whatsapp: '966573534185',
      whatsappLabel: 'تواصل معنا عبر واتساب',
      address: '7676 بطحاء قريش، مكة المكرمة، المملكة العربية السعودية',
      copyright: '© 2026 شركة الجزيرة للإمداد الذكي. جميع الحقوق محفوظة.',
      defaultSeo: {
        title: 'شركة الجزيرة للإمداد الذكي — المقاولات الكهروميكانيكية والأنظمة الذكية',
        description:
          'مقاولات متكاملة للأعمال الكهروميكانيكية ومكافحة الحريق والتيار الخفيف والبنية التحتية الذكية في المملكة العربية السعودية والخليج.',
        image: mediaIds['hero-city.png'],
      },
    },
  })
  await apiRequest(baseUrl, token, '/api/globals/site-settings', {
    method: 'POST',
    locale: 'en',
    body: {
      companyName: 'Al Jazira for Imdad Smart Co.',
      tagline: 'MEP CONTRACTING · FIREFIGHTING · SMART SYSTEMS',
      footerText:
        'A leading MEP construction company in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over 45 years of experience.',
      whatsappLabel: 'Chat with us on WhatsApp',
      address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
      copyright: '© 2026 Al Jazira for Imdad Smart Company. All rights reserved.',
      defaultSeo: {
        title: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering Contractors',
        description:
          'Full-scope electromechanical, firefighting, low-current and smart infrastructure contracting across Saudi Arabia and the Gulf region.',
        image: mediaIds['hero-city.png'],
      },
    },
  })

  const savedNavAr = await apiRequest(baseUrl, token, '/api/globals/navigation', {
    method: 'POST',
    locale: 'ar',
    body: {
      header: [
        { label: 'خدماتنا', link: { type: 'internal', internalRoute: '/services' } },
        { label: 'من نحن', link: { type: 'internal', internalRoute: '/about' } },
        { label: 'مشاريعنا', link: { type: 'internal', internalRoute: '/projects' } },
        { label: 'تواصل معنا', link: { type: 'internal', internalRoute: '/contact' } },
      ],
      headerCta: {
        label: 'اطلب عرض سعر',
        link: { type: 'internal', internalRoute: '/contact' },
      },
      footer: [
        {
          title: 'روابط سريعة',
          links: [
            { label: 'الرئيسية', link: { type: 'internal', internalRoute: '/' } },
            { label: 'خدماتنا', link: { type: 'internal', internalRoute: '/services' } },
            { label: 'من نحن', link: { type: 'internal', internalRoute: '/about' } },
            { label: 'مشاريعنا', link: { type: 'internal', internalRoute: '/projects' } },
            { label: 'تواصل معنا', link: { type: 'internal', internalRoute: '/contact' } },
          ],
        },
      ],
      footerCta: {
        title: 'هل لديك مشروع قادم؟',
        text: 'أرسل لنا المخططات أو جداول الكميات (BOQ) وسيتواصل معك مهندسونا خلال يوم عمل واحد.',
        button: {
          label: 'اطلب عرض سعر',
          link: { type: 'internal', internalRoute: '/contact' },
        },
        whatsappLabel: 'تحدث عبر واتساب',
      },
    },
  })
  const navHeaderList = savedNavAr?.result?.header || savedNavAr?.header || []
  const navFooterCol0 = (savedNavAr?.result?.footer || savedNavAr?.footer || [])[0]
  const navFooterLinks = navFooterCol0?.links || []

  await apiRequest(baseUrl, token, '/api/globals/navigation', {
    method: 'POST',
    locale: 'en',
    body: {
      header: [
        {
          id: navHeaderList[0]?.id,
          label: 'Services',
          link: { type: 'internal', internalRoute: '/services' },
        },
        {
          id: navHeaderList[1]?.id,
          label: 'About Us',
          link: { type: 'internal', internalRoute: '/about' },
        },
        {
          id: navHeaderList[2]?.id,
          label: 'Projects',
          link: { type: 'internal', internalRoute: '/projects' },
        },
        {
          id: navHeaderList[3]?.id,
          label: 'Contact Us',
          link: { type: 'internal', internalRoute: '/contact' },
        },
      ],
      headerCta: {
        label: 'Get a Quote',
        link: { type: 'internal', internalRoute: '/contact' },
      },
      footer: [
        {
          id: navFooterCol0?.id,
          title: 'Quick Links',
          links: [
            {
              id: navFooterLinks[0]?.id,
              label: 'Home',
              link: { type: 'internal', internalRoute: '/' },
            },
            {
              id: navFooterLinks[1]?.id,
              label: 'Services',
              link: { type: 'internal', internalRoute: '/services' },
            },
            {
              id: navFooterLinks[2]?.id,
              label: 'About Us',
              link: { type: 'internal', internalRoute: '/about' },
            },
            {
              id: navFooterLinks[3]?.id,
              label: 'Projects',
              link: { type: 'internal', internalRoute: '/projects' },
            },
            {
              id: navFooterLinks[4]?.id,
              label: 'Contact Us',
              link: { type: 'internal', internalRoute: '/contact' },
            },
          ],
        },
      ],
      footerCta: {
        title: 'Have a project in mind?',
        text: 'Send us your drawings or BOQ and our engineers will get back to you within one working day.',
        button: {
          label: 'Get a Quote',
          link: { type: 'internal', internalRoute: '/contact' },
        },
        whatsappLabel: 'Chat on WhatsApp',
      },
    },
  })

  // 6. Seed home-page global in ar and en (`design/copy/01-home.md`, R-2 title+titleAccent, R-7 statsSection.backgroundImage)
  const homeAr = {
    _status: 'published',
    hero: {
      enabled: true,
      eyebrow: '+45 عاماً من التميز الهندسي',
      title: 'نبني المستقبل',
      titleAccent: 'بحلول هندسية ذكية',
      subtitle:
        'شركة الجزيرة للإمداد الذكي هي مقاول رائد للأعمال الكهروميكانيكية في منطقة الخليج، تقدم حلولاً عالمية المستوى في الأنظمة الميكانيكية والكهربائية والصحية بخبرة تمتد لأكثر من أربعة عقود.',
      background: mediaIds['hero-city.png'],
      primaryCta: {
        label: 'استكشف خدماتنا',
        link: { type: 'internal', internalRoute: '/services' },
      },
      secondaryCta: {
        label: 'استعرض المشاريع',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    whoWeAre: {
      enabled: true,
      badgeStat: statIds[0],
      eyebrow: 'من نحن',
      title: 'التميز الهندسي منذ عام 1979',
      text: makeLexical(
        [
          'بخبرة تقارب خمسة عقود في أسواق الخليج، توسعت شركة الجزيرة للإمداد الذكي ونمت بخطى ثابتة، محققة أداءً استثنائياً ومكانة مرموقة كمقاول متخصص وموثوق للأعمال الكهروميكانيكية.',
          'ننفذ حزم الأعمال الكهروميكانيكية الشاملة عبر مهندسينا وفنيينا الداخليين، مما يقلل الاعتماد على مقاولي الباطن ويضمن أعلى مستويات الجودة والخدمة والتسليم في الموعد المحدد.',
        ],
        'rtl',
      ),
      button: {
        label: 'تعرف علينا أكثر',
        link: { type: 'internal', internalRoute: '/about' },
      },
      image: mediaIds['about-team.png'],
    },
    coreServices: {
      enabled: true,
      eyebrow: 'ماذا نقدم',
      title: 'خدمات كهروميكانيكية وإنشائية متكاملة تحت عقد واحد',
      intro:
        'من تنسيق التصميم إلى الفحص والتشغيل التجريبي، يتم تنفيذ نحو 85% من كل حزمة كهروميكانيكية بواسطة مهندسينا وفنيينا — تقليل التداخلات، خفض المخاطر، وتسريع التسليم.',
      button: {
        label: 'عرض جميع الخدمات',
        link: { type: 'internal', internalRoute: '/services' },
      },
    },
    interactiveSystems: {
      enabled: true,
      eyebrow: 'تفاعلي',
      title: 'كل نظام، فريق واحد مسؤول',
      intro:
        'اختر أي نظام لترى كيف نقوم بتصميمه وتركيبه وفحصه وتشغيله، من المبردات على السطح إلى مضخات الحريق في الطابق الأرضي.',
      heroImage: mediaIds['tower-render.png'],
      liveModelLabel: 'افتح النموذج ثلاثي الأبعاد المباشر',
      relatedProjectsLabel: 'مشاريع ذات صلة',
      systems: [
        {
          title: 'التكييف والمياه المبردة (HVAC)',
          text: 'المبردات (Chillers)، وحدات مناولة الهواء (AHUs)، وحدات ملف ومروحة (FCUs)، أنظمة VRF، مجاري الهواء، سحب الدخان، تضغيط السلالم وغرف التبريد — مع الفحص والضبط والموازنة (TAB) قبل التسليم.',
          shot: 'hvac',
          disciplines: ['hvac'],
        },
        {
          title: 'مكافحة الحريق والإنذار المبكر',
          text: 'مضخات الحريق، أنظمة الرش الآلي وصناديق الإطفاء، الإطفاء بالغازات النظيفة، وأنظمة الكشف والإنذار المبكر — وفق اشتراطات NFPA والدفاع المدني.',
          shot: 'fire',
          disciplines: ['fire-fighting'],
        },
        {
          title: 'السباكة والصرف وتغذية المياه',
          text: 'مضخات الرفع، خزانات المياه، شبكات التغذية، شبكات الصرف والتهوية، وكافة التركيبات الصحية المتكاملة.',
          shot: 'plumbing',
          disciplines: ['plumbing'],
        },
        {
          title: 'توزيع الطاقة والإنارة',
          text: 'لوحات الجهد المتوسط والمنخفض (MV/LV)، قضبان التوزيع (Busways)، القوى الكهربائية، الإنارة، وتوزيع مولدات الطوارئ.',
          shot: 'power',
          disciplines: ['electrical'],
        },
        {
          title: 'الأنظمة الذكية والتيار الخفيف (ELV & BMS)',
          text: 'الشبكات الهيكلية، كاميرات المراقبة (CCTV)، التحكم في الدخول، الأنظمة الصوتية والمرئية، غرف البيانات وربط أنظمة إدارة المباني (BMS).',
          shot: 'smart',
          disciplines: ['low-current', 'data-center'],
        },
      ],
    },
    statsSection: {
      enabled: true,
      title: 'ثقة رواد الصناعة والقطاعات الحيوية',
      text: 'أرقامنا تتحدث عن نفسها — عقود من الحلول الكهروميكانيكية الموثوقة في جميع أنحاء منطقة الخليج.',
      backgroundImage: mediaIds['bg-pipes.png'],
      stats: statIds,
    },
    featuredProjects: {
      enabled: true,
      eyebrow: 'سجل أعمالنا',
      title: 'مشاريع رائدة',
      intro:
        'مختارات من أبرز مشاريعنا في المقاولات الكهروميكانيكية والأنظمة الذكية في منطقة الخليج.',
      button: {
        label: 'استعراض جميع المشاريع',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    partners: {
      enabled: true,
      eyebrow: 'شركاء النجاح',
      title: 'شركاء النجاح',
      intro: 'نتعاون مع أبرز العلامات التجارية العالمية لتقديم حلول بأعلى معايير الجودة.',
    },
    cta: {
      enabled: true,
      title: 'هل أنت مستعد لبناء',
      titleAccent: 'مشروعك القادم؟',
      text: 'دع خبرتنا التي تمتد لأكثر من 45 عاماً في الأعمال الكهروميكانيكية تعمل لصالح مشروعك القادم. تواصل معنا للحصول على استشارة مجانية.',
      backgroundImage: mediaIds['proj-tower.png'],
      button: {
        label: 'تواصل معنا اليوم',
        link: { type: 'internal', internalRoute: '/contact' },
      },
      secondaryButton: {
        label: 'اتصل بنا الآن',
      },
    },
    meta: {
      title: 'شركة الجزيرة للإمداد الذكي — المقاولات الكهروميكانيكية والأنظمة الذكية',
      description:
        'مقاولات متكاملة للأعمال الكهروميكانيكية ومكافحة الحريق والتيار الخفيف والبنية التحتية الذكية في المملكة العربية السعودية والخليج.',
      image: mediaIds['hero-city.png'],
    },
  }

  const savedHomeAr = await apiRequest(baseUrl, token, '/api/globals/home-page', {
    method: 'POST',
    locale: 'ar',
    body: homeAr,
  })
  const savedSystems =
    savedHomeAr?.result?.interactiveSystems?.systems ||
    savedHomeAr?.interactiveSystems?.systems ||
    []
  const existingSystemIds = savedSystems.map((s) => s.id)

  const homeEn = {
    _status: 'published',
    hero: {
      enabled: true,
      eyebrow: '45+ Years of Engineering Excellence',
      title: 'Building the Future',
      titleAccent: 'with Smart Solutions',
      subtitle:
        'Al Jazira for Imdad Smart Company is a leading MEP contractor in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over four decades of proven excellence.',
      background: mediaIds['hero-city.png'],
      primaryCta: {
        label: 'Explore Our Services',
        link: { type: 'internal', internalRoute: '/services' },
      },
      secondaryCta: {
        label: 'View Projects',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    whoWeAre: {
      enabled: true,
      badgeStat: statIds[0],
      eyebrow: 'Who We Are',
      title: 'Engineering Excellence Since 1979',
      text: makeLexical(
        [
          'With nearly five decades of expertise in Gulf markets, Al Jazira for Imdad Smart Company has rapidly expanded and grown from strength to strength, delivering exceptional performance and earning a reputation as a highly dependable specialist MEP contractor.',
          'We deliver comprehensive MEP packages through our in-house engineers, minimizing reliance on subcontractors and ensuring better quality, service, and on-time delivery.',
        ],
        'ltr',
      ),
      button: {
        label: 'Learn More About Us',
        link: { type: 'internal', internalRoute: '/about' },
      },
      image: mediaIds['about-team.png'],
    },
    coreServices: {
      enabled: true,
      eyebrow: 'What we do',
      title: 'Integrated MEP & construction services under one contract',
      intro:
        'From design coordination to testing & commissioning, around 85% of every MEP package is delivered by our own engineers and technicians — fewer interfaces, lower risk, faster handover.',
      button: {
        label: 'View All Services',
        link: { type: 'internal', internalRoute: '/services' },
      },
    },
    interactiveSystems: {
      enabled: true,
      eyebrow: 'Interactive',
      title: 'Every system, one accountable team',
      intro:
        'Pick a system to see how we design, install, test and commission it, from rooftop chillers to the fire pumps at ground level.',
      heroImage: mediaIds['tower-render.png'],
      liveModelLabel: 'Open the live 3D model',
      relatedProjectsLabel: 'Related projects',
      systems: [
        {
          ...(existingSystemIds[0] ? { id: existingSystemIds[0] } : {}),
          title: 'HVAC & Chilled Water',
          text: 'Chillers, AHUs, FCUs, VRF, ductwork, smoke management, staircase pressurization and cold rooms — tested, adjusted and balanced (TAB) before handover.',
          shot: 'hvac',
          disciplines: ['hvac'],
        },
        {
          ...(existingSystemIds[1] ? { id: existingSystemIds[1] } : {}),
          title: 'Fire Fighting & Fire Alarm',
          text: 'Fire pumps, sprinkler and hose systems, clean-agent suppression, detection and alarm — to NFPA and Civil Defense requirements.',
          shot: 'fire',
          disciplines: ['fire-fighting'],
        },
        {
          ...(existingSystemIds[2] ? { id: existingSystemIds[2] } : {}),
          title: 'Plumbing, Drainage & Water Supply',
          text: 'Booster sets, water tanks, domestic water, drainage and vent networks, and complete sanitary installations.',
          shot: 'plumbing',
          disciplines: ['plumbing'],
        },
        {
          ...(existingSystemIds[3] ? { id: existingSystemIds[3] } : {}),
          title: 'Power Distribution & Lighting',
          text: 'MV/LV panels, busways, small power, lighting and emergency generator distribution.',
          shot: 'power',
          disciplines: ['electrical'],
        },
        {
          ...(existingSystemIds[4] ? { id: existingSystemIds[4] } : {}),
          title: 'Smart Systems, ELV & BMS',
          text: 'Structured cabling, CCTV, access control, sound & AV, data rooms and BMS integration.',
          shot: 'smart',
          disciplines: ['low-current', 'data-center'],
        },
      ],
    },
    statsSection: {
      enabled: true,
      title: 'Trusted by Industry Leaders',
      text: 'Our numbers speak for themselves — decades of reliable MEP solutions across the Gulf region.',
      backgroundImage: mediaIds['bg-pipes.png'],
      stats: statIds,
    },
    featuredProjects: {
      enabled: true,
      eyebrow: 'Our Portfolio',
      title: 'Featured Projects',
      intro:
        'A showcase of our most prestigious MEP construction and smart systems projects across the Gulf region.',
      button: {
        label: 'View All Projects',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    partners: {
      enabled: true,
      eyebrow: 'Trusted Partners',
      title: 'Trusted Partners',
      intro: 'We collaborate with world-leading brands to deliver the highest quality solutions.',
    },
    cta: {
      enabled: true,
      title: 'Ready to Build',
      titleAccent: 'Your Next Project?',
      text: 'Let our 45+ years of MEP expertise work for your next construction or infrastructure project. Get in touch for a free consultation.',
      backgroundImage: mediaIds['proj-tower.png'],
      button: {
        label: 'Contact Us Today',
        link: { type: 'internal', internalRoute: '/contact' },
      },
      secondaryButton: {
        label: 'Call Us Now',
      },
    },
    meta: {
      title: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering Contractors',
      description:
        'Full-scope electromechanical, firefighting, low-current and smart infrastructure contracting across Saudi Arabia and the Gulf region.',
      image: mediaIds['hero-city.png'],
    },
  }

  await apiRequest(baseUrl, token, '/api/globals/home-page', {
    method: 'POST',
    locale: 'en',
    body: homeEn,
  })

  return { mediaIds, statIds, homeEn, homeAr }
}

const HOME_SECTION_COMPARISONS = [
  {
    key: '01-hero',
    selector: '[data-home-section="hero"]',
    figmaFile: '01-hero.png',
    outName: 'side-by-side-01-hero.png',
  },
  {
    key: '02-who-we-are',
    selector: '[data-home-section="who-we-are"]',
    figmaFile: '02-who-we-are.png',
    outName: 'side-by-side-02-who-we-are.png',
  },
  {
    key: '03-core-services',
    selector: '[data-home-section="core-services"]',
    figmaFile: '03-core-services.png',
    outName: 'side-by-side-03-core-services.png',
  },
  {
    key: '04-interactive-systems',
    selector: '[data-home-section="interactive-systems"]',
    figmaFile: '04-interactive-systems.png',
    outName: 'side-by-side-04-interactive-systems.png',
  },
  {
    key: '05-trusted-by-industry-leaders',
    selector: '[data-home-section="stats"]',
    figmaFile: '05-trusted-by-industry-leaders.png',
    outName: 'side-by-side-05-trusted-by-industry-leaders.png',
  },
  {
    key: '06-featured-projects',
    selector: '[data-home-section="featured-projects"]',
    figmaFile: '06-featured-projects.png',
    outName: 'side-by-side-06-featured-projects.png',
  },
  {
    key: '07-trusted-partners',
    selector: '[data-home-section="partners"]',
    figmaFile: '07-trusted-partners.png',
    outName: 'side-by-side-07-trusted-partners.png',
  },
  {
    key: '08-cta',
    selector: '[data-home-section="cta"]',
    figmaFile: '08-cta.png',
    outName: 'side-by-side-08-cta.png',
  },
]

export async function runP3T4Evidence({
  baseUrl = process.env.EVIDENCE_BASE_URL || 'http://localhost:3000',
  reportsEvidenceDir = path.resolve(process.cwd(), 'docs/reports/evidence/P3-T4/r3'),
  reportsPhase3Dir = path.resolve(process.cwd(), 'docs/reports/phase-3/P3-T4/r3'),
  mode = 'all',
  skipBrands = false,
} = {}) {
  fs.mkdirSync(reportsEvidenceDir, { recursive: true })
  fs.mkdirSync(reportsPhase3Dir, { recursive: true })
  const headerBlock = getRepoHeaderBlock()

  let token = null
  let seededData = null
  if (mode === 'all' || mode === 'prod-home' || mode === 'seed-only') {
    console.log(`[P3-T4 Evidence] Seeding CMS via Payload REST API at ${baseUrl}...`)
    token = await ensureAdminAuthToken(baseUrl)
    seededData = await seedHomePageData(baseUrl, token, { skipBrands })
    console.log(`[P3-T4 Evidence] CMS seeded and published in ar and en.`)
    if (mode === 'seed-only') {
      return
    }
  }

  const browser = await chromium.launch({ headless: true })

  try {
    // =========================================================================
    // 1. R-17 & R-19 Verification: TeamCard Enter 2 clipping & hover shadow fade
    // =========================================================================
    if (mode === 'all' || mode === 'dev-styleguide') {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(`${baseUrl}/en/styleguide`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)

      const enter2Locator = page
        .locator(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Enter 2"]',
        )
        .first()
      await enter2Locator.scrollIntoViewIfNeeded()
      await saveCompressedPng(
        await enter2Locator.screenshot(),
        path.join(reportsPhase3Dir, 'team-card-enter-2-clipped.png'),
      )

      const hoverEnLocator = page
        .locator(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Hover"]',
        )
        .first()
      await hoverEnLocator.scrollIntoViewIfNeeded()
      await saveCompressedPng(
        await hoverEnLocator.screenshot(),
        path.join(reportsPhase3Dir, 'team-card-hover-shadow-en.png'),
      )

      await page.goto(`${baseUrl}/ar/styleguide`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const hoverArLocator = page
        .locator(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Hover"]',
        )
        .first()
      await hoverArLocator.scrollIntoViewIfNeeded()
      await saveCompressedPng(
        await hoverArLocator.screenshot(),
        path.join(reportsPhase3Dir, 'team-card-hover-shadow-ar.png'),
      )

      const r17Audit = await page.evaluate(() => {
        const card = document.querySelector(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Enter 2"]',
        )
        if (!card) return { found: false }
        const clipFrame = card.firstElementChild
        const content = card.querySelector('[class*="content"]')
        const cardRect = card.getBoundingClientRect()
        const clipStyle = clipFrame ? window.getComputedStyle(clipFrame) : null
        const beforeStyle = window.getComputedStyle(card, '::before')
        const afterStyle = window.getComputedStyle(card, '::after')
        return {
          found: true,
          cardWidth: Math.round(cardRect.width),
          cardHeight: Math.round(cardRect.height),
          clipFrameOverflow: clipStyle?.overflow ?? null,
          clipFrameBorderRadius: clipStyle?.borderRadius ?? null,
          contentTransform: content ? window.getComputedStyle(content).transform : null,
          beforeBoxShadow: beforeStyle.boxShadow,
          beforeOpacity: beforeStyle.opacity,
          afterOpacity: afterStyle.opacity,
        }
      })

      const r17Log = [
        headerBlock,
        '=== R-17 & R-19 TeamCard Enter 2 Clipping & Shadow Fade Audit ===',
        JSON.stringify(r17Audit, null, 2),
        '',
      ].join('\n')
      fs.writeFileSync(path.join(reportsEvidenceDir, 'r17-r19-team-card.log'), r17Log, 'utf8')
      await ctx.close()

      if (mode === 'dev-styleguide') {
        console.log(
          `[P3-T4 Evidence] dev-styleguide artifacts generated in ${reportsEvidenceDir} and ${reportsPhase3Dir}`,
        )
        return
      }
    }

    // =========================================================================
    // 2. Intro Splash Recording & Verification (`28:1609` -> `28:1615`, CTO §3, R-4, R-9, R-14, R-15)
    // =========================================================================
    {
      // 2a. Verify SSR HTML already includes `[data-component="intro-splash"][data-intro-state="start"]` (R-4)
      const ssrEnHtml = await (await fetch(`${baseUrl}/en`)).text()
      const ssrArHtml = await (await fetch(`${baseUrl}/ar`)).text()
      const ssrContainsIntroStartEn =
        ssrEnHtml.includes('data-component="intro-splash"') &&
        ssrEnHtml.includes('data-intro-state="start"')
      const ssrContainsIntroStartAr =
        ssrArHtml.includes('data-component="intro-splash"') &&
        ssrArHtml.includes('data-intro-state="start"')

      // 2b. R-14 Verification: JavaScript disabled -> overlay is display:none and page is usable
      const noJsVerification = {}
      for (const loc of ['ar', 'en']) {
        const noJsCtx = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          javaScriptEnabled: false,
        })
        const noJsPage = await noJsCtx.newPage()
        await noJsPage.goto(`${baseUrl}/${loc}`, { waitUntil: 'domcontentloaded' })
        const overlayVisibleNoJs = await noJsPage
          .locator('[data-component="intro-splash"]')
          .isVisible()
          .catch(() => false)
        const h1VisibleNoJs = await noJsPage.locator('h1').isVisible()
        const primaryCtaVisibleNoJs = await noJsPage
          .locator('[data-home-section="hero"] a')
          .first()
          .isVisible()
        noJsVerification[loc] = {
          javaScriptEnabled: false,
          overlayVisibleNoJs,
          h1VisibleNoJs,
          primaryCtaVisibleNoJs,
        }
        await noJsCtx.close()
      }

      // 2c. Capture `intro-start-en.png`, `intro-reveal-en.png`, `intro-start-ar.png`, `intro-reveal-ar.png`
      //     and verify R-4 (dataset.intro === 'active', opacity === '1' at domcontentloaded) and R-9 (`inert` + focus)
      const introStateByLocale = {}
      for (const loc of ['en', 'ar']) {
        const snapCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
        const snapPage = await snapCtx.newPage()
        await snapPage.goto(`${baseUrl}/${loc}`, { waitUntil: 'domcontentloaded' })
        const snapIntro = snapPage.locator('[data-component="intro-splash"]')
        await snapIntro.waitFor({ state: 'visible', timeout: 1500 })

        const initialDomCheck = await snapPage.evaluate(() => {
          const overlay = document.querySelector('[data-component="intro-splash"]')
          const style = overlay ? window.getComputedStyle(overlay) : null
          return {
            htmlDataIntro: document.documentElement.dataset.intro ?? null,
            overlayDisplay: style?.display ?? null,
            overlayOpacity: style?.opacity ?? null,
          }
        })

        const startVisible = await snapIntro.isVisible()
        const startBuf = await snapPage.screenshot()

        await snapPage
          .locator('[data-component="intro-splash"][data-intro-state="reveal"]')
          .waitFor({ state: 'visible', timeout: 1200 })

        const revealStateAttr = await snapIntro.getAttribute('data-intro-state')
        const hydratedA11yCheck = await snapPage.evaluate(() => {
          const header = document.querySelector('header')
          const homeContent = document.querySelector('[data-home-content="true"]')
          const footer = document.querySelector('footer')
          const fab = document.querySelector('[data-component="whatsapp-fab"]')
          return {
            headerInert: Boolean(header?.hasAttribute('inert')),
            homeContentInert: Boolean(homeContent?.hasAttribute('inert')),
            footerInert: Boolean(footer?.hasAttribute('inert')),
            fabInert: Boolean(fab?.hasAttribute('inert')),
            activeElementIsSkip: document.activeElement?.getAttribute('data-intro-skip') === 'true',
          }
        })

        await snapPage.waitForTimeout(80)
        const revealBuf = await snapPage.screenshot()
        await snapCtx.close()

        await saveCompressedPng(startBuf, path.join(reportsPhase3Dir, `intro-start-${loc}.png`))
        await saveCompressedPng(revealBuf, path.join(reportsPhase3Dir, `intro-reveal-${loc}.png`))

        introStateByLocale[loc] = {
          startVisible,
          revealStateAttr,
          ...initialDomCheck,
          ...hydratedA11yCheck,
        }
      }

      // Stitch side-by-side against Figma `00-intro-start.png` and `00-intro-reveal.png`
      const figmaIntroStart = path.resolve(
        process.cwd(),
        'design/screenshots/pages/00-intro-start.png',
      )
      const figmaIntroReveal = path.resolve(
        process.cwd(),
        'design/screenshots/pages/00-intro-reveal.png',
      )
      const startEnPngPath = path.join(reportsPhase3Dir, 'intro-start-en.png')
      const revealEnPngPath = path.join(reportsPhase3Dir, 'intro-reveal-en.png')
      if (fs.existsSync(figmaIntroStart) && fs.existsSync(startEnPngPath)) {
        await createSideBySideImage(
          [fs.readFileSync(figmaIntroStart), fs.readFileSync(startEnPngPath)],
          path.join(reportsPhase3Dir, 'side-by-side-00-intro-start.png'),
        )
      }
      if (fs.existsSync(figmaIntroReveal) && fs.existsSync(revealEnPngPath)) {
        await createSideBySideImage(
          [fs.readFileSync(figmaIntroReveal), fs.readFileSync(revealEnPngPath)],
          path.join(reportsPhase3Dir, 'side-by-side-00-intro-reveal.png'),
        )
      }

      // 2d. Record uninterrupted live intro videos on fresh sessions (/en and /ar) and measure duration
      const videoMetricsByLocale = {}
      for (const loc of ['en', 'ar']) {
        const videoTmpDir = path.join(reportsPhase3Dir, `_video_tmp_${loc}`)
        fs.mkdirSync(videoTmpDir, { recursive: true })
        const videoCtx = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          recordVideo: { dir: videoTmpDir, size: { width: 1440, height: 900 } },
        })
        const videoPage = await videoCtx.newPage()
        await videoPage.goto(`${baseUrl}/${loc}`, { waitUntil: 'domcontentloaded' })
        const introLocator = videoPage.locator('[data-component="intro-splash"]')
        await introLocator.waitFor({ state: 'visible', timeout: 1500 })
        const t0 = Date.now()

        const h1RenderedDuringIntro = await videoPage.evaluate(() => {
          const h1 = document.querySelector('h1')
          return Boolean(h1 && h1.textContent && h1.textContent.trim().length > 0)
        })

        await introLocator.waitFor({ state: 'detached', timeout: 2000 })
        const totalElapsedMs = Date.now() - t0
        const afterDismissCheck = await videoPage.evaluate(() => ({
          storageAfterFirstLoad: window.sessionStorage.getItem('aljazira_intro_seen'),
          headerInertAfterDismiss: Boolean(document.querySelector('header')?.hasAttribute('inert')),
          homeContentInertAfterDismiss: Boolean(
            document.querySelector('[data-home-content="true"]')?.hasAttribute('inert'),
          ),
        }))

        // Reload in same session -> intro must NOT appear again (suppressed pre-paint via html[data-intro="seen"])
        await videoPage.reload({ waitUntil: 'domcontentloaded' })
        const reloadCheck = await videoPage.evaluate(() => {
          const overlay = document.querySelector('[data-component="intro-splash"]')
          return {
            htmlDataIntroOnReload: document.documentElement.dataset.intro ?? null,
            overlayDisplayOnReload: overlay ? window.getComputedStyle(overlay).display : 'none',
          }
        })
        await videoPage.waitForTimeout(150)
        const visibleOnSecondVisit = await introLocator.isVisible().catch(() => false)

        const recordedVideo = videoPage.video()
        await videoPage.close()
        await videoCtx.close()
        if (recordedVideo) {
          const videoSrcPath = await recordedVideo.path()
          const shortNamePath = path.join(reportsPhase3Dir, `intro-${loc}.webm`)
          fs.copyFileSync(videoSrcPath, shortNamePath)
        }
        fs.rmSync(videoTmpDir, { recursive: true, force: true })

        videoMetricsByLocale[loc] = {
          h1RenderedDuringIntro,
          totalElapsedMs,
          ...afterDismissCheck,
          ...reloadCheck,
          visibleOnSecondVisit,
        }
      }

      // 2e. R-15 Verification: Throttled first-visit rAF timeline (`412x823`, `4x CPU`, `Slow 4G`, `cacheDisabled=true`)
      //     proving the overlay is gone (`display === 'none'` or detached or `opacity <= 0.05`) by `<= 1600 ms` from `navigationStart` (`performance.now()`)
      //     First warm Next.js `.next/cache/images` at 412x823 @ 1.75x so server-side sharp resizing does not skew `/ar` vs `/en`.
      for (const warmLoc of ['ar', 'en']) {
        const warmCtx = await browser.newContext({
          viewport: { width: 412, height: 823 },
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 1.75,
        })
        const warmPage = await warmCtx.newPage()
        await warmPage.goto(`${baseUrl}/${warmLoc}`, { waitUntil: 'networkidle' })
        await warmCtx.close()
      }

      const throttledRafTimelineByLocale = {}
      for (const loc of ['ar', 'en']) {
        const thCtx = await browser.newContext({
          viewport: { width: 412, height: 823 },
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 1.75,
        })
        await thCtx.addInitScript(() => {
          window.__aljaziraIntroFrames = []
          const sample = () => {
            const now = Math.round(performance.now())
            const htmlIntro = document.documentElement?.dataset?.intro ?? null
            const overlay = document.querySelector('[data-component="intro-splash"]')
            const style = overlay ? window.getComputedStyle(overlay) : null
            const display = overlay ? style.display : 'detached'
            const opacity = overlay ? Number(Number(style.opacity).toFixed(2)) : 0
            window.__aljaziraIntroFrames.push({
              tMs: now,
              htmlIntro,
              display,
              opacity,
            })
            if (now < 2200) {
              requestAnimationFrame(sample)
            }
          }
          requestAnimationFrame(sample)
        })
        const thPage = await thCtx.newPage()
        const cdp = await thCtx.newCDPSession(thPage)
        await cdp.send('Network.enable')
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 150,
          downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8),
          uploadThroughput: Math.floor((750 * 1024) / 8),
        })
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

        await thPage.goto(`${baseUrl}/${loc}`, { waitUntil: 'domcontentloaded' })
        await thPage.waitForTimeout(2300)

        const timeline = await thPage.evaluate(() => {
          const frames = window.__aljaziraIntroFrames || []
          const firstVisible = frames.find((f) => f.display === 'flex' && f.opacity > 0) || null
          const lastVisible =
            [...frames].reverse().find((f) => f.display === 'flex' && f.opacity > 0.05) || null
          const firstHiddenAfterVisible = firstVisible
            ? frames.find(
                (f) =>
                  f.tMs > firstVisible.tMs &&
                  (f.display === 'none' || f.display === 'detached' || f.opacity <= 0.05),
              ) || null
            : null
          const overlayNow = document.querySelector('[data-component="intro-splash"]')
          const finalDisplay = overlayNow ? window.getComputedStyle(overlayNow).display : 'detached'
          return {
            frameCount: frames.length,
            firstVisibleFrameMs: firstVisible?.tMs ?? null,
            lastVisibleFrameMs: lastVisible?.tMs ?? null,
            firstHiddenFrameMs: firstHiddenAfterVisible?.tMs ?? null,
            finalHtmlDataIntro: document.documentElement.dataset.intro ?? null,
            finalDisplay,
            sampledFrames:
              frames.length <= 40
                ? frames
                : frames.filter((_, idx) => idx % 2 === 0 || idx === frames.length - 1),
          }
        })
        throttledRafTimelineByLocale[loc] = timeline
        await thCtx.close()
      }

      // 2f. Verify Escape key skip in a fresh session
      const escCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const escPage = await escCtx.newPage()
      await escPage.goto(`${baseUrl}/ar`, { waitUntil: 'domcontentloaded' })
      const escIntro = escPage.locator('[data-component="intro-splash"]')
      await escIntro.waitFor({ state: 'visible', timeout: 1500 })
      const visibleBeforeEscape = await escIntro.isVisible()
      await escPage.keyboard.press('Escape')
      await escPage.waitForTimeout(50)
      const visibleAfterEscape = await escIntro.isVisible().catch(() => false)
      await escCtx.close()

      // 2g. Verify prefers-reduced-motion: reduce suppresses intro completely pre-paint
      const rmCtx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      })
      const rmPage = await rmCtx.newPage()
      await rmPage.goto(`${baseUrl}/ar`, { waitUntil: 'domcontentloaded' })
      const rmDataIntro = await rmPage.evaluate(() => document.documentElement.dataset.intro)
      await rmPage.waitForTimeout(120)
      const visibleWithReducedMotion = await rmPage
        .locator('[data-component="intro-splash"]')
        .isVisible()
        .catch(() => false)
      await rmCtx.close()

      const introAudit = {
        ssrContainsIntroStartEn,
        ssrContainsIntroStartAr,
        noJsVerification,
        introStateByLocale,
        videoMetricsByLocale,
        throttledRafTimelineByLocale,
        visibleBeforeEscape,
        visibleAfterEscape,
        rmDataIntro,
        visibleWithReducedMotion,
      }
      const introLog = [
        headerBlock,
        '=== Intro Splash Verification (28:1609 -> 28:1615, CTO decision §3, R-4 SSR pre-paint, R-9 inert + focus, R-14 No-JS, R-15 <=1.6s Throttled Cap) ===',
        JSON.stringify(introAudit, null, 2),
        '',
      ].join('\n')
      fs.writeFileSync(path.join(reportsEvidenceDir, 'intro-verification.log'), introLog, 'utf8')

      for (const loc of ['en', 'ar']) {
        const st = introStateByLocale[loc]
        const vm = videoMetricsByLocale[loc]
        const nj = noJsVerification[loc]
        const tl = throttledRafTimelineByLocale[loc]
        if (
          nj.overlayVisibleNoJs ||
          !nj.h1VisibleNoJs ||
          !nj.primaryCtaVisibleNoJs ||
          !st.startVisible ||
          st.revealStateAttr !== 'reveal' ||
          st.htmlDataIntro !== 'active' ||
          st.overlayDisplay !== 'flex' ||
          !st.headerInert ||
          !st.homeContentInert ||
          !st.footerInert ||
          !st.activeElementIsSkip ||
          !vm.h1RenderedDuringIntro ||
          vm.totalElapsedMs > 1600 ||
          vm.storageAfterFirstLoad !== '1' ||
          vm.headerInertAfterDismiss ||
          vm.homeContentInertAfterDismiss ||
          vm.htmlDataIntroOnReload !== 'seen' ||
          vm.visibleOnSecondVisit ||
          tl.firstVisibleFrameMs === null ||
          tl.firstHiddenFrameMs === null ||
          tl.firstHiddenFrameMs > 1600 ||
          tl.finalHtmlDataIntro !== 'seen'
        ) {
          throw new Error(
            `Intro splash verification failed for ${loc}: ${JSON.stringify(introAudit)}`,
          )
        }
      }
      if (
        !ssrContainsIntroStartEn ||
        !ssrContainsIntroStartAr ||
        !visibleBeforeEscape ||
        visibleAfterEscape ||
        rmDataIntro !== 'seen' ||
        visibleWithReducedMotion
      ) {
        throw new Error(`Intro splash global verification failed: ${JSON.stringify(introAudit)}`)
      }
    }

    // =========================================================================
    // 3. Full-page Screenshots (1440 / 768 / 390 in ar & en), Section Side-by-Sides,
    //    Console/Hydration/CSP Audit, R-1/R-20 Carousel Gutter/Bleed/Height Audit,
    //    R-6/R-8/R-10/R-11 Audits, R-27 44x44px Touch Target Audit, and CLS
    // =========================================================================
    const consoleErrors = []
    const pageErrors = []
    const cspViolations = []
    const hydrationWarnings = []

    const viewports = [
      { width: 1440, height: 900, label: '1440', expectedGutter: 140, expectedStatsCols: 4 },
      { width: 768, height: 1024, label: '768', expectedGutter: 24, expectedStatsCols: 2 },
      { width: 390, height: 844, label: '390', expectedGutter: 16, expectedStatsCols: 1 },
    ]

    const sectionBuffersByLocale = { en: {}, ar: {} }
    const touchTargetReport390 = { ar: [], en: [] }
    const clsReport = {}
    const layoutAndSeoAudit = {}

    for (const locale of ['ar', 'en']) {
      for (const vp of viewports) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          reducedMotion: 'no-preference',
        })
        await ctx.addInitScript(() => {
          window.sessionStorage.setItem('aljazira_intro_seen', '1')
          window.__aljaziraClsValue = 0
          window.__aljaziraCspEvents = []
          document.addEventListener('securitypolicyviolation', (e) => {
            window.__aljaziraCspEvents.push({
              blockedURI: e.blockedURI,
              violatedDirective: e.violatedDirective,
            })
          })
          try {
            const obs = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                window.__aljaziraClsValue += entry.value
              }
            })
            obs.observe({ type: 'layout-shift', buffered: true })
          } catch {
            // ignore
          }
        })

        const page = await ctx.newPage()
        page.on('console', (msg) => {
          const text = msg.text()
          if (msg.type() === 'error') {
            consoleErrors.push(`[${locale}@${vp.label}] ${text}`)
          }
          if (/hydration|did not match|server-rendered/i.test(text)) {
            hydrationWarnings.push(`[${locale}@${vp.label}] ${text}`)
          }
          if (/Content Security Policy|Refused to/i.test(text)) {
            cspViolations.push(`[${locale}@${vp.label}] ${text}`)
          }
        })
        page.on('pageerror', (err) => {
          pageErrors.push(`[${locale}@${vp.label}] ${err.message}`)
        })

        await page.goto(`${baseUrl}/${locale}`, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(200)

        const fullScreenshotBuf = await page.screenshot({ fullPage: true })
        await saveCompressedPng(
          fullScreenshotBuf,
          path.join(reportsPhase3Dir, `home-${locale}-${vp.label}.png`),
        )

        // Audit R-1, R-20, R-6, R-8, R-10, R-11 on this locale & viewport
        const vpAudit = await page.evaluate(
          ({ vpWidth, isRtl }) => {
            const carouselEl = document.querySelector('[data-component="services-carousel"]')
            const controlsRow = document.querySelector(
              '[data-component="services-carousel"] [class*="controlsRow"]',
            )
            const slide0 = document.querySelector(
              '[data-component="services-carousel"] [data-slide-index="0"]',
            )
            const slide4 = document.querySelector(
              '[data-component="services-carousel"] [data-slide-index="4"]',
            )
            const cRect = carouselEl ? carouselEl.getBoundingClientRect() : null
            const ctrlRect = controlsRow ? controlsRow.getBoundingClientRect() : null
            const s0Rect = slide0 ? slide0.getBoundingClientRect() : null
            const s4Rect = slide4 ? slide4.getBoundingClientRect() : null
            const carouselStartInset = s0Rect
              ? Math.round(isRtl ? vpWidth - s0Rect.right : s0Rect.left)
              : null
            const carouselHeight = cRect ? Math.round(cRect.height) : null
            const controlsInlineEndCoord = ctrlRect
              ? Math.round(isRtl ? ctrlRect.left : ctrlRect.right)
              : null
            const slide4BleedsInlineEnd = s4Rect
              ? isRtl
                ? s4Rect.right > 0 && s4Rect.left < 0
                : s4Rect.left < vpWidth && s4Rect.right > vpWidth
              : false

            const statItems = Array.from(
              document.querySelectorAll('[data-home-section="stats"] [data-stat-item]'),
            )
            const distinctStatLefts = new Set(
              statItems.map((el) => Math.round(el.getBoundingClientRect().left)),
            )
            const statsGridCols = distinctStatLefts.size

            const expandedAccordion = document.querySelector(
              '[data-home-section="interactive-systems"] [data-accordion-state="Expanded"]',
            )
            const expandedAccordionBg = expandedAccordion
              ? window.getComputedStyle(expandedAccordion).backgroundColor
              : null

            const heroCtaGroup = document.querySelector(
              '[data-home-section="hero"] [class*="heroCtaGroup"]',
            )
            const heroCtaPaddingTop = heroCtaGroup
              ? window.getComputedStyle(heroCtaGroup).paddingTop
              : null

            const whoPhotoWrap = document.querySelector(
              '[data-home-section="who-we-are"] [class*="whoPhotoWrap"]',
            )
            const whoPhotoMarginTop = whoPhotoWrap
              ? window.getComputedStyle(whoPhotoWrap).marginTop
              : null
            const whoPhotoMarginInlineStart = whoPhotoWrap
              ? window.getComputedStyle(whoPhotoWrap).marginInlineStart
              : null

            const liveModelControlCount = document.querySelectorAll(
              '[data-open-3d-model], [class*="liveModelBadge"]',
            ).length

            const h1Text = document.querySelector('h1')?.textContent ?? null
            const ctaH2Text =
              document.querySelector('[data-home-section="cta"] h2')?.textContent ?? null

            const hreflangXDefault =
              document
                .querySelector('link[rel="alternate"][hreflang="x-default"]')
                ?.getAttribute('href') ?? null
            const ogSiteName =
              document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ??
              null
            const ogUrl =
              document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null
            const ogImage =
              document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null

            const headerNavLabels = Array.from(
              document.querySelectorAll('[data-component="navbar"] nav a'),
            ).map((a) => (a.textContent || '').trim())

            return {
              carouselStartInset,
              carouselHeight,
              controlsInlineEndCoord,
              slide4BleedsInlineEnd,
              statsGridCols,
              expandedAccordionBg,
              heroCtaPaddingTop,
              whoPhotoMarginTop,
              whoPhotoMarginInlineStart,
              liveModelControlCount,
              h1Text,
              ctaH2Text,
              hreflangXDefault,
              ogSiteName,
              ogUrl,
              ogImage,
              headerNavLabels,
            }
          },
          { vpWidth: vp.width, isRtl: locale === 'ar' },
        )

        layoutAndSeoAudit[`${locale}-${vp.label}`] = vpAudit

        if (
          vpAudit.carouselStartInset !== vp.expectedGutter ||
          (vp.width === 1440 && !vpAudit.slide4BleedsInlineEnd) ||
          (vp.width === 1440 && vpAudit.carouselHeight !== 430) ||
          (vp.width === 1440 &&
            vpAudit.controlsInlineEndCoord !== (locale === 'ar' ? 140 : 1300)) ||
          vpAudit.statsGridCols !== vp.expectedStatsCols ||
          vpAudit.expandedAccordionBg !== 'rgb(255, 255, 255)' ||
          vpAudit.heroCtaPaddingTop !== '0px' ||
          (vp.width >= 768 &&
            (vpAudit.whoPhotoMarginTop !== '8px' || vpAudit.whoPhotoMarginInlineStart !== '8px')) ||
          vpAudit.liveModelControlCount !== 0 ||
          !vpAudit.hreflangXDefault?.endsWith('/ar') ||
          !vpAudit.ogSiteName ||
          !vpAudit.ogUrl?.endsWith(`/${locale}`) ||
          !vpAudit.ogImage
        ) {
          throw new Error(
            `Layout/SEO audit failed on ${locale}@${vp.label}: ${JSON.stringify(vpAudit)}`,
          )
        }

        if (locale === 'en') {
          if (
            vpAudit.h1Text !== 'Building the Future with Smart Solutions' ||
            vpAudit.ctaH2Text !== 'Ready to Build Your Next Project?' ||
            !vpAudit.headerNavLabels.includes('Services')
          ) {
            throw new Error(
              `English copy/nav check failed on en@${vp.label}: ${JSON.stringify(vpAudit)}`,
            )
          }
        } else {
          if (
            vpAudit.h1Text !== 'نبني المستقبل بحلول هندسية ذكية' ||
            vpAudit.ctaH2Text !== 'هل أنت مستعد لبناء مشروعك القادم؟' ||
            !vpAudit.headerNavLabels.includes('خدماتنا')
          ) {
            throw new Error(
              `Arabic copy/nav check failed on ar@${vp.label}: ${JSON.stringify(vpAudit)}`,
            )
          }
        }

        const pageCspEvents = await page.evaluate(() => window.__aljaziraCspEvents || [])
        for (const ev of pageCspEvents) {
          cspViolations.push(`[${locale}@${vp.label}] ${ev.violatedDirective}: ${ev.blockedURI}`)
        }

        const clsVal = await page.evaluate(() =>
          Number((window.__aljaziraClsValue || 0).toFixed(5)),
        )
        clsReport[`${locale}-${vp.label}`] = clsVal

        if (vp.width === 1440) {
          // Hide fixed navbar/fab via CSSOM insertRule (100% CSP-safe; no inline <style> or style="")
          await page.evaluate(() => {
            const sheet = document.styleSheets[0]
            if (sheet) {
              sheet.insertRule(
                '[data-component="navbar"], [data-component="whatsapp-fab"] { visibility: hidden !important; }',
                sheet.cssRules.length,
              )
            }
          })
          await page.waitForTimeout(50)

          for (const sec of HOME_SECTION_COMPARISONS) {
            const loc = page.locator(sec.selector).first()
            if ((await loc.count()) > 0) {
              await loc.scrollIntoViewIfNeeded()
              await page.waitForTimeout(50)
              const buf = await loc.screenshot()
              sectionBuffersByLocale[locale][sec.key] = buf
              await saveCompressedPng(
                buf,
                path.join(reportsPhase3Dir, `section-${sec.key}-${locale}-1440.png`),
              )
            }
          }
        }

        if (vp.width === 390) {
          // R-27: Verify every visible interactive control on Home page is >= 44x44px
          const controls = await page.evaluate(() => {
            const elements = Array.from(
              document.querySelectorAll(
                '[data-component="navbar"] a, [data-component="navbar"] button, main a, main button, [data-component="whatsapp-fab"]',
              ),
            )
            const results = []
            for (const el of elements) {
              const style = window.getComputedStyle(el)
              if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                Number(style.opacity) === 0
              ) {
                continue
              }
              if (el.closest('[hidden]') || el.closest('[aria-hidden="true"]')) {
                continue
              }
              const rect = el.getBoundingClientRect()
              if (rect.width === 0 || rect.height === 0) continue
              results.push({
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 48),
                component:
                  el.getAttribute('data-component') ||
                  el.closest('[data-home-section]')?.getAttribute('data-home-section') ||
                  'shell',
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              })
            }
            return results
          })
          touchTargetReport390[locale] = controls
        }

        await ctx.close()
      }
    }

    // Stitch 1440 section side-by-side images (`Figma | EN | AR`, scaled to <= 1440px width)
    const figmaSectionsDir = path.resolve(process.cwd(), 'design/screenshots/sections/01-home')
    for (const sec of HOME_SECTION_COMPARISONS) {
      const figmaPath = path.join(figmaSectionsDir, sec.figmaFile)
      const enBuf = sectionBuffersByLocale.en[sec.key]
      const arBuf = sectionBuffersByLocale.ar[sec.key]
      if (fs.existsSync(figmaPath) && enBuf && arBuf) {
        await createSideBySideImage(
          [fs.readFileSync(figmaPath), enBuf, arBuf],
          path.join(reportsPhase3Dir, sec.outName),
        )
      }
    }

    // Stitch full-page 1440 comparison (`Figma 01-home.png | EN 1440 | AR 1440`, scaled to <= 1440px width)
    const figmaFullHomePath = path.resolve(process.cwd(), 'design/screenshots/pages/01-home.png')
    const enFull1440Path = path.join(reportsPhase3Dir, 'home-en-1440.png')
    const arFull1440Path = path.join(reportsPhase3Dir, 'home-ar-1440.png')
    if (
      fs.existsSync(figmaFullHomePath) &&
      fs.existsSync(enFull1440Path) &&
      fs.existsSync(arFull1440Path)
    ) {
      await createSideBySideImage(
        [
          fs.readFileSync(figmaFullHomePath),
          fs.readFileSync(enFull1440Path),
          fs.readFileSync(arFull1440Path),
        ],
        path.join(reportsPhase3Dir, 'side-by-side-home-1440.png'),
      )
    }

    // Save R-27 Touch Target log
    const undersizedControls = [
      ...touchTargetReport390.ar.filter((c) => c.width < 44 || c.height < 44),
      ...touchTargetReport390.en.filter((c) => c.width < 44 || c.height < 44),
    ]
    const touchLog = [
      headerBlock,
      '=== R-27 Touch Target Audit at 390x844 (/ar and /en) ===',
      `ar controls checked: ${touchTargetReport390.ar.length}`,
      `en controls checked: ${touchTargetReport390.en.length}`,
      `undersized controls (< 44x44px): ${undersizedControls.length}`,
      JSON.stringify(
        {
          undersizedControls,
          sampleAr: touchTargetReport390.ar.slice(0, 12),
          sampleEn: touchTargetReport390.en.slice(0, 12),
        },
        null,
        2,
      ),
      '',
    ].join('\n')
    fs.writeFileSync(path.join(reportsEvidenceDir, 'r27-touch-targets-390.log'), touchLog, 'utf8')
    if (undersizedControls.length > 0) {
      throw new Error(
        `R-27 violation: found ${undersizedControls.length} controls < 44x44px at 390px: ${JSON.stringify(undersizedControls)}`,
      )
    }

    // Save Console / Hydration / CSP / CLS / R-1 / R-20 / R-6 / R-8 / R-10 / R-11 log
    const maxCls = Math.max(...Object.values(clsReport), 0)
    const runtimeLog = [
      headerBlock,
      '=== Console, Hydration, CSP, CLS & Layout/SEO Audit (/ar and /en across 1440, 768, 390) ===',
      `consoleErrors: ${consoleErrors.length}`,
      `pageErrors: ${pageErrors.length}`,
      `hydrationWarnings: ${hydrationWarnings.length}`,
      `cspViolations: ${cspViolations.length}`,
      `maxCls: ${maxCls}`,
      JSON.stringify(
        {
          clsReport,
          layoutAndSeoAudit,
          consoleErrors,
          pageErrors,
          hydrationWarnings,
          cspViolations,
        },
        null,
        2,
      ),
      '',
    ].join('\n')
    fs.writeFileSync(path.join(reportsEvidenceDir, 'runtime-csp-cls.log'), runtimeLog, 'utf8')

    if (
      consoleErrors.length > 0 ||
      pageErrors.length > 0 ||
      hydrationWarnings.length > 0 ||
      cspViolations.length > 0 ||
      maxCls > 0.05
    ) {
      throw new Error(`Runtime/CSP/CLS gate failed: ${runtimeLog}`)
    }

    // =========================================================================
    // 4. CMS Live Roundtrip: Draft isolation + Edit -> Publish -> Visible (R-2, R-7) + `enabled: false`
    // =========================================================================
    {
      // 4a. Save a DRAFT change (`_status: 'draft'`) -> anonymous visitor MUST NOT see it
      await apiRequest(baseUrl, token, '/api/globals/home-page?draft=true', {
        method: 'POST',
        locale: 'en',
        body: {
          _status: 'draft',
          statsSection: {
            enabled: true,
            title: 'DRAFT ONLY UNPUBLISHED HEADING DO NOT SHOW',
          },
        },
      })
      const anonDuringDraftHtml = await (await fetch(`${baseUrl}/en`)).text()
      const draftLeakedToAnon = anonDuringDraftHtml.includes(
        'DRAFT ONLY UNPUBLISHED HEADING DO NOT SHOW',
      )

      // 4b. Publish (`_status: 'published'`) live edits to `hero.title` + `hero.titleAccent`,
      //     `statsSection.backgroundImage: null` (R-7 empty state), and `partners.enabled: false`
      await apiRequest(baseUrl, token, '/api/globals/home-page', {
        method: 'POST',
        locale: 'en',
        body: {
          _status: 'published',
          hero: {
            enabled: true,
            title: 'Engineering Tomorrow',
            titleAccent: 'Across the Kingdom — Live CMS Verified',
          },
          statsSection: {
            enabled: true,
            title: 'Trusted by Industry Leaders — Live CMS Verified',
            backgroundImage: null,
          },
          partners: {
            enabled: false,
          },
        },
      })

      await apiRequest(baseUrl, token, '/api/globals/home-page', {
        method: 'POST',
        locale: 'ar',
        body: {
          _status: 'published',
          hero: {
            enabled: true,
            title: 'نهندس الغد',
            titleAccent: 'في أنحاء المملكة — تحديث مباشر',
          },
        },
      })

      const anonAfterPublishEnHtml = await (await fetch(`${baseUrl}/en`)).text()
      const anonAfterPublishArHtml = await (await fetch(`${baseUrl}/ar`)).text()
      const publishedTitleVisible =
        anonAfterPublishEnHtml.includes('Engineering Tomorrow') &&
        anonAfterPublishEnHtml.includes('Across the Kingdom — Live CMS Verified') &&
        anonAfterPublishEnHtml.includes('Trusted by Industry Leaders — Live CMS Verified')
      const publishedTitleVisibleAr =
        anonAfterPublishArHtml.includes('نهندس الغد') &&
        anonAfterPublishArHtml.includes('في أنحاء المملكة — تحديث مباشر')
      const partnersSectionHiddenWhenDisabled = !anonAfterPublishEnHtml.includes(
        'data-home-section="partners"',
      )
      const statsPlainNavyWhenBgNull =
        !anonAfterPublishEnHtml.includes('bg-pipes') &&
        !anonAfterPublishEnHtml.includes('statsBgLayer')

      // Capture screenshots of the live edits and disabled partners section (`R-5`, `R-18`)
      const cmsCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      await cmsCtx.addInitScript(() => {
        window.sessionStorage.setItem('aljazira_intro_seen', '1')
      })
      const cmsPage = await cmsCtx.newPage()
      await cmsPage.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
      await cmsPage.evaluate(() => document.fonts.ready)
      await saveCompressedPng(
        await cmsPage.screenshot(),
        path.join(reportsPhase3Dir, 'cms-live-edit-en.png'),
      )

      await saveCompressedPng(
        await cmsPage.screenshot({ fullPage: true }),
        path.join(reportsPhase3Dir, 'cms-toggle-partners-disabled-en.png'),
      )

      await cmsPage.goto(`${baseUrl}/ar`, { waitUntil: 'networkidle' })
      await cmsPage.evaluate(() => document.fonts.ready)
      await saveCompressedPng(
        await cmsPage.screenshot(),
        path.join(reportsPhase3Dir, 'cms-live-edit-ar.png'),
      )
      await cmsCtx.close()

      // Restore original published state in both locales
      const bgPipesId = seededData?.mediaIds?.['bg-pipes.png'] ?? null
      await apiRequest(baseUrl, token, '/api/globals/home-page', {
        method: 'POST',
        locale: 'en',
        body: {
          _status: 'published',
          hero: {
            enabled: true,
            title: 'Building the Future',
            titleAccent: 'with Smart Solutions',
          },
          statsSection: {
            enabled: true,
            title: 'Trusted by Industry Leaders',
            backgroundImage: bgPipesId,
          },
          partners: {
            enabled: true,
          },
        },
      })
      await apiRequest(baseUrl, token, '/api/globals/home-page', {
        method: 'POST',
        locale: 'ar',
        body: {
          _status: 'published',
          hero: {
            enabled: true,
            title: 'نبني المستقبل',
            titleAccent: 'بحلول هندسية ذكية',
          },
          statsSection: {
            enabled: true,
            title: 'ثقة رواد الصناعة والقطاعات الحيوية',
            backgroundImage: bgPipesId,
          },
          partners: {
            enabled: true,
          },
        },
      })

      const anonRestoredHtml = await (await fetch(`${baseUrl}/en`)).text()
      const partnersSectionRestored = anonRestoredHtml.includes('data-home-section="partners"')
      const statsBgRestored =
        anonRestoredHtml.includes('bg-pipes') && anonRestoredHtml.includes('statsBgLayer')

      const cmsRoundtripAudit = {
        draftLeakedToAnon,
        publishedTitleVisible,
        publishedTitleVisibleAr,
        partnersSectionHiddenWhenDisabled,
        statsPlainNavyWhenBgNull,
        partnersSectionRestored,
        statsBgRestored,
      }
      const cmsLog = [
        headerBlock,
        '=== CMS Live Roundtrip, R-2 Title+TitleAccent, R-7 Stats Bg & Section `enabled` Toggle Verification ===',
        JSON.stringify(cmsRoundtripAudit, null, 2),
        '',
      ].join('\n')
      fs.writeFileSync(path.join(reportsEvidenceDir, 'cms-live-roundtrip.log'), cmsLog, 'utf8')

      if (
        draftLeakedToAnon ||
        !publishedTitleVisible ||
        !publishedTitleVisibleAr ||
        !partnersSectionHiddenWhenDisabled ||
        !statsPlainNavyWhenBgNull ||
        !partnersSectionRestored ||
        !statsBgRestored
      ) {
        throw new Error(`CMS roundtrip verification failed: ${JSON.stringify(cmsRoundtripAudit)}`)
      }
    }

    // =========================================================================
    // 5. Cold-Cache Throttled Mobile CLS Audit (`412x823`, `4x CPU`, `Slow 4G`) (R-3, R-19)
    //    Counts ALL `layout-shift` entries (both `hadRecentInput: false` and `hadRecentInput: true`)
    // =========================================================================
    {
      const throttledClsByLocale = {}
      for (const loc of ['ar', 'en']) {
        const clsCtx = await browser.newContext({
          viewport: { width: 412, height: 823 },
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 1.75,
        })
        await clsCtx.addInitScript(() => {
          window.sessionStorage.setItem('aljazira_intro_seen', '1')
          window.__aljaziraShifts = []
          try {
            const obs = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                window.__aljaziraShifts.push({
                  value: Number(entry.value.toFixed(5)),
                  hadRecentInput: Boolean(entry.hadRecentInput),
                  startTime: Math.round(entry.startTime),
                  sources: (entry.sources || []).map((s) => ({
                    node: s.node
                      ? s.node.tagName +
                        (s.node.className ? '.' + String(s.node.className).split(' ')[0] : '')
                      : null,
                    previousRect: s.previousRect,
                    currentRect: s.currentRect,
                  })),
                })
              }
            })
            obs.observe({ type: 'layout-shift', buffered: true })
          } catch {
            // ignore
          }
        })
        const clsPage = await clsCtx.newPage()
        const cdp = await clsCtx.newCDPSession(clsPage)
        await cdp.send('Network.enable')
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 150,
          downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8),
          uploadThroughput: Math.floor((750 * 1024) / 8),
        })
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

        await clsPage.goto(`${baseUrl}/${loc}`, { waitUntil: 'networkidle' })
        await clsPage.evaluate(() => document.fonts.ready)
        await clsPage.waitForTimeout(500)

        const shifts = await clsPage.evaluate(() => window.__aljaziraShifts || [])
        const totalClsAllEntries = Number(
          shifts.reduce((acc, s) => acc + (s.value || 0), 0).toFixed(5),
        )
        const totalClsWithoutInput = Number(
          shifts
            .filter((s) => !s.hadRecentInput)
            .reduce((acc, s) => acc + (s.value || 0), 0)
            .toFixed(5),
        )
        const h1Height = await clsPage.evaluate(() => {
          const h1 = document.querySelector('h1')
          return h1 ? Math.round(h1.getBoundingClientRect().height) : null
        })
        throttledClsByLocale[loc] = {
          viewport: '412x823',
          cpuThrottlingRate: 4,
          network: 'Slow 4G (150ms RTT, 1.6Mbps down, cacheDisabled=true)',
          totalClsAllEntries,
          totalClsWithoutInput,
          h1Height,
          shifts,
        }
        await clsCtx.close()

        if (totalClsAllEntries > 0.05) {
          throw new Error(
            `R-3/R-19 throttled mobile CLS (all entries) exceeded 0.05 on /${loc}: ${JSON.stringify(throttledClsByLocale[loc])}`,
          )
        }
      }

      const r3ClsLog = [
        headerBlock,
        '=== R-3 & R-19 Throttled Cold-Cache Mobile CLS Verification (/ar and /en at 412x823, 4x CPU, Slow 4G, all layout-shift entries counted) ===',
        JSON.stringify(throttledClsByLocale, null, 2),
        '',
      ].join('\n')
      fs.writeFileSync(path.join(reportsEvidenceDir, 'r3-mobile-cls.log'), r3ClsLog, 'utf8')
    }

    // =========================================================================
    // 6. Official Google Lighthouse Mobile Audits on `/ar` and `/en` (R-5, R-16, DoD)
    // =========================================================================
    for (const loc of ['ar', 'en']) {
      const lhLogPath = path.join(reportsEvidenceDir, `lighthouse-mobile-${loc}.log`)
      const lhJsonPath = path.join(reportsEvidenceDir, `lighthouse-mobile-${loc}.json`)
      console.log(`[P3-T4 Evidence] Running Google Lighthouse mobile audit on ${baseUrl}/${loc}...`)
      await runLighthouseAudit({
        url: `${baseUrl}/${loc}`,
        locale: loc,
        headerBlock,
        outLogPath: lhLogPath,
        outJsonPath: lhJsonPath,
      })
    }
  } finally {
    await browser.close()
  }

  console.log(
    `[P3-T4 Evidence] All P3-T4 r3 evidence generated in ${reportsEvidenceDir} (logs) and ${reportsPhase3Dir} (images/videos)`,
  )
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/evidence/p3-t4-evidence.mjs')
) {
  const rawArgs = process.argv.slice(2)
  const modeArg = rawArgs.find((a) => a.startsWith('--mode='))
  const mode = modeArg ? modeArg.slice('--mode='.length) : process.env.EVIDENCE_MODE || 'all'
  const skipBrands = rawArgs.includes('--skip-brands')
  const posArgs = rawArgs.filter((a) => !a.startsWith('--'))

  const baseUrl = posArgs[0] || process.env.EVIDENCE_BASE_URL || 'http://localhost:3000'
  const reportsEvidenceDir =
    posArgs[1] || path.resolve(process.cwd(), 'docs/reports/evidence/P3-T4/r3')
  const reportsPhase3Dir =
    posArgs[2] || path.resolve(process.cwd(), 'docs/reports/phase-3/P3-T4/r3')

  runP3T4Evidence({
    baseUrl,
    reportsEvidenceDir,
    reportsPhase3Dir,
    mode,
    skipBrands,
  }).catch((err) => {
    console.error('[P3-T4 Evidence] ERROR:', err)
    process.exit(1)
  })
}
