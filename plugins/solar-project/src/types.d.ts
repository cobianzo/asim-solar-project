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
  realRotationAngle?: number; // in case we have rotated the data.azimuthDegrees I think I can delete it.
  map: google.maps.Map;
  isPortrait?: boolean;
}

// object with many properties saving the info of the rectangle that the user is painting in step 2
export interface CocoDrawingRectangleInfo {
  hoveredSegment?: ExtendedSegment;
  selectedSegment?: ExtendedSegment;

  // the creation of the rectangle polygon (and the resizing)
  tempFirstClickPoint?: google.maps.Point | null;  // to save the first click while creating the rect

  // not in use until we reactivate the rotation tool TODO:
  inclinationWhenCreated?: number;
  currentInclinationAfterRotation?: number;

  // the polygon (the inclined rectangle).
  polygon?: google.maps.Polygon;
  associatedMarkers?: Array<AdvancedMarkerElement>; // store markers to delete when we clean the rectangle

  // when rotating the rectangle, currently deactivated TODELETE
  rotatingRectangleStartingPoint?: google.maps.Point | null;
  rotatingRectangleStartingVertexPoints?: google.maps.Point[];
  tempRotatedPoints?: Array<google.maps.Point> | null;
  tempRotatedCoords?: string | null;

  // handlers to resize
  handlers?: Array<AdvancedMarkerElement>; // Array gets keys 0 and 2.
  draggingHandler?: AdvancedMarkerElement;
}

export type SavedRectangle = {
  polygon: google.maps.Polygon | null,
  tempPathAsString: string; // we use it to repaint the polygon after it's saved.
  segmentIndex?: number;
  solarPanelsPolygons: Array<google.maps.Polygon[]>;
  panelOrientation: SolarPanelsOrientation;
};

export type SavedRectangles = Array<SavedRectangle>

export type SelectRotationPortraitSegmentsOptions = 'no-rotation-at-all' | 'no-extra-rotation' | 'rotate-90-only-portrait';

export type CoupleOfPoints = [google.maps.Point, google.maps.Point] | [];

export type SolarPanelsOrientation = 'horizontal' | 'vertical' | null;