import { RoofSegmentStats, ExtendedSegment, CocoMapSetup, CocoDrawingRectangleInfo } from './types';


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
    gMapsKey: string; // not in use
    gf_current_page: number;

    cocoMaps: { [key: string]: CocoMapSetup }; // @TODO:
    cocoMapSetup?: CocoMapSetup;

    cocoBuildingSegments: Array<RoofSegmentStats>;

    // this fn is exposed by the external plugin coco-map0-field
    paintAPoygonInMap: (gMap: google.maps.Map, coordinatesAsString: string, extraparams?: object) => ExtendedSegment;
    paintAMarker: (gMap: google.maps.Map, position: google.maps.LatLng, markerIcon: string, extraOptions?: object) => Promise<AdvancedMarkerElement>;
  }
}


// imports
import './1-setup-segments';
import './step2_functions';
import './step3_functions';