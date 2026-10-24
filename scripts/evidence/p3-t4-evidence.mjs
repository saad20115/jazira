import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

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

  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 246, g: 248, b: 251, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath)
}

function copyToDirs(srcFile, destDirs) {
  const baseName = path.basename(srcFile)
  for (const dir of destDirs) {
    if (!dir) continue
    fs.mkdirSync(dir, { recursive: true })
    const dest = path.join(dir, baseName)
    if (path.resolve(srcFile) !== path.resolve(dest)) {
      fs.copyFileSync(srcFile, dest)
    }
  }
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

async function seedHomePageData(baseUrl, token) {
  const imagesDir = path.resolve(process.cwd(), 'design/assets/images')
  const mediaFiles = [
    ['hero-city.png', 'Riyadh skyline at dusk', 'أفق الرياض عند الغسق'],
    ['about-team.png', 'Al Jazira engineering team', 'الفريق الهندسي لشركة الجزيرة'],
    [
      'tower-render.png',
      '3D Building Systems Overview',
      'نظرة عامة على أنظمة المبنى ثلاثية الأبعاد',
    ],
    ['svc-electrical.png', 'Electrical Contracting', 'المقاولات الكهربائية'],
    ['svc-hvac.png', 'HVAC & Mechanical Systems', 'التكييف والأنظمة الميكانيكية'],
    ['svc-firefighting.png', 'Firefighting Systems', 'أنظمة مكافحة الحريق'],
    ['svc-firealarm.png', 'Fire Alarm & Early Warning', 'أنظمة الإنذار المبكر عن الحريق'],
    ['svc-lowcurrent.png', 'Low-Current & Smart Systems', 'التيار الخفيف والأنظمة الذكية'],
    ['svc-plumbing.png', 'Plumbing & Sanitary Networks', 'السباكة والشبكات الصحية'],
    ['svc-datacenter.png', 'Data Center Infrastructure', 'البنية التحتية لمراكز البيانات'],
    ['svc-civil.png', 'General Contracting & Civil Works', 'المقاولات العامة والأعمال المدنية'],
    ['proj-tower.png', 'Al Khalil Investment Project', 'مشروع الخليل الاستثماري'],
    ['proj-tunnel.png', 'King Abdullah Road Tunnel — Exit 10', 'نفق طريق الملك عبدالله — مخرج 10'],
    ['proj-datacenter.png', 'Riyadh Enterprise Data Center', 'مركز بيانات الأعمال بالرياض'],
    ['proj-hospital.png', 'Specialized Medical Complex', 'المجمع الطبي التخصصي'],
    ['proj-mall.png', 'Commercial Plaza & Retail Strip', 'البلازا التجارية والمجمع التجاري'],
    [
      'proj-warehouse.png',
      'Cold-Storage & Logistics Hub',
      'مركز المستودعات المبردة والخدمات اللوجستية',
    ],
    ['brand-abb.png', 'ABB', 'ABB'],
    ['brand-schneider.png', 'Schneider Electric', 'Schneider Electric'],
    ['brand-siemens.png', 'Siemens', 'Siemens'],
    ['brand-legrand.png', 'Legrand', 'Legrand'],
    ['brand-3m.png', '3M', '3M'],
    ['brand-york.png', 'York', 'York'],
    ['brand-gree.png', 'Gree', 'Gree'],
    ['brand-daikin.png', 'Daikin', 'Daikin'],
    ['brand-honeywell.png', 'Honeywell', 'Honeywell'],
    ['brand-notifier.png', 'Notifier', 'Notifier'],
    ['brand-simplex.png', 'Simplex', 'Simplex'],
    ['brand-bosch.png', 'Bosch', 'Bosch'],
    ['brand-hikvision.png', 'Hikvision', 'Hikvision'],
    ['brand-cisco.png', 'Cisco', 'Cisco'],
    ['brand-commscope.png', 'CommScope', 'CommScope'],
    ['brand-panduit.png', 'Panduit', 'Panduit'],
    ['brand-corning.png', 'Corning', 'Corning'],
    ['brand-grohe.png', 'Grohe', 'Grohe'],
    ['brand-Grundfos.png', 'Grundfos', 'Grundfos'],
  ]

  const mediaIds = {}
  for (const [file, altEn, altAr] of mediaFiles) {
    const fullPath = path.join(imagesDir, file)
    if (fs.existsSync(fullPath)) {
      mediaIds[file] = await ensureMediaUploaded(baseUrl, token, fullPath, altEn, altAr)
    }
  }

  // 1. Seed Stats (4 items)
  const statsSpec = [
    { order: 1, value: '9+', labelEn: 'Years of Experience', labelAr: 'عاماً من الخبرة' },
    { order: 2, value: '30+', labelEn: 'Projects Delivered', labelAr: 'مشروعاً منجزاً' },
    { order: 3, value: '120+', labelEn: 'Engineers & Technicians', labelAr: 'مهندساً وفنياً' },
    { order: 4, value: '50+', labelEn: 'Partner Brands', labelAr: 'علامة تجارية شريكة' },
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

  // 2. Seed 8 Main Services
  const servicesSpec = [
    {
      order: 1,
      slug: 'electrical-contracting',
      icon: 'electrical',
      image: 'svc-electrical.png',
      titleEn: 'Electrical Contracting',
      shortEn:
        'Complete MV/LV distribution, panels, cabling, lighting, earthing and lightning protection for commercial and industrial facilities.',
      titleAr: 'المقاولات الكهربائية',
      shortAr:
        'توزيع متكامل للجهد المتوسط والمنخفض، اللوحات، الكابلات، الإنارة، التأريض والحماية من الصواعق للمنشآت التجارية والصناعية.',
    },
    {
      order: 2,
      slug: 'hvac-mechanical',
      icon: 'hvac',
      image: 'svc-hvac.png',
      titleEn: 'HVAC & Mechanical Systems',
      shortEn:
        'Chilled-water plants, AHUs/FCUs, VRF, ductwork, ventilation, smoke management and full testing, adjusting & balancing (TAB).',
      titleAr: 'التكييف والأنظمة الميكانيكية',
      shortAr:
        'محطات المياه المبردة، وحدات مناولة الهواء، أنظمة VRF، مجاري الهواء، التهوية، سحب الدخان وأعمال الفحص والضبط والموازنة (TAB).',
    },
    {
      order: 3,
      slug: 'firefighting-systems',
      icon: 'fire',
      image: 'svc-firefighting.png',
      titleEn: 'Firefighting Systems',
      shortEn:
        'Civil Defense-compliant sprinkler networks, fire pumps, FM-200 / Novec clean-agent suppression, hose reels and foam systems.',
      titleAr: 'أنظمة مكافحة الحريق',
      shortAr:
        'شبكات الرش الآلي المعتمدة من الدفاع المدني، مضخات الحريق، أنظمة الإطفاء بالغازات النظيفة FM-200 / Novec، وصناديق الإطفاء.',
    },
    {
      order: 4,
      slug: 'fire-alarm-early-warning',
      icon: 'fire',
      image: 'svc-firealarm.png',
      titleEn: 'Fire Alarm & Early Warning',
      shortEn:
        'Addressable and conventional detection, voice evacuation, aspirating smoke detection (VESDA) and BMS integration.',
      titleAr: 'أنظمة الإنذار المبكر عن الحريق',
      shortAr:
        'أنظمة الكشف المعنونة والتقليدية، الإخلاء الصوتي، الكشف المبكر عن الدخان (VESDA) والربط مع أنظمة إدارة المباني (BMS).',
    },
    {
      order: 5,
      slug: 'low-current-smart-systems',
      icon: 'smart',
      image: 'svc-lowcurrent.png',
      titleEn: 'Low-Current & Smart Systems',
      shortEn:
        'Structured cabling, IP CCTV, access control, public address, audiovisual, nurse call and building management systems.',
      titleAr: 'التيار الخفيف والأنظمة الذكية',
      shortAr:
        'الشبكات الهيكلية، كاميرات المراقبة الشبكية، التحكم في الدخول، النداء العام، الأنظمة المرئية والصوتية وأنظمة إدارة المباني.',
    },
    {
      order: 6,
      slug: 'plumbing-sanitary',
      icon: 'plumbing',
      image: 'svc-plumbing.png',
      titleEn: 'Plumbing & Sanitary Networks',
      shortEn:
        'Domestic water supply, booster pumps, drainage, storm water, solar/central water heating and sanitary fixtures.',
      titleAr: 'السباكة والشبكات الصحية',
      shortAr:
        'شبكات تغذية المياه، مضخات الرفع، الصرف الصحي وتصريف مياه الأمطار، السخانات المركزية والشمسية والأدوات الصحية.',
    },
    {
      order: 7,
      slug: 'data-center-infrastructure',
      icon: 'mep',
      image: 'svc-datacenter.png',
      titleEn: 'Data Center Infrastructure',
      shortEn:
        'Server rooms, raised floors, precision cooling, UPS & power distribution, structured fiber/copper cabling and environmental monitoring.',
      titleAr: 'البنية التحتية لمراكز البيانات',
      shortAr:
        'غرف الخوادم، الأرضيات المرفوعة، التبريد الدقيق، وحدات عدم انقطاع التيار (UPS)، كابلات الألياف والنحاس ومراقبة البيئة.',
    },
    {
      order: 8,
      slug: 'general-contracting-civil',
      icon: 'contracting',
      image: 'svc-civil.png',
      titleEn: 'General Contracting & Civil Works',
      shortEn:
        'Turnkey electromechanical fit-out, plant rooms, trenching, structural supports and architectural finishing tied to MEP scope.',
      titleAr: 'المقاولات العامة والأعمال المدنية',
      shortAr:
        'التجهيزات الكهروميكانيكية المتكاملة، غرف الماكينات، الحفريات، الدعامات الإنشائية والتشطيبات المعمارية المرتبطة بنطاق MEP.',
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
      featured: true,
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

  // 3. Seed 6 Featured Projects
  const projectsSpec = [
    {
      order: 1,
      slug: 'al-khalil-investment-makkah',
      category: 'low-current',
      scope: ['low-current', 'hvac'],
      status: 'completed',
      image: 'proj-tower.png',
      titleEn: 'Al Khalil Investment Project',
      locationEn: 'Makkah — Ibrahim Al Khalil Rd.',
      scopeSummaryEn: 'LOW CURRENT SCS',
      summaryEn:
        'Full low-current and structured cabling infrastructure across a landmark hospitality and commercial development in Makkah.',
      titleAr: 'مشروع الخليل الاستثماري',
      locationAr: 'مكة المكرمة — شارع إبراهيم الخليل',
      scopeSummaryAr: 'أنظمة التيار الخفيف والشبكات',
      summaryAr:
        'تنفيذ كامل للبنية التحتية لأنظمة التيار الخفيف والشبكات الهيكلية في مشروع فندقي وتجاري بارز بمكة المكرمة.',
    },
    {
      order: 2,
      slug: 'king-abdullah-tunnel-exit-10',
      category: 'mep',
      scope: ['hvac', 'fire-fighting', 'electrical'],
      status: 'completed',
      image: 'proj-tunnel.png',
      titleEn: 'King Abdullah Road Tunnel — Exit 10',
      locationEn: 'Riyadh — King Abdullah Rd.',
      scopeSummaryEn: 'FULL MEP WORKS',
      summaryEn:
        'Jet ventilation, firefighting networks, power distribution and monitoring systems for a major urban roadway tunnel.',
      titleAr: 'نفق طريق الملك عبدالله — مخرج 10',
      locationAr: 'الرياض — طريق الملك عبدالله',
      scopeSummaryAr: 'أعمال كهروميكانيكية متكاملة',
      summaryAr:
        'أنظمة التهوية النفاثة، شبكات مكافحة الحريق، توزيع الطاقة وأنظمة المراقبة لنفق مروري رئيسي بالرياض.',
    },
    {
      order: 3,
      slug: 'enterprise-data-center-riyadh',
      category: 'data-center',
      scope: ['data-center', 'low-current', 'electrical'],
      status: 'in-progress',
      image: 'proj-datacenter.png',
      titleEn: 'Enterprise Data Center — Riyadh',
      locationEn: 'Riyadh — North Business District',
      scopeSummaryEn: 'DATA CENTER MEP',
      summaryEn:
        'Precision cooling, dual-bus UPS distribution, clean-agent suppression and high-density fiber backbone.',
      titleAr: 'مركز بيانات الأعمال — الرياض',
      locationAr: 'الرياض — حي الأعمال الشمالي',
      scopeSummaryAr: 'تجهيز مراكز البيانات',
      summaryAr:
        'أنظمة التبريد الدقيق، توزيع الطاقة المزدوج UPS، الإطفاء بالغازات النظيفة وشبكات الألياف الضوئية عالية الكثافة.',
    },
    {
      order: 4,
      slug: 'specialized-medical-complex-riyadh',
      category: 'mep',
      scope: ['hvac', 'plumbing', 'fire-fighting', 'electrical'],
      status: 'completed',
      image: 'proj-hospital.png',
      titleEn: 'Specialized Medical Complex',
      locationEn: 'Riyadh — Al Olaya',
      scopeSummaryEn: 'HEALTHCARE MEP',
      summaryEn:
        'Hygienic air handling, medical gas coordination, life-safety power and complete sanitary networks.',
      titleAr: 'المجمع الطبي التخصصي',
      locationAr: 'الرياض — العليا',
      scopeSummaryAr: 'أنظمة كهروميكانيكية طبية',
      summaryAr:
        'وحدات مناولة الهواء الصحية، تنسيق الغازات الطبية، أنظمة طاقة الطوارئ والشبكات الصحية المتكاملة.',
    },
    {
      order: 5,
      slug: 'commercial-plaza-retail-strip',
      category: 'fire-fighting',
      scope: ['fire-fighting', 'hvac', 'electrical'],
      status: 'in-progress',
      image: 'proj-mall.png',
      titleEn: 'Commercial Plaza & Retail Strip',
      locationEn: 'Riyadh — Al Narjis',
      scopeSummaryEn: 'FIRE & HVAC',
      summaryEn:
        'Civil Defense firefighting, smoke management, rooftop package HVAC and tenant power distribution.',
      titleAr: 'البلازا التجارية والمجمع التجاري',
      locationAr: 'الرياض — النرجس',
      scopeSummaryAr: 'مكافحة الحريق والتكييف',
      summaryAr:
        'أنظمة مكافحة الحريق المعتمدة من الدفاع المدني، إدارة الدخان، وحدات التكييف المدمجة وتوزيع الطاقة للمتاجر.',
    },
    {
      order: 6,
      slug: 'cold-storage-logistics-hub',
      category: 'civil-mep',
      scope: ['hvac', 'plumbing', 'civil'],
      status: 'completed',
      image: 'proj-warehouse.png',
      titleEn: 'Cold-Storage & Logistics Hub',
      locationEn: 'Riyadh — Al Kharj Industrial Rd.',
      scopeSummaryEn: 'INDUSTRIAL MEP',
      summaryEn:
        'Industrial refrigeration, insulated plant rooms, high-bay LED lighting and ESFR sprinkler protection.',
      titleAr: 'مركز المستودعات المبردة والخدمات اللوجستية',
      locationAr: 'الرياض — طريق الخرج الصناعي',
      scopeSummaryAr: 'أنظمة صناعية ومستودعات',
      summaryAr:
        'التبريد الصناعي، غرف الماكينات المعزولة، إنارة المستودعات العالية وأنظمة الرش الآلي المبكر ESFR.',
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

  // 4. Seed 20 Marquee Brands
  const brandsSpec = [
    ['ABB', 'brand-abb.png'],
    ['Schneider Electric', 'brand-schneider.png'],
    ['Siemens', 'brand-siemens.png'],
    ['Legrand', 'brand-legrand.png'],
    ['3M', 'brand-3m.png'],
    ['York', 'brand-york.png'],
    ['Gree', 'brand-gree.png'],
    ['Daikin', 'brand-daikin.png'],
    ['Honeywell', 'brand-honeywell.png'],
    ['Notifier', 'brand-notifier.png'],
    ['Simplex', 'brand-simplex.png'],
    ['Bosch', 'brand-bosch.png'],
    ['Hikvision', 'brand-hikvision.png'],
    ['Cisco', 'brand-cisco.png'],
    ['CommScope', 'brand-commscope.png'],
    ['Panduit', 'brand-panduit.png'],
    ['Corning', 'brand-corning.png'],
    ['Grohe', 'brand-grohe.png'],
    ['Grundfos', 'brand-Grundfos.png'],
    ['Alfanar', 'brand-abb.png'],
  ]
  const existingBrands = await apiRequest(baseUrl, token, '/api/brands?limit=50')
  for (let i = 0; i < brandsSpec.length; i++) {
    const [name, imgFile] = brandsSpec[i]
    const order = i + 1
    const logoId = mediaIds[imgFile]
    const found = (existingBrands.docs || []).find((d) => d.name === name)
    if (found) {
      await apiRequest(baseUrl, token, `/api/brands/${found.id}`, {
        method: 'PATCH',
        locale: 'ar',
        body: { name, logo: logoId, showInMarquee: true, order },
      })
      await apiRequest(baseUrl, token, `/api/brands/${found.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: { name, logo: logoId, showInMarquee: true, order },
      })
    } else {
      const created = await apiRequest(baseUrl, token, '/api/brands', {
        method: 'POST',
        locale: 'ar',
        body: { name, logo: logoId, showInMarquee: true, order },
      })
      await apiRequest(baseUrl, token, `/api/brands/${created.doc.id}`, {
        method: 'PATCH',
        locale: 'en',
        body: { name },
      })
    }
  }

  // 5. Seed site-settings & navigation globals
  await apiRequest(baseUrl, token, '/api/globals/site-settings', {
    method: 'POST',
    locale: 'ar',
    body: {
      companyName: 'شركة الجزيرة للإمداد الذكي',
      tagline: 'حلول الأعمال الكهروميكانيكية والهندسة الذكية · الرياض، المملكة العربية السعودية',
      footerText:
        'شركة سعودية رائدة في المقاولات الكهروميكانيكية وأنظمة مكافحة الحريق والتيار الخفيف والحلول الهندسية الذكية في المملكة العربية السعودية.',
      phone: '+966 57 353 4185',
      email: 'info@aljazira-imdad.sa',
      whatsapp: '966573534185',
      whatsappLabel: 'تواصل معنا عبر واتساب',
      address: 'حي السليمانية، الرياض، المملكة العربية السعودية',
      copyright: '© 2026 شركة الجزيرة للإمداد الذكي. جميع الحقوق محفوظة.',
      defaultSeo: {
        title: 'شركة الجزيرة للإمداد الذكي — المقاولات الكهروميكانيكية والأنظمة الذكية',
        description:
          'مقاولات متكاملة للأعمال الكهروميكانيكية ومكافحة الحريق والتيار الخفيف والبنية التحتية الذكية في الرياض والمملكة العربية السعودية.',
        image: mediaIds['hero-city.png'],
      },
    },
  })
  await apiRequest(baseUrl, token, '/api/globals/site-settings', {
    method: 'POST',
    locale: 'en',
    body: {
      companyName: 'Al Jazira for Imdad Smart Co.',
      tagline: 'MEP & Smart Engineering Solutions · Riyadh, KSA',
      footerText:
        'Riyadh-based electromechanical, firefighting, low-current and smart engineering contractor delivering precision execution across Saudi Arabia.',
      whatsappLabel: 'Chat with us on WhatsApp',
      address: 'Al Sulimaniyah Dist., Riyadh, Kingdom of Saudi Arabia',
      copyright: '© 2026 Al Jazira for Imdad Smart Co. All rights reserved.',
      defaultSeo: {
        title: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering Contractors',
        description:
          'Full-scope electromechanical, firefighting, low-current and smart infrastructure contracting across Saudi Arabia.',
        image: mediaIds['hero-city.png'],
      },
    },
  })

  await apiRequest(baseUrl, token, '/api/globals/navigation', {
    method: 'POST',
    locale: 'ar',
    body: {
      header: [
        { label: 'الرئيسية', link: { type: 'internal', internalRoute: '/' } },
        { label: 'من نحن', link: { type: 'internal', internalRoute: '/about' } },
        { label: 'خدماتنا', link: { type: 'internal', internalRoute: '/services' } },
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
            { label: 'من نحن', link: { type: 'internal', internalRoute: '/about' } },
            { label: 'خدماتنا', link: { type: 'internal', internalRoute: '/services' } },
            { label: 'مشاريعنا', link: { type: 'internal', internalRoute: '/projects' } },
            { label: 'تواصل معنا', link: { type: 'internal', internalRoute: '/contact' } },
            { label: 'سياسة الخصوصية', link: { type: 'internal', internalRoute: '/privacy' } },
          ],
        },
      ],
      footerCta: {
        title: 'هل لديك مشروع قادم؟',
        text: 'تواصل مع فريقنا الهندسي لدراسة نطاق مشروعك وتقديم عرض فني ومالي متكامل.',
        button: {
          label: 'اطلب عرض سعر',
          link: { type: 'internal', internalRoute: '/contact' },
        },
        whatsappLabel: 'أو تحدث عبر واتساب ←',
      },
    },
  })
  await apiRequest(baseUrl, token, '/api/globals/navigation', {
    method: 'POST',
    locale: 'en',
    body: {
      header: [
        { label: 'Home', link: { type: 'internal', internalRoute: '/' } },
        { label: 'About Us', link: { type: 'internal', internalRoute: '/about' } },
        { label: 'Services', link: { type: 'internal', internalRoute: '/services' } },
        { label: 'Projects', link: { type: 'internal', internalRoute: '/projects' } },
        { label: 'Contact', link: { type: 'internal', internalRoute: '/contact' } },
      ],
      headerCta: {
        label: 'Get a Quote',
        link: { type: 'internal', internalRoute: '/contact' },
      },
      footer: [
        {
          title: 'Quick Links',
          links: [
            { label: 'Home', link: { type: 'internal', internalRoute: '/' } },
            { label: 'About Us', link: { type: 'internal', internalRoute: '/about' } },
            { label: 'Services', link: { type: 'internal', internalRoute: '/services' } },
            { label: 'Projects', link: { type: 'internal', internalRoute: '/projects' } },
            { label: 'Contact Us', link: { type: 'internal', internalRoute: '/contact' } },
            { label: 'Privacy Policy', link: { type: 'internal', internalRoute: '/privacy' } },
          ],
        },
      ],
      footerCta: {
        title: 'Have an Upcoming Project?',
        text: 'Speak with our engineering team for a complete technical and commercial proposal.',
        button: {
          label: 'Get a Quote',
          link: { type: 'internal', internalRoute: '/contact' },
        },
        whatsappLabel: 'Or chat on WhatsApp →',
      },
    },
  })

  // 6. Seed home-page global in ar and en
  const homeAr = {
    _status: 'published',
    hero: {
      enabled: true,
      eyebrow: 'مقاولو الأعمال الكهروميكانيكية والهندسة الذكية · الرياض، السعودية',
      title: 'حلول هندسية ذكية\nللمشاريع الكبرى',
      subtitle:
        'مقاولات متكاملة للأعمال الكهروميكانيكية ومكافحة الحريق والتيار الخفيف والبنية التحتية الذكية — ننفذها بدقة والتزام كامل بمعايير السلامة والجودة في جميع أنحاء المملكة.',
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
      title: 'شريك هندسي متكامل للأعمال الكهروميكانيكية قائم على الدقة',
      text: makeLexical(
        [
          'شركة الجزيرة للإمداد الذكي هي شركة هندسة ومقاولات مقرها الرياض متخصصة في الأنظمة الكهروميكانيكية ومكافحة الحريق والتيار الخفيف والأنظمة الذكية للمشاريع الحكومية والتجارية والصناعية.',
          'من تنسيق التصميم ونمذجة BIM إلى التوريد والتركيب والفحص والتشغيل (T&C)، تدير فرقنا الهندسية كل تخصص تحت سقف واحد لتسليم المشاريع في موعدها ووفق أعلى الاشتراطات.',
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
      eyebrow: 'خدماتنا الأساسية',
      title: 'تخصصات شاملة في الأعمال الكهروميكانيكية والمقاولات',
      intro:
        'ثمانية تخصصات هندسية متكاملة تنفذها كوادرنا المتخصصة — من شبكات الجهد المتوسط والمنخفض والتكييف إلى مكافحة الحريق ومراكز البيانات.',
      button: {
        label: 'عرض جميع الخدمات',
        link: { type: 'internal', internalRoute: '/services' },
      },
    },
    interactiveSystems: {
      enabled: true,
      eyebrow: 'الأنظمة التفاعلية',
      title: 'استكشف كل نظام داخل المبنى',
      intro:
        'اضغط على أي تخصص لاستعراض كيفية تكامل أنظمتنا الكهروميكانيكية داخل المنشأة الحديثة — أو افتح النموذج التفاعلي ثلاثي الأبعاد.',
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
      text: 'سجل حافل بالإنجاز في أهم القطاعات الحيوية بالمملكة — بدعم كوادرنا الهندسية المعتمدة وشركائنا العالميين.',
      stats: statIds,
    },
    featuredProjects: {
      enabled: true,
      eyebrow: 'سجل أعمالنا',
      title: 'مشاريع رائدة في مختلف أنحاء المملكة',
      intro:
        'مختارات من المشاريع المنفذة والجارية التي تعكس قدراتنا في البنية التحتية والضيافة والمجمعات التجارية ومراكز البيانات.',
      button: {
        label: 'استعراض جميع المشاريع',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    partners: {
      enabled: true,
      eyebrow: 'شركاء النجاح',
      title: 'كبرى العلامات والمصنّعين العالميين الذين نعمل معهم',
      intro:
        'مقاول ومورّد معتمد لأبرز العلامات التجارية العالمية في أنظمة الكهرباء والتكييف ومكافحة الحريق والتيار الخفيف.',
    },
    cta: {
      enabled: true,
      title: 'هل أنت مستعد لبدء\nمشروعك القادم؟',
      text: 'شاركنا نطاق مشروعك أو جداول الكميات (BOQ) — وسيقوم فريقنا الهندسي بإعداد عرض فني ومالي مفصل.',
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
        'مقاولات متكاملة للأعمال الكهروميكانيكية ومكافحة الحريق والتيار الخفيف والبنية التحتية الذكية في الرياض والمملكة العربية السعودية.',
      image: mediaIds['hero-city.png'],
    },
  }

  const savedHomeAr = await apiRequest(baseUrl, token, '/api/globals/home-page', {
    method: 'POST',
    locale: 'ar',
    body: homeAr,
  })
  const existingSystemIds = (savedHomeAr?.interactiveSystems?.systems || []).map((s) => s.id)

  const homeEn = {
    _status: 'published',
    hero: {
      enabled: true,
      eyebrow: 'MEP & SMART ENGINEERING CONTRACTORS · RIYADH, KSA',
      title: 'Smart Engineering\nSolutions for Mega Projects',
      subtitle:
        'Full-scope electromechanical, firefighting, low-current and smart infrastructure contracting — delivered with precision, safety and on-schedule execution across Saudi Arabia.',
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
      eyebrow: 'WHO WE ARE',
      title: 'An Integrated MEP Engineering Partner Built on Precision',
      text: makeLexical(
        [
          'Al Jazira for Imdad Smart Co. is a Riyadh-based engineering and contracting company specializing in electromechanical systems, firefighting, low-current and smart building solutions for commercial, industrial and governmental developments.',
          'From design coordination and BIM modeling to installation, testing and commissioning, our engineers and technicians manage every discipline under one roof — ensuring seamless integration and reliable handover.',
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
      eyebrow: 'CORE SERVICES',
      title: 'Comprehensive MEP & Contracting Disciplines',
      intro:
        'Eight integrated engineering capabilities delivered by our in-house teams — from high-voltage power and HVAC plants to smart ELV systems.',
      button: {
        label: 'View All Services',
        link: { type: 'internal', internalRoute: '/services' },
      },
    },
    interactiveSystems: {
      enabled: true,
      eyebrow: 'INTERACTIVE SYSTEMS',
      title: 'Explore Every System Inside the Building',
      intro:
        'Click any discipline to inspect how our MEP systems work together inside a modern facility — or launch the live interactive 3D view.',
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
      text: 'Proven track record across Saudi Arabia’s most demanding sectors — backed by certified engineers and global manufacturer partnerships.',
      stats: statIds,
    },
    featuredProjects: {
      enabled: true,
      eyebrow: 'OUR PORTFOLIO',
      title: 'Landmark Projects Across the Kingdom',
      intro:
        'Selected engagements demonstrating our capability across infrastructure, hospitality, commercial complexes and mission-critical facilities.',
      button: {
        label: 'View All Projects',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    partners: {
      enabled: true,
      eyebrow: 'TRUSTED PARTNERS',
      title: 'Global Manufacturers We Work With',
      intro:
        'Certified installer and supply partner for leading international electrical, HVAC, firefighting and low-current brands.',
    },
    cta: {
      enabled: true,
      title: 'Ready to Start Your\nNext Project?',
      text: 'Share your project scope or BOQ with our engineering team — we will prepare a detailed technical and commercial proposal.',
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
        'Full-scope electromechanical, firefighting, low-current and smart infrastructure contracting across Saudi Arabia.',
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
  evidenceDir = path.resolve(process.cwd(), 'docs/evidence/P3-T4'),
  phase3Dir = path.resolve(process.cwd(), 'docs/evidence/phase-3'),
} = {}) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.mkdirSync(phase3Dir, { recursive: true })
  const destDirs = [evidenceDir, phase3Dir]
  const headerBlock = getRepoHeaderBlock()

  console.log(`[P3-T4 Evidence] Seeding CMS via Payload REST API at ${baseUrl}...`)
  const token = await ensureAdminAuthToken(baseUrl)
  await seedHomePageData(baseUrl, token)
  console.log(`[P3-T4 Evidence] CMS seeded and published in ar and en.`)

  const browser = await chromium.launch({ headless: true })

  try {
    // =========================================================================
    // 1. R-17 & R-19 Verification: TeamCard Enter 2 clipping & hover shadow fade
    // =========================================================================
    {
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
      const enter2PngPath = path.join(evidenceDir, 'team-card-enter-2-clipped.png')
      await enter2Locator.screenshot({ path: enter2PngPath })
      copyToDirs(enter2PngPath, destDirs)

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
      const r17LogPath = path.join(evidenceDir, 'r17-r19-team-card.log')
      fs.writeFileSync(r17LogPath, r17Log, 'utf8')
      copyToDirs(r17LogPath, destDirs)
      await ctx.close()
    }

    // =========================================================================
    // 2. Intro Splash Recording & Verification (`28:1609` -> `28:1615`, CTO §3)
    // =========================================================================
    {
      const videoTmpDir = path.join(evidenceDir, '_video_tmp')
      fs.mkdirSync(videoTmpDir, { recursive: true })

      // 2a. Record live intro video on fresh session (/en)
      const videoCtx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        recordVideo: { dir: videoTmpDir, size: { width: 1440, height: 900 } },
      })
      const videoPage = await videoCtx.newPage()
      const t0 = Date.now()
      await videoPage.goto(`${baseUrl}/en`, { waitUntil: 'domcontentloaded' })

      // Capture start state (`28:1609`) immediately
      const introLocator = videoPage.locator('[data-component="intro-splash"]')
      const startVisible = await introLocator.isVisible().catch(() => false)
      const startPngPath = path.join(evidenceDir, 'intro-start-en.png')
      await videoPage.screenshot({ path: startPngPath })
      copyToDirs(startPngPath, destDirs)

      // Wait ~380ms for reveal state (`28:1615`)
      await videoPage.waitForTimeout(380)
      const revealStateAttr = await introLocator.getAttribute('data-intro-state').catch(() => null)
      const revealPngPath = path.join(evidenceDir, 'intro-reveal-en.png')
      await videoPage.screenshot({ path: revealPngPath })
      copyToDirs(revealPngPath, destDirs)

      // Stitch side-by-side against Figma `00-intro-start.png` and `00-intro-reveal.png`
      const figmaIntroStart = path.resolve(
        process.cwd(),
        'design/screenshots/overlays/00-intro-start.png',
      )
      const figmaIntroReveal = path.resolve(
        process.cwd(),
        'design/screenshots/overlays/00-intro-reveal.png',
      )
      if (fs.existsSync(figmaIntroStart)) {
        const sbsStart = path.join(evidenceDir, 'side-by-side-00-intro-start.png')
        await createSideBySideImage(
          [fs.readFileSync(figmaIntroStart), fs.readFileSync(startPngPath)],
          sbsStart,
        )
        copyToDirs(sbsStart, destDirs)
      }
      if (fs.existsSync(figmaIntroReveal)) {
        const sbsReveal = path.join(evidenceDir, 'side-by-side-00-intro-reveal.png')
        await createSideBySideImage(
          [fs.readFileSync(figmaIntroReveal), fs.readFileSync(revealPngPath)],
          sbsReveal,
        )
        copyToDirs(sbsReveal, destDirs)
      }

      // Verify LCP <h1> is already rendered in the DOM while the intro is visible
      const h1RenderedDuringIntro = await videoPage.evaluate(() => {
        const h1 = document.querySelector('h1')
        return Boolean(h1 && h1.textContent && h1.textContent.trim().length > 0)
      })

      // Wait for intro to auto-dismiss (<= 1.6s total)
      await introLocator.waitFor({ state: 'detached', timeout: 2200 })
      const totalElapsedMs = Date.now() - t0
      const storageAfterFirstLoad = await videoPage.evaluate(() =>
        window.sessionStorage.getItem('aljazira_intro_seen'),
      )

      // Reload in same session -> intro must NOT appear again
      await videoPage.reload({ waitUntil: 'domcontentloaded' })
      await videoPage.waitForTimeout(150)
      const visibleOnSecondVisit = await introLocator.isVisible().catch(() => false)

      const recordedVideo = videoPage.video()
      await videoPage.close()
      await videoCtx.close()
      if (recordedVideo) {
        const videoSrcPath = await recordedVideo.path()
        const finalVideoPath = path.join(evidenceDir, 'intro-splash-en.webm')
        fs.copyFileSync(videoSrcPath, finalVideoPath)
        copyToDirs(finalVideoPath, destDirs)
      }
      fs.rmSync(videoTmpDir, { recursive: true, force: true })

      // 2b. Verify Escape key skip in a fresh session
      const escCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const escPage = await escCtx.newPage()
      await escPage.goto(`${baseUrl}/ar`, { waitUntil: 'domcontentloaded' })
      await escPage.waitForTimeout(80)
      const visibleBeforeEscape = await escPage
        .locator('[data-component="intro-splash"]')
        .isVisible()
        .catch(() => false)
      await escPage.keyboard.press('Escape')
      await escPage.waitForTimeout(50)
      const visibleAfterEscape = await escPage
        .locator('[data-component="intro-splash"]')
        .isVisible()
        .catch(() => false)
      await escCtx.close()

      // 2c. Verify prefers-reduced-motion: reduce suppresses intro completely
      const rmCtx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      })
      const rmPage = await rmCtx.newPage()
      await rmPage.goto(`${baseUrl}/ar`, { waitUntil: 'domcontentloaded' })
      await rmPage.waitForTimeout(100)
      const visibleWithReducedMotion = await rmPage
        .locator('[data-component="intro-splash"]')
        .isVisible()
        .catch(() => false)
      await rmCtx.close()

      const introAudit = {
        startVisible,
        revealStateAttr,
        h1RenderedDuringIntro,
        totalElapsedMs,
        storageAfterFirstLoad,
        visibleOnSecondVisit,
        visibleBeforeEscape,
        visibleAfterEscape,
        visibleWithReducedMotion,
      }
      const introLog = [
        headerBlock,
        '=== Intro Splash Verification (28:1609 -> 28:1615, CTO decision §3) ===',
        JSON.stringify(introAudit, null, 2),
        '',
      ].join('\n')
      const introLogPath = path.join(evidenceDir, 'intro-verification.log')
      fs.writeFileSync(introLogPath, introLog, 'utf8')
      copyToDirs(introLogPath, destDirs)
    }

    // =========================================================================
    // 3. Full-page Screenshots (1440 / 768 / 390 in ar & en), Section Side-by-Sides,
    //    Console/Hydration/CSP Audit, R-27 44x44px Touch Target Audit, and CLS
    // =========================================================================
    const consoleErrors = []
    const pageErrors = []
    const cspViolations = []
    const hydrationWarnings = []

    const viewports = [
      { width: 1440, height: 900, label: '1440' },
      { width: 768, height: 1024, label: '768' },
      { width: 390, height: 844, label: '390' },
    ]

    const sectionBuffersByLocale = { en: {}, ar: {} }
    const touchTargetReport390 = { ar: [], en: [] }
    const clsReport = {}

    for (const locale of ['ar', 'en']) {
      for (const vp of viewports) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          reducedMotion: 'reduce',
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
                if (!entry.hadRecentInput) {
                  window.__aljaziraClsValue += entry.value
                }
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

        const fullScreenshotPath = path.join(evidenceDir, `home-${locale}-${vp.label}.png`)
        await page.screenshot({ path: fullScreenshotPath, fullPage: true })
        copyToDirs(fullScreenshotPath, destDirs)

        const pageCspEvents = await page.evaluate(() => window.__aljaziraCspEvents || [])
        for (const ev of pageCspEvents) {
          cspViolations.push(`[${locale}@${vp.label}] ${ev.violatedDirective}: ${ev.blockedURI}`)
        }

        const clsVal = await page.evaluate(() =>
          Number((window.__aljaziraClsValue || 0).toFixed(5)),
        )
        clsReport[`${locale}-${vp.label}`] = clsVal

        if (vp.width === 1440) {
          // Hide fixed navbar/fab temporarily when capturing individual section screenshots
          // except for 01-hero? Actually in 01-hero.png Figma screenshot, Navbar is NOT inside 01-hero.png (`10-navbar.png` is separate).
          await page.addStyleTag({
            content:
              '[data-component="navbar"], [data-component="whatsapp-fab"] { visibility: hidden !important; }',
          })
          await page.waitForTimeout(50)

          for (const sec of HOME_SECTION_COMPARISONS) {
            const loc = page.locator(sec.selector).first()
            if ((await loc.count()) > 0) {
              await loc.scrollIntoViewIfNeeded()
              await page.waitForTimeout(50)
              const buf = await loc.screenshot()
              sectionBuffersByLocale[locale][sec.key] = buf
              const secPath = path.join(evidenceDir, `section-${sec.key}-${locale}-1440.png`)
              fs.writeFileSync(secPath, buf)
              copyToDirs(secPath, destDirs)
            }
          }
        }

        if (vp.width === 390) {
          // R-27: Verify every visible interactive control on Home page is >= 44x44px (or >= 44px height for full-width/inline links)
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

    // Stitch 1440 section side-by-side images (`Figma | EN | AR`)
    const figmaSectionsDir = path.resolve(process.cwd(), 'design/screenshots/sections/01-home')
    for (const sec of HOME_SECTION_COMPARISONS) {
      const figmaPath = path.join(figmaSectionsDir, sec.figmaFile)
      const enBuf = sectionBuffersByLocale.en[sec.key]
      const arBuf = sectionBuffersByLocale.ar[sec.key]
      if (fs.existsSync(figmaPath) && enBuf && arBuf) {
        const outPath = path.join(evidenceDir, sec.outName)
        await createSideBySideImage([fs.readFileSync(figmaPath), enBuf, arBuf], outPath)
        copyToDirs(outPath, destDirs)
      }
    }

    // Stitch full-page 1440 comparison (`Figma 01-home.png | EN 1440 | AR 1440`)
    const figmaFullHomePath = path.resolve(process.cwd(), 'design/screenshots/pages/01-home.png')
    const enFull1440Path = path.join(evidenceDir, 'home-en-1440.png')
    const arFull1440Path = path.join(evidenceDir, 'home-ar-1440.png')
    if (
      fs.existsSync(figmaFullHomePath) &&
      fs.existsSync(enFull1440Path) &&
      fs.existsSync(arFull1440Path)
    ) {
      const outFullSbs = path.join(evidenceDir, 'side-by-side-home-1440.png')
      await createSideBySideImage(
        [
          fs.readFileSync(figmaFullHomePath),
          fs.readFileSync(enFull1440Path),
          fs.readFileSync(arFull1440Path),
        ],
        outFullSbs,
      )
      copyToDirs(outFullSbs, destDirs)
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
    const touchLogPath = path.join(evidenceDir, 'r27-touch-targets-390.log')
    fs.writeFileSync(touchLogPath, touchLog, 'utf8')
    copyToDirs(touchLogPath, destDirs)
    if (undersizedControls.length > 0) {
      throw new Error(
        `R-27 violation: found ${undersizedControls.length} controls < 44x44px at 390px: ${JSON.stringify(undersizedControls)}`,
      )
    }

    // Save Console / Hydration / CSP / CLS log
    const maxCls = Math.max(...Object.values(clsReport), 0)
    const runtimeLog = [
      headerBlock,
      '=== Console, Hydration, CSP & CLS Audit (/ar and /en across 1440, 768, 390) ===',
      `consoleErrors: ${consoleErrors.length}`,
      `pageErrors: ${pageErrors.length}`,
      `hydrationWarnings: ${hydrationWarnings.length}`,
      `cspViolations: ${cspViolations.length}`,
      `maxCls: ${maxCls}`,
      JSON.stringify(
        { clsReport, consoleErrors, pageErrors, hydrationWarnings, cspViolations },
        null,
        2,
      ),
      '',
    ].join('\n')
    const runtimeLogPath = path.join(evidenceDir, 'runtime-csp-cls.log')
    fs.writeFileSync(runtimeLogPath, runtimeLog, 'utf8')
    copyToDirs(runtimeLogPath, destDirs)

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
    // 4. CMS Live Roundtrip: Draft isolation + Edit -> Publish -> Visible + `enabled: false`
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

      // 4b. Publish (`_status: 'published'`) an edit AND toggle `partners.enabled: false`
      await apiRequest(baseUrl, token, '/api/globals/home-page', {
        method: 'POST',
        locale: 'en',
        body: {
          _status: 'published',
          statsSection: {
            enabled: true,
            title: 'Trusted by Industry Leaders — Live CMS Verified',
          },
          partners: {
            enabled: false,
          },
        },
      })

      const anonAfterPublishHtml = await (await fetch(`${baseUrl}/en`)).text()
      const publishedTitleVisible = anonAfterPublishHtml.includes(
        'Trusted by Industry Leaders — Live CMS Verified',
      )
      const partnersSectionHiddenWhenDisabled = !anonAfterPublishHtml.includes(
        'data-home-section="partners"',
      )

      // Restore original published state
      await apiRequest(baseUrl, token, '/api/globals/home-page', {
        method: 'POST',
        locale: 'en',
        body: {
          _status: 'published',
          statsSection: {
            enabled: true,
            title: 'Trusted by Industry Leaders',
          },
          partners: {
            enabled: true,
          },
        },
      })
      const anonRestoredHtml = await (await fetch(`${baseUrl}/en`)).text()
      const partnersSectionRestored = anonRestoredHtml.includes('data-home-section="partners"')

      const cmsRoundtripAudit = {
        draftLeakedToAnon,
        publishedTitleVisible,
        partnersSectionHiddenWhenDisabled,
        partnersSectionRestored,
      }
      const cmsLog = [
        headerBlock,
        '=== CMS Live Roundtrip & Section `enabled` Toggle Verification ===',
        JSON.stringify(cmsRoundtripAudit, null, 2),
        '',
      ].join('\n')
      const cmsLogPath = path.join(evidenceDir, 'cms-live-roundtrip.log')
      fs.writeFileSync(cmsLogPath, cmsLog, 'utf8')
      copyToDirs(cmsLogPath, destDirs)

      if (
        draftLeakedToAnon ||
        !publishedTitleVisible ||
        !partnersSectionHiddenWhenDisabled ||
        !partnersSectionRestored
      ) {
        throw new Error(`CMS roundtrip verification failed: ${JSON.stringify(cmsRoundtripAudit)}`)
      }
    }

    // =========================================================================
    // 5. Preliminary Mobile Performance & Accessibility Metrics on `/ar` (`390x844`)
    // =========================================================================
    {
      const perfCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      })
      await perfCtx.addInitScript(() => {
        window.sessionStorage.setItem('aljazira_intro_seen', '1')
      })
      const perfPage = await perfCtx.newPage()
      await perfPage.goto(`${baseUrl}/ar`, { waitUntil: 'networkidle' })
      await perfPage.evaluate(() => document.fonts.ready)

      const perfMetrics = await perfPage.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0]
        const paints = performance.getEntriesByType('paint')
        const fcp = paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? null
        return {
          url: window.location.href,
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          ttfbMs: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
          fcpMs: fcp !== null ? Math.round(fcp) : null,
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
          sectionsRendered: Array.from(document.querySelectorAll('[data-home-section]')).map((el) =>
            el.getAttribute('data-home-section'),
          ),
          imagesMissingAltCount: Array.from(document.querySelectorAll('img')).filter(
            (img) => !img.hasAttribute('alt'),
          ).length,
          buttonsMissingAccessibleNameCount: Array.from(document.querySelectorAll('button')).filter(
            (btn) => !(btn.textContent?.trim() || btn.getAttribute('aria-label')?.trim()),
          ).length,
        }
      })
      await perfCtx.close()

      const perfLog = [
        headerBlock,
        '=== Preliminary Mobile Performance & Accessibility Audit on /ar (390x844) ===',
        JSON.stringify(perfMetrics, null, 2),
        '',
      ].join('\n')
      const perfLogPath = path.join(evidenceDir, 'lighthouse-mobile-ar.log')
      fs.writeFileSync(perfLogPath, perfLog, 'utf8')
      copyToDirs(perfLogPath, destDirs)
    }
  } finally {
    await browser.close()
  }

  console.log(`[P3-T4 Evidence] All P3-T4 evidence artifacts generated in ${evidenceDir}`)
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/evidence/p3-t4-evidence.mjs')
) {
  const baseUrl = process.argv[2] || process.env.EVIDENCE_BASE_URL || 'http://localhost:3000'
  const evidenceDir = process.argv[3] || path.resolve(process.cwd(), 'docs/evidence/P3-T4')
  const phase3Dir = process.argv[4] || path.resolve(process.cwd(), 'docs/evidence/phase-3')

  runP3T4Evidence({ baseUrl, evidenceDir, phase3Dir }).catch((err) => {
    console.error('[P3-T4 Evidence] ERROR:', err)
    process.exit(1)
  })
}
