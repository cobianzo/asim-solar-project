// WIP
import { createButtonActivateDeactivateSolarPanels, createOrientationRadio } from "./buttons-unselect-save-rectangle";
import { createNotification, removeNotification } from "./notification-api";
import { FADED_RECTANGLE_OPTIONS, getSavedRectangleBySegment, SELECTED_RECTANGLE_OPTIONS } from "./setup-rectangle-interactive";
import { getInclinationByPolygonPath, getPolygonCenterCoords, getRectangleSideDimensionsByPolygonPath, metersToLatDegrees, metersToLngDegrees, rotatePolygonRectangleToOrthogonal, rotateRectanglePolygon } from "./trigonometry-helpers";
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
  ...PANEL_OPTIONS,
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
    cleanupSolarPanelsForSavedRectangle(savedRectangle);
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

  // both of these solutions work the same, i think
  const latLengthPanel = (latNorth - latSouth) * factorY;
  const lngLengthPanel = (lngEast - lngWest) * factorX;
  // const latLengthPanel = 1 * metersToLatDegrees( dimensionsPanel[1], latSouth);
  // const lngLengthPanel = -1 * metersToLngDegrees( dimensionsPanel[0], latSouth, lngWest);

  const maxPanelsInY = Math.floor(1 / factorY);
  const maxPanelsInX = Math.floor(1 / factorX);
  // const maxPanelsInY = Math.abs(Math.floor((latNorth - latSouth) / latLengthPanel));
  // const maxPanelsInX = Math.abs(Math.floor((lngEast - lngWest) / lngLengthPanel));

  for ( let i = 0; i < maxPanelsInY; i++ ) {
    for ( let j = 0; j < maxPanelsInX; j++) {
      // Paint the solar panel and apply the style depending on it is deselected or not
      paintASolarPanel( savedRectangle, rectPathToNorth[0], i, j, latLengthPanel, lngLengthPanel );
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
  );

  // We save the reference to the panel in the grid
  if ( !theSavedRectangle.solarPanelsPolygons[orderLng] ) {
    theSavedRectangle.solarPanelsPolygons[orderLng] = [];
  } else if (theSavedRectangle.solarPanelsPolygons[orderLng][orderLat]) {
    theSavedRectangle.solarPanelsPolygons[orderLng][orderLat].setMap(null);
  }
  theSavedRectangle.solarPanelsPolygons[orderLng][orderLat] = panel;


  if (panel) {
    // update the stlye if the panel is deactivated
    if ( isSolarPanelDeactivated(theSavedRectangle, panel) ) {
      panel.setOptions(DELETED_PANEL_OPTIONS);
    } else panel.setOptions(PANEL_OPTIONS);
  }

  return panel;
}

export const cleanupSolarPanelsForSavedRectangle = function( savedRect: SavedRectangle, cleanupOnlyPolygons = true ) {
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
    // so far the information about what solar panels are deactivated by the user
    savedRect.deactivatedSolarPanels = new Set();
  }
}

/**
 * API to access and edit which solar panels are deactivated (clicked to remove them)
 * ============= ============= ============= ============= ============= =============
 */

// Function to get a unique identifier for a polygon based on its position in the array
// We use it to find the polygon of a solar panel and assign to it the property of deactivated
function getSolaPanelIndexIdentifier(savedRect: SavedRectangle, polygon: google.maps.Polygon): string | null {
  for (let i = 0; i < savedRect.solarPanelsPolygons.length; i++) {
    for (let j = 0; j < savedRect.solarPanelsPolygons[i].length; j++) {
      if (savedRect.solarPanelsPolygons[i][j] === polygon) {
        return `${i},${j}`; // Unique index-based identifier
      }
    }
  }
  return null; // Polygon not found
}


export function isSolarPanelDeactivated(savedRect: SavedRectangle, polygon: google.maps.Polygon): boolean {
  const id = getSolaPanelIndexIdentifier(savedRect, polygon);
  return id ? savedRect.deactivatedSolarPanels.has(id) : false;
}

// Function to deactivate a polygon
export function deactivateSolarPanel(savedRect: SavedRectangle, polygon: google.maps.Polygon): void {
  const id = getSolaPanelIndexIdentifier(savedRect, polygon);
  if (id) {
    savedRect.deactivatedSolarPanels.add(id);
  }
}

// Function to activate a polygon
export function activateSolarPanel(savedRect: SavedRectangle, polygon: google.maps.Polygon): void {
  const id = getSolaPanelIndexIdentifier(savedRect, polygon);
  if (id) {
    savedRect.deactivatedSolarPanels.delete(id);
  }
}

/**
 * Handlers for individual solar panels
 * * ============= ============= ============= ============= ============= ============= *
 */

export const startEditSolarPanelsMode = function() {

  // the button gets the class active
  const btn = document.getElementById('activate-deactivate-solar-panels-btn');
  if (btn) {
    btn.classList.add('active');
  }

  // change the style of the rectangle polygon and the solar panels
  const currentSegment = window.cocoDrawingRectangle.selectedSegment;
  const currentSavedRectangle = getSavedRectangleBySegment(currentSegment!);
  if (currentSavedRectangle) {
    // the rectangle becomes inactive
    currentSavedRectangle.polygon?.setOptions(FADED_RECTANGLE_OPTIONS);

    // while every tile of a solar panel becomes interactive
    currentSavedRectangle.solarPanelsPolygons.forEach( (row,i) => {
      row.forEach( (sp,j) => {
        const options = isSolarPanelDeactivated(currentSavedRectangle, sp)? DELETED_PANEL_OPTIONS : EDITABLE_PANEL_OPTIONS;
        sp.setOptions(options);

        // reset the listeners just in case. To assign them again
        ['click', 'mouseover', 'mouseout'].forEach(evName => google.maps.event.clearListeners(sp, evName));

        // add an event listener to each solar panel
        sp.addListener('mouseover', function(this: google.maps.Polygon, e: MouseEvent) {
          sp.setOptions(HIGHLIGHTED_PANEL_OPTIONS);
        });
        sp.addListener('mouseout', function(this: google.maps.Polygon, e: MouseEvent) {
          const polygonClicked = this;
          const options = isSolarPanelDeactivated(currentSavedRectangle, polygonClicked)? DELETED_PANEL_OPTIONS : EDITABLE_PANEL_OPTIONS;
          sp.setOptions(options);
        });
        sp.addListener('click', function(this: google.maps.Polygon, e: MouseEvent) {
          const polygonClicked = this;
          let isDeactivated = isSolarPanelDeactivated(currentSavedRectangle, polygonClicked);
          if (isDeactivated) {
            activateSolarPanel(currentSavedRectangle, polygonClicked);
          } else {
            deactivateSolarPanel(currentSavedRectangle, polygonClicked);
          }
          isDeactivated = isSolarPanelDeactivated(currentSavedRectangle, polygonClicked);
          sp.setOptions(isDeactivated? DELETED_PANEL_OPTIONS : EDITABLE_PANEL_OPTIONS);

          createNotification('STEP3_CLICK_ON_SOLAR_PANEL');
        });
      });
    } );
  }

  createNotification('STEP3_START_EDIT_PANELS');
}

export const exitEditSolarPanelsMode = function() {
  const btn = document.getElementById('activate-deactivate-solar-panels-btn');
  if (btn) {
    btn.classList.remove('active');
  }
  // set the style of the rectangle to normal
  const currentSegment = window.cocoDrawingRectangle.selectedSegment;
  const currentSavedRectangle = getSavedRectangleBySegment(currentSegment!);
  if (currentSavedRectangle) {
    currentSavedRectangle.polygon?.setOptions(SELECTED_RECTANGLE_OPTIONS);
  }

  // deactivate listeners for all solar panels from all rectangles in the map
  window.cocoSavedRectangles?.forEach( savedR => {
    // get all solar panels and reset listeners
    const {solarPanelsPolygons} = savedR;
    solarPanelsPolygons.forEach( row => row.forEach( (polyg) => {
      ['click', 'mouseover', 'mouseout'].forEach(evName => google.maps.event.clearListeners(polyg, evName));
      const options = isSolarPanelDeactivated(savedR, polyg) ? DELETED_PANEL_OPTIONS : PANEL_OPTIONS;
      polyg.setOptions(options);
    }));
  })

  removeNotification();
}