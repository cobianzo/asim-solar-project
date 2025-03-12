/**
 * In the step 2 we desgin the segments as per the solar API response.
 * These segments have a small displacement rispect the Satellite map.
 * We allow the user to drag the segments all together to correct this displacement.
 * The we save this displacement and we take it into account:
 * - the segments from solar API are aligned with the Map view
 * - the rectangle is aligned with the Satellite view.
 * We use that displacement to translate the rectangle into the Map view.
 */

import { paintBoundingBoxAsRectangle } from "./drawing-helpers";
import setupSegments, { deactivateInteractivityOnSegment } from "./setup-segments-interactive-functions";
import getStep2CocoMapSetup from "./step2_functions";
import { ExtendedSegment } from "./types";

export const createDraggableBoundingBoxForMovingAllSegments = () => {

  const cocoMapSetup = getStep2CocoMapSetup();
  const gmap = cocoMapSetup?.map;
  const segments = cocoMapSetup?.segments;


  if ( ! cocoMapSetup || ! gmap || ! segments) {
    console.log(`Not found the coco-map of step 2 in page ${window.gf_current_page}. Early exit`, cocoMapSetup);
    return;
  }
  // reset things if needed

  window.cocoRectangleBoundingBox = paintBoundingBoxAsRectangle(
    gmap,
    window.cocoAllSegmentBoundingBox,
    {fillOpacity: 0, strokeOpacity: 0}
  );

  if (!window.cocoRectangleBoundingBox) {
    console.error('No bounding box was created');
    return;
  }

  if (segments.length) {
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

    const upHandler = () => {
      if (dragListener && upListener) {
        google.maps.event.removeListener(dragListener);
        google.maps.event.removeListener(upListener);
      }
      let newNE = window.cocoRectangleBoundingBox?.getBounds()?.getNorthEast();
      if (!newNE || !startNE) return;
      const latDiff = newNE.lat() - startNE.lat();
      const lngDiff = newNE.lng() - startNE.lng();

      alert(`applying displacement in lat of ${latDiff}`);
      // update the single source of truth for the position of the segments
      segments.forEach( s => {
        if (s.indexInMap == null) return;
        window.cocoBuildingSegments[s.indexInMap].boundingBox.sw.latitude += latDiff;
        window.cocoBuildingSegments[s.indexInMap].boundingBox.sw.longitude += lngDiff;
        window.cocoBuildingSegments[s.indexInMap].boundingBox.ne.latitude += latDiff;
        window.cocoBuildingSegments[s.indexInMap].boundingBox.ne.longitude += lngDiff;
        window.cocoBuildingSegments[s.indexInMap].center.latitude += latDiff;
        window.cocoBuildingSegments[s.indexInMap].center.longitude += lngDiff;
      })

      setupSegments();
      createDraggableBoundingBoxForMovingAllSegments();
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