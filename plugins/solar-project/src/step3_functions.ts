// RENAME TO step 4 TODO:
import { paintCenterOfUsersRectangleInMap, paintInclinedAxisAsLinesFromCoordenates, paintRectangleInMap } from './drawing-helpers';
import { updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion } from './setup-drag-all-segments-interaction';
import rectangleRotationInteractionSetup from './setup-rotate-rectangle-interaction';
import setupSegments from './setup-segments-interactive-functions';
import { convertPointsArrayToLatLngString, getLineIntersection, latLngToPoint } from './trigonometry-helpers';
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

}

const setFirstVertexOfRectangle = ( gmap: google.maps.Map, latLng: google.maps.LatLngLiteral, angle: number ) => {
  window.cocoDrawingRectangle.firstVertexCoord = latLng;
  window.cocoDrawingRectangle.firstVertexPoint = latLngToPoint(gmap, { latitude: latLng.lat, longitude: latLng.lng });

  if (! window.cocoDrawingRectangle.firstVertexPoint ) {
    console.error('window.cocoDrawingRectangle.firstVertexPoint is null. This is a problem. Check the code.', window.cocoDrawingRectangle);
    return;
  }
  // paint the first 2 lines
  const { axisLinesDefinedByPoints, line1, line2 } = paintInclinedAxisAsLinesFromCoordenates( gmap, window.cocoDrawingRectangle.firstVertexPoint, angle );
  console.log(axisLinesDefinedByPoints); // object with {lineX, lineY}
  window.cocoDrawingRectangle.boundariesLinesAxisFirstClick = axisLinesDefinedByPoints;
  window.cocoDrawingRectangle.firstClickAxislineX = line1;
  window.cocoDrawingRectangle.firstClickAxislineY = line2;
  console.log('we saved the first vertex on ', window.cocoDrawingRectangle.firstVertexPoint);
}

const handlerMouseMoveSecondVertexRectangle = (clickEvent: google.maps.MapMouseEvent) => {

  const gmap = window.cocoDrawingRectangle.selectedSegment?.map;
  const angle = window.cocoDrawingRectangle.selectedSegment?.realRotationAngle;

  if (!gmap || angle === null) return;

  // if the polygon is drawn, we remove it
  window.cocoDrawingRectangle.polygon?.setMap(null);
  window.cocoDrawingRectangle.secondClickAxislineX?.setMap(null);
  window.cocoDrawingRectangle.secondClickAxislineY?.setMap(null);

  // save the point where we clicked and project a line with the given angle
  const secondVertexPoint = latLngToPoint(gmap, { latitude: clickEvent.latLng.lat(), longitude: clickEvent.latLng.lng() });
  // this line causes problems. It inhibites the currnt click event on the segment
  const { axisLinesDefinedByPoints, line1, line2 } = paintInclinedAxisAsLinesFromCoordenates( gmap, secondVertexPoint, angle );
  if (!axisLinesDefinedByPoints ) return;
  window.cocoDrawingRectangle.boundariesLinesAxisSecondClick = axisLinesDefinedByPoints;
  window.cocoDrawingRectangle.secondClickAxislineX = line1;
  window.cocoDrawingRectangle.secondClickAxislineY = line2;


  console.log('moving the mouse to build a rectangle: ', secondVertexPoint);

  // now get the 2 other points that we need
  const axisFirstClick = window.cocoDrawingRectangle.boundariesLinesAxisFirstClick;
  const axisSecondClick = window.cocoDrawingRectangle.boundariesLinesAxisSecondClick;
  const intersectionPointB = getLineIntersection(
    axisFirstClick.lineX[0].x, axisFirstClick.lineX[0].y,
    axisFirstClick.lineX[1].x, axisFirstClick.lineX[1].y,
    axisSecondClick.lineY[0].x, axisSecondClick.lineY[0].y,
    axisSecondClick.lineY[1].x, axisSecondClick.lineY[1].y
  );
  const intersectionPointD = getLineIntersection(
    axisFirstClick.lineY[0].x, axisFirstClick.lineY[0].y,
    axisFirstClick.lineY[1].x, axisFirstClick.lineY[1].y,
    axisSecondClick.lineX[0].x, axisSecondClick.lineX[0].y,
    axisSecondClick.lineX[1].x, axisSecondClick.lineX[1].y
  );

  // with all the points, we draw the inclined rectangle created by the user
  if ( window.cocoDrawingRectangle.firstVertexPoint && intersectionPointB && secondVertexPoint && intersectionPointD ) {
    const vertexPoints = [
      window.cocoDrawingRectangle.firstVertexPoint,
      intersectionPointB,
      secondVertexPoint,
      intersectionPointD
    ]
    const rectanglePolygonCoords = convertPointsArrayToLatLngString( gmap, vertexPoints ) ?? '';;

    // paint the rectangle created by the user!
    paintRectangleInMap(gmap, rectanglePolygonCoords, vertexPoints);

    return true;
  }

  return false;

}
