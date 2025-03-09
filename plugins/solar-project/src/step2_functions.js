import { rotateRectangle,
  convertPointsArrayToLatLngString,
  orthopedicRegtanglePoints,
  latLngToPoint,
  getLineIntersection,
} from './trigonometry-helpers.js';

import {
  paintASunForSegment,
  paintInclinedAxisAsLinesFromCoordenates,
 } from './drawing-helpers.js';
// import addGeoTIFFOverlayToMap from './geotiff_helpers.js';

document.addEventListener("solarMapReady", function (event) {


  if ( ! window.cocoIsStepSelectRectangle ) {
    return;
  }

  const cocoMapSetup = event.detail; // Obtenemos la instancia de Google Maps
  console.log('map so far ', cocoMapSetup);

  if ( window.step2PolygonInputId !== cocoMapSetup.inputElement.id ) {
    console.error( 'not found the input id', cocoMapSetup.inputElement );
    return;
  }
  console.log(' Exectued cocoMap for field', cocoMapSetup);
  const theMap = cocoMapSetup.map;

  // retrieve all roof segments
  const roofSegments = window.cocoBuildingRoofs;
  if ( roofSegments.length )
    roofSegments.forEach((element,i) => {
      console.log( 'Calculos par segment ', i, element);

      const {center, azimuthDegrees, boundingBox: {sw, ne}} = element;

      // calculations of coord of the new rotated rect
      const rectPoints = orthopedicRegtanglePoints(theMap, sw, ne);
      const isPortrait = Math.abs(rectPoints[0].x - rectPoints[2].x) < Math.abs(rectPoints[0].y - rectPoints[1].y);
      console.log(isPortrait ? 'portrait' : 'landscape');
      // angle that we'll turn the drwan rectangle
      // here the API of gmaps is weird: if the rectangle is landscape, the angle is correct,
      // but if the rectangle is portrait, we need to add 90 degrees to the angle
      const angle90 = (azimuthDegrees + (isPortrait? 90 : 0) ) % 90;
      const centerPoint = latLngToPoint(theMap, center);
      const newRectPoints = rotateRectangle(rectPoints, centerPoint, angle90);
      console.log('newRectPoints', newRectPoints);
      const rectangleToPaint = convertPointsArrayToLatLngString(theMap, newRectPoints);
      console.log('rectangleToPaint', rectangleToPaint);

      // Finally paint the inclined rectangle, adding some properties for easy access
      cocoMapSetup.segments = cocoMapSetup.segments || [];
      const segment = window.paintAPoygonInMap(theMap, rectangleToPaint, { clickable: true, fillOpacity: 0.35 });
      segment.data = element; // to access to the solar API data of the segment
      segment.indexInMap = i;
      segment.pointsInMap = newRectPoints;
      segment.sunMarker = paintASunForSegment(theMap, segment, `sun-marker${isPortrait? '-hover':''}.png` );
      segment.realInclinationAngle = angle90;

      cocoMapSetup.segments.push( segment );


      // Evento mouseover
      segment.addListener('mouseover', function() {
        console.log('hover on roof segment', segment);
        highlightSegment(segment);
        window.cocoDrawingRectangle = window.cocoDrawingRectangle || {};
        window.cocoDrawingRectangle.hoveredSegment = segment;
      });

      // Evento mouseout
      google.maps.event.addListener(segment, 'mouseout', function() {
        if ( window.cocoDrawingRectangle?.hoveredSegment?.indexInMap !== segment.indexInMap
          || window.cocoDrawingRectangle?.selectedSegment?.indexInMap === segment.indexInMap
        ) {
          return;
        }
        window.cocoDrawingRectangle.hoveredSegment = null;
        unhighlightSegment(segment);
      });

      google.maps.event.addListener(segment, 'click', handlerClickSelectSegment);
    });
} );


function highlightSegment(roofSegment) {
  roofSegment.setOptions({ fillOpacity: 0.7 });
  roofSegment.sunMarker.setIcon({
    ...roofSegment.sunMarker.getIcon(),
    url: window.cocoAssetsDir + 'sun-marker-hover.png'
  });
}
function unhighlightSegment(roofSegment) {
  roofSegment.setOptions({ fillOpacity: 0.35 });
  roofSegment.sunMarker.setIcon({
    ...roofSegment.sunMarker.getIcon(),
    url: window.cocoAssetsDir + 'sun-marker.png'
  });
}

function handlerClickSelectSegment(e) {
  const segm = this;
  console.log('click on segment once', segm);
  // unhighlight all segments
  const allSegments = cocoMaps[window.step2PolygonInputId].segments;;
  allSegments.forEach( s => {
    if ( s.indexInMap !== segm.indexInMap ) {
      s.setVisible(false);
    }
    unhighlightSegment(s);
  } );
  highlightSegment(segm);
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
    handleClickFirstVertexRectangle( segm.map, e, segm.realInclinationAngle );
    segm.setOptions({ fillOpacity: 0.1 });
    google.maps.event.addListener(segm, 'mousemove', function(e) {
      console.log('moving:' , e);
    });
  }

  // SECOND CLICK OF RECT DESIGN: Now we mark the opposite vertex of the rectangle
  else if ( window.cocoDrawingRectangle.drawRectangleStep === 'step2.selectSecondVertex' ) {

    handleClickSecondVertexRectangle( segm.map, e, segm.realInclinationAngle );
    // WE PAINT THE NEW RECTANGLE - and we should set it up in the input field TODO:


  }

}


const handleClickFirstVertexRectangle = ( gmap, clickEvent, angle ) => {
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
  const inclinedAxis = paintInclinedAxisAsLinesFromCoordenates( gmap, window.cocoDrawingRectangle.firstVertexPoint, angle );
  console.log(inclinedAxis);
  window.cocoDrawingRectangle.boundariesLines = window.cocoDrawingRectangle.boundariesLines || [];
  window.cocoDrawingRectangle.boundariesLines.push( inclinedAxis );

  window.cocoDrawingRectangle.drawRectangleStep = 'step2.selectSecondVertex';
}

const handleClickSecondVertexRectangle = ( gmap, clickEvent, angle ) => {

  // save the point where we clicked and project a line with the given angle
  window.cocoDrawingRectangle.secondVertexCoord = { lat: clickEvent.latLng.lat(), lng: clickEvent.latLng.lng() };
  window.cocoDrawingRectangle.secondVertexPoint = latLngToPoint(gmap, { latitude: clickEvent.latLng.lat(), longitude: clickEvent.latLng.lng() });
  const inclinedAxis = paintInclinedAxisAsLinesFromCoordenates( gmap, window.cocoDrawingRectangle.secondVertexPoint, angle );
  window.cocoDrawingRectangle.boundariesLines = window.cocoDrawingRectangle.boundariesLines || [];
  window.cocoDrawingRectangle.boundariesLines.push( inclinedAxis );

  // now get the 2 other points that we need
  const axisFirstClick = window.cocoDrawingRectangle.boundariesLines[0];
  const axisSecondClick = window.cocoDrawingRectangle.boundariesLines[1];
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
  const polygonPath = convertPointsArrayToLatLngString( gmap, [
    window.cocoDrawingRectangle.firstVertexPoint, intersectionPointB, window.cocoDrawingRectangle.secondVertexPoint, intersectionPointD
  ]);

  window.paintAPoygonInMap(gmap, polygonPath);

  const input = document.getElementById(window.step2PolygonInputId);
  input.value = polygonPath;
  console.log('polygonPath', polygonPath);

  return {
    secondVertexCoord: window.cocoDrawingRectangle.secondVertexCoord,
    secondVertexPoint: window.cocoDrawingRectangle.secondVertexPoint,
    inclinedAxis: inclinedAxis,
    polygonPath: polygonPath
  }
}