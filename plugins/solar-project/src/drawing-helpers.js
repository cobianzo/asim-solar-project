import {
  pointToLatLng,
  projectLineFromXY
} from './trigonometry-helpers.ts';


export const paintASunForSegment = function( gmap, seg, icon = 'sun-marker.png' ) {
  return window.paintAMarker(
    gmap,
    { lat: seg.data.center.latitude, lng: seg.data.center.longitude },
    `${window.cocoAssetsDir}${icon}`,
    {
      scaledSize: new window.google.maps.Size(10, 10),
      anchor: new google.maps.Point(5, 5),
    }
  );
}

export const drawALine = function( gmap, path, extraparams = {} ) {
  return new google.maps.Polyline({
    path,
    strokeColor: '#800080',
    strokeOpacity: 0.8,
    strokeWeight: 1,
    map: gmap,
    ...extraparams
  });
}

export const paintInclinedAxisAsLinesFromCoordenates = function( Gmap, crossPointInMap, degrees ) {

  const axisLinesDefinedByPoints = { lineX: [], lineY: [] };
  // draw line 1
  const angle90 = (degrees + 90 ) % 360;
  let tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle90, 100 );
  axisLinesDefinedByPoints.lineX.push(tempPoint);


  let coordPointALine1 = pointToLatLng(Gmap, tempPoint.x, tempPoint.y);
  coordPointALine1 = { lat: coordPointALine1.lat(), lng: coordPointALine1.lng() };
  tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle90, -100 );
  axisLinesDefinedByPoints.lineX.push(tempPoint);
  let coordPointBLine1 = pointToLatLng(Gmap, tempPoint.x, tempPoint.y);
  coordPointBLine1 = { lat: coordPointBLine1.lat(), lng: coordPointBLine1.lng() };

  // drawing a line in Gmaps - it works, painting the axis but it stops listening to click event, so I remove it
  // const line1 = drawALine( Gmap, [ coordPointALine1, coordPointBLine1 ]);

  // --- draw line 2
  const angle0 = (degrees + 0 ) % 360;
  tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle0, 100 );
  axisLinesDefinedByPoints.lineY.push(tempPoint);
  let coordPointALine2 = pointToLatLng(Gmap, tempPoint.x, tempPoint.y);
  coordPointALine2 = { lat: coordPointALine2.lat(), lng: coordPointALine2.lng() };
  tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle0, -100 );
  axisLinesDefinedByPoints.lineY.push(tempPoint);
  let coordPointBLine2 = pointToLatLng(Gmap, tempPoint.x, tempPoint.y);
  coordPointBLine2 = { lat: coordPointBLine2.lat(), lng: coordPointBLine2.lng() };

  console.log('drawin line from, to', window.cocoDrawingRectangle.firstVertexCoord, coordPointBLine2 );

  // drawing a line in Gmaps: same as above
  // const line2 = drawALine( Gmap, [ coordPointALine2, coordPointBLine2 ]);

  return {
    axisLinesDefinedByPoints,
    line1: null,
    line2: null,
  }
}