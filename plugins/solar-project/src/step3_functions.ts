// RENAME TO step 4 TODO:
import { paintCenterOfUsersRectangleInMap, paintRectangleInMap } from './drawing-helpers';
import { updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion } from './setup-drag-all-segments-interaction';
import { paintResizeHandlersInPolygon } from './setup-resize-rectangle-interaction';
import rectangleRotationInteractionSetup from './setup-rotate-rectangle-interaction';
import setupSegments from './setup-segments-interactive-functions';
import { convertPointsArrayToLatLngString, getInclinedAxisAsLinesFromCoordenates, getLineIntersection, latLngToPoint } from './trigonometry-helpers';
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
  setFirstVertexOfRectangle( segm.map, latLng, segm.realRotationAngle ?? 0 );

  segm.setOptions({ fillOpacity: 0.1 });

  google.maps.event.clearListeners(segm, 'click');

  console.log('The map where we apply mousemove: ', segm.map);
  segm.map.addListener('mousemove', handlerMouseMoveSecondVertexRectangle);
  // we don't need to add the click because it already has it
  segm.map.addListener('click', handlerSecondClickDrawRectangle);
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

  // Clear the mouseover listener
  console.log('Clear mousemove listener');
  window.google.maps.event.clearListeners(segm.map, 'mousemove');
  window.google.maps.event.clearListeners(segm.map, 'click');

  window.cocoDrawingRectangle.polygon?.setOptions({ clickable: true });
  paintCenterOfUsersRectangleInMap(segm.map);

  // assign the event listeners that allow the user to rotate the rectangle on the map
  rectangleRotationInteractionSetup();
  paintResizeHandlersInPolygon(); // TODO: apply after rotation.
}

const setFirstVertexOfRectangle = ( gmap: google.maps.Map, latLng: google.maps.LatLngLiteral, angle: number ) => {
  window.cocoDrawingRectangle.firstVertexCoord = latLng;
  window.cocoDrawingRectangle.firstVertexPoint = latLngToPoint(gmap, { latitude: latLng.lat, longitude: latLng.lng });

  if (! window.cocoDrawingRectangle.firstVertexPoint ) {
    console.error('window.cocoDrawingRectangle.firstVertexPoint is null. This is a problem. Check the code.', window.cocoDrawingRectangle);
    return;
  }
}

const handlerMouseMoveSecondVertexRectangle = (clickEvent: google.maps.MapMouseEvent) => {

  const gmap = window.cocoDrawingRectangle.selectedSegment?.map;
  const angle = window.cocoDrawingRectangle.selectedSegment?.realRotationAngle;

  if (!gmap || angle === null ||
    !window.cocoDrawingRectangle.firstVertexPoint
  ) return;


  // Paint the polygon rectangle again with the params:
  // window.cocoDrawingRectangle.firstVertexPoint
  const pointB = latLngToPoint(gmap, { latitude: clickEvent.latLng.lat(), longitude: clickEvent.latLng.lng() });
  // angle
  if ( !pointB) return;

  const success = drawRectangleByOppositePointsAndInclination(
    gmap,
    window.cocoDrawingRectangle.firstVertexPoint,
    pointB,
    angle!
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


function drawRectangleByOppositePointsAndInclination( gmap: google.maps.Map, pointA: google.maps.Point, pointC: google.maps.Point, angle: number ) {

  const { axisLinesDefinedByPoints: axisLinesDefinedByPointsFirst } =
    getInclinedAxisAsLinesFromCoordenates( pointA, angle! );

  if (!axisLinesDefinedByPointsFirst) {
    return null;
  }

  console.log('we saved the first vertex on ', axisLinesDefinedByPointsFirst);

  const { axisLinesDefinedByPoints: axisLinesDefinedByPointsSecond }
    = getInclinedAxisAsLinesFromCoordenates( pointC, angle ?? 0 );

  if (!axisLinesDefinedByPointsSecond ) {
    return null;
  }

  console.log('moving the mouse to build a rectangle: ', pointC);

  // now get the 2 other points that we need

  const axisSecondClick = window.cocoDrawingRectangle.boundariesLinesAxisSecondClick;
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
  if ( window.cocoDrawingRectangle.firstVertexPoint && intersectionPointB && pointC && intersectionPointD ) {
    const vertexPoints = [
      window.cocoDrawingRectangle.firstVertexPoint,
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