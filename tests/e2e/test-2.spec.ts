import { test, expect } from '@playwright/test';
import { coco_login, coco_setup_form_page } from './tests-helpers';

test('Select a proper building and confirm it works', async ({ page }) => {
  // initial tasks
  await coco_login(page);
  await coco_setup_form_page(page);
  const page2Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'View Page' }).nth(1).click();
  const page2 = await page2Promise;

  // Search for a place
  const searchTerm = 'Los Angeles';
  await page2.getByRole('textbox', { name: 'Search location' }).click();
  await page2.getByRole('textbox', { name: 'Search location' }).fill(searchTerm);
  await page2.getByText(searchTerm).first().click();
  // zoom in
  for (let i = 0; i < 8; i++) {
    await page2.getByRole('button', { name: 'Zoom in' }).click();
    await page2.waitForTimeout(300);
  }
  // click on the center, there is a building there, and move Next
  await page2.locator('.gm-style > div > div:nth-child(2)').first().click();

  // save the value in the input
  await page2.waitForSelector('input.gform_coco_map');
  const inputValueStep1 = await page2.$eval('input.gform_coco_map', (input) => (input as HTMLInputElement).value);

  console.log('Input value:', inputValueStep1);
  await page2.getByRole('button', { name: 'Next' }).click();

  // Now we are in step 2. The input value should be the same
  await page2.waitForTimeout(500);
  const inputValueStep2 = await page2.$eval('input.gform_coco_map', (input) => (input as HTMLInputElement).value);
  console.log('Input value:', inputValueStep2);
  expect(inputValueStep1).toEqual(inputValueStep2);
  await page2.getByRole('radio', { name: 'Rotare 90 gradi se il' }).check();
  page2.pause()
});
