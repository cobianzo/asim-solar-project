// types
import { RoofSegmentStats, ExtendedSegment, CocoMapSetup, CocoDrawingRectangleInfo } from './types';
import {
  latLngToPoint,
  orthopedicRegtanglePoints,
  rotateRectangle,
  convertPointsArrayToLatLngString,
  getLineIntersection,
} from './trigonometry-helpers';

import {
  paintASunForSegment,
  paintInclinedAxisAsLinesFromCoordenates,
 } from './drawing-helpers';

declare global {
  interface Window {
    cocoDrawingRectangle: CocoDrawingRectangleInfo;
    cocoIsStepSelectRectangle: Boolean;
    cocoIsStepSelectPanelli: Boolean;

    cocoAssetsDir: string;
    step2PolygonInputId: string;
    step2RectangleCoords: string;
    step3PolygonInputId: string;
    gMapsKey: string;

    cocoMaps: { [key: string]: CocoMapSetup }; // @TODO:
    paintAPoygonInMap: (gMap: google.maps.Map, coordinatesAsString: string, extraparams?: object) => ExtendedSegment;
  }
}

document.addEventListener("solarMapReady", (event: CustomEvent<CocoMapSetup>) => {

  if ( ! window.cocoIsStepSelectRectangle ) {
    return;
  }

  const cocoMapSetup = event.detail;
  console.log('map so far ', cocoMapSetup);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-ignore
  if ( window.step2PolygonInputId !== cocoMapSetup.inputElement.id ) {
    console.error( 'not found the input id', cocoMapSetup.inputElement );
    return;
  }
  console.log(' Exectued cocoMap for field', cocoMapSetup);
  const theMap = cocoMapSetup.map;

  // retrieve all roof segments

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-ignore
  const roofSegments = window.cocoBuildingRoofs;
  if ( roofSegments.length )
    roofSegments.forEach((element : RoofSegmentStats, i: number) => {
      console.log( 'Calculos par segment ', i, element);

      const {center, azimuthDegrees, boundingBox: {sw, ne}} = element;

      // calculations of coord of the new rotated rect
      const rectPoints = orthopedicRegtanglePoints(theMap, sw, ne);

      if ( ! rectPoints ) {
        return null;
      }

      const isPortrait = rectPoints ?
        Math.abs(rectPoints[0].x - rectPoints[2].x) < Math.abs(rectPoints[0].y - rectPoints[1].y)
        : false;

      // angle that we'll turn the drwan rectangle
      // here the API of gmaps is weird: if the rectangle is landscape, the angle is correct,
      // but if the rectangle is portrait, we need to add 90 degrees to the angle
      const angle90 = (azimuthDegrees + (isPortrait? 90 : 0) ) % 90;
      const centerPoint = latLngToPoint(theMap, center);
      const newRectPoints = centerPoint? rotateRectangle(rectPoints, centerPoint, angle90) : null;
      const rectangleToPaint = newRectPoints? convertPointsArrayToLatLngString(theMap, newRectPoints) : null;
      console.log('rectangleToPaint', rectangleToPaint);

      // Finally paint the inclined rectangle, adding some properties for easy access
      cocoMapSetup.segments = cocoMapSetup.segments || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const segment = window.paintAPoygonInMap(theMap, rectangleToPaint, { clickable: true, fillOpacity: 0.35 });
      segment.data = element; // to access to the solar API data of the segment
      segment.indexInMap = i;
      segment.pointsInMap = newRectPoints || undefined;
      segment.sunMarker = paintASunForSegment(theMap, segment, `sun-marker${isPortrait? '-hover':''}.png` );
      segment.realInclinationAngle = angle90;

      cocoMapSetup.segments.push( segment );


      // Evento mouseover
      segment.addListener('mouseover', function() {
        console.log('hover on roof segment', segment);
        highlightSegment(segment);

        // eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
        // @ts-ignore

        window.cocoDrawingRectangle = window.cocoDrawingRectangle || {};
        window.cocoDrawingRectangle.hoveredSegment = segment;

        // hide all other segments
        cocoMapSetup.segments?.forEach((segm) => {
          if ( segm.indexInMap !== segment.indexInMap ) {
            fadeSegment(segm);
          }
        })
      });

      // Evento mouseout
      google.maps.event.addListener(segment, 'mouseout', function() {
        // @ts-ignore
        if ( window.cocoDrawingRectangle?.hoveredSegment?.indexInMap !== segment.indexInMap // @ts-ignore
          || window.cocoDrawingRectangle?.selectedSegment?.indexInMap === segment.indexInMap
        ) {
          return;
        }
        // @ts-ignore
        window.cocoDrawingRectangle.hoveredSegment = null;
        resetSegmentVisibility(segment);
        // hide all other segments .
        // @ts-ignore
        cocoMapSetup.segments.forEach((segm) => resetSegmentVisibility(segm));
      });

      google.maps.event.addListener(segment, 'click', handlerClickSelectSegment);
    });
} );


function highlightSegment(roofSegment: ExtendedSegment, extraParams = {}) {
  roofSegment.setOptions({ fillOpacity: 0.7, strokeOpacity: 1, ...extraParams });
  roofSegment.sunMarker?.setIcon({ // @ts-ignore
    ...roofSegment.sunMarker.getIcon(), // @ts-ignore
    url: window.cocoAssetsDir + 'sun-marker-hover.png',
  });
}
function resetSegmentVisibility(roofSegment: ExtendedSegment) {
  roofSegment.setOptions({ fillOpacity: 0.35 });
  roofSegment.sunMarker?.setIcon({ // @ts-ignore
    ...roofSegment.sunMarker.getIcon(), // @ts-ignore
    url: window.cocoAssetsDir + 'sun-marker.png'
  });
}
function fadeSegment(roofSegment: ExtendedSegment) {
  roofSegment.setOptions({ fillOpacity: 0.1, strokeOpacity: 0 });
  // roofSegment.sunMarker.setIcon({
  //   ...roofSegment.sunMarker.getIcon(),
  //   url: window.cocoAssetsDir + 'sun-marker.png'
  // });
}

function handlerClickSelectSegment(e: Event) {
  const segm = this as ExtendedSegment;
  console.log('click on segment once', segm);
  // unhighlight all segments
  const allSegments = window.cocoMaps[window.step2PolygonInputId].segments;
  allSegments.forEach( (s: ExtendedSegment) => {
    if ( s.indexInMap !== segm.indexInMap ) {
      s.setVisible(false);
    }
    resetSegmentVisibility(s);
  } );
  highlightSegment(segm, { fillColor: 'green', fillOpacity: 0.5, strokeWeight: 5, draggableCursor: 'crosshair'  }); // green

  window.cocoDrawingRectangle = window.cocoDrawingRectangle || {};
  window.cocoDrawingRectangle.selectedSegment = segm;
  window.cocoDrawingRectangle.hoveredSegment = null;

  window.cocoDrawingRectangle.drawRectangleStep = 'step1.selectFirstVertex';
  google.maps.event.clearListeners(segm, 'click');
  google.maps.event.clearListeners(segm, 'mouseover');
  google.maps.event.clearListeners(segm, 'mouseout');
  google.maps.event.addListener(segm, 'click', handlerClickDrawRectangleOverSegment);
}

function handlerClickDrawRectangleOverSegment(e) {
  const segm = this;
  console.log('click on the segment', segm);
  console.log('step', window.cocoDrawingRectangle.drawRectangleStep );
  console.log('event', e, e.latLng.lat(), e.latLng.lng() );

  // FIRST CLICK OF RECT DESIGN: Now we mark the first vertex of the rectangle
  if ( window.cocoDrawingRectangle.drawRectangleStep === 'step1.selectFirstVertex' ) {
    handlerClickFirstVertexRectangle( segm.map, e, segm.realInclinationAngle );
    window.cocoDrawingRectangle.drawRectangleStep = 'step2.selectSecondVertex';
    segm.setOptions({ fillOpacity: 0.1 });
    segm.addListener('mousemove', function( ev ) {
      console.log( 'Moving >>>> ' + ev.latLng.lat() );
      handlerMouseMoveSecondVertexRectangle( segm.map, ev, segm.realInclinationAngle );
    } );
    segm.addListener('click', function( ev ) {
      console.log('Paso a step2'); // handlerClickDrawRectangleOverSegment
    });
  }

  // SECOND CLICK OF RECT DESIGN: Now we mark the opposite vertex of the rectangle
  else if ( window.cocoDrawingRectangle.drawRectangleStep === 'step2.selectSecondVertex' ) {

    const input = document.getElementById(window.step2PolygonInputId);
    input.value = window.cocoDrawingRectangle.rectanglePolygonCoords;
    console.log('window.cocoDrawingRectangle.rectanglePolygonCoords', window.cocoDrawingRectangle.rectanglePolygonCoords);

    // Clear the mouseover listener
    console.log('Clear mousemove listener');
    window.google.maps.event.clearListeners(segm, 'mousemove');
    window.google.maps.event.clearListeners(segm, 'click');
    window.cocoDrawingRectangle.drawRectangleStep = 'step3.finished';

  }

}


const handlerClickFirstVertexRectangle = ( gmap, clickEvent, angle ) => {
  window.paintAMarker(
    gmap,
    { lat: clickEvent.latLng.lat(), lng: clickEvent.latLng.lng() },
    `${window.cocoAssetsDir}vertex-ne.png`,
    {
      scaledSize: new window.google.maps.Size(10, 10),
      anchor: new google.maps.Point(0, 10),
    }
  );

  window.cocoDrawingRectangle.firstVertexCoord = { lat: clickEvent.latLng.lat(), lng: clickEvent.latLng.lng() };
  window.cocoDrawingRectangle.firstVertexPoint = latLngToPoint(gmap, { latitude: clickEvent.latLng.lat(), longitude: clickEvent.latLng.lng() });

  // paint the first 2 lines
  const { axisLinesDefinedByPoints, line1, line2 } = paintInclinedAxisAsLinesFromCoordenates( gmap, window.cocoDrawingRectangle.firstVertexPoint, angle );
  console.log(axisLinesDefinedByPoints); // object with {lineX, lineY}
  window.cocoDrawingRectangle.boundariesLinesAxisFirstClick = axisLinesDefinedByPoints;
  window.cocoDrawingRectangle.firstClickAxislineX = line1;
  window.cocoDrawingRectangle.firstClickAxislineY = line2;
}

const handlerMouseMoveSecondVertexRectangle = ( gmap, clickEvent, angle ) => {

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
  window.cocoDrawingRectangle.rectanglePolygonCoords = convertPointsArrayToLatLngString( gmap, [
    window.cocoDrawingRectangle.firstVertexPoint, intersectionPointB, secondVertexPoint, intersectionPointD
  ]) ?? '';;

  // paint!
  window.cocoDrawingRectangle.polygon = window.paintAPoygonInMap(
    gmap,
    window.cocoDrawingRectangle.rectanglePolygonCoords
  );

  return true;
}