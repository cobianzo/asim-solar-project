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
  window.paintAMarker(
    gmap,
    coords,
    `${(window as any).cocoAssetsDir}${'target.png'}`,
    {
      style: {
        width: '20px',
        height: '20px',
        transform: 'translate(0px, 10px)',
        border:'2px solid white',
        borderRadius:'50%',
      },
    }
  ).then(marker => {
    // we save the marker for future access.
    if (marker.content) {
      marker.content.title = "Resize";
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
  element.style.border = "2px solid red";

  window.cocoDrawingRectangle.polygon?.setOptions({clickable: false});
  window.cocoDrawingRectangle.selectedSegment?.setOptions({clickable: false});

  // now we keep on listeneing the movement of the mouse
  window.cocoDrawingRectangle.draggingHandler?.map?.addListener('mousemove', handlerMouseMoveSecondVertexRectangle);
  window.cocoDrawingRectangle.draggingHandler?.map?.addListener('mouseup', (e: google.maps.MapMouseEvent) => {
    console.log('%cMOUSEUP - we fix the rectangle', 'color: green; font-weight: bold;');
    handlerSecondClickDrawRectangle(e);
  });
}

// todelete
const moveDrag = function(this: google.maps.Map, e: google.maps.MapMouseEvent) {
  const map = this;
  const point = latLngToPoint(map, { latitude: e.latLng.lat(), longitude: e.latLng.lng() });
};

const endDrag = function(e: google.maps.MapMouseEvent) {

}


// MOVE to trigonometry TODELETE: i think it doesnt work ok
export const getRectangleInclination = function( polygon: google.maps.Polygon | undefined ): number {
  if ( ! polygon ) return 0;
  const pointsPath = convertPolygonPathToPoints( polygon );
  const pointA = pointsPath[0];
  const pointB = pointsPath[1];

  // Calcula las diferencias en las coordenadas
  const deltaX = pointB.x - pointA.x;
  const deltaY = pointB.y - pointA.y;

  // Calcula el ángulo en radianes respecto al eje Y
  const angleInRadians = Math.atan2(deltaX, deltaY);

  // Convierte el ángulo a grados (opcional)
  const angleInDegrees = (-1 * angleInRadians * (180 / Math.PI) + 360 ) % 360;

  return angleInDegrees; // Devuelve el ángulo en grados
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
