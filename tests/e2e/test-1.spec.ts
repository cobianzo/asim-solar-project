import { test, expect } from '@playwright/test';
import { coco_login, coco_setup_form_page } from './tests-helpers';

test('setup the plugins and page with form and test a place without buildings', async ({ page }) => {

  // initial tasks
  await coco_login(page);
  await coco_setup_form_page(page);

  // open the page in frontend and assert
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'View Page' }).nth(1).click();
  const page1 = await page1Promise;
  await expect(page1.locator('h1')).toHaveText('Pannelli solari');

  // Search in the map a place that doesn not exist
  const searchTerm = 'Amazonas';
  await page1.getByRole('textbox', { name: 'Search location' }).click();
  await page1.getByRole('textbox', { name: 'Search location' }).fill(searchTerm);
  await page1.getByText(searchTerm).first().click();

  // clicks in the center of the map, in a place without buildings
  await page1.locator('.gm-style > div > div:nth-child(2)').first().click();
  await page1.waitForTimeout(1000);
  await page1.locator('.gm-style > div > div:nth-child(2)').first().click();
  await page1.waitForTimeout(1000);
  await expect(page1.getByRole('textbox', { name: 'Seleziona il tuo tetto' })).toHaveValue('-3.794050965354937,-64.94765660454075');

  await page1.locator('.gm-style > div > div:nth-child(2)').first().click();
  await page1.locator('.gm-style > div > div:nth-child(2)').first().click();
  await page1.getByRole('button', { name: 'Next' }).click();

  // In step 2, we should see the error message
  await expect(page1.locator('#field_1_5')).toContainText('Requested entity was not found');
  await expect(page1.getByRole('button', { name: 'Next' })).not.toBeVisible();
});
