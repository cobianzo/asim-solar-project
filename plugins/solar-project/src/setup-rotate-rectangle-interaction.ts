import { convertPointsArrayToLatLngString, convertStringCoordinatesIntoGMapCoordinates, latLngToPoint, rotateRectangle } from "./trigonometry-helpers";

const rectangleRotationInteractionSetup = function() {

  // validations
  if (!window.cocoDrawingRectangle.polygon)  {
    return;
  }

  // LISTENER mousedown. Clicking starts the rotation
  window.cocoDrawingRectangle.polygon.addListener('mousedown', function(this: google.maps.Polygon, event: google.maps.MapMouseEvent) {
    console.log('mouse down', this, event.latLng.lat(), event.latLng.lng());
    // Add desired behavior or function call here
    if (!window.cocoDrawingRectangle.polygon) return;
    const { polygon } = window.cocoDrawingRectangle;
    const map = polygon.getMap();
    if (!map) return;
    map.setOptions({ draggable: false });
    polygon.setOptions({ clickable: false });
    const point = latLngToPoint(map, { latitude: event.latLng.lat(), longitude: event.latLng.lng() });
    console.log('Pixel coordinates:', point);
    window.cocoDrawingRectangle.rotatingRectangleStartingPoint = point;


    // LISTENER mouse MOVE. Apply rotation on mouse deflection
    map.addListener('mousemove', function(event: google.maps.MapMouseEvent) {
      // console.log('moving the mouse over the polygon', this, event.latLng.lat(), event.latLng.lng());
      const { polygon } = window.cocoDrawingRectangle;

      const point = latLngToPoint(map, { latitude: event.latLng.lat(), longitude: event.latLng.lng() });

      if (!point || !window.cocoDrawingRectangle.polygon
        || !window.cocoDrawingRectangle?.rotatingRectangleStartingPoint) return;

      const [deltaX, deltaY] = [point.x - window.cocoDrawingRectangle.rotatingRectangleStartingPoint.x, point.y - window.cocoDrawingRectangle.rotatingRectangleStartingPoint.y];

      // rotate the polygon
      const degreesFactor = 1; // Adjust this factor as needed
      const deltaDegrees = deltaX * degreesFactor;
      window.cocoDrawingRectangle.tempRotatedPoints = rotateRectangle(window.cocoDrawingRectangle.polygonPoints, window.cocoDrawingRectangle.polygonCenterPoint, deltaDegrees);
      window.cocoDrawingRectangle.tempRotatedCoords = convertPointsArrayToLatLngString(map, window.cocoDrawingRectangle.tempRotatedPoints);
      const latLngCoords = convertStringCoordinatesIntoGMapCoordinates(window.cocoDrawingRectangle.tempRotatedCoords);
      window.cocoDrawingRectangle.polygon.setPath(latLngCoords);
    });

    // LISTENER mouseup. Stops rotation and save new data for the new polygon shape.
    map.addListener('mouseup', function(event: google.maps.MapMouseEvent) {

      // end of rotating, set thigns back to normal
      console.log('mouse up', event.latLng.lat(), event.latLng.lng());
      window.cocoDrawingRectangle.rotatingRectangleStartingPoint = null;
      delete window.cocoDrawingRectangle.tempRotatedPoints;
      delete window.cocoDrawingRectangle.tempRotatedCoords;

      const { polygon } = window.cocoDrawingRectangle;
      const map = polygon? polygon.getMap() : null;
      if (!polygon || !map) return;


      // reset listeners and setups changed on mousedown
      window.google.maps.event.clearListeners(map, 'mousemove');
      window.google.maps.event.clearListeners(map, 'mouseup');
      map.setOptions({ draggable: true });
      polygon.setOptions({ clickable: true });

      // update data saved in global vars about the rect.
      window.cocoDrawingRectangle.polygonPoints = window.cocoDrawingRectangle.tempRotatedPoints;
      window.cocoDrawingRectangle.rectanglePolygonCoords = window.cocoDrawingRectangle.tempRotatedCoords;

      // save the new value in the input
      // @TODO: this is now step 3!
      const input = document.getElementById(window.step2CocoMapInputId) as HTMLInputElement;
      if (input) {
        input.value = window.cocoDrawingRectangle.rectanglePolygonCoords || '';
      }
    });
  });


  // Not so important

  window.cocoDrawingRectangle.polygon.addListener('mouseover', function() {
    const icon = `${(window as any).cocoAssetsDir}${'rotate-marker.png'}`;
    if (window.cocoDrawingRectangle.polygonCenterMarker?.content )  {
      window.cocoDrawingRectangle.polygonCenterMarker.content.style.backgroundImage = `url(${icon})`;
    }
  });
  window.cocoDrawingRectangle.polygon.addListener('mouseout', function() {
    const icon = `${(window as any).cocoAssetsDir}${'target.png'}`;
    if (window.cocoDrawingRectangle.polygonCenterMarker?.content )  {
      window.cocoDrawingRectangle.polygonCenterMarker.content.style.backgroundImage = `url(${icon})`;
    }
  });
}

export default rectangleRotationInteractionSetup;
