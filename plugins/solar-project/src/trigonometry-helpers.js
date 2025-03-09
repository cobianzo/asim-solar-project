/**
 *
 * @param {google.map} m
 * @param {latitude:float, longitude:float} latLngObject
 * @returns {google.map.Point} with keys x and y
 */
export const latLngToPoint = function (m, latLngObject) {
  const latLng = new google.maps.LatLng(latLngObject.latitude, latLngObject.longitude);
  const scale = Math.pow(2, m.getZoom());
  const projection = m.getProjection();

  const bounds = m.getBounds();
  if (!bounds) {
    console.error("Error: Bounds are not defined.", m);
    return null;
  }

  const nw = new google.maps.LatLng(
      bounds.getNorthEast().lat(),
      bounds.getSouthWest().lng()
  );

  var worldCoordinateNW = projection.fromLatLngToPoint(nw);
  var worldCoordinate = projection.fromLatLngToPoint(latLng);
  var pixelCoordinate = new google.maps.Point(
      (worldCoordinate.x - worldCoordinateNW.x) * scale,
      (worldCoordinate.y - worldCoordinateNW.y) * scale
  );

  return pixelCoordinate;
}

export const pointToLatLng = function(map, x, y) {
  const scale = Math.pow(2, map.getZoom());
  const projection = map.getProjection();
  const bounds = map.getBounds();

  const nw = new google.maps.LatLng(
      bounds.getNorthEast().lat(),
      bounds.getSouthWest().lng()
  );

  const worldCoordinateNW = projection.fromLatLngToPoint(nw);
  const worldCoordinate = new google.maps.Point(
      x / scale + worldCoordinateNW.x,
      y / scale + worldCoordinateNW.y
  );
  return projection.fromPointToLatLng(worldCoordinate);
}

export const orthopedicRegtanglePoints = function (map, sw, ne) {
  // get the latitude and logintude and convert into points in the map.
  const swPoint = latLngToPoint(map, sw);
  const nePoint = latLngToPoint(map, ne);
  return [ // vertex from bottom left, top left, top right, bottom right
    { x: swPoint.x, y: swPoint.y },
    { x: swPoint.x, y: nePoint.y },
    { x: nePoint.x, y: nePoint.y },
    { x: nePoint.x, y: swPoint.y }
  ];
}

/**
 *
 * @param {x: float, y:float} vertices
 * @param {x: float, y:float} center
 * @param {0-360} angleDegrees
 * @returns
 */
export const rotateRectangle = function (vertices, center, angleDegrees) {
  const angleRadians = (angleDegrees * Math.PI) / 180;

  return vertices.map(vertex => {
      // Trasladar el vértice al origen
      const translatedX = vertex.x - center.x;
      const translatedY = vertex.y - center.y;

      // Aplicar la rotación
      const rotatedX = translatedX * Math.cos(angleRadians) - translatedY * Math.sin(angleRadians);
      const rotatedY = translatedX * Math.sin(angleRadians) + translatedY * Math.cos(angleRadians);

      // Trasladar el vértice de nuevo al centro especificado
      const newX = rotatedX + center.x;
      const newY = rotatedY + center.y;

      return { x: newX, y: newY };
  });
}

export const convertPointsArrayToLatLngString = function(map, points) {
  // Convertir cada punto en píxeles a LatLng
  const latLngPoints = points.map(point => {
      const latLng = pointToLatLng(map, point.x, point.y);
      return `${latLng.lat()},${latLng.lng()}`;
  });

  // Unir los puntos LatLng en una cadena separada por espacios
  return latLngPoints.join(' ');
}


export const calculateRightAngleVertex = function(x1, y1, x2, y2, angleDegrees) {
  // Convertir el ángulo a radianes
  const angleRadians = (angleDegrees * Math.PI) / 180;

  // Calcular la longitud de la hipotenusa
  const hypotenuseLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

  // Calcular la longitud de los catetos usando el ángulo y la hipotenusa
  const adjacentLength = hypotenuseLength * Math.cos(angleRadians);
  const oppositeLength = hypotenuseLength * Math.sin(angleRadians);

  // Calcular el punto medio de la hipotenusa
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calcular el vértice del ángulo recto
  const rightVertexX = midX + oppositeLength * (y2 - y1) / hypotenuseLength;
  const rightVertexY = midY - oppositeLength * (x2 - x1) / hypotenuseLength;

  return { x: rightVertexX, y: rightVertexY };
}

export const projectLineFromXY = function (x, y, angle, length = 100) {
  const radian = (angle * Math.PI) / 180; // Convertir grados a radianes
  const x2 = x + Math.cos(radian) * length;
  const y2 = y + Math.sin(radian) * length;
  return { x: x2, y: y2 };
}

export function getLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  console.log('calculating intersection of ', x1, y1, x2, y2, x3, y3, x4, y4);
  const det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (det === 0) return null; // Las líneas son paralelas

  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / det;
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / det;

  return { x: px, y: py };
}
