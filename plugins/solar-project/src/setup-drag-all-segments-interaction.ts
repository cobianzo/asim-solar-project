/**
 * In the step 2 we desgin the segments as per the solar API response.
 * These segments have a small displacement rispect the Satellite map.
 * We allow the user to drag the segments all together to correct this displacement.
 * The we save this displacement and we take it into account:
 * - the segments from solar API are aligned with the Map view
 * - the rectangle is aligned with the Satellite view.
 * We use that displacement to translate the rectangle into the Map view.
 */

import { applyRotationPortraitSegmentsByRadioSelected } from "./command-rotate-portrait-segments";
import { paintBoundingBoxAsRectangle } from "./drawing-helpers";
import setupSegments, { deactivateInteractivityOnSegment } from "./setup-segments-interactive-functions";
import getStep2CocoMapSetup from "./step2_functions";
import { ExtendedSegment } from "./types";

/**
 * Setup draggable bounding box for moving all segments.
 * Deactivate the interactivity of the segments, as the only interaction will be
 * dragging the big bouniding box containing them all
 */
export const setupSegmentsAndDraggableBoundingBox = () => {
  setupSegments(); // paint the segments (it also applies listeners to interact with them)
  createDraggableBoundingBoxForMovingAllSegments(); // remothe segment's listeners and paint bounding box w/ dragabble listeners
  applyRotationPortraitSegmentsByRadioSelected(); // rotate the segments as per the option selected
}

export const createDraggableBoundingBoxForMovingAllSegments = () => {

  const cocoMapSetup = getStep2CocoMapSetup();
  const gmap = cocoMapSetup?.map;
  const segments = cocoMapSetup?.segments;


  if ( ! cocoMapSetup || ! gmap || ! segments) {
    console.log(`Not found the coco-map of step 2 in page ${window.gf_current_page}. Early exit`, cocoMapSetup);
    return;
  }

  // reset things if needed
  if (window.cocoRectangleBoundingBox) {
    google.maps.event.clearListeners(window.cocoRectangleBoundingBox, 'mousedown');
    google.maps.event.clearListeners(window.cocoRectangleBoundingBox, 'bounds_changed');
    google.maps.event.clearListeners(window.cocoRectangleBoundingBox, 'mouseup');
    window.cocoRectangleBoundingBox.setMap(null);
    window.cocoRectangleBoundingBox = null;
  }

  window.cocoRectangleBoundingBox = paintBoundingBoxAsRectangle(
    gmap,
    window.cocoAllSegmentBoundingBox,
    {fillOpacity: 0.1, strokeOpacity: 0.3, fillColor: 'black' }
  );

  if (!window.cocoRectangleBoundingBox) {
    console.error('No bounding box was created');
    return;
  }

  if (segments.length) {
    console.log('in creating bounding box, deactivate interaction segments');
    segments.forEach((segment: ExtendedSegment) => {
      deactivateInteractivityOnSegment(segment);
    });
  }

  google.maps.event.addListener(window.cocoRectangleBoundingBox, 'mousedown', (e: google.maps.MapMouseEvent) => {

    // scoped vars that I need
    const startNE = window.cocoRectangleBoundingBox?.getBounds()?.getNorthEast(); // save initial NE so we can calculate displacement
    const allSegmentsOriginalPath = segments.map( s => s.getPath().getArray() ); // save initia vertex

    const moveHandler = (moveEvent: google.maps.MapMouseEvent) => {
      let newNE = window.cocoRectangleBoundingBox?.getBounds()?.getNorthEast();
      if (!newNE || !startNE) return;
      const latDiff = newNE.lat() - startNE.lat();
      const lngDiff = newNE.lng() - startNE.lng();

      // // update position
      console.log('diff: ', latDiff, lngDiff);

      // apply that difference to all segments
      segments?.forEach( (s,i) => {
        const originalPath = allSegmentsOriginalPath[i];
        applyDisplacementToPolygon(s, originalPath, latDiff, lngDiff);
      })
    };

    /** When the dragging is finsihed: we update the global parameters for segments and boundingbox  */
    const upHandler = () => {
      if (dragListener && upListener) {
        google.maps.event.removeListener(dragListener);
        google.maps.event.removeListener(upListener);
      }
      let newNE = window.cocoRectangleBoundingBox?.getBounds()?.getNorthEast();
      if (!newNE || !startNE) return;
      const latDiff = newNE.lat() - startNE.lat();
      const lngDiff = newNE.lng() - startNE.lng();

      console.log(`applying displacement in lat of ${latDiff},${lngDiff}`);

      // update the single source of truth for the position of the segments
      updateValuesCoordsSegmentsWithOffset(latDiff, lngDiff);

      // save the offset in the input
      const cocoMapSetup = getStep2CocoMapSetup();
      if ( cocoMapSetup?.inputElement ) {
        const center = window.cocoBoundingBoxCenter;
        cocoMapSetup.inputElement.value = `${center.latitude + latDiff},${center.longitude + lngDiff}`;
      }

      // restart everything, paiting from scratch the segments and boundg box with new values
      setupSegmentsAndDraggableBoundingBox();
    };

    if (!window.cocoRectangleBoundingBox) {
      return;
    }
    const dragListener = google.maps.event.addListener(window.cocoRectangleBoundingBox, 'bounds_changed', moveHandler);
    const upListener = google.maps.event.addListener(window.cocoRectangleBoundingBox, 'mouseup', upHandler);

  });
}


function applyDisplacementToPolygon(polygon: ExtendedSegment, originalPath: Array<google.maps.LatLng>, latOffset: number, lngOffset: number ) {
  const indexInMap = polygon.indexInMap;
  if (indexInMap == null) return;
  // we need to update the cocoBuildingSegments source of truth coordenates
  const newPath = polygon.getPath().getArray().map((latLng, index) => {
    const originalLatLng = originalPath[index];
    const [newLat, newLng] = [originalLatLng.lat() + latOffset, originalLatLng.lng() + lngOffset];
    return new google.maps.LatLng(newLat, newLng);
  });
  polygon.setPath(newPath);
}

// updates the single source of truth for the position of the segments
export const updateValuesCoordsSegmentsWithOffset = function( latOffset: number, lngOffset: number ) {
  window.cocoBuildingSegments.forEach( s => {
    s.boundingBox.sw.latitude += latOffset;
    s.boundingBox.sw.longitude += lngOffset;
    s.boundingBox.ne.latitude += latOffset;
    s.boundingBox.ne.longitude += lngOffset;
    s.center.latitude += latOffset;
    s.center.longitude += lngOffset;
  })
  window.cocoAllSegmentBoundingBox.sw.latitude += latOffset;
  window.cocoAllSegmentBoundingBox.sw.longitude += lngOffset;
  window.cocoAllSegmentBoundingBox.ne.latitude += latOffset;
  window.cocoAllSegmentBoundingBox.ne.longitude += lngOffset;
}