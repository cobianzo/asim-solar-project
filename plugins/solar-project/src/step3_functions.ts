// RENAME TO step 4 TODO:
import { paintCenterOfUsersRectangleInMap, paintRectangleInMap } from './drawing-helpers';
import { updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion } from './setup-drag-all-segments-interaction';
import { getRectangleInclination, paintResizeHandlersInPolygon } from './setup-resize-rectangle-interaction';
import rectangleRotationInteractionSetup from './setup-rotate-rectangle-interaction';
import setupSegments from './setup-segments-interactive-functions';
import { calculatePathRectangleByOppositePointsAndInclination, convertPointsArrayToLatLngString, getInclinedAxisAsLinesFromCoordenates, getLineIntersection, latLngToPoint } from './trigonometry-helpers';
import { CocoMapSetup } from './types';

/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
export const getStep3CocoMapSetup = function() : CocoMapSetup | null {
  const cocoMapSetup = window.cocoMaps[window.step3CocoMapInputId];
  return cocoMapSetup ?? null;
}

document.addEventListener("solarMapReady", (event: Event) => {

  // setup and validations
  const customEvent = event as CustomEvent<CocoMapSetup>;
  const cocoMapSetup = getStep3CocoMapSetup();
  if ( ! window.cocoIsStepSelectRectangle || ! cocoMapSetup
    || ( cocoMapSetup.inputElement.id !== customEvent.detail.inputElement.id )
  ) {
    return;
  }

  console.log(' Exectued cocoMap for field', window.cocoMapSetup);
  const theMap = cocoMapSetup.map;

  updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion();

  setupSegments( window.step2RotationInserted ?? 'no-extra-rotation' );
//  window.paintAPoygonInMap(theMap, window.step3RectangleCoords, { fillOpacity: 0.35 });

});

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



export const handlerFirstClickDrawRectangleOverSegment = function (e: google.maps.MapMouseEvent) {
  const segm = window.cocoDrawingRectangle.selectedSegment;
  if ( !segm ) {
    console.error('we need the selected segment , but its not saved.', segm);
    return;
  }

  console.log('click on the segment', segm);
  console.log('event', e, e.latLng.lat(), e.latLng.lng() );

  // FIRST CLICK OF RECT DESIGN: Now we mark the first vertex of the rectangle
  const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
  setFirstVertexOfRectangle( segm.map, latLng );

  segm.setOptions({ fillOpacity: 0.1 });

  google.maps.event.clearListeners(segm, 'click');

  console.log('The map where we apply mousemove: ', segm.map);
  segm.map.addListener('mousemove', handlerMouseMoveSecondVertexRectangle);
  segm.map.addListener('click', (e: google.maps.MapMouseEvent) => {
    console.log('%cSECONDCLICK - we fix the rectangle', 'color: blue; font-weight: bold;');
    handlerSecondClickDrawRectangle(e);
    // the rectangle polygon has been created, we save the inclination, which can be modified with rotation tool.
    window.cocoDrawingRectangle.inclinationWhenCreated = getRectangleInclination( window.cocoDrawingRectangle.polygon );
    window.cocoDrawingRectangle.currentInclinationAfterRotation = window.cocoDrawingRectangle.inclinationWhenCreated;
  });
  segm.setOptions({ clickable: false });
  segm.setVisible(false);

}

export const handlerSecondClickDrawRectangle = function (e: google.maps.MapMouseEvent) {

  const segm = window.cocoDrawingRectangle.selectedSegment;
  if ( ! segm ) {
    console.error('Segment not found:', segm);
    return;
  }

  const input = document.getElementById(window.step3CocoMapInputId) as HTMLInputElement;
  if (input) {
    input.value = window.cocoDrawingRectangle.rectanglePolygonCoords || '';
  }
  console.log('window.cocoDrawingRectangle.rectanglePolygonCoords', window.cocoDrawingRectangle.rectanglePolygonCoords);

  // save data of the second click (we don't use it) TODELETE: not needed to store these I believe
  // const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
  // setSecondVertexOfRectangle( segm.map, latLng);

  // Finsi setup and paint hte center
  window.cocoDrawingRectangle.polygon?.setOptions({ clickable: true });
  paintCenterOfUsersRectangleInMap(segm.map);

  // assign the event listeners that allow the user to rotate the rectangle on the map
  rectangleRotationInteractionSetup();
  paintResizeHandlersInPolygon(); // TODO: apply after rotation.

  // Clear the listeners for mousedown, click, and mousemove on segm.map
  window.google.maps.event.clearListeners(segm.map, 'mousedown');
  window.google.maps.event.clearListeners(segm.map, 'click');
  window.google.maps.event.clearListeners(segm.map, 'mousemove');
  window.google.maps.event.clearListeners(segm.map, 'mouseup');
}

const setFirstVertexOfRectangle = ( gmap: google.maps.Map, latLng: google.maps.LatLngLiteral ) => {
  window.cocoDrawingRectangle.firstVertexCoord = latLng;
  window.cocoDrawingRectangle.firstVertexPoint = latLngToPoint(gmap, { latitude: latLng.lat, longitude: latLng.lng });

  if (! window.cocoDrawingRectangle.firstVertexPoint ) {
    console.error('window.cocoDrawingRectangle.firstVertexPoint is null. This is a problem. Check the code.', window.cocoDrawingRectangle);
    return;
  }
}

// not needed to store these I believe TODELETE:
const setSecondVertexOfRectangle = ( gmap: google.maps.Map, latLng: google.maps.LatLngLiteral ) => {
  window.cocoDrawingRectangle.secondVertexCoord = latLng;
  window.cocoDrawingRectangle.secondVertexPoint = latLngToPoint(gmap, { latitude: latLng.lat, longitude: latLng.lng });
  if (! window.cocoDrawingRectangle.secondVertexPoint ) {
    console.error('window.cocoDrawingRectangle.firstVertexPoint is null. This is a problem. Check the code.', window.cocoDrawingRectangle);
    return;
  }
}


export const handlerMouseMoveSecondVertexRectangle = (clickEvent: google.maps.MapMouseEvent) => {

  const gmap = window.cocoDrawingRectangle.selectedSegment?.map;
  const angle = window.cocoDrawingRectangle.selectedSegment?.realRotationAngle;

  if (!gmap || angle === null ||
    !window.cocoDrawingRectangle.firstVertexPoint
  ) return;


  // Paint the polygon rectangle again with the params:
  // window.cocoDrawingRectangle.firstVertexPoint
  const pointEnd = latLngToPoint(gmap, { latitude: clickEvent.latLng.lat(), longitude: clickEvent.latLng.lng() });
  // angle
  if ( !pointEnd) return;


  // we consider the case of the rectangle has been rotated with the tool to rotate.
  let degreesOffset = window.cocoDrawingRectangle.currentInclinationAfterRotation - window.cocoDrawingRectangle.inclinationWhenCreated;
  if (isNaN(degreesOffset)) {
    degreesOffset = 0;
  }

  console.log('degreesoffset', degreesOffset);

  const success = calculatePathRectangleByOppositePointsAndInclination(
    gmap,
    window.cocoDrawingRectangle.firstVertexPoint,
    pointEnd,
    (angle! + degreesOffset)
  );

  if (window.cocoDrawingRectangle.selectedSegment
    && success?.axisLinesDefinedByPointsFirst && success?.axisLinesDefinedByPointsSecond
    && success?.rectanglePolygonCoords && success?.vertexPoints
  ) {
    const {
      axisLinesDefinedByPointsFirst,
      axisLinesDefinedByPointsSecond,
      rectanglePolygonCoords,
      vertexPoints
    } = success;

    // after the changes we update:
    window.cocoDrawingRectangle.boundariesLinesAxisFirstClick = axisLinesDefinedByPointsFirst;
    window.cocoDrawingRectangle.boundariesLinesAxisSecondClick = axisLinesDefinedByPointsSecond;

    // if the polygon is drawn, we remove it and repaint it and update the params of the rectangle
    paintRectangleInMap(gmap, window.cocoDrawingRectangle.selectedSegment, rectanglePolygonCoords, vertexPoints);
    console.log('Rectangle painted, ', success);
  }

  return success;

}
