
export const login = async (page) => {
  await page.goto('http://localhost:8889/wp-login.php');
  await page.getByRole('textbox', { name: 'Username or Email Address' }).fill('admin');
  await page.getByRole('textbox', { name: 'Username or Email Address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Log In' }).click();
}
