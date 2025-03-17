import { MARKER_CENTERED_OPTIONS } from "./drawing-helpers";
import { handlerMouseMoveSecondVertexRectangle, handlerSecondClickDrawRectangle } from "./setup-rectangle-interactive";
import { latLngToPoint, convertPolygonPathToPoints } from "./trigonometry-helpers";



export const paintResizeHandlersInPolygon = function() {
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
    if (marker.content) {
      marker.content.title = "Resize";
      marker.content.classList.add(`handler-resize`);
      marker.content.dataset.handlerVertexIndex = indexVertex.toString();
    }
    window.cocoDrawingRectangle.handlers = window.cocoDrawingRectangle.handlers || [];
    window.cocoDrawingRectangle.handlers[indexVertex] = marker;
    window.cocoDrawingRectangle.draggingHandler = marker;

    // apply listeners when clicked on the vertex, to drag
    (marker as AdvancedMarkerElement).content!.addEventListener("mousedown", startDrag);
  });
}

// dragging handlers
const startDrag = function(e: MouseEvent) {
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

// todelete
const moveDrag = function(this: google.maps.Map, e: google.maps.MapMouseEvent) {
  const map = this;
  const point = latLngToPoint(map, { latitude: e.latLng.lat(), longitude: e.latLng.lng() });
};

const endDrag = function(e: google.maps.MapMouseEvent) {

}


export const destroyHandlersInRectanglePolygon = function() {

  delete window.cocoDrawingRectangle.draggingHandler;

  if (window.cocoDrawingRectangle.handlers) {
    Object.keys(window.cocoDrawingRectangle.handlers).forEach(key => {
      // @ts-ignore
      const handler = window.cocoDrawingRectangle.handlers[key];
      if (handler) {
        google.maps.event.clearInstanceListeners(handler);
        handler.map = null;
      }
    });
    window.cocoDrawingRectangle.handlers = [];
  }
}
