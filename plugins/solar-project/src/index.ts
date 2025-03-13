import { RoofSegmentStats, ExtendedSegment, CocoMapSetup, CocoDrawingRectangleInfo, boxBySWNE, LatitudeLongitudeObject } from './types';


declare global {
  interface Window {

    cocoDrawingRectangle: CocoDrawingRectangleInfo;
    cocoIsStepSelectOffset: Boolean;
    cocoIsStepSelectRectangle: Boolean;
    cocoIsStepSelectPanelli: Boolean;

    // data exposed in php, in class-hooks:
    cocoAssetsDir: string;
    step2CocoMapInputId: string;
    step2RotationInserted: string;
    step2OffsetInserted: string;
    step2RectangleCoords: string; // TODO:
    step3CocoMapInputId: string; // TODO:

    cocoBuildingProfile: Array<string>;
    gf_current_page: number;

    cocoMaps: { [key: string]: CocoMapSetup }; // @TODO:
    cocoMapSetup?: CocoMapSetup;

    // segments source of truth
    cocoBuildingSegments: Array<RoofSegmentStats>;
    cocoAllSunMarkers?: Array<AdvancedMarkerElement | null>;
    cocoAllSegmentBoundingBox: boxBySWNE;
    cocoBoundingBoxCenter: LatitudeLongitudeObject;
    cocoRectangleBoundingBox: google.maps.Rectangle | null;

    // this fn is exposed by the external plugin coco-map0-field
    paintAPoygonInMap: (gMap: google.maps.Map, coordinatesAsString: string, extraparams?: object) => ExtendedSegment;
    paintAMarker: (gMap: google.maps.Map, position: google.maps.LatLng, markerIcon: string, extraOptions?: object) => Promise<AdvancedMarkerElement>;
  }
}


// imports
import './setup-segments-interactive-functions';
import './step2_functions';
import './step3_functions';