/**
 * ==== In STEP 2 only ===
 * In the step 2 we desgin the segments as per the solar API response.
 * These segments have a small displacement rispect the Satellite map.
 * We allow the user to drag the segments all together to correct this displacement.
 * The we save this displacement and we take it into account:
 * - the segments from solar API are aligned with the Map view
 * - the rectangle is aligned with the Satellite view.
 * We use that displacement to translate the rectangle into the Map view.
 * the sources of truth here are:
 * - window.cocoOriginalBoundingBox (sw/ne) (never changes)
 * - window.cocoMovingBoundingBoxPolygon The google.maps.Rectangle object with the dragged boundingBox
 */

import { getCurrentStepCocoMap } from ".";
import { applyRotationPortraitSegmentsByRadioSelected } from "./command-rotate-portrait-segments";
import { paintBoundingBoxAsRectangle } from "./drawing-helpers";
import { createNotification, removeNotification } from "./notification-api";
import { deactivateInteractivityOnSegment } from "./setup-segments-interactive-functions";
import getStep2CocoMapSetup from "./step2_functions";
import { convertStringCoordsInLatitudeLongitude, convertStringCoordsInLatLng, getPolygonCenterBySWNE, getPolygonCenterCoords } from "./trigonometry-helpers";
import { ExtendedSegment } from "./types";


export const MOVING_BOUNDINGBOX_OPTIONS: google.maps.RectangleOptions =  {
  editable: false,   // No permite editar vértices
  draggable: true,   // We can drag it
  clickable: true,
  zIndex: 9999,
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#FF0000",
  fillOpacity: 0.35,
}

/**
 * Setup draggable bounding box for moving all segments.
 * Deactivate the interactivity of the segments, as the only interaction will be
 * dragging the big bouniding box containing them all
 */
export const setupSegmentsAndDraggableBoundingBox = function() {
  const cocoSetupMap = getCurrentStepCocoMap();
  if (!cocoSetupMap) return;
  applyRotationPortraitSegmentsByRadioSelected( false );
  createDraggableBoundingBoxForMovingAllSegments(); // remove segment's listeners and paint bounding box w/ dragabble listeners
  createNotification('STEP2_DRAGGABLE_BOUNDING_BOX', [window.cocoBuildingSegments.length.toString()] );
}

export const createDraggableBoundingBoxForMovingAllSegments = () => {

  const cocoMapSetup = getStep2CocoMapSetup();
  const gmap = cocoMapSetup?.map;
  const segments = cocoMapSetup?.segments;


  if ( ! cocoMapSetup || ! gmap || ! segments) {
    console.error(`- Not found the coco-map of step 2 in page ${window.gf_current_page}. Early exit`, cocoMapSetup);
    return;
  }

  /**
   * =========
   * RESET THINGS before repaiting
   * (delete the bounding box to repaint it later). we save the current pos of bbox before that.
   */
  const [offsetLat, offsetLng] = getOffsetFromOriginBoundingBox();
  if (window.cocoMovingBoundingBoxPolygon) {
    // alert('this shouldnt be needed, we should exit here');
    // return;
    google.maps.event.clearListeners(window.cocoMovingBoundingBoxPolygon, 'mousedown');
    google.maps.event.clearListeners(window.cocoMovingBoundingBoxPolygon, 'bounds_changed');
    google.maps.event.clearListeners(window.cocoMovingBoundingBoxPolygon, 'mouseup');
    window.cocoMovingBoundingBoxPolygon.setMap(null);
    window.cocoMovingBoundingBoxPolygon = null;
  }

  /**
   * =========
   * PAINT (or repaint) the bounding box with the center circle
   * (delete the bounding box to repaint it later). we save the current pos of bbox before that.
   */
  window.cocoMovingBoundingBoxPolygon = paintBoundingBoxAsRectangle(
    {
      sw: { latitude: window.cocoOriginalBoundingBox.sw.latitude + offsetLat, longitude: window.cocoOriginalBoundingBox.sw.longitude + offsetLng},
      ne: { latitude: window.cocoOriginalBoundingBox.ne.latitude + offsetLat, longitude: window.cocoOriginalBoundingBox.ne.longitude + offsetLng},
    },
    {fillOpacity: 0.1, strokeOpacity: 0.3, strokeWeight: 5, fillColor: 'black' }
  );
  paintCenterOfMovingBoundingBox();

  if (!window.cocoMovingBoundingBoxPolygon) {
    console.error('No bounding box was created');
    return;
  }

  /**
   * =========
   * DEACTIVATE any interactivity in the segments (we don't click on them)
   */
  if (segments.length) {
    console.log('in creating bounding box, deactivate interaction segments');
    segments.forEach((segment: ExtendedSegment) => {
      deactivateInteractivityOnSegment(segment);
    });
  }

  /**
   * =========
   * Apply LISTENERS to the Bounding Box Rectangle ()
   */
  google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'mousedown', (e: google.maps.MapMouseEvent) => {

    // scoped vars that I need
    const startDragCenter = window.cocoMovingBoundingBoxPolygon?.getBounds()?.getCenter(); // save initial NE so we can calculate displacement
    const allSegmentsStartDragPath = segments.map( s => s.getPath().getArray() ); // save initia vertex

    const moveHandler = (moveEvent: google.maps.MapMouseEvent) => {
      let newCenter = window.cocoMovingBoundingBoxPolygon?.getBounds()?.getCenter();
      if (!newCenter || !startDragCenter) return;
      const latDragDiff = newCenter.lat() - startDragCenter.lat();
      const lngDragDiff = newCenter.lng() - startDragCenter.lng();

      // // update position
      console.log('Dragdiff: ', latDragDiff, lngDragDiff);

      // apply that difference to all segments

      cocoMapSetup.segments?.forEach( (s,i) => {
        const originalPath = allSegmentsStartDragPath[i];
        applyDisplacementToSegment(s, originalPath, latDragDiff, lngDragDiff);
      })
    };

    /** When the dragging is finsihed: we update the global parameters for segments and boundingbox  */
    const upHandler = () => {
      if (dragListener && upListener) {
        google.maps.event.removeListener(dragListener);
        google.maps.event.removeListener(upListener);
      }

      // relative to this drag
      const newCenter = window.cocoMovingBoundingBoxPolygon?.getBounds()?.getCenter();
      let [latDragDiff, lngDragDiff] = [0,0];
      if (newCenter && startDragCenter) {
        latDragDiff = newCenter.lat() - startDragCenter.lat();
        lngDragDiff = newCenter.lng() - startDragCenter.lng();
      }

      // alert(`Displacement of this drag ${latDragDiff},${lngDragDiff}. Total displacement: ${latDiffFromOriginal},${lngDiffFromOriginal}`);

      // update the single source of truth for the position of the segments
      updateValuesCoordsSegmentsWithOffset();

      // restart everything, painting from scratch the segments and boundg box with new values
      // the value of the input is updated when we paing the center circle
      setupSegmentsAndDraggableBoundingBox();

      removeNotification('STEP2_DRAGGABLE_BOUNDING_BOX');
    };
    // ======================================================================

    if (!window.cocoMovingBoundingBoxPolygon) {
      return;
    }
    const dragListener = google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'bounds_changed', moveHandler);
    const upListener = google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'mouseup', upHandler);

  });
}


function applyDisplacementToSegment(polygon: ExtendedSegment, originalPath: Array<google.maps.LatLng>, latOffset: number, lngOffset: number ) {
  const indexInMap = polygon.indexInMap;
  if (indexInMap == null) {
    console.error('not index for polygon segment', polygon);
    return;
  }
  // we need to update the cocoBuildingSegments source of truth coordenates
  const newPath = polygon.getPath().getArray().map((latLng, index) => {
    const originalLatLng = originalPath[index];
    const [newLat, newLng] = [originalLatLng.lat() + latOffset, originalLatLng.lng() + lngOffset];
    return new google.maps.LatLng(newLat, newLng);
  });
  console.log(`applying displacement for segment ${indexInMap}`, [latOffset,lngOffset], polygon);
  if (polygon.data?.stats.areaMeters2 && (polygon.data.stats.areaMeters2 < 20)) {
    polygon.setVisible(false)
  } else {
    polygon.setPath(newPath);
  }
}

// updates the single source of truth for the position of the segments
export const updateValuesCoordsSegmentsWithOffset = function() {

  const [latOffset, lngOffset] = getOffsetFromOriginBoundingBox();

  // alert(`Applying offset ${latOffset*100000}, ${lngOffset*100000}`);
  if (isNaN(latOffset) || isNaN(lngOffset)) {
    console.error('Error. offsets are not numbers. Check out why with the developer. updateValuesCoordsSegmentsWithOffset');
    return;
  }
  window.cocoBuildingSegments.forEach( s => {
    s.boundingBox.sw.latitude = s.originalCoords.originalBoundingBox.sw.latitude + latOffset;
    s.boundingBox.sw.longitude = s.originalCoords.originalBoundingBox.sw.longitude + lngOffset;
    s.boundingBox.ne.latitude = s.originalCoords.originalBoundingBox.ne.latitude + latOffset;
    s.boundingBox.ne.longitude = s.originalCoords.originalBoundingBox.ne.longitude + lngOffset;
    s.center.latitude = s.originalCoords.originalCenter.latitude + latOffset;
    s.center.longitude = s.originalCoords.originalCenter.longitude + lngOffset;
  })
}

// For the page load, we might need to apply the offset inserted in the step 2 in the form.
export const updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion = () => {
  const cocoMapSetup = getStep2CocoMapSetup();
  const initialCenter = window.step2OffsetInserted;
  if (!initialCenter) return;

  if (cocoMapSetup?.inputElement && initialCenter) {
    cocoMapSetup.inputElement.value = initialCenter;
  }

  // We paint the bounding box in that center, as it is the source of truth
  const iniCenterCoords = convertStringCoordsInLatLng(initialCenter);
  if (!iniCenterCoords) {
    console.error(`erroe in initial center inserted in the DB`, initialCenter);
    return;
  }

  const latLength = window.cocoOriginalBoundingBox.ne.latitude - window.cocoOriginalBoundingBox.sw.latitude;
  const lngLength = window.cocoOriginalBoundingBox.ne.longitude - window.cocoOriginalBoundingBox.sw.longitude;
  const bboxCoords = {
    sw: { latitude: iniCenterCoords.lat() - (latLength/2), longitude: iniCenterCoords.lng() - (lngLength/2) },
    ne: { latitude: iniCenterCoords.lat() - (latLength/2), longitude: iniCenterCoords.lng() - (lngLength/2) },
  };
  window.cocoMovingBoundingBoxPolygon = paintBoundingBoxAsRectangle( bboxCoords, { strokeColor: 'pink'} );

  // This is the real original center.
  window.cocoOriginalBoundingBoxCenter = {
    latitude: window.cocoMovingBoundingBoxPolygon!.getBounds()!.getCenter().lat(),
    longitude: window.cocoMovingBoundingBoxPolygon!.getBounds()!.getCenter().lng(),
  };
  if (cocoMapSetup?.inputElement) {
    cocoMapSetup.inputElement.value = `${window.cocoOriginalBoundingBoxCenter.latitude},${window.cocoOriginalBoundingBoxCenter.longitude}`;
  }
  // initialCenter vs center of window.cocoMovingBoundingBoxPolygon

  // now that the bounding box is updated, we can apply the changes to the segments.
  updateValuesCoordsSegmentsWithOffset();
}

export const paintCenterOfMovingBoundingBox = () => {

  // delete if any previous marker was painted.
  window.cocoMovingBoundingBoxAssociatedMarkers = window.cocoMovingBoundingBoxAssociatedMarkers || [];
  window.cocoMovingBoundingBoxAssociatedMarkers.forEach(m => m.map = null);

  if (! window.cocoMovingBoundingBoxPolygon ) {
    return;
  }
  const center = window.cocoMovingBoundingBoxPolygon?.getBounds()?.getCenter();
  if ( ! center ) {
    return;
  }
  // paint the target for the center of the boundingBox
  const cocoMapSetup = getCurrentStepCocoMap();
  if (cocoMapSetup?.map) {
    window.paintAMarker(
      cocoMapSetup.map,
      center,
      `${(window as any).cocoAssetsDir}${'target.png'}`,
      {
        style: {
          width: '20px',
          height: '20px',
          transform: 'translate(0px, 10px)',
          border:'2px solid white',
          borderRadius:'50%',
        },
      }
    ).then(marker => {
      // we save the marker for future access.
      window.cocoMovingBoundingBoxAssociatedMarkers?.push(marker);
      if (marker.content)
        marker.content.title = `Center of the bounding box \n ${center.lat()}, ${center.lng()}`;

      // Once everything's drawn, we initialize the value for the input
      if (cocoMapSetup.inputElement) {
        const currentCenter = getMovingBoundingBoxCenter();
        cocoMapSetup.inputElement.value = `${currentCenter?.lat()},${currentCenter?.lng()}`;
      }
    });
  }
}

/**
 * The offset is calculated by the center of the moving rectangle bbox
 * and the original center of the bounding boxr
 * @returns
 */
export const getOffsetFromOriginBoundingBox = function(): [number, number] {

  if (!window.cocoMovingBoundingBoxPolygon) {
    return [0, 0];
  }
  const [currentLat, currentLng] = [
    window.cocoMovingBoundingBoxPolygon?.getBounds()?.getSouthWest().lat(),
    window.cocoMovingBoundingBoxPolygon?.getBounds()?.getSouthWest().lng()
  ];
  const [offsetLat, offsetLng] = [
    currentLat! - window.cocoOriginalBoundingBox.sw.latitude,
    currentLng! - window.cocoOriginalBoundingBox.sw.longitude,
  ];
  return [offsetLat, offsetLng];
}

// The value stored in the gravity forms entry is exposed in window. step2·OffsetInserted
export const getOffsetFromValueInDB = function() {
  const coords = convertStringCoordsInLatLng( window.step2OffsetInserted );
  if (!coords) {
    return [0, 0];
  }
  const [currentLat, currentLng] = [
    coords.lat(),
    coords.lng()
  ];
  const [offsetLat, offsetLng] = [
    currentLat! - window.cocoOriginalBoundingBox.sw.latitude,
    currentLng! - window.cocoOriginalBoundingBox.sw.longitude,
  ];
  return [offsetLat, offsetLng];
}

// TODELETE
function getMovingBoundingBoxCenter() {
  if (!window.cocoMovingBoundingBoxPolygon) {
    console.error('Error: cocoMovingBoundingBoxPolygon is undefined. Unable to calculate the center.');
    return null;
  }
  const bounds = window.cocoMovingBoundingBoxPolygon.getBounds();
  if (!bounds) {
    console.error('Error: getBounds error. Unable to calculate the center.');
    return null;
  }
  return getPolygonCenterBySWNE({
    sw: { latitude: bounds.getSouthWest().lat(), longitude: bounds.getSouthWest().lng() },
    ne: { latitude: bounds.getNorthEast().lat(), longitude: bounds.getNorthEast().lng(), },
  });
}