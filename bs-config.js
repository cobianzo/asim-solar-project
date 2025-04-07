module.exports = {
  files: ["*.html", "*.css", "js/*.js", "php/*.php"],
  proxy: "http://localhost:8777", // Cambia esto por la URL de tu entorno local
  port: 9004,
  open: true,
  notify: false
};
