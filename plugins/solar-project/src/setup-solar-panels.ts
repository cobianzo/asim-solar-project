// WIP

import { convertPointsArrayToLatLngString, convertPolygonPathToPoints, getInclinationByPolygonPath, getPolygonCenterCoords, getRectangleSideDimensionsByPolygonPath, rotatePolygonRectangleToOrthogonal, rotateRectanglePolygon, scaleRectangleByPoints } from "./trigonometry-helpers";
import { SavedRectangle } from "./types"



export const setupSolarPanels = function() {

  // retrieve all rectangles
  const allSavedRectangles = window.cocoSavedRectangles || [];
  allSavedRectangles.forEach( rect => {
    paintSolarPanelsForSavedRectangle(rect);
  });
}


export const paintSolarPanelsForSavedRectangle = function( savedRectangle: SavedRectangle) {
  const { polygon } = savedRectangle;
  if (!polygon) {
    return;
  }
  const map = polygon.getMap();
  if (!map) {
    return;
  }
  console.log('%c TITLE: solar panels for saved rectangle ', 'font-size:2rem;color:blue',savedRectangle);
  const [lengthSideY, lengthSideX] = getRectangleSideDimensionsByPolygonPath(polygon);
  console.log('lentgth in m', lengthSideY, lengthSideX);

  // calculate the fatorfacto to scale to get a rectangle 10x15m
  const dimensionsPanel = [2,1]; // 2 meters x 1 meter
  const factorX = dimensionsPanel[0] / lengthSideX; //
  const factorY = dimensionsPanel[1] / lengthSideY; //

  console.log( `Y is ${lengthSideY} m. The length of the panel is ${factorX} times that size` )


  // get rectangle aligned to North
  const originaInclination = getInclinationByPolygonPath(polygon);
  const centerRectangle = getPolygonCenterCoords(polygon);
  const rectPathToNorth = rotatePolygonRectangleToOrthogonal(polygon);
  if (!rectPathToNorth) return;
  const latSouth = rectPathToNorth[0].lat();
  const latNorth = rectPathToNorth[1].lat();
  const lngWest = rectPathToNorth[1].lng();
  const lngEast = rectPathToNorth[2].lng();
  // swap factoX <-> factorY to display panels landscape
  const latLengthPanel = Math.abs(latNorth - latSouth) * factorX;
  const lngLengthPanel = Math.abs(lngEast - lngWest) * factorY;
  console.log(`In Lat it is ${Math.abs(latNorth - latSouth)}, and the panel has lat DIMENSION `,latLengthPanel);
  console.log('lngt DIMENSION ',lngLengthPanel);
  console.log('STARTING AT ', `${latSouth},${lngWest}`);

  // calculate the vertex of the panel placed in the SW edge of the orthogonal rectangle
  const coords = [
    `${latSouth},${lngWest}`, // v0
    `${latSouth + 1*latLengthPanel},${lngWest}`, // v1 (north west)
    `${latSouth + 1*latLengthPanel},${lngWest + 1*lngLengthPanel}`, // v2
    `${latSouth},${lngWest + 1*lngLengthPanel}`, // v3
  ];
  console.log('coords panel', coords);
  const panel = window.paintAPoygonInMap(map, coords.join(' '), { strokeWeight: 5 })

  // now rotate the panel respect the center of the rectangle to be in the right place
  const inclinedPanelCoords = rotateRectanglePolygon(
    panel,
    originaInclination,
    { latitude: centerRectangle.lat(), longitude: centerRectangle.lng() },
    true
  )
  // move to paintASolarPanel

}