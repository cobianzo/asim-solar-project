/**
 * The use defines rectangles where the solar panels go.
 * There is one rectangle per segment
 *
 * The rectangles can be
 * 1) created from scratch (you need to select the segment first)
 * 2) edited if they existed when you select the segment
 * When editing, the info of the edited rectangle is in window.cocoDrawingRectangle
 *
 * The created rectangles are in window.cocoSavedRectangles
 *
 */
import { MARKER_LEFT_BOTTOM_OPTIONS, paintRectangleInMap } from './drawing-helpers';
import {
	activateInteractionWithRectangleResizeHandler,
	paintResizeHandlersInUsersRectangle,
} from './setup-resize-rectangle-interaction';
import { getStep3CocoMapSetup } from './step3_functions';
import {
	calculatePathRectangleByOppositePointsAndInclination,
	convertPolygonPathToStringLatLng,
	convertStringLatLngToArrayLatLng,
	getCardinalOrientationFromAngle,
	getInclinationByPolygonPath,
	getInclinationByRectanglePoints,
	getRectangleSideDimensionsByPolygonPath,
	latLngToPoint,
} from './trigonometry-helpers';
import { ExtendedSegment, LoadedSavedRectangeData, MapMouseEvent, SavedRectangle } from './types';
import { handlerClickSaveRectangleButton } from './buttons-topright-map';
import { addAssociatedMarker, getSegmentByIndex, selectSegment } from './setup-segments-interactive-functions';
import {
	cleanupSolarPanelsForSavedRectangle,
	numberOfPanelsInRectangle,
	setupSolarPanels,
} from './setup-solar-panels';
import { getCurrentStepCocoMap } from '.';
import { createNotification } from './notification-api';

export const RECTANGLE_OPTIONS: google.maps.PolygonOptions = {
	strokeWeight: 2,
	strokeColor: 'black',
	fillColor: 'lightblue',
	fillOpacity: 0.3,
	visible: true,
	clickable: false,
	draggable: false,
	zIndex: 0,
};
export const HIGHLIGHTED_RECTANGLE_OPTIONS: google.maps.PolygonOptions = {
	...RECTANGLE_OPTIONS,
	strokeColor: 'blue',
	fillColor: 'blue',
	zIndex: 10000,
};

export const SELECTED_RECTANGLE_OPTIONS: google.maps.PolygonOptions = {
	...RECTANGLE_OPTIONS,
	strokeColor: 'yellow',
	strokeWeight: 5,
	fillOpacity: 0.1,
	clickable: true,
	draggable: true,
	zIndex: 100,
};

export const FADED_RECTANGLE_OPTIONS: google.maps.PolygonOptions = {
	fillOpacity: 0.2,
	zIndex: -1,
	clickable: false,
	draggable: true,
};

/** paint the rectangles and make them selectables */
export const setupRectangles = function () {
	const cocoMapSetup = getStep3CocoMapSetup();
	if (!cocoMapSetup?.map) {
		return;
	}

	const allSavedRectangles = window.cocoSavedRectangles || [];
	allSavedRectangles.forEach((r) => paintSavedRectangle(cocoMapSetup.map, r));

	setupSolarPanels();
};

export const paintSavedRectangle = function (gmap: google.maps.Map, rectangleInfo: SavedRectangle) {
	if (!rectangleInfo.tempPathAsString?.length) return;
	if (!rectangleInfo.polygon?.getMap()) {
		rectangleInfo.polygon = window.paintAPoygonInMap(gmap, rectangleInfo.tempPathAsString, RECTANGLE_OPTIONS);
	} else {
		// paint again the polygon. tempPathAsString must be ready with the new coords
		const path = convertStringLatLngToArrayLatLng(rectangleInfo.tempPathAsString);
		rectangleInfo.polygon.setPath(path);
		rectangleInfo.polygon.setOptions(RECTANGLE_OPTIONS);
	}
};

export const getSavedRectangleBySegment = function (segment: ExtendedSegment): SavedRectangle | undefined {
	return (window.cocoSavedRectangles || []).find((r) => r.segmentIndex === segment.indexInMap);
};

export const removeSavedRectangleBySegmentIndex = function (segmentIndex: number) {
	if (segmentIndex == null) {
		console.error('no sement index to remove the rectangle');
		return;
	}
	// before deleting its info
	if (!window.cocoSavedRectangles || !window.cocoSavedRectangles.length) {
		window.cocoSavedRectangles = [];
		return;
	}

	const indexInArray = window.cocoSavedRectangles.findIndex((sr) => sr.segmentIndex === segmentIndex);
	if (typeof indexInArray === 'number' && indexInArray >= 0) {
		// delete all the polygons for the solar panels
		cleanupSolarPanelsForSavedRectangle(window.cocoSavedRectangles[indexInArray]);
	}
	window.cocoSavedRectangles = window.cocoSavedRectangles.filter((r) => r.segmentIndex !== segmentIndex);
};

export const highlightSavedRectangle = function (segm: ExtendedSegment) {
	const rectangle = getSavedRectangleBySegment(segm);
	if (rectangle && rectangle.polygon) {
		rectangle.polygon.setOptions(HIGHLIGHTED_RECTANGLE_OPTIONS);
	}
};

export const unhighlightSavedRectangle = function (segm: ExtendedSegment) {
	// find the rectangle associated to this segment
	const rectangle = getSavedRectangleBySegment(segm);

	if (rectangle && rectangle.polygon) {
		rectangle.polygon.setOptions(RECTANGLE_OPTIONS);
	}
};

export const saveSavedRectanglesInTextArea = function () {
	const dataToSave = window.cocoSavedRectangles
		.map((savedR: SavedRectangle) => {
			// 1. save the shape of the rectangle
			const rectData = {};
			if (!savedR.polygon) return null;
			rectData.rectanglePath = convertPolygonPathToStringLatLng(savedR.polygon);

			// 2. save deactivated solar panels
			rectData.deactivatedSolarPanels = Array.from(savedR.deactivatedSolarPanels ?? []);

			// 3. save orientation of solar panels
			rectData.panelOrientation = savedR.panelOrientation ?? '';

			// 4. associated segment
			rectData.indexSegment = savedR.segmentIndex;

			// This info is needed in step 4, but not needed here in step 3.
			// ==========
			const theSegm = getSegmentByIndex(savedR.segmentIndex!);
			if (theSegm) {
				rectData.orientation = getCardinalOrientationFromAngle(theSegm.data?.azimuthDegrees!).join(', ');
			}
			rectData.numberPanels = numberOfPanelsInRectangle(savedR);
			// ==========

			return rectData;
		})
		.filter((a) => a != null);

	const dataStringified = JSON.stringify(dataToSave);

	// find the textarea to save the data.
	const textAreaEl = document.querySelector('.gfield.saved-rectangles textarea');
	if (!textAreaEl) {
		console.error('the textarea with class and with adminLabbel saved-rectangles doesnt exist');
		return;
	}

	// We save the data in the textarea. GF will keep it persistent along the steps and submission
	(textAreaEl as HTMLTextAreaElement).value = dataStringified;
};

export const loadSavedRectanglesFromTextArea = function () {
	const textAreaEl = document.querySelector('.gfield.saved-rectangles textarea');
	if (!textAreaEl) {
		console.error('the textarea with class and with adminLabbel saved-rectangles doesnt exist');
		return;
	}
	const cocoMapSetup = getCurrentStepCocoMap();
	const segments = cocoMapSetup?.segments;
	if (!cocoMapSetup || !segments) {
		return;
	}

	const stringified = (textAreaEl as HTMLTextAreaElement).value;
	if (!stringified.length) {
		console.log('nothing to load');
		return;
	}
	const data = JSON.parse(stringified);
	data.forEach((savedRectangleData: LoadedSavedRectangeData) => {
		// 1. load the shape of the rectangle
		const pathAsString = savedRectangleData.rectanglePath;
		const savedRectangle: SavedRectangle = {
			polygon: null,
			tempPathAsString: pathAsString,
			segmentIndex: savedRectangleData.indexSegment,
			solarPanelsPolygons: [],
			deactivatedSolarPanels: new Set(savedRectangleData.deactivatedSolarPanels),
			panelOrientation: savedRectangleData.panelOrientation,
		};

		window.cocoSavedRectangles = window.cocoSavedRectangles || [];
		window.cocoSavedRectangles.push(savedRectangle);

		paintSavedRectangle(cocoMapSetup.map, savedRectangle);

		// once the rectagnle is painted, we paint the solar panels
	});

	// now the source of truth has the data ready to paint the rectangles and solar panels.
	// we just need to wait for google.maps.geometry, which might take some secs
	if (typeof google === 'undefined' || !google.maps || !google.maps.geometry) {
		const interval = setInterval(() => {
			if (typeof google !== 'undefined' && google.maps && google.maps.geometry) {
				clearInterval(interval);
				setupRectangles();
			}
		}, 100);
	} else {
		setupRectangles();
	}
};

/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */
/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */
/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */

/// Now the handlers to CREATE and RESIZE the rectangle

export const handlerFirstClickDrawRectangleOverSegment = function (e: google.maps.MapMouseEvent) {
	const segm = window.cocoDrawingRectangle.selectedSegment;
	if (!segm) {
		console.error('we need the selected segment , but its not saved.', segm);
		return;
	}
	const latLng = { lat: e.latLng!.lat(), lng: e.latLng!.lng() };
	console.log('click on the segment', segm.indexInMap, latLng);

	// FIRST CLICK OF RECT DESIGN: Now we mark the first vertex of the rectangle

	window.cocoDrawingRectangle.tempFirstClickPoint = latLngToPoint(segm.map, {
		latitude: latLng.lat,
		longitude: latLng.lng,
	});

	segm.setOptions({
		fillOpacity: 0.1,
		clickable: false,
		visible: false,
	});

	// paint the arrow marking the first vertex
	window
		.paintAMarker(
			segm.map,
			e.latLng!,
			`${window.cocoAssetsDir}vertex-sw-white.png`,
			MARKER_LEFT_BOTTOM_OPTIONS
		)
		.then((m) => addAssociatedMarker(m, window.cocoDrawingRectangle as AssociatedMarkersParent));

	createNotification('STEP3_FIRST_VERTEX_RECTANGLE');

	// Now setup the listeners for editing the existing rectangle
	const theMap = segm.map;
	google.maps.event.clearListeners(segm, 'click');
	segm.map.addListener('mousemove', handlerMouseMoveSecondVertexRectangle);
	segm.map.addListener('click', (e: google.maps.MapMouseEvent) => {
		console.log('%cSECONDCLICK when we create a new rectangle', 'color: blue; font-weight: bold;');

		handlerSecondClickDrawRectangle(); // this is also used when we edit an existing rectangle
	});
};

export const handlerSecondClickDrawRectangle = function () {
	const segm = window.cocoDrawingRectangle.selectedSegment;
	if (!segm) {
		alert('todel, handler of second click on rect');
		console.error('Segment not found:', segm);
		return;
	}
	const map = segm.getMap();

	// save the data path of coordenates in the input elment as text
	// [... ] TODO:
	delete window.cocoDrawingRectangle.tempFirstClickPoint;

	// Finish setup and paint hte center
	// paintCenterOfUsersRectangleInMap(segm.map);

	// assign the event listeners that allow the user to rotate the rectangle on the map
	// rectangleRotationInteractionSetup(); // currently deactivated
	paintResizeHandlersInUsersRectangle();
	activateInteractionWithRectangleResizeHandler(segm);

	// The rectangle has been updated. We need to update the saved rectangle if it exists.
	const savedRectangle = getSavedRectangleBySegment(segm);
	if (savedRectangle) {
		savedRectangle.tempPathAsString = convertPolygonPathToStringLatLng(window.cocoDrawingRectangle.polygon!);
	}

	createNotification('STEP3_SECOND_VERTEX_RECTANGLE');

	handlerClickSaveRectangleButton(null); // save the rectangle the user just painted. It unselects the segment
	const cocoSetupMap = getStep3CocoMapSetup();
	const theSegment = cocoSetupMap?.segments?.find((s) => s.indexInMap === segm.indexInMap);
	if (theSegment) {
		selectSegment(theSegment);
	}
};

/**
 * Fairly complex.
 * Paints the rectangle of the user while it is being created, as the user drags the mouse.
 * It calculates the coordinates of the rectangle given the two points that the user is dragging.
 * It takes into account the inclination of the parent segment.
 * Potentially it could  into account if the rectangle has been rotated (but this option is deactivated).
 * @param clickEvent The google maps event that has triggered this function.
 * @returns an object with the calculated coordinates of the rectangle, axis lines and vertex points.
 */
export const handlerMouseMoveSecondVertexRectangle = (clickEvent: MapMouseEvent) => {
	const gmap = window.cocoDrawingRectangle.selectedSegment?.map;

	if (clickEvent?.pixel && window.cocoDrawingRectangle.tempFirstClickPoint) {
		// wait for the rectangle to be bin enough to calculate the inclination
		// otherwise we can't calculate the inclination with warranties.
		// while this early exit happens, the user will see an arrow where he clicked first.
		const distancePixels = Math.sqrt(
			Math.pow(clickEvent.pixel.x - window.cocoDrawingRectangle.tempFirstClickPoint.x, 2) +
				Math.pow(clickEvent.pixel.y - window.cocoDrawingRectangle.tempFirstClickPoint.y, 2)
		);
		const minPixels = 5;
		if (distancePixels < minPixels) return;
	}

	// When we execute this handler the first time, as the rectangle polygon doesnt exist,
	// then we take the inclination of the parent segment.
	const referencePolygonForInclination =
		window.cocoDrawingRectangle.polygon ?? window.cocoDrawingRectangle.selectedSegment!;
	let angle = getInclinationByPolygonPath(referencePolygonForInclination);
	if (null === angle) {
		angle = getInclinationByPolygonPath(window.cocoDrawingRectangle.selectedSegment);
	}
	// const angle = window.cocoDrawingRectangle.selectedSegment?.realRotationAngle; // this works but I think I've improved it
	console.log(
		"THE ANGLE that we'll use to desing the rectange is",
		angle,
		window.cocoDrawingRectangle.polygon ? 'USEING rectangle' : 'using parent segment'
	);

	if (!gmap || angle === null) return;

	// Paint the polygon rectangle again with the params:
	// window.cocoDrawingRectangle.firstVertexPoint
	const pointEnd = latLngToPoint(gmap, {
		latitude: clickEvent.latLng!.lat(),
		longitude: clickEvent.latLng!.lng(),
	});
	// angle
	if (!pointEnd) return;

	// get the pixel where the rectangles starts. this handler happens in two situations:
	// 1) creation of the polygon (the firstclick is saved on 'click' 2) resizing, we take it form the path
	let firstVertexPoint = window.cocoDrawingRectangle.tempFirstClickPoint ?? null;
	console.log('we have clicked on the first vertex which is', firstVertexPoint);
	if (!firstVertexPoint) {
		// the rectangle is already created, there oppposite vertex was not created on click, so we grab it
		//  assuming it's the vertex 0 because we are dragging vertes 2.
		const firstVertexLatLng = window.cocoDrawingRectangle.polygon?.getPath().getArray()[0];
		if (!firstVertexLatLng) {
			console.error('error retrieving coordenates first vertesx', firstVertexLatLng);
			return;
		}
		firstVertexPoint = latLngToPoint(gmap, {
			latitude: firstVertexLatLng.lat(),
			longitude: firstVertexLatLng.lng(),
		});
		if (!firstVertexPoint) {
			console.error('error retrieving coordenates first vertesx', firstVertexPoint);
			return;
		}

		window.cocoDrawingRectangle.tempFirstClickPoint = firstVertexPoint; // we save it so we don't need to calculate each mousemove
	}

	if (!firstVertexPoint) {
		console.error(
			"we don't know the origin vertex of the rectangleRotationInteractionSetup",
			firstVertexPoint
		);
		return;
	}

	const success = calculatePathRectangleByOppositePointsAndInclination(
		gmap,
		firstVertexPoint,
		pointEnd,
		angle!
	);
	if (
		window.cocoDrawingRectangle.selectedSegment &&
		success?.axisLinesDefinedByPointsFirst &&
		success?.axisLinesDefinedByPointsSecond &&
		success?.rectanglePolygonCoords &&
		success?.vertexPoints
	) {
		const {
			axisLinesDefinedByPointsFirst,
			axisLinesDefinedByPointsSecond,
			rectanglePolygonCoords, // the only one we need
			vertexPoints,
		} = success;

		// if the polygon is drawn, we remove it and repaint it and update the params of the rectangle
		paintRectangleInMap(gmap, window.cocoDrawingRectangle.selectedSegment, rectanglePolygonCoords);
	}

	return success;
};
