import { projectLineFromXY, pointToLatLng } from './trigonometry-helpers';

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
    strokeOpacity: 0.1,
    strokeWeight: 1,
    map: gmap,
    ...extraparams
  });
}

export const paintInclinedAxisAsLinesFromCoordenates = function( gmap, crossPointInMap, degrees ) {

  const axisLinesDefinedByPoints = { lineX: [], lineY: [] };
  // draw line 1
  const angle90 = (degrees + 90 ) % 360;
  let tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle90, 100 );
  axisLinesDefinedByPoints.lineX.push(tempPoint);
  let coordPointALine1 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  coordPointALine1 = { lat: coordPointALine1.lat(), lng: coordPointALine1.lng() };
  tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle90, -100 );
  axisLinesDefinedByPoints.lineX.push(tempPoint);
  let coordPointBLine1 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  coordPointBLine1 = { lat: coordPointBLine1.lat(), lng: coordPointBLine1.lng() };

  console.log('drawin line from, to', window.cocoDrawingRectangle.firstVertexCoord, coordPointBLine1 );

  // drawing a line in gmaps
  const line1 = drawALine( gmap, [ coordPointALine1, coordPointBLine1 ]);

  // --- draw line 2
  const angle0 = (degrees + 0 ) % 360;
  tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle0, 100 );
  axisLinesDefinedByPoints.lineY.push(tempPoint);
  let coordPointALine2 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  coordPointALine2 = { lat: coordPointALine2.lat(), lng: coordPointALine2.lng() };
  tempPoint = projectLineFromXY(crossPointInMap.x, crossPointInMap.y, angle0, -100 );
  axisLinesDefinedByPoints.lineY.push(tempPoint);
  let coordPointBLine2 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  coordPointBLine2 = { lat: coordPointBLine2.lat(), lng: coordPointBLine2.lng() };

  console.log('drawin line from, to', window.cocoDrawingRectangle.firstVertexCoord, coordPointBLine2 );

  // drawing a line in gmaps
  const line2 = drawALine( gmap, [ coordPointALine2, coordPointBLine2 ]);

  return axisLinesDefinedByPoints;
}