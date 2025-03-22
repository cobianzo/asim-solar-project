// WIP
import { createButtonActivateDeactivateSolarPanels, createOrientationRadio } from "./buttons-unselect-save-rectangle";
import { getInclinationByPolygonPath, getPolygonCenterCoords, getRectangleSideDimensionsByPolygonPath, rotatePolygonRectangleToOrthogonal, rotateRectanglePolygon } from "./trigonometry-helpers";
import { SavedRectangle, SolarPanelsOrientation } from "./types"

export const PANEL_OPTIONS: google.maps.PolygonOptions = {
  strokeColor: 'black',
  strokeWeight: 1,
  fillColor:'white',
  fillOpacity: 0.8,
  visible: true,
  clickable: false,
  draggable: false,
  zIndex: 1
}

export const EDITABLE_PANEL_OPTIONS: google.maps.PolygonOptions = {
  ...PANEL_OPTIONS,
  strokeColor: 'red',
  strokeWeight: 3,
  fillOpacity: 0.9,
  clickable: true,
  zIndex: 9999
}

export const HIGHLIGHTED_PANEL_OPTIONS: google.maps.PolygonOptions = {
  ...EDITABLE_PANEL_OPTIONS,
  fillColor: 'yellow',
  fillOpacity: 0.9,
};

export const DELETED_PANEL_OPTIONS: google.maps.PolygonOptions = {
  fillColor: 'gray',
  fillOpacity: 0.1,
  clickable: true,
}


export const setupSolarPanels = function() {

  // retrieve all rectangles
  const allSavedRectangles = window.cocoSavedRectangles || [];
  allSavedRectangles.forEach( rect => {

    paintSolarPanelsForSavedRectangle(rect);
    // syncOrientationRadioButton
  });
}


export const paintSolarPanelsForSavedRectangle = function(savedRectangle: SavedRectangle) {
  const { polygon } = savedRectangle;
  if (!polygon) {
    return;
  }
  const map = polygon.getMap();
  if (!map) {
    return;
  }

  // delete all the polygons first.
  const existingSolarPanels = savedRectangle.solarPanelsPolygons;
  if ( existingSolarPanels.length ) {
    cleanupSolarPanelForSavedRectangle(savedRectangle);
  }
  // end of cleanup


  console.log('%c TITLE: solar panels for saved rectangle ', 'font-size:2rem;color:blue',savedRectangle);
  const [lengthSideY, lengthSideX] = getRectangleSideDimensionsByPolygonPath(polygon);

  // calculate the fatorfacto to scale to get a rectangle 10x15m
  // let dimensionsPanel = [ 1.134, 1.172 ]; // meters
  let dimensionsPanel = [ 2, 1 ]; // meters

  if ( 'horizontal' == savedRectangle.panelOrientation ) {
    const [width, height] = dimensionsPanel;
    dimensionsPanel = [height, width];
  }
  const factorX = dimensionsPanel[0] / lengthSideX;
  const factorY = dimensionsPanel[1] / lengthSideY;

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
  // console.log(`In Lat Diff of segment it is ${(latNorth - latSouth)}, and the ${dimensionsPanel[1]}m of the solarpanel has lat DIMENSION of `,latLengthPanel);
  // console.log('lngt DIMENSION ',lngLengthPanel);
  // console.log('STARTING AT ', `${latSouth},${lngWest}`);

  const maxPanelsInY = Math.floor(1 / factorY);
  const maxPanelsInX = Math.floor(1 / factorX);

  for ( let i = 0; i < maxPanelsInY; i++ ) {
    for ( let j = 0; j < maxPanelsInX; j++) {
      // delete the polygon if it exists
      const sp = paintASolarPanel( savedRectangle, rectPathToNorth[0], i, j, latLengthPanel, lngLengthPanel );

      if (sp) {
        // update the stlye if the panel is deactivated
        if ( isPolygonDeactivated(savedRectangle, sp) ) {
          sp.setOptions(DELETED_PANEL_OPTIONS);
        } else sp.setOptions(PANEL_OPTIONS);
      }
    }
  }

}




const paintASolarPanel = function (
  theSavedRectangle: SavedRectangle,
  startSWLatLng: google.maps.LatLng,
  orderLat: number, orderLng: number,
  latLengthPanel: number, lngLengthPanel: number
): google.maps.Polygon | null {

  const polygon = theSavedRectangle.polygon;
  const map = polygon!.getMap();
  if (!polygon || !map) {
    return null;
  }

  const [latSouth, lngWest] = [ startSWLatLng.lat(), startSWLatLng.lng()  ]


  const panelLatSouth = latSouth + latLengthPanel * orderLat;
  const panelLatNorth = panelLatSouth + latLengthPanel;
  const panelLngWest = lngWest + lngLengthPanel * orderLng;
  const panelLngEast = panelLngWest + lngLengthPanel;

  const coords = [
    `${panelLatSouth},${panelLngWest}`, // v0
    `${panelLatNorth},${panelLngWest}`, // v1 (north west)
    `${panelLatNorth},${panelLngEast}`, // v2
    `${panelLatSouth},${panelLngEast}`, // v3
  ];

  const panel = window.paintAPoygonInMap(map, coords.join(' '), PANEL_OPTIONS)

  /* ====== ====== ====== ====== ====== ======
  Now we have stopped the calulation in a orthogonoal axis.
  lets rotate everthing
  and save the data in the source of truth
  ====== ====== ====== ====== ====== ====== */

  const originaInclination = getInclinationByPolygonPath(polygon);
  const centerRectangle = getPolygonCenterCoords(polygon);
  rotateRectanglePolygon(
    panel,
    originaInclination?? 0,
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

  return panel;
}

export const cleanupSolarPanelForSavedRectangle = function( savedRect: SavedRectangle, cleanupOnlyPolygons = true ) {
  if ( !savedRect.solarPanelsPolygons || !savedRect.solarPanelsPolygons.length ) {
    savedRect.solarPanelsPolygons = [];
    return;
  }
  savedRect.solarPanelsPolygons.forEach( row => {
    if ( !row || ! row.length ) return;
    row.forEach( panelPolygon  => {
      google.maps.event.clearInstanceListeners(panelPolygon);
      panelPolygon.setMap(null);
    })
  });

  savedRect.solarPanelsPolygons = [];

  if (!cleanupOnlyPolygons) {
    // reset the rest of the things in the savedRectangle
    savedRect.deactivatedSolarPanels = new Set();
  }
}

/**
 * API to access and edit which solar panels are deactivated (clicked to remove them)
 */

// Function to get a unique identifier for a polygon based on its position in the array
function getPolygonIndexIdentifier(savedRect: SavedRectangle, polygon: google.maps.Polygon): string | null {
  for (let i = 0; i < savedRect.solarPanelsPolygons.length; i++) {
    for (let j = 0; j < savedRect.solarPanelsPolygons[i].length; j++) {
      if (savedRect.solarPanelsPolygons[i][j] === polygon) {
        return `${i},${j}`; // Unique index-based identifier
      }
    }
  }
  return null; // Polygon not found
}


export function isPolygonDeactivated(savedRect: SavedRectangle, polygon: google.maps.Polygon): boolean {
  const id = getPolygonIndexIdentifier(savedRect, polygon);
  return id ? savedRect.deactivatedSolarPanels.has(id) : false;
}

// Function to deactivate a polygon
export function deactivatePolygon(savedRect: SavedRectangle, polygon: google.maps.Polygon): void {
  const id = getPolygonIndexIdentifier(savedRect, polygon);
  if (id) {
    savedRect.deactivatedSolarPanels.add(id);
  }
}

// Function to activate a polygon
export function activatePolygon(savedRect: SavedRectangle, polygon: google.maps.Polygon): void {
  const id = getPolygonIndexIdentifier(savedRect, polygon);
  if (id) {
    savedRect.deactivatedSolarPanels.delete(id);
  }
}

export const updateSolarPanelDeactivation = function( savedRect: SavedRectangle, i: number, j: number, deactivated: boolean ) {
  savedRect.deactivatedSolarPanels = savedRect.deactivatedSolarPanels || [];
  savedRect.deactivatedSolarPanels[i] = savedRect.deactivatedSolarPanels[i] || [];
  savedRect.deactivatedSolarPanels[i][j] = deactivated? true: false;
}