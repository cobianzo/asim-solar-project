/**
 * The use defines rectangles where the solar panels go.
 * There is one rectangle per segment
 *
 * The rectangles can be
 * 1) created from scratch (you need to select the segment first)
 * 2) edited if they existed when you select the segment
 * When editing, the info of the edited rectangle is in window.cocoDrawingRectangle
 *
 * The created rectangles are in window.cocoSavedRectangles
 *
 */
import { MARKER_CENTERED_OPTIONS, MARKER_LEFT_BOTTOM_OPTIONS, paintCenterOfUsersRectangleInMap, paintRectangleInMap } from "./drawing-helpers";
import { paintResizeHandlersInPolygon } from "./setup-resize-rectangle-interaction";
import rectangleRotationInteractionSetup from "./setup-rotate-rectangle-interaction";
import { getStep3CocoMapSetup } from "./step3_functions";
import { calculatePathRectangleByOppositePointsAndInclination, convertPolygonPathToPoints, convertPolygonPathToStringLatLng, getInclinationByPolygonPath, getInclinationByRectanglePoints, latLngToPoint } from "./trigonometry-helpers";
import { ExtendedSegment, SavedRectangle } from "./types";
import { createSaveSegmentButton } from "./buttons-unselect-save-rectangle";
import { addAssociatedMarker, cleanupAssociatedMarkers } from "./setup-segments-interactive-functions";
import { cleanupSolarPanelForSavedRectangle, setupSolarPanels } from "./setup-solar-panels";

export const RECTANGLE_OPTIONS: google.maps.PolygonOptions = {
  strokeColor: 'black',
  fillColor:'blue',
  fillOpacity: 0.8,
  visible: true,
  zIndex: 0
}
export const HIGHLIGHTED_RECTANGLE_OPTIONS: google.maps.PolygonOptions = {
  strokeColor: 'yellow',
  fillColor:'yellow',
  zIndex: 10000
}

export const FADED_RECTANGLE_OPTIONS: google.maps.PolygonOptions = {
  fillOpacity: 0.2,
  zIndex: -1
}


/** paint the rectangles and make them selectables */
const setupRectangles = function() {

  const cocoMapSetup = getStep3CocoMapSetup();
  if (! cocoMapSetup?.map ) {
    return;
  }

  const allSavedRectangles = window.cocoSavedRectangles || [];
  allSavedRectangles.forEach(r => paintSavedRectangle(cocoMapSetup.map, r));

  setupSolarPanels();
}

export const paintSavedRectangle = function(gmap: google.maps.Map, rectangleInfo: SavedRectangle) {
  if (!rectangleInfo.tempPathAsString?.length) return;
  if (!rectangleInfo.polygon?.getMap()) {
    rectangleInfo.polygon = window.paintAPoygonInMap(
      gmap,
      rectangleInfo.tempPathAsString,
      RECTANGLE_OPTIONS
    );
  }
}

export const getRectangleBySegment = function( segment: ExtendedSegment ) : SavedRectangle | undefined {
  return (window.cocoSavedRectangles || []).find(
    (r) => r.segmentIndex === segment.indexInMap
  );
}

export const hideAllRectangles = function() {}

export const showAllRectangles = function() {}

export const highlightSavedRectangle = function(segm: ExtendedSegment) {
  const rectangle = getRectangleBySegment(segm);
  if (rectangle && rectangle.polygon) {
    rectangle.polygon.setOptions(HIGHLIGHTED_RECTANGLE_OPTIONS);
  }
}

export const unhighlightSavedRectangle = function(segm: ExtendedSegment) {
  // find the rectangle associated to this segment
  const rectangle = getRectangleBySegment(segm);

  if (rectangle && rectangle.polygon) {
    rectangle.polygon.setOptions(RECTANGLE_OPTIONS);
  }
}


/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */
/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */
/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */

/// Now the handlers to CREATE and RESIZE the rectangle

export const handlerFirstClickDrawRectangleOverSegment = function (e: google.maps.MapMouseEvent) {
  const segm = window.cocoDrawingRectangle.selectedSegment;
  if ( !segm ) {
    console.error('we need the selected segment , but its not saved.', segm);
    return;
  }
  const latLng = { lat: e.latLng!.lat(), lng: e.latLng!.lng() };
  console.log('click on the segment', segm.indexInMap, latLng);

  // FIRST CLICK OF RECT DESIGN: Now we mark the first vertex of the rectangle

  window.cocoDrawingRectangle.tempFirstClickPoint = latLngToPoint(segm.map, { latitude: latLng.lat, longitude: latLng.lng });

  segm.setOptions({ fillOpacity: 0.1 });
  segm.setOptions({ clickable: false });
  segm.setVisible(false);

  // paint the arrow marking the first vertex
  window.paintAMarker(segm.map, e.latLng!, `${window.cocoAssetsDir}vertex-sw-white.png`, MARKER_LEFT_BOTTOM_OPTIONS)
    .then(m => addAssociatedMarker(m, window.cocoDrawingRectangle as AssociatedMarkersParent))

  // Now setup the listeners
  google.maps.event.clearListeners(segm, 'click');
  segm.map.addListener('mousemove', handlerMouseMoveSecondVertexRectangle);
  segm.map.addListener('click', (e: google.maps.MapMouseEvent) => {

    console.log('%cSECONDCLICK when we create a new rectangle', 'color: blue; font-weight: bold;');

    handlerSecondClickDrawRectangle(); // this is also used when we edit an existing rectangle

    createSaveSegmentButton(segm.map);

    // WIP - currently not in use
    // the rectangle polygon has been created, we save the inclination, which can be modified with rotation tool.
    const degreesInc = getInclinationByPolygonPath( window.cocoDrawingRectangle.polygon );
    window.cocoDrawingRectangle.inclinationWhenCreated = degreesInc == null? 0 : degreesInc;
    window.cocoDrawingRectangle.currentInclinationAfterRotation = window.cocoDrawingRectangle.inclinationWhenCreated;

  });

}

export const handlerSecondClickDrawRectangle = function () {

  const segm = window.cocoDrawingRectangle.selectedSegment;
  if ( ! segm ) {
    console.error('Segment not found:', segm);
    return;
  }

  // save the data path of coordenates in the input elment as text
  // [... ] TODO:

  delete window.cocoDrawingRectangle.tempFirstClickPoint;

  // Finish setup and paint hte center
  window.cocoDrawingRectangle.polygon?.setOptions({ clickable: true });
  paintCenterOfUsersRectangleInMap(segm.map);

  // assign the event listeners that allow the user to rotate the rectangle on the map
  rectangleRotationInteractionSetup();
  paintResizeHandlersInPolygon(); // TODO: apply after rotation.

  // Clear the listeners for mousedown, click, and mousemove on segm.map
  window.google.maps.event.clearListeners(segm.map, 'mousedown');
  window.google.maps.event.clearListeners(segm.map, 'click');
  window.google.maps.event.clearListeners(segm.map, 'mousemove');
  window.google.maps.event.clearListeners(segm.map, 'mouseup');

  // make the polygon draggable WIP
  if (window.cocoDrawingRectangle.polygon) {
    window.cocoDrawingRectangle.polygon.setOptions({ draggable: true });

    // Add event listener to handle drag end
    window.cocoDrawingRectangle.polygon.addListener('dragend', () => {
      console.log('%cRectangle dragged', 'color: green; font-weight: bold;');
      // Update the rectangle coordinates after dragging
      const newPath = window.cocoDrawingRectangle.polygon!.getPath();
      let updatedCoords: string = '';
      newPath.forEach((latLng) => {
        updatedCoords += (updatedCoords.length ? ' ' : '') + latLng.lat + ',' + latLng.lng;
      });
      console.log('Updated rectangle coordinates:', updatedCoords);

      // Repaint the rectangle with all the accessories
      delete window.cocoDrawingRectangle.tempFirstClickPoint;
      window.cocoDrawingRectangle.polygon?.setOptions({ clickable: true });
      paintCenterOfUsersRectangleInMap(segm.map);
      rectangleRotationInteractionSetup();
      paintResizeHandlersInPolygon(); // TODO: apply after rotation.

    });
  }
}

export const handlerMouseMoveSecondVertexRectangle = (clickEvent: google.maps.MapMouseEvent) => {

  const gmap = window.cocoDrawingRectangle.selectedSegment?.map;

  // When we execute this handler the first time, as the rectangle polygon doesnt exist,
  // then we take the inclination of the parent segment.
  const referencePolygonForInclination = window.cocoDrawingRectangle.polygon?? window.cocoDrawingRectangle.selectedSegment!;
  let angle = getInclinationByPolygonPath(referencePolygonForInclination)
  if ( null === angle) {
    angle = getInclinationByPolygonPath(window.cocoDrawingRectangle.selectedSegment)
  }
  // const angle = window.cocoDrawingRectangle.selectedSegment?.realRotationAngle; // this works but I think I've improved it
  console.log('THE ANGLE that we\'ll use to desing the rectange is', angle, window.cocoDrawingRectangle.polygon? 'USEING rectangle' : 'using parent segment');

  if (!gmap || angle === null) return;


  // Paint the polygon rectangle again with the params:
  // window.cocoDrawingRectangle.firstVertexPoint
  const pointEnd = latLngToPoint(gmap, { latitude: clickEvent.latLng!.lat(), longitude: clickEvent.latLng!.lng() });
  // angle
  if ( !pointEnd) return;


  // we consider the case of the rectangle has been rotated with the tool to rotate.
  // Not in use
  // let degreesOffset = window.cocoDrawingRectangle.currentInclinationAfterRotation - window.cocoDrawingRectangle.inclinationWhenCreated;
  // if (isNaN(degreesOffset)) {
  // degreesOffset = 0;
  // }
  // console.log('degreesoffset', degreesOffset);
  const degreesOffset = 0;


  // get the pixel where the rectangles starts. this handler happens in two situations:
  // 1) creation of the polygon (the firstclick is saved on 'click' 2) resizing, we take it form the path
  let firstVertexPoint = window.cocoDrawingRectangle.tempFirstClickPoint?? null;
  console.log('we have clicked on the first vertex which is', firstVertexPoint);
  if (! firstVertexPoint ) {
    // the rectangle is already created, there oppposite vertex was not created on click, so we grab it
    //  assuming it's the vertex 0 because we are dragging vertes 2.
    const firstVertexLatLng = window.cocoDrawingRectangle.polygon?.getPath().getArray()[0];
    if ( !firstVertexLatLng ) {
      console.error('error retrieving coordenates first vertesx', firstVertexLatLng);
      return;
    }
    firstVertexPoint = latLngToPoint(gmap, { latitude: firstVertexLatLng.lat(), longitude: firstVertexLatLng.lng() } );
    if ( !firstVertexPoint ) {
      console.error('error retrieving coordenates first vertesx', firstVertexPoint);
      return;
    }

    window.cocoDrawingRectangle.tempFirstClickPoint = firstVertexPoint; // we save it so we don't need to calculate each mousemove
  }

  if (!firstVertexPoint) {
    console.error('we don\'t know the origin vertex of the rectangleRotationInteractionSetup', firstVertexPoint);
    return;
  }

  const success = calculatePathRectangleByOppositePointsAndInclination(
    gmap,
    firstVertexPoint,
    pointEnd,
    (angle! + degreesOffset)
  );
  if (window.cocoDrawingRectangle.selectedSegment
    && success?.axisLinesDefinedByPointsFirst && success?.axisLinesDefinedByPointsSecond
    && success?.rectanglePolygonCoords && success?.vertexPoints
  ) {
    const {
      axisLinesDefinedByPointsFirst,
      axisLinesDefinedByPointsSecond,
      rectanglePolygonCoords,
      vertexPoints
    } = success;



    // if the polygon is drawn, we remove it and repaint it and update the params of the rectangle
    paintRectangleInMap(gmap, window.cocoDrawingRectangle.selectedSegment, rectanglePolygonCoords);
    console.log('Rectangle painted, ', success);
  }

  return success;

}

export const removeSavedRectangleBySegmentIndex = function( segmentIndex: number ) {

  if ( segmentIndex == null) {
    console.error('no sement index to remove the rectangle');
    return;
  }
  // before deleting its info
  if (!window.cocoSavedRectangles || !window.cocoSavedRectangles.length) {
    window.cocoSavedRectangles = [];
    return;
  }
  const indexInArray = window.cocoSavedRectangles.findIndex( sr => sr.segmentIndex === segmentIndex );
  if (typeof indexInArray === 'number') {
    // delete all the polygons for the solar panels
    cleanupSolarPanelForSavedRectangle(window.cocoSavedRectangles[indexInArray]);
  }
  window.cocoSavedRectangles = window.cocoSavedRectangles.filter( r => r.segmentIndex !== segmentIndex)
}

export default setupRectangles;