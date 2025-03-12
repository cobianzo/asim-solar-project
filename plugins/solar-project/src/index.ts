import { RoofSegmentStats, ExtendedSegment, CocoMapSetup, CocoDrawingRectangleInfo, boxBySWNE } from './types';


declare global {
  interface Window {

    cocoDrawingRectangle: CocoDrawingRectangleInfo;
    cocoIsStepSelectRectangle: Boolean;
    cocoIsStepSelectPanelli: Boolean;

    cocoAssetsDir: string;
    step2PolygonInputId: string;
    step2RectangleCoords: string;
    step3PolygonInputId: string;
    cocoBuildingProfile: Array<string>;
    gf_current_page: number;

    cocoMaps: { [key: string]: CocoMapSetup }; // @TODO:
    cocoMapSetup?: CocoMapSetup;

    cocoBuildingSegments: Array<RoofSegmentStats>;
    cocoAllSegmentBoundingBox: boxBySWNE;
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