import { MARKER_CENTERED_OPTIONS } from "./drawing-helpers";
import { handlerMouseMoveSecondVertexRectangle, handlerSecondClickDrawRectangle } from "./setup-rectangle-interactive";
import { cleanupAssociatedMarkers } from "./setup-segments-interactive-functions";
import { latLngToPoint, convertPolygonPathToPoints } from "./trigonometry-helpers";



export const paintResizeHandlersInUsersRectangle = function() {
  if (!window.cocoDrawingRectangle.polygon)  {
    return;
  }
  destroyHandlersInRectanglePolygon();
  // paintResizeHandlerInPolygon( window.cocoDrawingRectangle.polygon.getMap(), window.cocoDrawingRectangle.polygon, 0 );
  paintResizeHandlerInPolygon( window.cocoDrawingRectangle.polygon.getMap(), window.cocoDrawingRectangle.polygon, 2 );
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
