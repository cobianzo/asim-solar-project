import { boxBySWNE, CoupleOfPoints, LatitudeLongitudeObject } from './types';

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
export const latLngToPoint = function (
	m: google.maps.Map,
	latLngObject: LatitudeLongitudeObject
): google.maps.Point | null {
	const latLng = new google.maps.LatLng(latLngObject.latitude, latLngObject.longitude);
	const scale = Math.pow(2, m.getZoom() as number);
	const projection = m.getProjection();

	const bounds = m.getBounds();
	if (!bounds) {
		console.error('Error: Bounds are not defined.', m);
		return null;
	}

	const nw = new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());

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
export const pointToLatLng = function (map: google.maps.Map, x: number, y: number): google.maps.LatLng | null {
	const scale = Math.pow(2, map.getZoom() as number);
	const projection = map.getProjection() as google.maps.Projection;
	const bounds = map.getBounds() as google.maps.LatLngBounds;

	const nw = new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());

	const worldCoordinateNW = projection.fromLatLngToPoint(nw);
	if (worldCoordinateNW) {
		const worldCoordinate = new google.maps.Point(
			x / scale + worldCoordinateNW.x,
			y / scale + worldCoordinateNW.y
		);
		return projection.fromPointToLatLng(worldCoordinate);
	}

	return null;
};

/**
 * Given [ {x: 32.32, y: 55.1234 }, {..}, ... ] ===> '32.3414325,11.4324324 33.1113423,12.4324312 ...'
 * Tranform array of points to a space-separated string of LatLng coordinates.
 * @param map - The Google Map instance used for conversion
 * @param points - An array of Points in pixel coordinates
 * @returns A string of LatLng coordinates separated by spaces, or null if any
 *          point cannot be converted
 */
export const convertPointsArrayToLatLngString = function (
	map: google.maps.Map,
	points: Array<google.maps.Point>
): string | null {
	// Convertir cada punto en píxeles a LatLng
	const latLngPoints = points.map((point) => {
		const latLng = pointToLatLng(map, point.x, point.y);
		return latLng ? `${latLng.lat()},${latLng.lng()}` : null;
	});

	// Unir los puntos LatLng en una cadena separada por espacios
	return latLngPoints.join(' ');
};

/** ========= converters into structured data ========= */

/**
 * polygon with getPath() which is [ { lat(), lng() }, {...}, ... ] ==> [ {x: 32.3, y: 55.1 }, {..}, .]
 * @param polygon
 * @returns
 */
export const convertPolygonPathToPoints = function (polygon: google.maps.Polygon) {
	const temp = polygon
		.getPath()
		.getArray()
		.map((latLng) => {
			return latLngToPoint(polygon.getMap()!, { latitude: latLng.lat(), longitude: latLng.lng() });
		});
	return temp.filter((p) => p != null);
};

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
	const newPolygonCoords = coordinatesArray.map((coordStr) => convertStringCoordsInLatLng(coordStr));
	return newPolygonCoords.filter((val) => val !== null);
};

/**
 * 44.5425,23.543534 => google.maps.LatLng  { lat(), lng() }
 * Similar as the one on top but only with a coord lat lng,
 * @param commaSeparated
 * @returns
 */
export const convertStringCoordsInLatLng = function (
	commaSeparated: string | HTMLInputElement
): google.maps.LatLng | null {
	let lat = null;
	let lng = null;

	if (commaSeparated instanceof HTMLInputElement) {
		commaSeparated = commaSeparated.value;
	}
	if (typeof commaSeparated === 'string') {
		const values = commaSeparated.split(',');

		// Validate that values is an array of two elements and both can be converted to numbers
		if (values.length === 2 && !isNaN(Number(values[0])) && !isNaN(Number(values[1]))) {
			lat = parseFloat(values[0]);
			lng = parseFloat(values[1]);
		}
	}

	if (lat === null || lng === null) {
		console.warn('converting to Lat Lng returns null. This is due to an error');
		return null;
	}
	// switch (returnAs) {
	//   case 'LatitudeLongitude':
	//     return { latitude: lat, longitude: lng };
	//   case 'LatLngLiteral':
	//     return { lat, lng };
	//   default: // LatLng
	return new google.maps.LatLng(lat, lng);
	// }
};

/**
 * google.maps.polygon ==> '34.43243,11.423423 34.5567,12.432423 ...'
 * @param polygon
 * @returns
 */
export const convertPolygonPathToStringLatLng = function (polygon: google.maps.Polygon): string {
	let stringCoords = '';
	const path = polygon.getPath().getArray();
	const stringCoordsArray = path.map((latLng) => `${latLng.lat()},${latLng.lng()}`);
	stringCoords = stringCoordsArray.join(' ');
	return stringCoords;
};

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
	center: google.maps.Point | null = null
): Array<google.maps.Point> => {
	const angleRadians = (angleDegrees * Math.PI) / 180;

	if (!center) {
		center = getCenterByVertexPoints(vertices);
	}

	const newVertex = vertices.map((vertex) => {
		// Trasladar el vértice al origen
		const translatedX = vertex.x - center.x;
		const translatedY = vertex.y - center.y;

		// Aplicar la rotación
		const rotatedX = translatedX * Math.cos(angleRadians) - translatedY * Math.sin(angleRadians);
		const rotatedY = translatedX * Math.sin(angleRadians) + translatedY * Math.cos(angleRadians);

		// Trasladar el vértice de nuevo al centro especificado
		const newX = rotatedX + center.x;
		const newY = rotatedY + center.y;

		return new google.maps.Point(newX, newY);
	});

	return newVertex;
};

/** Not in use but it works like charm  */
export const rotateRectanglePolygon = function (
	polygon: google.maps.Polygon,
	angle: number,
	center: LatitudeLongitudeObject | null,
	applyRotation: boolean = false
) {
	if (!polygon) {
		console.error('no polygon');
		return null;
	}
	const map = polygon.getMap();
	if (!map) {
		console.error('no map');
		return null;
	}
	let centerPoints = null;
	if (center) {
		centerPoints = latLngToPoint(map, center);
	}
	const points = convertPolygonPathToPoints(polygon);
	const rotatedPoints = rotateRectangle(points, angle, centerPoints);
	const newPathString = convertPointsArrayToLatLngString(map, rotatedPoints);
	const newPath = convertStringLatLngToArrayLatLng(newPathString!);

	if (applyRotation) polygon.setPath(newPath);

	return newPath;
};

export const rotatePolygonRectangleToOrthogonal = function (
	polygon: google.maps.Polygon,
	applyTranform: boolean = false
) {
	const angle = getInclinationByPolygonPath(polygon);
	if (angle == null) return null;
	const orthogonalPath = rotateRectanglePolygon(polygon, -1 * angle, null, applyTranform);
	return orthogonalPath;
};

export const scaleRectangleByPoints = function (
	arrayPoints: Array<google.maps.Point>,
	scaleX: number,
	scaleY: number
) {
	// get the center of the rect
	const center = getCenterByVertexPoints(arrayPoints);

	// unrotate to align with Y,X axis
	const angle = getInclinationByRectanglePoints(arrayPoints);
	const orthopedicPoints = rotateRectangle(arrayPoints, -1 * (angle == null ? 0 : angle));

	const scaledOrthogonal = orthopedicPoints.map((point) => {
		const deltaX = point.x - center.x;
		const deltaY = point.y - center.y;

		const scaledDeltaX = deltaX * scaleX;
		const scaledDeltaY = deltaY * scaleY;

		const newX = center.x + scaledDeltaX;
		const newY = center.y + scaledDeltaY;

		return new google.maps.Point(newX, newY);
	});

	const scaledInclinedPoints = rotateRectangle(scaledOrthogonal, angle == null ? 0 : angle);
	return scaledInclinedPoints;
};

export const moveGoogleMapsRectangleToCenter = function (
	rectangle: google.maps.Rectangle,
	lat: number,
	lng: number
) {
	// Obtener los límites actuales del rectángulo
	const boundsActuales = rectangle.getBounds();
	if (!boundsActuales) {
		return null;
	}
	const centroActual = boundsActuales.getCenter();

	// Calcular la diferencia de latitud y longitud
	const diffLat = lat - centroActual.lat();
	const diffLng = lng - centroActual.lng();

	// Calcular las nuevas esquinas
	const ne = boundsActuales.getNorthEast();
	const sw = boundsActuales.getSouthWest();

	const nuevoNE = new google.maps.LatLng(ne.lat() + diffLat, ne.lng() + diffLng);
	const nuevoSW = new google.maps.LatLng(sw.lat() + diffLat, sw.lng() + diffLng);

	// Establecer los nuevos límites
	rectangle.setBounds(new google.maps.LatLngBounds(nuevoSW, nuevoNE));

	return rectangle.getBounds()?.getCenter();
};

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
): Array<google.maps.Point> | null => {
	// get the latitude and logintude and convert into points in the map.
	const swPoint = latLngToPoint(map, sw);
	const nePoint = latLngToPoint(map, ne);
	if (!swPoint || !nePoint) {
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
export const projectLineFromXY = function (x: number, y: number, angle: number, length = 100): google.maps.Point {
	const radian = (angle * Math.PI) / 180; // Convertir grados a radianes
	const x2 = x + Math.cos(radian) * length;
	const y2 = y + Math.sin(radian) * length;
	return new google.maps.Point(x2, y2);
};

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
export const getLineIntersection = function (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	x3: number,
	y3: number,
	x4: number,
	y4: number
): google.maps.Point | null {
	console.log('calculating intersection of ', x1, y1, x2, y2, x3, y3, x4, y4);
	const det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

	if (det === 0) return null; // Las líneas son paralelas

	const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / det;
	const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / det;

	return new google.maps.Point(px, py);
};

/**
 * Returns {x,y} of the polygon by an array of the {x,y} points
 * @param polygonVertexPoints
 * @returns
 */
export const getCenterByVertexPoints = function (polygonVertexPoints: Array<google.maps.Point>) {
	const sumX = polygonVertexPoints.reduce((acc, point) => acc + point.x, 0);
	const sumY = polygonVertexPoints.reduce((acc, point) => acc + point.y, 0);

	return new google.maps.Point(sumX / polygonVertexPoints.length, sumY / polygonVertexPoints.length);
};

/**
 * polygon => { lat(), lng() }
 * Given the polygon, returns the center (getCenter() only works for rectangles)
 * We can use getBounds().getCenter(), but I found a little displacemente
 * @param polygon
 * @returns
 */
export const getPolygonCenterCoords = function (polygon: google.maps.Polygon): google.maps.LatLng {
	const path = polygon.getPath().getArray();
	const v0 = path[0]; // sw
	const v2 = path[2]; // ne
	const coordObject = {
		sw: { latitude: v0.lat(), longitude: v0.lng() },
		ne: { latitude: v2.lat(), longitude: v2.lng() },
	};
	return getPolygonCenterBySWNE(coordObject);
};

export const getPolygonCenterBySWNE = function (swNE: boxBySWNE): google.maps.LatLng {
	const midLat = swNE.sw.latitude + (swNE.ne.latitude - swNE.sw.latitude) / 2;
	const midLng = swNE.sw.longitude + (swNE.ne.longitude - swNE.sw.longitude) / 2;

	return new google.maps.LatLng(midLat, midLng);
};

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
	const axisLinesDefinedByPoints: { lineX: CoupleOfPoints; lineY: CoupleOfPoints } = { lineX: [], lineY: [] };

	// draw line 1 (the X axis)
	const angle90 = (degrees + 90) % 360;
	let tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle90, 100);
	axisLinesDefinedByPoints.lineX[0] = tempPoint;

	tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle90, -100);
	axisLinesDefinedByPoints.lineX[1] = tempPoint;

	// --- line 2 (the Y axis)
	const angle0 = (degrees + 0) % 360;
	tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle0, 100);
	axisLinesDefinedByPoints.lineY[0] = tempPoint;
	tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle0, -100);
	axisLinesDefinedByPoints.lineY[1] = tempPoint;

	return {
		axisLinesDefinedByPoints,
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
export const calculatePathRectangleByOppositePointsAndInclination = function (
	gmap: google.maps.Map,
	pointA: google.maps.Point,
	pointC: google.maps.Point,
	angle: number
) {
	const { axisLinesDefinedByPoints: axisLinesDefinedByPointsFirst } = getInclinedAxisAsLinesFromCoordenates(
		pointA,
		angle!
	);

	if (!axisLinesDefinedByPointsFirst) {
		console.error('not calculated axisLinesDefinedByPointsFirst', axisLinesDefinedByPointsFirst);
		return null;
	}

	console.log('we saved the first vertex on ', axisLinesDefinedByPointsFirst);

	const { axisLinesDefinedByPoints: axisLinesDefinedByPointsSecond } = getInclinedAxisAsLinesFromCoordenates(
		pointC,
		angle ?? 0
	);

	if (!axisLinesDefinedByPointsSecond) {
		console.error('not calculated axisLinesDefinedByPointsSecond', axisLinesDefinedByPointsSecond);
		return null;
	}

	console.log('moving the mouse to build a rectangle: ', pointC);

	// now get the 2 other points that we need
	const intersectionPointB = getLineIntersection(
		axisLinesDefinedByPointsFirst.lineX[0]!.x,
		axisLinesDefinedByPointsFirst.lineX[0]!.y,
		axisLinesDefinedByPointsFirst.lineX[1]!.x,
		axisLinesDefinedByPointsFirst.lineX[1]!.y,
		axisLinesDefinedByPointsSecond.lineY[0]!.x,
		axisLinesDefinedByPointsSecond.lineY[0]!.y,
		axisLinesDefinedByPointsSecond.lineY[1]!.x,
		axisLinesDefinedByPointsSecond.lineY[1]!.y
	);
	const intersectionPointD = getLineIntersection(
		axisLinesDefinedByPointsFirst.lineY[0]!.x,
		axisLinesDefinedByPointsFirst.lineY[0]!.y,
		axisLinesDefinedByPointsFirst.lineY[1]!.x,
		axisLinesDefinedByPointsFirst.lineY[1]!.y,
		axisLinesDefinedByPointsSecond.lineX[0]!.x,
		axisLinesDefinedByPointsSecond.lineX[0]!.y,
		axisLinesDefinedByPointsSecond.lineX[1]!.x,
		axisLinesDefinedByPointsSecond.lineX[1]!.y
	);

	// with all the points, we draw the inclined rectangle created by the user
	if (pointA && intersectionPointB && pointC && intersectionPointD) {
		const vertexPoints = [pointA, intersectionPointB, pointC, intersectionPointD];
		const rectanglePolygonCoords = convertPointsArrayToLatLngString(gmap, vertexPoints) ?? '';

		return {
			axisLinesDefinedByPointsFirst, // axis crossing point A
			axisLinesDefinedByPointsSecond, // axis crossing point C
			// the rectangle defined by lat lng coordenates, and by x,y points
			rectanglePolygonCoords,
			vertexPoints,
		};
	}

	return null;
};

export const getInclinationByRectanglePoints = function (points: Array<google.maps.Point>): number | null {
	if (!points || points.length !== 4 || points.some((p) => !p || p.x === undefined || isNaN(p.x))) {
		console.error('error getting inclination', points);
		return null; // Valor predeterminado si no hay 4 puntos
	}

	// 1. Calcular la pendiente (m)
	const diffX = points[1].x - points[0].x;
	if (diffX === 0) {
		return 0;
	}
	const m = (points[1].y - points[0].y) / diffX;

	// 2. Calcular el ángulo con respecto al eje X (alfa)
	const alfa = Math.atan(m); // Radiantes
	const alfaGrados = (alfa * 180) / Math.PI; // Grados

	// 3. Calcular el ángulo con respecto al eje Y (beta)
	// Depending on the quadrant we need to substract 180.
	let betaGrados = alfaGrados + 270;
	// not sure very well why (there are probably more elegant ways to do this), but
	// if the first side of the rect is facing East we need to do this.
	if (points[1].x > points[0].x) betaGrados -= 180;

	betaGrados %= 360;
	if (isNaN(betaGrados)) {
		console.error('betagrados es nan', alfaGrados, betaGrados, points[0], points[1]);
	}
	return betaGrados;
};

export const getInclinationByPolygonPath = function (polygon: google.maps.Polygon | undefined): number | null {
	if (!polygon) {
		console.error("can't calculate inclination because polygon doesnt exist", polygon);
		return 0;
	}
	const asPoints = convertPolygonPathToPoints(polygon);
	if (!asPoints || !asPoints.length || !asPoints[0].x || isNaN(asPoints[0].x)) {
		console.error('error in the polygone', asPoints, polygon);
		return 0;
	}
	const inclination = getInclinationByRectanglePoints(asPoints);

	return inclination; // Devuelve el ángulo en grados
};

export const getRectangleSideDimensionsByPolygonPath = function (polygon: google.maps.Polygon) {
	const pathAsArray = polygon.getPath().getArray();

	const side1_length = google.maps.geometry.spherical.computeDistanceBetween(pathAsArray[0], pathAsArray[1]);
	const side2_length = google.maps.geometry.spherical.computeDistanceBetween(pathAsArray[1], pathAsArray[2]);

	return [side1_length, side2_length];
};

export const getCardinalOrientationFromPolygon = function (poly: google.maps.Polygon) {
	const [v0, v1] = poly.getPath().getArray();
	return convertLineIntoCardinalOrientation(v0, v1);
};
export const getCardinalOrientationFromAngle = function (angle: number): [string, string?] {
	// Normalize the angle to be within 0-360 degrees
	const cardinales = {};
	const amplitude = 45;
	const extramargin = 15;
	cardinales.North = { min: 337.5, max: 22.5 };
	cardinales.East = { min: cardinales.North.max + amplitude, max: cardinales.North.max + amplitude * 2 };
	cardinales.South = { min: cardinales.East.max + amplitude, max: cardinales.East.max + amplitude * 2 };
	cardinales.West = { min: cardinales.South.max + amplitude, max: cardinales.South.max + amplitude * 2 };

	cardinales.Northeast = {
		min: cardinales.North.max - extramargin,
		max: cardinales.North.max + amplitude + extramargin,
	};
	cardinales.Southeast = {
		min: cardinales.East.max - extramargin,
		max: cardinales.East.max + amplitude + extramargin,
	};
	cardinales.Southwest = {
		min: cardinales.South.max - extramargin,
		max: cardinales.South.max + amplitude + extramargin,
	};
	cardinales.Northwest = {
		min: cardinales.West.max - extramargin,
		max: cardinales.West.max + amplitude + extramargin,
	};

	const cardinalPoints = [];
	Object.keys(cardinales).forEach((cardinalName) => {
		// particular case of north where max is lower than min
		const cardinalBoundaries = cardinales[cardinalName];
		if (cardinalBoundaries.max < cardinalBoundaries.min) {
			if ((angle >= cardinalBoundaries.min && angle <= 360) || angle < cardinalBoundaries.max)
				cardinalPoints.push(cardinalName);
		}
		// regular case
		if (angle >= cardinalBoundaries.min && angle < cardinalBoundaries.max) {
			cardinalPoints.push(cardinalName);
		}
	});

	// sanitize, Ensure the array has max two items
	cardinalPoints.splice(2);
	return cardinalPoints as [string, string?];
};
const convertLineIntoCardinalOrientation = function (v0: google.maps.LatLng, v1: google.maps.LatLng): string {
	const [lat0, lng0, lat1, lng1] = [v0.lat(), v0.lng(), v1.lat(), v1.lng()];

	const deltaLat = lat1 - lat0;
	const deltaLng = lng1 - lng0;

	if (deltaLat === 0 && deltaLng === 0) {
		return 'Undefined'; // hadnle this differently
	}

	const angle = (Math.atan2(deltaLng, deltaLat) * 180) / Math.PI;
	return getCardinalOrientationFromAngle(angle);
};

/**
 * Converts a distance in meters to the equivalent change in latitude degrees.
 * @param meters - The distance in meters.
 * @param lat - The starting latitude.
 * @returns The latitude degrees corresponding to the given meters.
 */
export function metersToLatDegrees(meters: number, lat: number): number {
	const origin = new google.maps.LatLng(lat, 0);
	const destination = google.maps.geometry.spherical.computeOffset(origin, meters, 0); // Move north
	return destination.lat() - origin.lat();
}

/**
 * Converts a distance in meters to the equivalent change in longitude degrees.
 * @param meters - The distance in meters.
 * @param lat - The starting latitude (important for accuracy).
 * @param lng - The starting longitude.
 * @returns The longitude degrees corresponding to the given meters.
 */
export function metersToLngDegrees(meters: number, lat: number, lng: number): number {
	const origin = new google.maps.LatLng(lat, lng);
	const destination = google.maps.geometry.spherical.computeOffset(origin, meters, 90); // Move east
	return destination.lng() - origin.lng();
}
