const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('User journey con Gravity Forms', async ({ page, request }) => {
    // 1. Activar Gravity Forms y tu plugin (ya está hecho en wp-env)

    // 2. Subir el archivo XML del formulario
    const formXmlPath = path.join(__dirname, 'data', 'form-page-demo.xml');
    const formXml = fs.readFileSync(formXmlPath, 'utf8');

    const uploadResponse = await request.post('/wp-json/gf/v2/forms/import', {
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            form_xml: formXml,
        },
    });
    expect(uploadResponse.ok()).toBeTruthy();

    // 3. Obtener el ID del formulario importado
    const formId = (await uploadResponse.json()).id;

    // 4. Navegar al formulario
    await page.goto(`http://localhost:8889/?gf_page=preview&id=${formId}`);

    // 5. Interactuar con el formulario
    await page.fill('input[name="input_1"]', 'John Doe'); // Ejemplo: Rellenar un campo
    await page.click('button[type="submit"]'); // Enviar el formulario

    // 6. Verificar que el formulario se envió correctamente
    await expect(page.locator('.gform_confirmation_message')).toBeVisible();
});