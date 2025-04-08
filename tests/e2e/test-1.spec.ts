import { test, expect } from '@playwright/test';
import { login } from './tests-helpers';

test('setup the plugins and page with form', async ({ page }) => {

  await login(page);

  // go to Settings > Testing page, to create the basic structure
  await page.getByRole('link', { name: 'Testing Page' }).click();
  await page.getByRole('button', { name: 'Setup plugins and tests' }).click();
  await expect(page.getByText('✅ Solar Project API key')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Page' }).nth(1)).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Form' })).toBeVisible();

  // open the page in frontend and assert
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'View Page' }).nth(1).click();
  const page1 = await page1Promise;
  await expect(page1.locator('h1')).toHaveText('Pannelli solari');
  await page1.getByRole('textbox', { name: 'Search location' }).click();
  await page1.getByRole('textbox', { name: 'Search location' }).fill('Embajada de Espa');
  await page1.getByText('Embajada de Espa').first().click();
  await page1.getByRole('button', { name: 'Zoom in' }).click();
  await page1.getByRole('button', { name: 'Zoom in' }).click();
  await page1.getByRole('button', { name: 'Zoom in' }).click();
  await page1.locator('.gm-style > div > div:nth-child(2)').first().click();
  await expect(page1.getByRole('textbox', { name: 'Seleziona il tuo tetto' })).toBeVisible();
  await page1.getByRole('button', { name: 'Next' }).click();
});
