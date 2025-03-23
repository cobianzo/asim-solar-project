import { RoofSegmentStats, ExtendedSegment, CocoMapSetup, CocoDrawingRectangleInfo, boxBySWNE, LatitudeLongitudeObject, SelectRotationPortraitSegmentsOptions, SavedRectangles } from './types';


declare global {
  interface Window {

    cocoNotifications: any;

    cocoDrawingRectangle: CocoDrawingRectangleInfo;
    cocoSavedRectangles: SavedRectangles;

    // data exposed in php, in class-hooks:
    cocoIsStepSelectRoof: Boolean;
    cocoIsStepSelectOffset: Boolean;
    cocoIsStepSelectRectangle: Boolean;


    cocoAssetsDir: string;
    step1CocoMapInputId: string;
    step2CocoMapInputId: string;
    step2RotationInserted: SelectRotationPortraitSegmentsOptions;
    step2OffsetInserted: string;
    // step3RectangleCoords: string; todel
    step3CocoMapInputId: string;

    cocoBuildingProfile: Array<string>;
    gf_current_page: number;

    cocoMaps: { [key: string]: CocoMapSetup }; // @TODO:
    cocoMapSetup?: CocoMapSetup;

    // segments source of truth
    cocoBuildingSegments: Array<RoofSegmentStats>;
    cocoSegmentsOriginalFirstVertex: google.maps.LatLng;
    cocoOriginalBoundingBox: boxBySWNE; // the data
    cocoMovingBoundingBoxPolygon: google.maps.Rectangle | null; // the painteed object from the data.
    cocoMovingBoundingBoxAssociatedMarkers: AdvancedMarkerElement[] | null;
    cocoOriginalBoundingBoxCenter: LatitudeLongitudeObject; // to calculate the offset respect the painted polygon

    // this fn is exposed by the external plugin coco-map0-field
    paintAPoygonInMap: (gMap: google.maps.Map, coordinatesAsString: string, extraparams?: object) => ExtendedSegment;
    paintAMarker: (gMap: google.maps.Map, position: google.maps.LatLng, markerIcon: string, extraOptions?: object) => Promise<AdvancedMarkerElement>;


    debug: Record<string, any>; // /TODELETE, for debugging testing in console, use it wit window.debug
  }
}


export const getCurrentStepCocoMap = function(): CocoMapSetup | null {
  if (window.cocoMaps) {
    const firstKey = Object.keys(window.cocoMaps)[0];
    return window.cocoMaps[firstKey];
  }
  return null;
}

// imports

import './step1_functions';
import './step2_functions';
import './step3_functions';
