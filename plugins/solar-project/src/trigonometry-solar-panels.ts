// first try it doens work:
// polygon = cocoMaps.input_1_11.segments[0];
// window.ee( polygon )


// usage:
// const newRectangle = resizeRectangle(originalVertices, 3, 2) : google.maps.Point[];

import { convertPointsArrayToLatLngString, convertStringCoordinatesIntoGMapCoordinates, polygonPathToPoints } from "./trigonometry-helpers";




export const resizeRectanglePolygon = function( polygon: google.maps.Polygon ) {
  if (!polygon) {
    console.error('no polygon');
    return;
  }
  const map = polygon.getMap();
  if (!map) {
    console.error('no map');
    return;
  }
  const points = polygonPathToPoints(polygon);
  const newRectanglePoints = resizeRectangle(points, 30, 22);

  const newPathString = convertPointsArrayToLatLngString(map, newRectanglePoints);
  console.log('new coordinates', newPathString);
  const newPath = convertStringCoordinatesIntoGMapCoordinates(newPathString!);

  polygon.setPath(newPath);
}
window.ee = resizeRectanglePolygon;


// TODO: move this into trigonometry maybe?
// created by chatgpt
function distance(p1: google.maps.Point, p2: google.maps.Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function scaleVector(p1: google.maps.Point, p2: google.maps.Point, newLength: number): google.maps.Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx ** 2 + dy ** 2);
  return new google.maps.Point(p1.x + (dx / length) * newLength, p1.y + (dy / length) * newLength);
}

function resizeRectangle(vertices: Array<google.maps.Point>, newSide1: number, newSide2: number): Array<google.maps.Point> {
  if (vertices.length !== 4) throw new Error("El rectángulo debe tener 4 vértices");

  // Determinar las longitudes de los lados originales
  const d1 = distance(vertices[0], vertices[1]);
  const d2 = distance(vertices[1], vertices[2]);

  console.log('lado 1 en px: ', d1);
  console.log('lado 2 en px: ', d2);

  // Identificar qué lado es más largo
  const [longerSide, shorterSide] = d1 > d2 ? [vertices[0], vertices[1], vertices[2]] : [vertices[1], vertices[2], vertices[3]];

  // Redimensionar los lados usando la misma inclinación
  const newP1 = longerSide;  // Primer punto permanece igual
  const newP2 = scaleVector(newP1, shorterSide, newSide1);
  const newP3 = scaleVector(newP2, vertices[2], newSide2);
  const newP4 = scaleVector(newP1, vertices[3], newSide2);

  return [newP1, newP2, newP3, newP4];
}