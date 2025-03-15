/**
 * In the step 2 we desgin the segments as per the solar API response.
 * These segments have a small displacement rispect the Satellite map.
 * We allow the user to drag the segments all together to correct this displacement.
 * The we save this displacement and we take it into account:
 * - the segments from solar API are aligned with the Map view
 * - the rectangle is aligned with the Satellite view.
 * We use that displacement to translate the rectangle into the Map view.
 * the sources of truth here are:
 * - window.cocoOriginalBoundingBox (sw/ne) and cocoOriginalBoundingBoxCenter (never changes)
 * - cocoMapSetup.inputElement.value the input value of the coco-map, giving the center of the dragged boundingBox
 * - window.cocoMovingBoundingBoxPolygon The google.maps.Rectangle object with the dragged boundingBox
 */

import { getCurrentStepCocoMap } from ".";
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
  applyRotationPortraitSegmentsByRadioSelected( false );
  createDraggableBoundingBoxForMovingAllSegments(); // remove segment's listeners and paint bounding box w/ dragabble listeners
}

export const createDraggableBoundingBoxForMovingAllSegments = () => {

  const cocoMapSetup = getStep2CocoMapSetup();
  const gmap = cocoMapSetup?.map;
  const segments = cocoMapSetup?.segments;


  if ( ! cocoMapSetup || ! gmap || ! segments) {
    console.error(`- Not found the coco-map of step 2 in page ${window.gf_current_page}. Early exit`, cocoMapSetup);
    return;
  }

  // reset things if needed.
  if (window.cocoMovingBoundingBoxPolygon) {
    google.maps.event.clearListeners(window.cocoMovingBoundingBoxPolygon, 'mousedown');
    google.maps.event.clearListeners(window.cocoMovingBoundingBoxPolygon, 'bounds_changed');
    google.maps.event.clearListeners(window.cocoMovingBoundingBoxPolygon, 'mouseup');
    window.cocoMovingBoundingBoxPolygon.setMap(null);
    window.cocoMovingBoundingBoxPolygon = null;
  }

  // first time design of the bounding box in the original value given by Solar API
  const [offsetLat, offsetLng] = getOffsetFromOriginBoundingBox();
  // alert(`painting bb, calculated offset of ${offsetLat} ${offsetLng}`  );
  window.cocoMovingBoundingBoxPolygon = paintBoundingBoxAsRectangle(
    gmap,
    {
      sw: { latitude: window.cocoOriginalBoundingBox.sw.latitude + offsetLat, longitude: window.cocoOriginalBoundingBox.sw.longitude + offsetLng},
      ne: { latitude: window.cocoOriginalBoundingBox.ne.latitude + offsetLat, longitude: window.cocoOriginalBoundingBox.ne.longitude + offsetLng},
    },
    {fillOpacity: 0.1, strokeOpacity: 0.3, fillColor: 'black' }
  );
  paintCenterOfDisplacedBoundingBox();

  if (!window.cocoMovingBoundingBoxPolygon) {
    console.error('No bounding box was created');
    return;
  }

  if (segments.length) {
    console.log('in creating bounding box, deactivate interaction segments');
    segments.forEach((segment: ExtendedSegment) => {
      deactivateInteractivityOnSegment(segment);
    });
  }

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
        applyDisplacementToPolygon(s, originalPath, latDragDiff, lngDragDiff);
      })
    };

    /** When the dragging is finsihed: we update the global parameters for segments and boundingbox  */
    const upHandler = () => {
      if (dragListener && upListener) {
        google.maps.event.removeListener(dragListener);
        google.maps.event.removeListener(upListener);
      }

      // update input with the center of the dragged bounding box
      const cocoMapSetup = getStep2CocoMapSetup();
      if ( cocoMapSetup?.inputElement ) {
        const center = window.cocoMovingBoundingBoxPolygon?.getBounds()?.getCenter();
        if (center) {
          cocoMapSetup.inputElement.value = `${center.lat()},${center.lng()}`;
        }
      }

      // get abosulte and relative to the drag displacements

      // absolute to the original bounding box:
      const [latDiffFromOriginal, lngDiffFromOriginal] = getOffsetFromOriginBoundingBox();

      // relative to this drag
      const newCenter = window.cocoMovingBoundingBoxPolygon?.getBounds()?.getCenter();
      let [latDragDiff, lngDragDiff] = [0,0];
      if (newCenter && startDragCenter) {
        latDragDiff = newCenter.lat() - startDragCenter.lat();
        lngDragDiff = newCenter.lng() - startDragCenter.lng();
      }

      // alert(`Displacement of this drag ${latDragDiff},${lngDragDiff}. Total displacement: ${latDiffFromOriginal},${lngDiffFromOriginal}`);

      // update the single source of truth for the position of the segments
      updateValuesCoordsSegmentsWithOffset(latDragDiff, lngDragDiff);

      // restart everything, paiting from scratch the segments and boundg box with new values
      setupSegmentsAndDraggableBoundingBox();
    };
    // ======================================================================

    if (!window.cocoMovingBoundingBoxPolygon) {
      return;
    }
    const dragListener = google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'bounds_changed', moveHandler);
    const upListener = google.maps.event.addListener(window.cocoMovingBoundingBoxPolygon, 'mouseup', upHandler);

  });
}


function applyDisplacementToPolygon(polygon: ExtendedSegment, originalPath: Array<google.maps.LatLng>, latOffset: number, lngOffset: number ) {
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
export const updateValuesCoordsSegmentsWithOffset = function( latOffset: number, lngOffset: number ) {
  // alert(`Applying offset ${latOffset*100000}, ${lngOffset*100000}`);
  window.cocoBuildingSegments.forEach( s => {
    s.boundingBox.sw.latitude += latOffset;
    s.boundingBox.sw.longitude += lngOffset;
    s.boundingBox.ne.latitude += latOffset;
    s.boundingBox.ne.longitude += lngOffset;
    s.center.latitude += latOffset;
    s.center.longitude += lngOffset;
  })
}

// For the page load, we might need to apply the offset inserted in the step 2 in the form.
// window.cocoOriginalBoundingBoxCenter is the center of the boundingBox without modifying it from the Solar API response
export const updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion = () => {
  if (window.step2OffsetInserted?.length && window.cocoOriginalBoundingBoxCenter) {
    const displacedLatLng = window.step2OffsetInserted.split(',');
    const diffLat = window.cocoOriginalBoundingBoxCenter.latitude - parseFloat(displacedLatLng[0]);
    const diffLng = window.cocoOriginalBoundingBoxCenter.longitude - parseFloat(displacedLatLng[1]);
    updateValuesCoordsSegmentsWithOffset(-diffLat, -diffLng);
  }
}

export const paintCenterOfDisplacedBoundingBox = () => {

  // delete if any previous marker was painted.
  window.cocoMovingBoundingBoxCenterMarker = window.cocoMovingBoundingBoxCenterMarker || [];
  window.cocoMovingBoundingBoxCenterMarker.forEach(m => m.map = null);

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
      window.cocoMovingBoundingBoxCenterMarker?.push(marker);
    });
  }
}

/**
 * The offset is calculated by the value of the input of the step 2 (if we are in the step 2,
 *  otherwise by the saved value in that input, and exposed in php on window.step2OffsetInserted)
 * and the original center of the bounding box window.cocoOriginalBoundingBoxCenter
 * @returns
 */
export const getOffsetFromOriginBoundingBox = function(): [number, number] {
  const cocoMapSetup = getStep2CocoMapSetup();
  const inputNewCenterValue = cocoMapSetup ? cocoMapSetup.inputElement.value : window.step2OffsetInserted;
  if (!inputNewCenterValue.length) {
    return [0,0];
  }
  const [newCenterLat, newCenterLng] = inputNewCenterValue.split(',');
  console.log('inputvalue: ', [newCenterLat, newCenterLng]);
  const [offsetLat, offsetLng] = [
    parseFloat(newCenterLat) - window.cocoOriginalBoundingBoxCenter.latitude,
    parseFloat(newCenterLng) - window.cocoOriginalBoundingBoxCenter.longitude,
  ];
  return [offsetLat, offsetLng];
}