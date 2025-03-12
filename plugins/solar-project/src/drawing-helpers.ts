// types
import { ExtendedSegment } from './types';
import {
  getPolygonCenterByVertexPoints,
  pointToLatLng,
  projectLineFromXY,
} from './trigonometry-helpers';
import { Draggable } from '@wordpress/components';
import { BorderControl } from '@wordpress/components/build-types/border-control';

/**
 * Paints a sun marker in the map at the center of a segment.
 *
 * This function is meant to be used to paint a sun icon in the map at the position
 * of a segment's center. The icon is a little sun image, and it is anchored at
 * the bottom, so it appears to be at the position of the segment's center.
 *
 * @param gmap The Google Map instance
 * @param seg The segment for which we want to paint a sun marker
 * @param icon The icon to use (defaults to 'sun-marker.png')
 * @returns The marker object
 */
export const paintASunForSegment = async(
  gmap: google.maps.Map,
  seg: ExtendedSegment,
  icon: string = 'sun-marker.png'
): Promise<AdvancedMarkerElement> => {

  if ( ! seg.data ) {
    return Promise.reject(new Error('Segment does not have center coordinates'));
  }

  // paintAMarker is a function defined by coco plugin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return await window.paintAMarker(
    gmap,
    new google.maps.LatLng(seg.data.center.latitude, seg.data.center.longitude),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
    `${(window as any).cocoAssetsDir}${icon}`,
    {
      style: {
        width: '20px',
        height: '20px',
        transform: 'translate(-10px, 10px)'
      },
    }
  );
};

/**
 * Draws a line in the map from an array of LatLng coordinates.
 *
 * @param gmap The Google Map instance
 * @param path The array of LatLng coordinates to draw the line
 * @param extraparams Extra parameters to pass to the `google.maps.Polyline` constructor
 * @returns The `google.maps.Polyline` object
 */
export const drawALine = (
  gmap: google.maps.Map,
  path: google.maps.LatLngLiteral[],
  extraparams: google.maps.PolylineOptions = {}
): google.maps.Polyline => {
  return new google.maps.Polyline({
    path,
    strokeColor: '#800080',
    strokeOpacity: 0.8,
    strokeWeight: 1,
    map: gmap,
    ...extraparams
  });
};

/**
 * Calculates the 2 right lines that define the an inclined axis.
 * Every line is defined by two points in an array
 * @param gmap
 * @param crossPointInMap
 * @param degrees
 * @returns
 */
export const paintInclinedAxisAsLinesFromCoordenates = (
  gmap: google.maps.Map,
  crossPointInMap: google.maps.Point,
  degrees: number
): {
  axisLinesDefinedByPoints: { lineX: google.maps.Point[]; lineY: google.maps.Point[] };
  line1: null;
  line2: null;
} => {

  const axisLinesDefinedByPoints
    : { lineX: google.maps.Point[]; lineY: google.maps.Point[] }
    = { lineX: [], lineY: [] };

  // draw line 1
  const angle90 = (degrees + 90) % 360;
  let tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle90,
    100
  );
  axisLinesDefinedByPoints.lineX.push(tempPoint);

  tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle90,
    -100
  );
  axisLinesDefinedByPoints.lineX.push(tempPoint);

  // drawing a line in Gmaps - it works, painting the axis but it stops listening to click event, so I remove it
  // let temp1 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  // const coordPointALine1 = temp1 ? { lat: temp1.lat(), lng: temp1.lng() } : null;
  // temp1 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  // const coordPointBLine1 = temp1 ? { lat: temp1.lat(), lng: temp1.lng() } : null;
  // const line1 = drawALine( Gmap, [ coordPointALine1, coordPointBLine1 ]);

  // --- line 2 (Y)
  const angle0 = (degrees + 0) % 360;
  tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle0,
    100
  );
  axisLinesDefinedByPoints.lineY.push(tempPoint);
  tempPoint = projectLineFromXY(
    crossPointInMap.x,
    crossPointInMap.y,
    angle0,
    -100
  );
  axisLinesDefinedByPoints.lineY.push(tempPoint);

  // drawing a line in Gmaps: same as above
  // let temp2 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  // const coordPointALine2 = temp2? { lat: temp2.lat(), lng: temp2.lng() } : null;
  // temp2 = pointToLatLng(gmap, tempPoint.x, tempPoint.y);
  // const coordPointBLine2 = temp2? { lat: temp2.lat(), lng: temp2.lng() } : null;
  // const line2 = drawALine( Gmap, [ coordPointALine2, coordPointBLine2 ]);

  return {
    axisLinesDefinedByPoints,
    line1: null,
    line2: null,
  };
};


export const designBuildingProfile = (
  gmap: google.maps.Map,
  buildingProfiles: Array<string>,
  color: string
) => {
  buildingProfiles.forEach( building => {
    window.paintAPoygonInMap(gmap, building, { strokeColor: color, fillColor: 'black', fillOpacity: 0.1, clickable: false });
  } );
}


export const createUnselectSegmentButton = ( gmap : google.maps.Map ) => {
  const unselectButton = document.createElement('button');
  unselectButton.textContent = 'Unselect';
  unselectButton.style.position = 'absolute';
  unselectButton.style.top = '10px';
  unselectButton.style.right = '10px';
  gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(unselectButton);
  return unselectButton;
}

export const highlightSegment = function(roofSegment: ExtendedSegment, extraParams = {}) {
  roofSegment.setOptions({ fillOpacity: 0.7, strokeOpacity: 1, ...extraParams });
  if (roofSegment.sunMarker?.content) {
    roofSegment.sunMarker.content.style.border = '1px solid orange';
    roofSegment.sunMarker.content.style.borderRadius = '50%';
  }
}
export const resetSegmentVisibility = function(roofSegment: ExtendedSegment) {
  roofSegment.setOptions({ fillOpacity: 0.35, fillColor: '#FF0000', clickable: true });
  if (roofSegment.sunMarker?.content) {
    roofSegment.sunMarker.content.style.border = 'none'
  }
}
export const fadeSegment =function(roofSegment: ExtendedSegment) {
  roofSegment.setOptions({ fillOpacity: 0.1, strokeOpacity: 0 });
}

// Rectangle painted by the user
export const paintRectangleInMap = (gmap: google.maps.Map, rectangleAsStringOfCoords: string, vertexPoints?: Array<google.maps.Point>) => {

  if (window.cocoDrawingRectangle?.polygon) {
    removeRectangleInMap(gmap, false);
  }

  window.cocoDrawingRectangle.polygon = window.paintAPoygonInMap(
    gmap,
    rectangleAsStringOfCoords,
    // { clickable: true }
  );

  window.cocoDrawingRectangle.polygonPoints = vertexPoints ?? [];
  window.cocoDrawingRectangle.polygonCenterPoint = vertexPoints? getPolygonCenterByVertexPoints(vertexPoints) : null;

  if (window.cocoDrawingRectangle.polygonCenterPoint) {
    window.cocoDrawingRectangle.polygonCenterCoords = pointToLatLng(
      gmap,
      window.cocoDrawingRectangle.polygonCenterPoint.x,
      window.cocoDrawingRectangle.polygonCenterPoint.y
    );
  }
}

  /**
   * Removes the drawn rectangle from the map
   * @param gmap the google map object
   */
export const removeRectangleInMap = (gmap: google.maps.Map, clearDrawingInfo = false) => {
  if (window.cocoDrawingRectangle?.polygon) {
    window.cocoDrawingRectangle.polygon.setMap(null);
    if (window.cocoDrawingRectangle.polygonCenterMarker) {
      window.cocoDrawingRectangle.polygonCenterMarker.map = null;
    }
    if (clearDrawingInfo)
      window.cocoDrawingRectangle = {};
  }
}

/**
 * The user paints a rectangle using the mouse. This fn
 * paints a circle at the center of the user-drawn rectangle in the map.
 * @param gmap The Google Map instance
 * @returns void
 */
export const paintCenterOfUsersRectangleInMap = (gmap: google.maps.Map) => {
  // paint hte center of the polygon
  if (window.cocoDrawingRectangle.polygonCenterMarker)
    window.cocoDrawingRectangle.polygonCenterMarker.map = null;
  console.log('center polygon is ', window.cocoDrawingRectangle.polygonCenterCoords?.lat(), window.cocoDrawingRectangle.polygonCenterCoords?.lng());
  if (window.cocoDrawingRectangle.polygonCenterCoords) {
    window.paintAMarker(
      gmap,
      window.cocoDrawingRectangle.polygonCenterCoords,
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
      window.cocoDrawingRectangle.polygonCenterMarker = marker;
    });
  }
}