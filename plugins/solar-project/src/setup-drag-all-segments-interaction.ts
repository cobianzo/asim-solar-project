/**
 * ==== In STEP 2 === (and we need the moving bounding box in step 3 too )
 * In the step 2 we design the segments as per the solar API response.
 * These segments have a small offset displacement respect the Satellite map.
 * We allow the user to drag the segments all together to correct this displacement.
 * the sources of truth here are:
 * - window.coco·OriginalBoundingBox (sw vertex as a reference to calculate the offset) (never changes)
 * - window.coco·MovingBoundingBoxPolygon The google.maps.Rectangle object with the draggable boundingBox
 * - window.step2·OffsetInserted, (the value inserted in the DB, we use it on pageload to apply to bbox))
 */

import { convertStringCoordsInLatLng } from './trigonometry-helpers';
import { ExtendedSegment } from './types';

export const MOVING_BOUNDINGBOX_OPTIONS: google.maps.RectangleOptions = {
	editable: false, // No permite editar vértices
	draggable: true, // We can drag it
	clickable: true,
	zIndex: 9999,
	strokeColor: 'white',
	strokeOpacity: 0.2,
	strokeWeight: 1,
	fillColor: 'yellow',
	fillOpacity: 0.1,
};

export const MOVING_BOUNDINGBOX_HOVER: google.maps.RectangleOptions = {
	...{ MOVING_BOUNDINGBOX_OPTIONS },
	strokeOpacity: 0.1,
	strokeColor: 'red',
	fillOpacity: 0.3,
};

// updates the single source of truth for the position of the segments
export const updateValuesCoordsSegmentsWithOffset = function (
	useOffsetLat: number | null = null,
	useOffsetLng: number | null = null
) {
	// if the params are not passed, we take the offset of the step 2 moving Bbox
	let latOffset = null;
	let lngOffset = null;
	if (useOffsetLat === null || useOffsetLng === null) {
		[latOffset, lngOffset] = getMovingBoundingBoxOffsetFromOrigin();
	} else {
		latOffset = useOffsetLat;
		lngOffset = useOffsetLng;
	}

	// alert(`Applying offset ${latOffset*100000}, ${lngOffset*100000}`);
	if (null === latOffset || null === lngOffset || isNaN(latOffset) || isNaN(lngOffset)) {
		console.error(
			'Error. offsets are not numbers. Check out why with the developer. updateValuesCoordsSegmentsWithOffset'
		);
		return;
	}
	window.cocoBuildingSegments.forEach((s) => {
		s.boundingBox.sw.latitude = s.originalCoords.originalBoundingBox.sw.latitude + latOffset;
		s.boundingBox.sw.longitude = s.originalCoords.originalBoundingBox.sw.longitude + lngOffset;
		s.boundingBox.ne.latitude = s.originalCoords.originalBoundingBox.ne.latitude + latOffset;
		s.boundingBox.ne.longitude = s.originalCoords.originalBoundingBox.ne.longitude + lngOffset;
		s.center.latitude = s.originalCoords.originalCenter.latitude + latOffset;
		s.center.longitude = s.originalCoords.originalCenter.longitude + lngOffset;
	});
};

// For the page load, we might need to apply the offset inserted in the step 2 in the form.
export const updateValuesCoordsSegmentsFromDBOffset = () => {
	const [offsetLat, offsetLng] = getOffsetFromValueInDB();

	// now that the bounding box is updated, we can apply the changes to the segments.
	updateValuesCoordsSegmentsWithOffset(offsetLat, offsetLng);
};

/**
 * For Page Load: Take the value of the offset inserted by the user,
 * and apply to the sources of truth window.coco·MovingBoundingBoxPolygon
 */
export const updateMovingBoundingBoxFromDBOffset = () => {
	const [offsetLat, offsetLng] = getOffsetFromValueInDB();

	// Apply that offset to the bounding box
	const newSWNE = {
		sw: {
			latitude: window.cocoOriginalBoundingBox.sw.latitude + offsetLat,
			longitude: window.cocoOriginalBoundingBox.sw.longitude + offsetLng,
		},
		ne: {
			latitude: window.cocoOriginalBoundingBox.ne.latitude + offsetLat,
			longitude: window.cocoOriginalBoundingBox.ne.longitude + offsetLng,
		},
	};
	window.cocoMovingBoundingBoxPolygon!.setBounds({
		south: newSWNE.sw.latitude,
		west: newSWNE.sw.longitude,
		north: newSWNE.ne.latitude,
		east: newSWNE.ne.longitude,
	});
};

/**
 * The offset is calculated by the center of the moving rectangle bbox
 * and the original center of the bounding boxr
 * @returns
 */
export const getMovingBoundingBoxOffsetFromOrigin = function (): [number, number] {
	if (!window.cocoMovingBoundingBoxPolygon) {
		return [0, 0];
	}
	const [currentLat, currentLng] = [
		window.cocoMovingBoundingBoxPolygon?.getBounds()?.getSouthWest().lat(),
		window.cocoMovingBoundingBoxPolygon?.getBounds()?.getSouthWest().lng(),
	];
	const [offsetLat, offsetLng] = [
		currentLat! - window.cocoOriginalBoundingBox.sw.latitude,
		currentLng! - window.cocoOriginalBoundingBox.sw.longitude,
	];
	return [offsetLat, offsetLng];
};

export const isPortaitSegmentRotated = function(segment: ExtendedSegment | null) : boolean {
  if (!segment) return false;
  return (segment.realRotationAngle == ((segment.data?.azimuthDegrees ?? 0) + 90));
}

// The value stored in the gravity forms entry is exposed in window. step2·OffsetInserted
export const getOffsetFromValueInDB = function (): [number, number] {
	const coords = convertStringCoordsInLatLng(window.step2OffsetInserted);
	if (!coords) {
		return [0, 0];
	}
	const [currentLat, currentLng] = [coords.lat(), coords.lng()];
	const [offsetLat, offsetLng] = [
		currentLat! - window.cocoOriginalBoundingBox.sw.latitude,
		currentLng! - window.cocoOriginalBoundingBox.sw.longitude,
	];
	return [offsetLat, offsetLng];
};

export const handlerBoundingBoxHover = function () {
	if (window.cocoMovingBoundingBoxPolygon) {
		window.cocoMovingBoundingBoxPolygon.setOptions(MOVING_BOUNDINGBOX_HOVER);
	}
};

export const handlerBoundingBoxMouseOut = function () {
	if (window.cocoMovingBoundingBoxPolygon) {
		window.cocoMovingBoundingBoxPolygon.setOptions(MOVING_BOUNDINGBOX_OPTIONS);
	}
};
