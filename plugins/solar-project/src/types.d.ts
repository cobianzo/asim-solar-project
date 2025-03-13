// defined in plugin coco map field
export interface CocoMapSetup {
  map: google.maps.Map;
  inputElement: HTMLInputElement;
  segments?: ExtendedSegment[]; // the google.map.Polygons with extra data
}

// remember there is also a google.maps.LatLngLiteral which uses {lat: ... , lng: ... }
export interface LatitudeLongitudeObject {
  latitude: number;
  longitude: number;
}

export interface boxBySWNE {
  sw: LatitudeLongitudeObject;
  ne: LatitudeLongitudeObject;
}

// response from Solar API schema
export interface RoofSegmentStats {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  center: LatitudeLongitudeObject;
  boundingBox: boxBySWNE;
  planeHeightAtCenterMeters: number;
}

// to a polygone which is a rectangle of the one roof segment, we bind more data:
export interface ExtendedSegment extends google.maps.Polygon {
  data?: RoofSegmentStats;
  indexInMap?: number;
  sunMarker?: AdvancedMarkerElement | null;
  pointsInMap?: google.maps.Point[];
  realRotationAngle?: number; // in case we have rotated the data.azimuthDegrees
  map: google.maps.Map;
  isPortrait?: boolean;
  panelsRectangle: google.maps.Polygon;
}

// object with many properties saving the info of the rectangle that the user is painting in step 2
export interface CocoDrawingRectangleInfo {
  hoveredSegment?: ExtendedSegment;
  selectedSegment?: ExtendedSegment;

  rectanglePolygonCoords?: string | null;
  firstVertexCoord?: google.maps.LatLngLiteral;
  firstVertexPoint?: google.maps.Point | null;
  boundariesLinesAxisFirstClick?: { lineX: google.maps.Point[]; lineY: google.maps.Point[] };
  firstClickAxislineX?: google.maps.Polyline | null;
  firstClickAxislineY?: google.maps.Polyline | null;

  polygon?: google.maps.Polygon;
  polygonPoints?: Array<google.maps.Point>;
  polygonCenterPoint?: google.maps.Point | null;
  polygonCenterCoords?: google.maps.LatLng | null;
  polygonCenterMarker?: AdvancedMarkerElement | null;

  rotatingRectangleStartingPoint?: google.maps.Point | null;
  rotatingRectangleStartingVertexPoints: google.maps.Point[];
  tempRotatedPoints?: Array<google.maps.Point> | null;
  tempRotatedCoords?: string | null;

  boundariesLinesAxisSecondClick?: { lineX: google.maps.Point[]; lineY: google.maps.Point[] };
  secondClickAxislineX?: google.maps.Polyline | null;
  secondClickAxislineY?: google.maps.Polyline | null;

  // handlers to resize
  handlers: Array<HandlerAdvancedMarker>; // Array gets keys 0 and 2.
}

export type SelectRotationPortraitSegmentsOptions = 'no-rotation-at-all' | 'no-extra-rotation' | 'rotate-90-only-portrait' | 'rotate-all';
