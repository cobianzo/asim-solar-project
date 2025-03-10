import { LatLngObject } from './types';

/**
 * Converts a LatLng coordinate to a Point on the map's viewport.
 * @param m - The Google Map instance
 * @param latLngObject - An object containing latitude and longitude properties
 * @returns The pixel coordinates on the map or null if bounds are not defined
 */
export const latLngToPoint = function(
  m: google.maps.Map,
  latLngObject: LatLngObject
): google.maps.Point | null {
  const latLng = new google.maps.LatLng(latLngObject.latitude, latLngObject.longitude);
  const scale = Math.pow(2, m.getZoom() as number);
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

  const worldCoordinateNW = projection?.fromLatLngToPoint(nw);
  const worldCoordinate = projection?.fromLatLngToPoint(latLng);
  if (worldCoordinateNW && worldCoordinate) {
    const pixelCoordinate = new google.maps.Point(
      (worldCoordinate.x - worldCoordinateNW.x) * scale,
      (worldCoordinate.y - worldCoordinateNW.y) * scale
    );
    return pixelCoordinate;
  }

  return null;
};

/**
 * Converts a Point on the map's viewport to a LatLng coordinate.
 * @param map - The Google Map instance
 * @param x - The x-coordinate of the point in pixels
 * @param y - The y-coordinate of the point in pixels
 * @returns The lat/lng coordinate or null if bounds are not defined
 */
export const pointToLatLng = function(
  map: google.maps.Map,
  x: number,
  y: number
): google.maps.LatLng | null {
  const scale = Math.pow(2, map.getZoom() as number);
  const projection = map.getProjection() as google.maps.Projection;
  const bounds = map.getBounds() as google.maps.LatLngBounds;

  const nw = new google.maps.LatLng(
    bounds.getNorthEast().lat(),
    bounds.getSouthWest().lng()
  );

  const worldCoordinateNW = projection.fromLatLngToPoint(nw);
  if (worldCoordinateNW) {
    const worldCoordinate = new google.maps.Point(
      x / scale + worldCoordinateNW.x,
      y / scale + worldCoordinateNW.y
    );
    return projection.fromPointToLatLng(worldCoordinate);
  }

  return null;
}

  /**
   * Returns an array of Points representing the vertices of a rectangle
   * whose bottom left and top right corners are given by the two LatLng
   * objects. The order of the points in the array is:
   *   [bottom left, top left, top right, bottom right]
   * @param map The Google Map instance
   * @param sw The LatLng of the bottom left corner of the rectangle
   * @param ne The LatLng of the top right corner of the rectangle
   * @returns An array of Points or null if the map bounds are not defined
   */
export const orthopedicRegtanglePoints = (
  map: google.maps.Map,
  sw: LatLngObject,
  ne: LatLngObject
): Array<google.maps.Point> | null  => {
  // get the latitude and logintude and convert into points in the map.
  const swPoint = latLngToPoint(map, sw);
  const nePoint = latLngToPoint(map, ne);
  if (! swPoint || ! nePoint) {
    return null;
  }

  return [
    // vertex from bottom left, top left, top right, bottom right
    new google.maps.Point(swPoint.x, swPoint.y),
    new google.maps.Point(swPoint.x, nePoint.y),
    new google.maps.Point(nePoint.x, nePoint.y),
    new google.maps.Point(nePoint.x, swPoint.y),
  ];
};


export const rotateRectangle = (
  vertices: Array<google.maps.Point>,
  center: google.maps.Point,
  angleDegrees: number
): Array<google.maps.Point> => {
  const angleRadians = (angleDegrees * Math.PI) / 180;

  return vertices.map(vertex => {
    // Trasladar el vértice al origen
    const translatedX = vertex.x - center.x;
    const translatedY = vertex.y - center.y;

    // Aplicar la rotación
    const rotatedX =
      translatedX * Math.cos(angleRadians) -
      translatedY * Math.sin(angleRadians);
    const rotatedY =
      translatedX * Math.sin(angleRadians) +
      translatedY * Math.cos(angleRadians);

    // Trasladar el vértice de nuevo al centro especificado
    const newX = rotatedX + center.x;
    const newY = rotatedY + center.y;

    return new google.maps.Point(newX, newY);
  });
};


/**
 * Converts an array of Points in pixel coordinates to a space-separated string
 * of LatLng coordinates.
 * @param map - The Google Map instance used for conversion
 * @param points - An array of Points in pixel coordinates
 * @returns A string of LatLng coordinates separated by spaces, or null if any
 *          point cannot be converted
 */

export const convertPointsArrayToLatLngString = function(
  map: google.maps.Map,
  points: Array<google.maps.Point>
): string | null {
  // Convertir cada punto en píxeles a LatLng
  const latLngPoints = points.map(point => {
      const latLng = pointToLatLng(map, point.x, point.y);
      return latLng? `${latLng.lat()},${latLng.lng()}` : null;
  });

  // Unir los puntos LatLng en una cadena separada por espacios
  return latLngPoints.join(' ');
}

/**
 * Projects a line of a given length from a point (x, y) at a given angle
 * in degrees, and returns the end point of the line as a google.maps.Point.
 * @param x - The x-coordinate of the point
 * @param y - The y-coordinate of the point
 * @param angle - The angle in degrees at which to project the line
 * @param length - The length of the line to project (defaults to 100)
 * @returns The end point of the projected line as a google.maps.Point
 */
export const projectLineFromXY = function(
  x: number,
  y: number,
  angle: number,
  length = 100): google.maps.Point {

  const radian = (angle * Math.PI) / 180; // Convertir grados a radianes
  const x2 = x + Math.cos(radian) * length;
  const y2 = y + Math.sin(radian) * length;
  return new google.maps.Point(x2, y2);
}

/**
 * Calculates the intersection point of two lines defined by two points each.
 * @param x1 The x-coordinate of the first point of the first line
 * @param y1 The y-coordinate of the first point of the first line
 * @param x2 The x-coordinate of the second point of the first line
 * @param y2 The y-coordinate of the second point of the first line
 * @param x3 The x-coordinate of the first point of the second line
 * @param y3 The y-coordinate of the first point of the second line
 * @param x4 The x-coordinate of the second point of the second line
 * @param y4 The y-coordinate of the second point of the second line
 * @returns The intersection point of the two lines as a google.maps.Point,
 *          or null if the lines are parallel
 */
export const getLineIntersection = function(
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  x4: number, y4: number
): google.maps.Point | null {
  console.log('calculating intersection of ', x1, y1, x2, y2, x3, y3, x4, y4);
  const det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (det === 0) return null; // Las líneas son paralelas

  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / det;
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / det;

  return new google.maps.Point(px, py);
}

