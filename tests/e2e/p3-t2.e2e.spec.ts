import { expect, test } from '@playwright/test'

test.describe('P3-T2 — Shell & Primitives Interactive E2E (R-9)', () => {
  test('mobile drawer focus trap (Tab / Shift+Tab), Escape close + focus restore, Accordion click toggle, and language switcher click', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/ar/styleguide', { waitUntil: 'networkidle' })

    const menuButton = page.locator('header[data-component="navbar"] button[aria-controls]').first()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    // 1. Open drawer via hamburger button click
    await menuButton.click()
    const drawerDialog = page.locator('[data-navbar-drawer="open"]')
    await expect(drawerDialog).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    // 2. Focus trap: Shift+Tab moves to drawer brand logo (1st element), second Shift+Tab wraps to last element (CTA button)
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator(':focus')).toHaveAttribute('href', '/ar')

    await page.keyboard.press('Shift+Tab')
    await expect(page.locator(':focus')).toHaveAttribute('href', '/ar/contact#quote')

    // Tab from last element wraps back to first element
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('href', '/ar')

    // 3. Escape closes the drawer and restores focus to the hamburger menu button
    await page.keyboard.press('Escape')
    await expect(drawerDialog).toBeHidden()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menuButton).toBeFocused()

    // 4. Accordion click toggles aria-expanded and panel hidden state
    const accTrigger1 = page.locator('#interactive-acc-1-trigger')
    const accPanel1 = page.locator('#interactive-acc-1-panel')
    await expect(accTrigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(accPanel1).toBeHidden()

    await accTrigger1.click()
    await expect(accTrigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(accPanel1).toBeVisible()

    await accTrigger1.click()
    await expect(accTrigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(accPanel1).toBeHidden()

    // 5. Switch to desktop viewport and click language switcher (/ar/styleguide -> /en/styleguide)
    await page.setViewportSize({ width: 1440, height: 900 })
    const desktopLangSwitch = page
      .locator('header[data-component="navbar"]')
      .first()
      .locator('a[hreflang="en"]')
      .first()
    const ariaLabel = await desktopLangSwitch.getAttribute('aria-label')
    expect(ariaLabel).toContain('EN')
    await desktopLangSwitch.click()
    await page.waitForURL('**/en/styleguide')

    const enLangSwitch = page
      .locator('header[data-component="navbar"]')
      .first()
      .locator('a[hreflang="ar"]')
      .first()
    const enAriaLabel = await enLangSwitch.getAttribute('aria-label')
    // R-11: English language switcher aria-label contains visible text "ع"
    expect(enAriaLabel).toContain('ع')
  })
})
