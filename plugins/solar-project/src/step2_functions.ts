// types
import { CocoMapSetup } from './types';

import  { getStep2CocoMapSetup, setupSegments } from './1-setup-segments';
import {
  latLngToPoint,
  convertPointsArrayToLatLngString,
  getLineIntersection,
} from './trigonometry-helpers';

import {
  paintInclinedAxisAsLinesFromCoordenates,
  designBuildingProfile,
  paintRectangleInMap,
  paintCenterOfRectangleInMap,
 } from './drawing-helpers';

 import { debugSetup } from './debug';


/** Start everything  */

document.addEventListener("solarMapReady", (event: CustomEvent<CocoMapSetup>) => {

  if ( ! window.cocoIsStepSelectRectangle ) {
    return;
  }

  const cocoMapSetup = getStep2CocoMapSetup();


  console.log('We are in the step of select rectangle. map so far ', );

  // Verification, we get info of the map of step 2.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-ignore
  if ( cocoMapSetup.inputElement.id !== event.detail.inputElement.id ) {
    console.error( 'not found the input id', cocoMapSetup.inputElement );
    return;
  }

  console.log(' Exectued cocoMap for field', window.cocoMapSetup);
  const theMap = cocoMapSetup.map;

  // design polygon of the whole roof profile
  if (window.cocoBuildingProfile?.length) {
    console.log('>>>>> design of', window.cocoBuildingProfile);
    designBuildingProfile(theMap, window.cocoBuildingProfile, 'black');
  }

  // design all segments
  setupSegments();


  // things related to debugging
  debugSetup();

} );



export const handlerClickDrawRectangleOverSegment = function (e) {
  const segm = this;
  console.log('click on the segment', segm);
  console.log('step', window.cocoDrawingRectangle.drawRectangleStep );
  console.log('event', e, e.latLng.lat(), e.latLng.lng() );

  // FIRST CLICK OF RECT DESIGN: Now we mark the first vertex of the rectangle
  if ( window.cocoDrawingRectangle.drawRectangleStep === 'step1.selectFirstVertex' ) {
    handlerClickFirstVertexRectangle( segm.map, e, segm.realRotationAngle );
    window.cocoDrawingRectangle.drawRectangleStep = 'step2.selectSecondVertex';
    segm.setOptions({ fillOpacity: 0.1 });
    segm.addListener('mousemove', function( ev ) {
      console.log( 'Moving >>>> ' + ev.latLng.lat() );
      handlerMouseMoveSecondVertexRectangle( segm.map, ev, segm.realRotationAngle );
    } );
    segm.addListener('click', function( ev ) {
      console.log('Paso a step2'); // handlerClickDrawRectangleOverSegment
    });
  }

  // SECOND CLICK OF RECT DESIGN: Now we mark the opposite vertex of the rectangle
  else if ( window.cocoDrawingRectangle.drawRectangleStep === 'step2.selectSecondVertex' ) {

    const input = document.getElementById(window.step2PolygonInputId) as HTMLInputElement;
    if (input) {
      input.value = window.cocoDrawingRectangle.rectanglePolygonCoords || '';
    }
    console.log('window.cocoDrawingRectangle.rectanglePolygonCoords', window.cocoDrawingRectangle.rectanglePolygonCoords);

    // Clear the mouseover listener
    console.log('Clear mousemove listener');
    window.google.maps.event.clearListeners(segm, 'mousemove');
    window.google.maps.event.clearListeners(segm, 'click');
    window.cocoDrawingRectangle.drawRectangleStep = 'step3.finished';

    window.cocoDrawingRectangle.polygon?.setOptions({ clickable: true });
    paintCenterOfRectangleInMap(segm.map);
    if (window.cocoDrawingRectangle.polygon) {
      window.cocoDrawingRectangle.polygon.addListener('click', function(this: google.maps.Polygon, event: google.maps.MapMouseEvent) {
        console.log('Polygon clicked at', this, event.latLng.lat(), event.latLng.lng());
        // Add desired behavior or function call here

        // rotate the pixels of the polygon, and repaint it
      });
    }

  }

}


const handlerClickFirstVertexRectangle = ( gmap: google.maps.Map, clickEvent: google.maps.event, angle: number ) => {
  window.cocoDrawingRectangle.firstVertexCoord = { lat: clickEvent.latLng.lat(), lng: clickEvent.latLng.lng() };
  window.cocoDrawingRectangle.firstVertexPoint = latLngToPoint(gmap, { latitude: clickEvent.latLng.lat(), longitude: clickEvent.latLng.lng() });

  // paint the first 2 lines
  const { axisLinesDefinedByPoints, line1, line2 } = paintInclinedAxisAsLinesFromCoordenates( gmap, window.cocoDrawingRectangle.firstVertexPoint, angle );
  console.log(axisLinesDefinedByPoints); // object with {lineX, lineY}
  window.cocoDrawingRectangle.boundariesLinesAxisFirstClick = axisLinesDefinedByPoints;
  window.cocoDrawingRectangle.firstClickAxislineX = line1;
  window.cocoDrawingRectangle.firstClickAxislineY = line2;
}

const handlerMouseMoveSecondVertexRectangle = (
  gmap: google.maps.Map,
  clickEvent: google.maps.event,
  angle: number
) => {

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