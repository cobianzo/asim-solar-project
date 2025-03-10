// defined in plugin coco map field
export interface CocoMapSetup {
  map: google.maps.Map;
  inputElement: HTMLInputElement;
  segments?: ExtendedSegment[];
}

// remember there is also a google.maps.LatLngLiteral which uses {lat: ... , lng: ... }
export interface LatLngObject {
  latitude: number;
  longitude: number;
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
  center: LatLngObject;
  boundingBox: {
    sw: LatLngObject;
    ne: LatLngObject;
  };
  planeHeightAtCenterMeters: number;
}

// to a polygone which is a rectangle of the one roof segment, we bind more data:
export interface ExtendedSegment extends google.maps.Polygon {
  data?: RoofSegmentStats;
  indexInMap?: number;
  sunMarker?: google.maps.Marker;
  pointsInMap?: google.maps.Point[];
  realInclinationAngle?: number;
  map: google.maps.Map;
}

// object with many properties saving the info of the rectangle that the user is painting in step 2
export interface CocoDrawingRectangleInfo {
  hoveredSegment?: ExtendedSegment;
  selectedSegment?: ExtendedSegment;
  drawRectangleStep?: string;
  rectanglePolygonCoords?: string;
  firstVertexCoord?: google.maps.LatLngLiteral;
  firstVertexPoint?: google.maps.Point;
  boundariesLinesAxisFirstClick?: { lineX: google.maps.Point[]; lineY: google.maps.Point[] };
  firstClickAxislineX?: google.maps.Polyline | null;
  firstClickAxislineY?: google.maps.Polyline | null;

  polygon?: google.maps.Polygon;

  boundariesLinesAxisSecondClick?: { lineX: google.maps.Point[]; lineY: google.maps.Point[] };
  secondClickAxislineX?: google.maps.Polyline | null;
  secondClickAxislineY?: google.maps.Polyline | null;

}