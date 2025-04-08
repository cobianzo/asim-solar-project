import { test, expect } from '@playwright/test';

export const baseurl = 'http://localhost:8889';

// Go to wp-admin and login in test environment (TODO: use the wordpress e2e library)
export const coco_login = async (page) => {
  await page.goto('http://localhost:8889/wp-login.php');
  await page.getByRole('textbox', { name: 'Username or Email Address' }).fill('admin');
  await page.getByRole('textbox', { name: 'Username or Email Address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Log In' }).click();
}

// call the setup made in plugin.php, so we can start interacting with the form in the frontend
export const coco_setup_form_page = async (page) => {
  // go to Settings > Testing page, to create the basic structure
    await page.goto(`${baseurl}/wp-admin/options-general.php?page=testing-page`);
    await page.getByRole('button', { name: 'Setup plugins and tests' }).click();
    await expect(page.getByText('Plugins and tests have been set up successfully!')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Page' }).nth(1)).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Form' })).toBeVisible();
}
