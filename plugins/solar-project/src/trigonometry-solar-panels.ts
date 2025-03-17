// first try it doens work:
// polygon = cocoMaps.input_1_11.segments[0];
// window.ee( polygon )


// usage:
// const newRectangle = resizeRectangle(originalVertices, 3, 2) : google.maps.Point[];

import { convertPointsArrayToLatLngString, convertStringLatLngToArrayLatLng, convertPolygonPathToPoints } from "./trigonometry-helpers";




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
  const points = convertPolygonPathToPoints(polygon);
  const newRectanglePoints = resizeRectangle(points, 30, 22);

  const newPathString = convertPointsArrayToLatLngString(map, newRectanglePoints);
  console.log('new coordinates', newPathString);
  const newPath = convertStringLatLngToArrayLatLng(newPathString!);

  polygon.setPath(newPath);
}


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

export const resizePolygon = function(points: google.maps.Point[], scaleFactor: number): google.maps.Point[] {

  /*
  // Ejemplo de uso
    points = [
      { x: 50, y: 250 },
      { x: 50, y: 100 },
      { x: 150, y: 100 },
      { x: 150, y: 250 }
    ];

    window.debug.previewPolygonPoints(points);
    points = debug.resizePolygon(points, 1.5); // Escala al 150%
    window.debug.previewPolygonPoints(points);
  */
  if (points.length === 0) return [];

  // Calcular el centro del polígono
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  // Escalar cada punto respecto al centro
  const scaledPoints = points.map(p => new google.maps.Point( centerX + (p.x - centerX) * scaleFactor, centerY + (p.y - centerY) * scaleFactor ));
  return scaledPoints;
}

