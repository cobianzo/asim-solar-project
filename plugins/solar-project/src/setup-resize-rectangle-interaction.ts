import { MARKER_CENTERED_OPTIONS, paintCenterOfUsersRectangleInMap } from "./drawing-helpers";
import { getSavedRectangleBySegment, handlerMouseMoveSecondVertexRectangle, handlerSecondClickDrawRectangle, SELECTED_RECTANGLE_OPTIONS } from "./setup-rectangle-interactive";
import rectangleRotationInteractionSetup from "./setup-rotate-rectangle-interaction";
import { cleanupAssociatedMarkers } from "./setup-segments-interactive-functions";
import { latLngToPoint, convertPolygonPathToPoints, convertPolygonPathToStringLatLng } from "./trigonometry-helpers";
import { ExtendedSegment } from "./types";



export const paintResizeHandlersInUsersRectangle = function() {
  if (!window.cocoDrawingRectangle.polygon)  {
    return;
  }
  destroyHandlersInRectanglePolygon();
  // paintResizeHandlerInPolygon( window.cocoDrawingRectangle.polygon.getMap(), window.cocoDrawingRectangle.polygon, 0 );
  paintResizeHandlerInPolygon( window.cocoDrawingRectangle.polygon.getMap(), window.cocoDrawingRectangle.polygon, 2 );
}

export const activateInteractionWithRectangleResizeHandler = function(segment: ExtendedSegment) {

  // The segment below should not be interactive now:
  // Clear the listeners for mousedown, click, and mousemove on segm.map
  if (segment.map)
    ['mousedown', 'click', 'mousemove', 'mouseup'].forEach(eventName => {
        google.maps.event.clearListeners(segment.map, eventName);
    });

  // make the polygon draggable and add event when the drag finishes
  if (window.cocoDrawingRectangle.polygon) {

    // cleanup first
    if (window.cocoDrawingRectangle.polygon) {
      ['dragend', 'click', 'mousemove'].forEach(eventName => {
        google.maps.event.clearListeners(window.cocoDrawingRectangle.polygon!, eventName);
      });
    }

    window.cocoDrawingRectangle.polygon.setOptions(SELECTED_RECTANGLE_OPTIONS);

    // Add event listener to handle drag end
    window.cocoDrawingRectangle.polygon.addListener('dragend', () => {
      console.log('%cRectangle dragged', 'color: green; font-weight: bold;');

      // Repaint the rectangle with all the accessories
      delete window.cocoDrawingRectangle.tempFirstClickPoint;
      paintCenterOfUsersRectangleInMap(segment.map);
      rectangleRotationInteractionSetup();
      paintResizeHandlersInUsersRectangle(); // TODO: apply after rotation.
      // The rectangle has been updated. We need to update the saved rectangle if it exists.
      const savedRectangle = getSavedRectangleBySegment(segment);
      if (savedRectangle) {
        savedRectangle.tempPathAsString = convertPolygonPathToStringLatLng(window.cocoDrawingRectangle.polygon!);
      }
    });
  }
}

export const paintResizeHandlerInPolygon = function( gmap: google.maps.Map | null, polygon: google.maps.Polygon, indexVertex: number = 0) {

  if (! gmap ) return;

  // reset the handler if created before
  // make sure destroyHandlersInRectanglePolygon has been called before this function


  const vertexCoords = polygon.getPath().getArray();
  const coords = vertexCoords[indexVertex];
  window.paintAMarker(gmap, coords, `${(window as any).cocoAssetsDir}${'target.png'}`, MARKER_CENTERED_OPTIONS)
    .then(marker => {
    // we save the marker for future access.
    if (marker) {

      if (marker.content) {
        marker.content.title = "Resize";
        marker.content.classList.add(`handler-resize`);
        marker.content.dataset.handlerVertexIndex = indexVertex.toString();
        marker.content.id = Math.random().toString(36).substr(2, 5);
      }
      window.cocoDrawingRectangle.rectangleAssociatedMarkers ||= [];
      window.cocoDrawingRectangle.rectangleAssociatedMarkers.push(marker);
      window.cocoDrawingRectangle.draggingHandler = marker;
      // apply listeners when clicked on the vertex, to resize
      (marker as AdvancedMarkerElement).content!.addEventListener("mousedown", startResize);
    } else alert('error inmarker');
  });
}

// dragging handlers
const startResize = function(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  const element = e.currentTarget as HTMLDivElement;
  element.classList.add('dragging');

  window.cocoDrawingRectangle.polygon?.setOptions({clickable: false});
  window.cocoDrawingRectangle.selectedSegment?.setOptions({clickable: false});

  // now we keep on listeneing the movement of the mouse
  window.cocoDrawingRectangle.draggingHandler?.map?.addListener('mousemove', handlerMouseMoveSecondVertexRectangle);
  window.cocoDrawingRectangle.draggingHandler?.map?.addListener('mouseup', (e: google.maps.MapMouseEvent) => {
    console.log('%cMOUSEUP - we fix the rectangle', 'color: green; font-weight: bold;');
    handlerSecondClickDrawRectangle();
  });
}

export const destroyHandlersInRectanglePolygon = function() {
  delete window.cocoDrawingRectangle.draggingHandler;
  cleanupAssociatedMarkers(window.cocoDrawingRectangle as AssociatedMarkersParent, 'rectangleAssociatedMarkers');
}
