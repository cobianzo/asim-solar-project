import { ExtendedSegment } from "./types";
import * as trigo from './trigonometry-helpers';
import { getCurrentStepCocoMap } from ".";

/** ====== ====== ====== ====== ======
 *   EXPOSE FUNCIONS IN CONSOLE
 * ====== ====== ====== ====== ====== */
window.debug = window.debug || {};

// expose all trigonmetry functions so I can use window.rotateRectangle(,.,) in console
window.debug = { ...window.debug, ...trigo };

// Overwriting rotateRectante
window.debug.rotateRectangle = function(points: google.maps.Point[], angle: number) {
  previewPolygonPoints(points);
  const angleBefore = trigo.getInclinationByRectanglePoints(points);
  console.log('▷▷angle Before',angleBefore);
  const newpoints = trigo.rotateRectangle(points, angle);
  const angleAfter = trigo.getInclinationByRectanglePoints(newpoints);
  console.log('▷▷angle After rotation of '+angle, angleAfter);
  previewPolygonPoints(newpoints);
  return newpoints;
}
// quick access to data of our page
window.debug.getSegmentAsPoints = (index: number) => {
  /** Usage:
   s0 = window.debug.getSegmentAsPoints(0);
   window.debug.previewPolygonPoints(s0);
   */
  const c = getCurrentStepCocoMap();
  const seg = c?.segments ? c.segments[index] : null;
  if (seg) {
    return trigo.convertPolygonPathToPoints(seg);
  }
  return [];
}

window.debug.getRectangleAsPoints = (index: number) => {
  /** Usage:
   r = window.debug.getRectangleAsPoints();
   window.debug.previewPolygonPoints(r);
   */
  const pol = window.cocoDrawingRectangle.polygon;
  if (pol) {
    return trigo.convertPolygonPathToPoints(pol);
  }
  return [];
}


/** ====== ====== ====== ====== ======
 *   POPUPS showing info
 * ====== ====== ====== ====== ====== */

export const createPopup = function (elementContentToClone: Element) {
  const oldPopup = document.getElementById('popup-info');
  if (oldPopup) {
    oldPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = `popup-info`;
  popup.classList.add('popup');
  // Add content to the popup
  popup.innerHTML = elementContentToClone.innerHTML;
  document.body.appendChild(popup);

  popup.addEventListener('click', (event) => {
    popup.remove();
  });

}

export const highlightSegmentInfo = function(roofSegment: ExtendedSegment) {
  const index = roofSegment.indexInMap;
  const id = '#segment-basic-info-' + index;
  const divInfo = document.querySelectorAll(`.grid-h ${id}`);
  if (divInfo.length) Array.from(divInfo).forEach(el => {
    el.classList.add('highlight');
    console.log('%c Highlighting segment info', 'background: #222; color: #bada55', id, el.classList, divInfo);
  });
}
export const resetSegmentsInfo = function() {
  const divInfo = document.querySelectorAll(`.grid-h .segment-basic-info`);
  if (divInfo.length) Array.from(divInfo).forEach(el => {
    el.classList.remove('highlight');
  });
}


/** ====== ====== ====== ====== ======
 *   DEBUG SHOWING POLIGONS IN x y COORDENATES
 * ====== ====== ====== ====== ====== */
export function previewPolygonPoints(points: google.maps.Point[]) {
  // Crear el canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1200;  // Ajusta el tamaño según necesites
  canvas.height = 600;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.border = "2px solid black";
  canvas.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Dibujar el polígono
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 0, 255, 0.5)";  // Color azul semi-transparente
  ctx.fill();
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dibujar un círculo sobre el primer vértice
  const firstPoint = points[0];
  ctx.beginPath();
  ctx.arc(firstPoint.x, firstPoint.y, 2, 0, Math.PI * 2); // Círculo de 2px de radio
  ctx.fillStyle = "red"; // Color rojo para el primer vértice
  ctx.fill();
  ctx.strokeStyle = "black"; // Borde negro
  ctx.stroke();

  // Evento para eliminar el canvas al hacer clic
  canvas.addEventListener("click", () => {
      document.body.removeChild(canvas);
  });
}

/*
// Ejemplo de uso con un polígono
const polygon = [
  new window.google.maps.Point(50, 50),
  new window.google.maps.Point(200, 50),
  new window.google.maps.Point(150, 200),
  new window.google.maps.Point(50, 150),
];
window.debug.previewPolygonPoints(polygon);
*/
window.debug.previewPolygonPoints = previewPolygonPoints;