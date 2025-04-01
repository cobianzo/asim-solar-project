// WIP
import apiFetch from "@wordpress/api-fetch";
import { getCurrentStepCocoMap } from ".";
import { createButtonActivateDeactivateSolarPanels, createOrientationRadio } from "./buttons-unselect-save-rectangle";
import { createNotification, removeNotification } from "./notification-api";
import { FADED_RECTANGLE_OPTIONS, getSavedRectangleBySegment, SELECTED_RECTANGLE_OPTIONS } from "./setup-rectangle-interactive";
import { getInclinationByPolygonPath, getPolygonCenterCoords, getRectangleSideDimensionsByPolygonPath, metersToLatDegrees, metersToLngDegrees, rotatePolygonRectangleToOrthogonal, rotateRectanglePolygon } from "./trigonometry-helpers";
import { ExtendedSegment, SavedRectangle, SolarPanelsOrientation } from "./types"
import { getSegmentByIndex } from "./setup-segments-interactive-functions";

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
  fillOpacity: 0.5,
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
  fillOpacity: 0.2,
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
  const cocoSetp = getCurrentStepCocoMap();
  const { polygon } = savedRectangle;
  if (!polygon) {
    alert('not po');
    return;
  }
  const map = cocoSetp!.map;
  if (!map) {
    alert('not mapppp');
    return;
  }
  polygon.setMap(cocoSetp!.map);

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
  let dimensionsPanel = getCurrentPanelsDimensions(); // meters

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

  const maxPanelsInY = Math.floor(1 / factorY);
  const maxPanelsInX = Math.floor(1 / factorX);

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
 * Small helpers
 * * ============= ============= ============= ============= ============= ============= *
 */
export const getCurrentPanelsModel = function() : string {
  const model = document.querySelector('.panel-model-dropdown select option:checked');
  return model?.textContent ?? '-';
}

export const getCurrentQuantilScenario = function() : {scenarioName: string, scenarioIndex: number} {
  const scenarioEl = document.querySelector('.panel-quantiles input:checked');
  const scenarioName = scenarioEl?.parentElement?.textContent ? scenarioEl.parentElement.textContent.trim() : '';
  const scenarioIndex = (scenarioEl as HTMLInputElement).value;
  return {scenarioName, scenarioIndex: parseInt(scenarioIndex) };
}

export const getCurrentHoursPerYear = function(segment: ExtendedSegment) : number {
  const segmentQuantiles = segment.data?.stats.sunshineQuantiles;
  const scenario = getCurrentQuantilScenario();
  let hoursPerYear = segmentQuantiles? segmentQuantiles[scenario.scenarioIndex] : window.cocoSolarPotential.maxSunshineHoursPerYear;
  return hoursPerYear;
}

export const getCurrentPanelsDimensions = function() : [number,number] {
  const inputLength = document.querySelector('.panel-length input');
  const inputHeight = document.querySelector('.panel-height input');
  const [length, height] = [(inputLength as HTMLInputElement).value, (inputHeight as HTMLInputElement).value]
  return [ parseFloat(length?? '1'), parseFloat(height?? '1.5') ]; // in meters
}

export const getCurrentPanelsNominalPower = function() : number {
  const inputPower = document.querySelector('.panel-nominal-power input');
  const power = (inputPower as HTMLInputElement).value ?? '400';
  return parseInt(power); // in Watios
}

export const getCurrentPanelsSystemEfficiency = function() : number {
  // electric system efficiency * hours of sun / ideal hours of sun,
  const inputEfficiency = document.querySelector('.panel-efficiency input');
  const efficiency = parseFloat((inputEfficiency as HTMLInputElement).value);
  // electric system efficiency depends on the inversor.
  // ideal hours of sun is something we still dont know
  return efficiency?? 0.8; // %
}

export const getAnnualGeneratedPower = function(savedRect: SavedRectangle) : number {
// Energıˊa Anual (kWh) = Potencia Total (kW)×Horas de Sol al An˜o×Eficiencia del Sistema
  const segment = getSegmentByIndex(savedRect.segmentIndex!);
  if (!savedRect || !segment) {
    console.error('No saved Rectagnle info or no segmeent', savedRect, segment);
    return 0;
  }
  const numberOfPanels = numberOfPanelsInRectangle(savedRect);
  const panelPower =  getCurrentPanelsNominalPower() / 1000; // in kW
  const hours_of_sun = getCurrentHoursPerYear(segment);
  const finalEfficiency = getCurrentPanelsSystemEfficiency();
  const powerInKW = numberOfPanels * panelPower * hours_of_sun * finalEfficiency;
  return parseInt(powerInKW.toFixed(0));
}

/**
 * Counts the activated panels in a rectangle drawn by the user.
 * @param savedRect
 * @returns
 */
export const numberOfPanelsInRectangle = function(savedRect: SavedRectangle) : number {
  let countPanels = 0;
  savedRect.solarPanelsPolygons.forEach( row => {
    row.forEach( panel => {
      const isDeactivated = isSolarPanelDeactivated(savedRect, panel);
      if (!isDeactivated) {
        countPanels++;
      }
    })
  });
  return countPanels;
}

/**
 * On every change of the dropdown .panel-model-dropdown select, we load the
 * attributes of that Model Panel from WordPress Db into our inputs.
 * @returns
 */
export const loadModelPanelParametersInInputs = function() {

  // get the ID of the panel selected in the dropdown.
  const dropdown = document.querySelector('.panel-model-dropdown select');

  const inputLength = document.querySelector('.panel-length input');
  const inputHeight = document.querySelector('.panel-height input');
  const inputPower = document.querySelector('.panel-nominal-power input');
  if (!dropdown) {
    console.error('We cant find the dropdown panel-model-dropdown in gravity forms ');
    return;
  }
  const postId = (dropdown as HTMLSelectElement).value;

  apiFetch({ path: `/wp/v2/panel/${postId}` }).then(
    data => {
      const typedData = data as { custom_fields?: { length: string; height: string; nominal_power: string } };
      if (!typedData.custom_fields) {
        console.error('custom_fields not found', data);
        return;
      }
      const { length, height, nominal_power } = typedData.custom_fields;
      (inputLength as HTMLInputElement).value = length;
      (inputHeight as HTMLInputElement).value = height;
      (inputPower as HTMLInputElement).value = nominal_power;
    }
  );
}

export const applyListenersToPanelModelsDropdown = function() {
  const dropdown = document.querySelector('.panel-model-dropdown select');
  dropdown?.addEventListener('change', (e) => {
    loadModelPanelParametersInInputs();
  });
}


async function getIdealSunHours(lat: number, lon: number) {
  const url = `https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=${lat}&lon=${lon}&outputformat=json`;

  try {
      const response = await fetch(url);
      const data = await response.json();

      // Extraer la irradiación solar promedio mensual en inclinación óptima
      const monthlyData = data.outputs.monthly;

      // Sumar las horas de sol estimadas a partir de G(i)
      let totalHours = 0;
      monthlyData.forEach(month => {
          const irradiance = month["G(i)"]; // kWh/m² por mes
          totalHours += (irradiance * 1000) / 100; // Conversión a horas de sol
      });

      console.log(`Horas de sol ideales al año: ${totalHours.toFixed(2)} h`);
      return totalHours;
  } catch (error) {
      console.error("Error obteniendo datos de PVGIS:", error);
  }
}


/**
 * Handlers for individual solar panels
 * * ============= ============= ============= ============= ============= ============= *
 */

export const enterEditSolarPanelsMode = function() {

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
        const options = isSolarPanelDeactivated(currentSavedRectangle, sp)?
          {...EDITABLE_PANEL_OPTIONS, ...DELETED_PANEL_OPTIONS }
          : EDITABLE_PANEL_OPTIONS;
        sp.setOptions(options);

        // reset the listeners just in case. To assign them again
        ['click', 'mouseover', 'mouseout'].forEach(evName => google.maps.event.clearListeners(sp, evName));

        // add an event listener to each solar panel
        sp.addListener('mouseover', function(this: google.maps.Polygon, e: MouseEvent) {
          console.log('HOVERRERE');
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
  } else {
    console.error('nt found button activate-deactivate-solar-panels-btn', btn);
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