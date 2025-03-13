


export const paintResizeHandlersInPolygon = function() {
  if (!window.cocoDrawingRectangle.polygon)  {
    return;
  }
  destroyHandlersInPolygon();
  paintResizeHandlerInPolygon( window.cocoDrawingRectangle.polygon.getMap(), window.cocoDrawingRectangle.polygon, 0 );
}

export const paintResizeHandlerInPolygon = function( gmap: google.maps.Map | null, polygon: google.maps.Polygon, indexVertex: number = 0) {

  if (! gmap ) return;

  // reset the handler if created before

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
    marker.title = "Resize";
    window.cocoDrawingRectangle.handlers = window.cocoDrawingRectangle.handlers || [];
    window.cocoDrawingRectangle.handlers[indexVertex] = marker;

    // apply listeners to drag the vertex
    (marker as AdvancedMarkerElement).content!.addEventListener("mousedown", startDrag);
    (marker as AdvancedMarkerElement).content!.addEventListener("mousemove", moveDrag);
    (marker as AdvancedMarkerElement).content!.addEventListener("mouseup", endDrag);
  });
}

export const destroyHandlersInPolygon = function() {
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

// dragging handlers

const startDrag = function(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  const element = e.currentTarget as HTMLDivElement;
  const { x, y } = element.getBoundingClientRect()
  element.dataset.isDragging = 'yes';
  element.dataset.startDragPointX = e.clientX.toString();
  element.dataset.startDragPointY = e.clientY.toString();
  element.dataset.startMarkerX = x.toString();
  element.dataset.startMarkerY = y.toString();
  element.dataset.initialBorderStyle = element.style.border;

  const initialTransform = element.style.transform ?? '';
  const transformMatch = initialTransform.match(/translate\(([^px]+)px, ([^px]+)px\)/);
  const [initialX, initialY] = transformMatch ? [parseFloat(transformMatch[1]), parseFloat(transformMatch[2])] : [0, 0];
  element.dataset.initialTranslateX = initialX.toString() ?? '0' ;
  element.dataset.initialTranslateY = initialY.toString() ?? '0';
  console.log('initial translate ', element.dataset);
  element.style.border = "50px solid red";
}

const moveDrag = function(e: MouseEvent) {
  const element = e.currentTarget as HTMLDivElement;
  if (!element.dataset.isDragging) return;
  e.preventDefault();
  e.stopPropagation();

  // -- move the handler --
  const [offsetX, offsetY] = [
    e.clientX - parseFloat(element.dataset.startDragPointX!),
    e.clientY - parseFloat(element.dataset.startDragPointY!)
  ];

  const [translateX, translateY] = [
    parseFloat(element.dataset.initialTranslateX ?? '0') + offsetX,
    parseFloat(element.dataset.initialTranslateY ?? '0') + offsetY
  ];
  element.style.transform = `translate(${translateX}px, ${translateY}px)`;
  // -- circle handler moved  --

  // -- repaint the rectangle --


  console.log('offset', offsetX, offsetY, element.style.transform)

  // redesign the rectangle

};

const endDrag = function(e: MouseEvent) {
  const element = e.currentTarget as HTMLDivElement;
  if (!element.dataset.isDragging) return;
  e.preventDefault();
  e.stopPropagation();
  const [offsetX, offsetY] = [
    e.clientX - parseFloat(element.dataset.startDragPointX!),
    e.clientY - parseFloat(element.dataset.startDragPointY!)
  ];
  element.style.border = "";
  delete element.dataset.isDragging;
  delete element.dataset.startDragPointX;
  delete element.dataset.startDragPointY;
  delete element.dataset.startMarkerX;
  delete element.dataset.startMarkerY;
  element.style.border = element.dataset.initialBorderStyle ?? '';
  // element.style.transform = element.dataset.initialTransform ?? '';
}



export const getRectangleInclination = function( polygon: google.maps.Polygon | undefined ): number {
  if ( ! polygon ) return 0;
  const path = polygon.getPath().getArray();
  const point1 = path[0];
  const point2 = path[1];

  const deltaX = point2.lng() - point1.lng();
  const deltaY = point2.lat() - point1.lat();

  const angleRadians = Math.atan2(deltaY, deltaX);
  const angleDegrees = angleRadians * (180 / Math.PI);

  return angleDegrees;
}

