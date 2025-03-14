const { test, expect } = require('@playwright/test');

test('Cargar la página principal', async ({ page }) => {
    // Navegar a la URL de tu proyecto (ajusta la URL según tu entorno)
    await page.goto('http://localhost:8888');

    // Verificar que el título de la página es correcto
    await expect(page).toHaveTitle('Tu Título de WordPress'); // Cambia esto por el título de tu sitio
});