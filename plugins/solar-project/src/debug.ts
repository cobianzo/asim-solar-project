import { ExtendedSegment } from "./types";
import * as trigo from './trigonometry-helpers';
import { getSavedRectangleBySegment } from "./setup-rectangle-interactive";
import * as notification from './notification-api';
import { getCurrentStepCocoMap } from ".";
import { getMovingBoundingBoxOffsetFromOrigin } from "./setup-drag-all-segments-interaction";
import { cleanupAssociatedMarkers } from "./setup-segments-interactive-functions";

/** ====== ====== ====== ====== ======
 *   EXPOSE FUNCIONS IN CONSOLE
 * ====== ====== ====== ====== ====== */
window.debug = window.debug || {};

// expose all trigonmetry functions so I can use window.rotateRectangle(,.,) in console
window.debug = { ...window.debug , ...trigo, ...notification };
window.debug.getSavedRectangleBySegment =  function(s: ExtendedSegment) {
  return getSavedRectangleBySegment( s );
};
window.debug.getSavedRectangleBySegmentIndex =  function(i: number) {
  const c = getCurrentStepCocoMap();
  const seg = c?.segments ? c.segments[i] : null;
  return getSavedRectangleBySegment( seg! );
}
window.debug.cleanupAssociatedMarkers = function(s) {
  cleanupAssociatedMarkers(s);
}

/**
 Usage:
 dea = debug.getSavedRectangleBySegmentIndex(0).deactivatedSolarPanels;
 window.debug('Deactivated panels:' , dea);
 */
window.debug.showVarInPopup = function(varName: string, varValue: any) {
  const popup = createPopup();
  popup.innerHTML = showVariableAsString(varName, varValue);
}

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

export const createPopup = function (elementContentToClone?: Element): Element{
  const oldPopup = document.getElementById('popup-info');
  if (oldPopup) {
    oldPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = `popup-info`;
  popup.classList.add('popup');
  // Add content to the popup
  if (elementContentToClone instanceof Element) {
    popup.innerHTML = elementContentToClone.innerHTML;
  }
  document.body.appendChild(popup);

  popup.addEventListener('click', (event) => {
    popup.remove();
  });

  return popup;
}

export const highlightSegmentInfo = function(roofSegment: ExtendedSegment) {
  const index = roofSegment.indexInMap;
  const id = '#segment-basic-info-' + index;
  const divInfo = document.querySelectorAll(`.grid-h ${id}`);
  if (divInfo.length) Array.from(divInfo).forEach(el => {
    el.classList.add('highlight');
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

/** ====== ====== ====== ====== ======
 *   SHOW DATA OF ALL THE JS GLOBAL VARIABLES
 *
 *  ====== ====== ====== ====== ====== ==== */
export function showVariableAsString(varName: string, varValue: any, seen: Set<unknown> = new Set()) {
  let readableValue;

  try {
    readableValue = JSON.stringify(varValue, (key, val) => {
      // exceptions that I don't need to show completely
      if (key === 'solarPanelsPolygons') {
        const row = val.length;
        const col = val[0]?.length;
        return `${row} rows of ${col} google.maps.Polygon`;
      }

      if (val === null) {
        return 'null';
      }
      if (val && val.getMapId) {
        return '[google.maps object]';
      }
      if (val && val.classList) {
        return '[DOM element]';
      }
      if (val && typeof val.indexInMap === 'number') {
        return '[extended Segment Polygon] - index in map: ' + val.indexInMap;
      }
      if (val && val.getPath) {
        return '[google.maps.Polygon]';
      }
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    }, 2);
  } catch (error) {
    readableValue = '[Unserializable]' + (error instanceof Error ? error.message : String(error));
  }
  return `<b>${varName}</b>: ${readableValue}`;
}
window.debug.showAllJSGlobalVarsInPopup = function(e: Event) {
  e.preventDefault();
  const popup = createPopup();
  let innerHTML = '';

  // 2.show the offset
  const offset = getMovingBoundingBoxOffsetFromOrigin();
  innerHTML += `<p>Offset moving bbox: ${offset[0]*10000} ${offset[1]*10000}</p>`;

  // 1. show the variables from the plugin gravity forms plugin: cocoMaps.
  if (window.cocoMaps) {
    const firstKetCocoMaps = Object.keys(window.cocoMaps)[0]; // gets 'input_1_11' for example.'
    innerHTML += '<h2>window.cocoMaps.'+firstKetCocoMaps+'</h2>';
    innerHTML += '<p>The variable initialized but coco-gf-map-field plugin with extra params.</p>';

    const cocoMapsKeys = Object.keys(window.cocoMaps[firstKetCocoMaps]);
    const seen = new Set(); // Initialize the 'seen' Set to track circular references
    const cocoMapsVars = cocoMapsKeys.map((key) => {
        const value = (window.cocoMaps[firstKetCocoMaps] as Record<string, any>)[key];
        return showVariableAsString(key, value, seen);
      } )
      .join('<br>');
    innerHTML += `<pre>${cocoMapsVars}</pre>`;
  } else {
    innerHTML += "No cocoMaps variables found.";
  }
  if (window.cocoVars) {
    innerHTML += "<h3>window.cocoVars</h3>";
    innerHTML += "<pre>" + showVariableAsString('window.cocoVars (object from coco-gf-map=field plugin)', window['cocoVars'], new Set()) + " </pre>";
  }

  // 2. show the variables exposed in php:
  const globalCocoVars = Object.keys(window).filter(key => (
    key.startsWith('coco') || key.startsWith('step')) && ! ['cocoMaps', 'cocoVars', 'cocoDrawingRectangle'].includes(key)
  );
  innerHTML += '<h2>Global Variables Exposed in class-gravity-hooks.php</h2>';
  innerHTML += '<pre><ul>';
  globalCocoVars.forEach(key => {
    if (key === 'cocoBuildingSegments') {
      innerHTML += `<li><b>${key}</b>: there is a button show thi long var</li>`;
      return;
    }
    if (key === 'cocoBuildingProfile') {
      innerHTML += `<li><b>${key}</b>: ${window[key].length} polygons</li>`;
      return;
    }
    const stringValue = showVariableAsString(key, window[key], new Set());
    innerHTML += `<li>${stringValue}</li>`;
  });
  innerHTML += '</ul></pre>';

  // window.cocoDrawingRectangle is an important state variable deserves a new section
  innerHTML += '<h1>window.cocoDrawingRectangle</h1>';
  innerHTML += '<p>variable with infor about the selection of a segment and creation of the rectangle<p><pre><ul>';
  const stringValue = showVariableAsString('cocoDrawingRectangle', window['cocoDrawingRectangle'], new Set());
  innerHTML += `<li>${stringValue}</li>`;
  innerHTML += '</ul></pre>';

  // show the global variables exposed with PHP
  popup.innerHTML = innerHTML;
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