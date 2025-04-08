// playwright.config.js
module.exports = {
  testDir: './tests/e2e', // Directorio donde estarán tus tests
  use: {
    headless: true, // Ejecutar en modo sin cabeza (headless)
    viewport: { width: 1280, height: 720 }, // Tamaño de la ventana del navegador
    ignoreHTTPSErrors: true, // Ignorar errores de HTTPS
    screenshot: 'only-on-failure', // Tomar capturas de pantalla solo en fallos
    baseURL: 'http://localhost:8889', // URL base del entorno de pruebas
  },
};
