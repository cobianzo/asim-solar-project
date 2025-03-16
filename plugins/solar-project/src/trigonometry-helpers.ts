import { CoupleOfPoints, LatitudeLongitudeObject } from './types';


/**
 * ========= ========= ========= =========
 *    t r a n s f o r m   u n i t s
 * ========= ========= ========= =========
 */

/**
 * { latitude: ., longitude: . } ===> { x, y }}
 * Converts a LatLng coordinate to a Point on the map's viewport.
 * @param m - The Google Map instance
 * @param LatitudeLongitudeObject - An object containing latitude and longitude properties { latitude: number, longitude: number }
 * @returns The pixel coordinates {x, y} on the map or null if bounds are not defined
 */
export const latLngToPoint = function(
  m: google.maps.Map,
  latLngObject: LatitudeLongitudeObject
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
 * x, y  ===> { lat{}, lng{} }
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
 * Given [ {x: 32.32, y: 55.1234 }, {..}, ... ] ===> '32.3414325,11.4324324 33.1113423,12.4324312 ...'
 * Tranform array of points to a space-separated string of LatLng coordinates.
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


/** ========= converters into structured data ========= */

/**
 * polygon with getPath() which is [ { lat(), lng() }, {...}, ... ] ==> [ {x: 32.3, y: 55.1 }, {..}, .]
 * @param polygon
 * @returns
 */
export const convertPolygonPathToPoints = function( polygon: google.maps.Polygon ) {
  const temp = polygon.getPath().getArray().map( latLng => {
    return latLngToPoint( polygon.getMap()!, { latitude: latLng.lat(), longitude: latLng.lng() } ) ;
  } );
  return temp.filter( p => p != null );
}

/**
 * '32.3414325,11.4324324 33.1113423,12.4324312 ...' ===> [ { lat(), lng() }, {...}, ...]
 * Converts a string of coordinates into an array of Google Maps LatLng objects.
 *
 * @param coordinatesAsString - A string containing coordinates separated by spaces.
 * Each coordinate should be in the format "latitude,longitude".
 * @returns An array of `google.maps.LatLng` objects representing the coordinates. {lat: number, lng: number}
 */
export const convertStringLatLngToArrayLatLng = function (coordinatesAsString: string) {
	const coordinatesArray = coordinatesAsString.split(' ');
	const newPolygonCoords = coordinatesArray.map((coord) => {
		const [lat, lng] = coord.split(',');
		return new window.google.maps.LatLng({ lat: parseFloat(lat), lng: parseFloat(lng) });
	});
	return newPolygonCoords;
};

export const convertPolygonPathToStringLatLng = function (polygon: google.maps.Polygon) {
  let stringCoords = '';
  const path = polygon.getPath().getArray();
  const stringCoordsArray = path.map(latLng => `${latLng.lat()},${latLng.lng()}`);
  stringCoords = stringCoordsArray.join(' ');
  return stringCoords;
}



/**
 * ========= ========= ========= =========
 *    tranformers of geometry (rotate ... )
 * ========= ========= ========= =========
 */

/**
 * Given a polygon defined by Array<google.maps.Point>, y returns the
 * Array<google.maps.Point> after rotating the polygon `angleDegrees`
 * @param vertices
 * @param center
 * @param angleDegrees
 * @returns
 */
export const rotateRectangle = (
  vertices: Array<google.maps.Point>,
  angleDegrees: number,
  center: google.maps.Point|null = null,
): Array<google.maps.Point> => {
  const angleRadians = (angleDegrees * Math.PI) / 180;

  if (! center) {
    center = getCenterByVertexPoints(vertices);
  }

  const newVertex = vertices.map(vertex => {
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

  // show for debuggint in a human reading stuff
  console.log('rotateRectangle from the center', center.x, center.y);
  console.log('From', vertices.map(point => `${point.x.toFixed()},${point.y.toFixed()}` ).join('  ') );
  console.log('To   ', newVertex.map(point => `${point.x.toFixed()},${point.y.toFixed()}` ).join('  ') );

  return newVertex;
};

/** Not in use but it works like charm  */
export const rotateRectanglePolygon = function( polygon: google.maps.Polygon, angle: number ) {
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
  console.log('posints', points); // todelete
  const rotatedPoints = rotateRectangle(points, angle);
  console.log('rotates points', points); // todelete
  const newPathString = convertPointsArrayToLatLngString(map, rotatedPoints);
  console.log('new coordinates', newPathString);
  const newPath = convertStringLatLngToArrayLatLng(newPathString!);
  console.log('new coordinates', newPath);
  polygon.setPath(newPath);
}

export const scaleRectangleByPoints = function(arrayPoints: Array<google.maps.Point>, scale: number) {
  // get the center of the rect
  const center = getCenterByVertexPoints(arrayPoints);
  return arrayPoints.map((point) => {
    const deltaX = point.x - center.x;
    const deltaY = point.y - center.y;

    const scaledDeltaX = deltaX * scale;
    const scaledDeltaY = deltaY * scale;

    const newX = center.x + scaledDeltaX;
    const newY = center.y + scaledDeltaY;

    return new google.maps.Point(newX, newY);
  });
}

/**
 * ========= ========= ========= =========
 *    projections (calulation of a trigonometry param based on other parms)
 * ========= ========= ========= =========
 */

/**
 * Given sw and ne coords,
 * returns an array of Points for the whole rectangle
 * The order of the points in the array is:
 *   [bottom left, top left, top right, bottom right]
 * @param map The Google Map instance
 * @param sw The LatLng of the bottom left corner of the rectangle
 * @param ne The LatLng of the top right corner of the rectangle
 * @returns An array of Points or null if the map bounds are not defined
 */
export const orthopedicRegtanglePoints = (
  map: google.maps.Map,
  sw: LatitudeLongitudeObject,
  ne: LatitudeLongitudeObject
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

/**
 * Given x,y Point, angle and length of line ==> point {x,y} of the extreme of the line
 *
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

/**
 * Returns {x,y} of the polygon by an array of the {x,y} points
 * @param polygonVertexPoints
 * @returns
 */
export const getCenterByVertexPoints = function(polygonVertexPoints: Array<google.maps.Point>) {

  const sumX = polygonVertexPoints.reduce((acc, point) => acc + point.x, 0);
  const sumY = polygonVertexPoints.reduce((acc, point) => acc + point.y, 0);

  return new google.maps.Point(sumX / polygonVertexPoints.length, sumY / polygonVertexPoints.length);

}

/**
 * polygon => { lat(), lng() }
 * Given the polygon, returns the center (getCenter() only works for rectangles)
 * @param polygon
 * @returns
 */
export const getPolygonCenterCoords = function(polygon: google.maps.Polygon) : google.maps.LatLng{
  const path = polygon.getPath().getArray();
  const sumLat = path.reduce((acc, latLng) => acc + latLng.lat(), 0);
  const sumLng = path.reduce((acc, latLng) => acc + latLng.lng(), 0);

  return new google.maps.LatLng(sumLat / path.length, sumLng / path.length);
}


/**
 * Calculates the 2 right lines that define the an inclined axis.
 * Every line is defined by two points in an array
 * @param crossPointInMap
 * @param degrees
 * @returns
 */
export const getInclinedAxisAsLinesFromCoordenates = (
  crossPointInMap: google.maps.Point,
  degrees: number
): {
  axisLinesDefinedByPoints: { lineX: CoupleOfPoints; lineY: CoupleOfPoints };
} => {

  const axisLinesDefinedByPoints: { lineX: CoupleOfPoints; lineY: CoupleOfPoints }
    = { lineX: [], lineY: [] };

  // draw line 1 (the X axis)
  const angle90 = (degrees + 90) % 360;
  let tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle90,
    100
  );
  axisLinesDefinedByPoints.lineX[0] = tempPoint;

  tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle90,
    -100
  );
  axisLinesDefinedByPoints.lineX[1] = tempPoint;

  // --- line 2 (the Y axis)
  const angle0 = (degrees + 0) % 360;
  tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle0,
    100
  );
  axisLinesDefinedByPoints.lineY[0] = tempPoint;
  tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle0,
    -100
  );
  axisLinesDefinedByPoints.lineY[1] = tempPoint;

  return {
    axisLinesDefinedByPoints
  };
};

/**
 * For the creation of the inclined rectangle by the user (he clicks on v0 and then drags to set v2)
 * Quite complex process. Given the angle I calculate the lines y and x in the clicked point.
 * Then calculate the lines y and x for the v2 as the user drags the mouse, and finds the interections.
 * @param gmap
 * @param pointA
 * @param pointC
 * @param angle
 * @returns
 */
export const calculatePathRectangleByOppositePointsAndInclination = function(
  gmap: google.maps.Map,
  pointA: google.maps.Point,
  pointC: google.maps.Point,
  angle: number
) {

  const { axisLinesDefinedByPoints: axisLinesDefinedByPointsFirst } =
    getInclinedAxisAsLinesFromCoordenates( pointA, angle! );

  if (!axisLinesDefinedByPointsFirst) {
    console.error('not calculated axisLinesDefinedByPointsFirst', axisLinesDefinedByPointsFirst);
    return null;
  }

  console.log('we saved the first vertex on ', axisLinesDefinedByPointsFirst);

  const { axisLinesDefinedByPoints: axisLinesDefinedByPointsSecond }
    = getInclinedAxisAsLinesFromCoordenates( pointC, angle ?? 0 );

  if (!axisLinesDefinedByPointsSecond ) {
    console.error('not calculated axisLinesDefinedByPointsSecond', axisLinesDefinedByPointsSecond);
    return null;
  }

  console.log('moving the mouse to build a rectangle: ', pointC);

  // now get the 2 other points that we need
  const intersectionPointB = getLineIntersection(
    axisLinesDefinedByPointsFirst.lineX[0]!.x, axisLinesDefinedByPointsFirst.lineX[0]!.y,
    axisLinesDefinedByPointsFirst.lineX[1]!.x, axisLinesDefinedByPointsFirst.lineX[1]!.y,
    axisLinesDefinedByPointsSecond.lineY[0]!.x, axisLinesDefinedByPointsSecond.lineY[0]!.y,
    axisLinesDefinedByPointsSecond.lineY[1]!.x, axisLinesDefinedByPointsSecond.lineY[1]!.y
  );
  const intersectionPointD = getLineIntersection(
    axisLinesDefinedByPointsFirst.lineY[0]!.x, axisLinesDefinedByPointsFirst.lineY[0]!.y,
    axisLinesDefinedByPointsFirst.lineY[1]!.x, axisLinesDefinedByPointsFirst.lineY[1]!.y,
    axisLinesDefinedByPointsSecond.lineX[0]!.x, axisLinesDefinedByPointsSecond.lineX[0]!.y,
    axisLinesDefinedByPointsSecond.lineX[1]!.x, axisLinesDefinedByPointsSecond.lineX[1]!.y
  );

  // with all the points, we draw the inclined rectangle created by the user
  if ( pointA && intersectionPointB && pointC && intersectionPointD ) {
    const vertexPoints = [
      pointA,
      intersectionPointB,
      pointC,
      intersectionPointD
    ]
    const rectanglePolygonCoords = convertPointsArrayToLatLngString( gmap, vertexPoints ) ?? '';;

    return {
      axisLinesDefinedByPointsFirst, // axis crossing point A
      axisLinesDefinedByPointsSecond, // axis crossing point C
      // the rectangle defined by lat lng coordenates, and by x,y points
      rectanglePolygonCoords,
      vertexPoints
    };
  }

  return null;
}

export const getRectangleInclinationByPoints = function( points: Array<google.maps.Point>) : number {
  if (!points || points.length !== 4) {
    return 0; // Valor predeterminado si no hay 4 puntos
  }

  // 1. Calcular la pendiente (m)
  const m = (points[1].y - points[0].y) / (points[1].x - points[0].x);

  // 2. Calcular el ángulo con respecto al eje X (alfa)
  const alfa = Math.atan(m); // Radiantes
  const alfaGrados = (alfa * 180) / Math.PI; // Grados

  // 3. Calcular el ángulo con respecto al eje Y (beta)
  const betaGrados = 90 - alfaGrados;

  return betaGrados;

}