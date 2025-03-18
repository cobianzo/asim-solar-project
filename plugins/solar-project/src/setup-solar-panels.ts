// WIP

import { paintSavedRectangle } from "./setup-rectangle-interactive";
import { cleanupAssociatedMarkers } from "./setup-segments-interactive-functions";
import { convertPointsArrayToLatLngString, convertPolygonPathToPoints, getInclinationByPolygonPath, getPolygonCenterCoords, getRectangleSideDimensionsByPolygonPath, rotatePolygonRectangleToOrthogonal, rotateRectanglePolygon, scaleRectangleByPoints } from "./trigonometry-helpers";
import { SavedRectangle } from "./types"

const PANEL_OPTIONS: google.maps.PolygonOptions = {
  strokeColor: 'black',
  strokeWeight: 1,
  fillColor:'white',
  fillOpacity: 0.8,
  visible: true,
  clickable: false,
  draggable: false,
  zIndex: 0
}


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

  // calculate the fatorfacto to scale to get a rectangle 10x15m
  const dimensionsPanel = [2,1]; // 2 meters x 1 meter
  const factorX = dimensionsPanel[0] / lengthSideX; //
  const factorY = dimensionsPanel[1] / lengthSideY; //

  console.log(`Panel Size: `, dimensionsPanel.join('x') + 'm' )
  console.log( `Y is ${lengthSideY} m. The length of the panel (${dimensionsPanel[1]}) is ${factorY.toFixed(2)} times that size` )


  // get rectangle aligned to North (no need to paint it, just get the coords)
  const rectPathToNorth = rotatePolygonRectangleToOrthogonal(polygon);
  if (!rectPathToNorth) return;



  const [latSouth, latNorth, lngWest, lngEast] = [
    rectPathToNorth[0].lat(), rectPathToNorth[1].lat(), rectPathToNorth[1].lng(), rectPathToNorth[2].lng()
  ];
  // swap factoX <-> factorY to display panels landscape
  const latLengthPanel = (latNorth - latSouth) * factorY;
  const lngLengthPanel = (lngEast - lngWest) * factorX;
  console.log(`In Lat Diff of segment it is ${(latNorth - latSouth)}, and the ${dimensionsPanel[1]}m of the solarpanel has lat DIMENSION of `,latLengthPanel);
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
  const panel = window.paintAPoygonInMap(map, coords.join(' '), PANEL_OPTIONS)

  // now rotate the panel respect the center of the rectangle to be in the right place
  const originaInclination = getInclinationByPolygonPath(polygon);
  const centerRectangle = getPolygonCenterCoords(polygon);
  const inclinedPanelCoords = rotateRectanglePolygon(
    panel,
    originaInclination,
    { latitude: centerRectangle.lat(), longitude: centerRectangle.lng() },
    true
  )
  // move to paintASolarPanel


  // Repeat to see
  paintASolarPanel( savedRectangle, rectPathToNorth[0], 1, 1, latLengthPanel, lngLengthPanel );
}

const paintASolarPanel = function (
  theSavedRectangle: SavedRectangle,
  startSWLatLng: google.maps.LatLng,
  orderLat: number, orderLng: number,
  latLengthPanel: number, lngLengthPanel: number
) {

  const polygon = theSavedRectangle.polygon;
  const map = polygon!.getMap();
  if (!polygon || !map) {
    return;
  }

  const [latSouth, lngWest] = [ startSWLatLng.lat(), startSWLatLng.lng()  ]


  const panelLatSouth = latSouth + latLengthPanel * orderLat;
  const panelLatNorth = panelLatSouth + latLengthPanel;
  const panelLngWest = lngWest + lngLengthPanel * orderLat;
  const panelLngEast = panelLngWest + lngLengthPanel;

  const coords = [
    `${panelLatSouth},${panelLngWest}`, // v0
    `${panelLatNorth},${panelLngWest}`, // v1 (north west)
    `${panelLatNorth},${panelLngEast}`, // v2
    `${panelLatSouth},${panelLngEast}`, // v3
  ];

  const panel = window.paintAPoygonInMap(map, coords.join(' '), PANEL_OPTIONS)

  /* ====== ====== ====== ====== ====== ======
  Now we have stopped the calulation in a orthogonoal axis. lets rotate everthing
  ====== ====== ====== ====== ====== ====== */

  const originaInclination = getInclinationByPolygonPath(polygon);
  const centerRectangle = getPolygonCenterCoords(polygon);
  rotateRectanglePolygon(
    panel,
    originaInclination,
    { latitude: centerRectangle.lat(), longitude: centerRectangle.lng() },
    true
  )

  // We save the reference to the panel in the grid
  if ( !theSavedRectangle.solarPanelsPolygons[orderLng] ) {
    theSavedRectangle.solarPanelsPolygons[orderLng] = [];
  } else if (theSavedRectangle.solarPanelsPolygons[orderLng][orderLat]) {
    theSavedRectangle.solarPanelsPolygons[orderLng][orderLat].setMap(null);
  }
  theSavedRectangle.solarPanelsPolygons[orderLng][orderLat] = panel;
}