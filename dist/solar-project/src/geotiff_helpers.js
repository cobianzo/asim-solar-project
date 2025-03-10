// Asegúrate de que geotiff.js está cargado en tu proyecto
import * as GeoTIFF from 'geotiff';

export const loadGeoTIFF = async function(tiffUrl) {
    const API_KEY = window.gMapsKey; // Reemplaza con tu clave real
    const url = `${tiffUrl}&key=${API_KEY}`;

    const response = await fetch(url); // Descargar el archivo GeoTIFF
    const arrayBuffer = await response.arrayBuffer(); // Convertir a buffer
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer); // Cargar el TIFF
    const image = await tiff.getImage(); // Obtener la imagen dentro del TIFF
    const rasters = await image.readRasters(); // Leer datos de raster
    const width = image.getWidth();
    const height = image.getHeight();

    return { rasters, width, height, image };
}

export const geoTIFFToCanvas = function({ rasters, width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  // Asumimos que hay un solo canal (escala de grises)
  const rasterData = rasters[0];

  for (let i = 0; i < rasterData.length; i++) {
      const value = rasterData[i]; // Obtiene el valor del píxel

      // Normalizamos el valor entre 0 y 255 (ajustar según datos)
      const normalized = (value / 255) * 255;

      imageData.data[i * 4] = normalized;      // Rojo
      imageData.data[i * 4 + 1] = normalized;  // Verde
      imageData.data[i * 4 + 2] = normalized;  // Azul
      imageData.data[i * 4 + 3] = 150;         // Opacidad (ajustable)
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL(); // Convertir canvas a imagen en Base64
}

const addGeoTIFFOverlayToMap = async function(url, map) {
  const geoTIFFData = await loadGeoTIFF(url);
  const imageUrl = geoTIFFToCanvas(geoTIFFData);

  // Obtener las coordenadas de la imagen desde el GeoTIFF
  const bbox = geoTIFFData.image.getBoundingBox(); // [minX, minY, maxX, maxY]

  const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(bbox[1], bbox[0]), // Esquina inferior izquierda (minY, minX)
      new google.maps.LatLng(bbox[3], bbox[2])  // Esquina superior derecha (maxY, maxX)
  );

  const overlay = new google.maps.GroundOverlay(imageUrl, bounds);
  overlay.setMap(map); // Agregar la imagen al mapa
}

export default addGeoTIFFOverlayToMap;