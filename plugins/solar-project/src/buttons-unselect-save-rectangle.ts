import { paintSegment, removeRectangleInMap, resetSegmentVisibility } from './drawing-helpers';
import setupSegments from './setup-segments-interactive-functions';
import { convertPolygonPathToStringLatLng } from './trigonometry-helpers';
import { getSavedRectangleBySegment, paintSavedRectangle, RECTANGLE_OPTIONS, removeSavedRectangleBySegmentIndex, saveSavedRectanglesInTextArea } from './setup-rectangle-interactive';
import { SavedRectangle, SolarPanelsOrientation } from './types';
import { paintSolarPanelsForSavedRectangle, enterEditSolarPanelsMode, exitEditSolarPanelsMode } from './setup-solar-panels';
import { getCurrentStepCocoMap } from '.';
import { createNotification, removeNotification } from './notification-api';
import { debug } from 'geotiff/dist-node/logging';
import { getStep3CocoMapSetup } from './step3_functions';


const DEFAULT_PANELS_ORIENTATION = 'vertical';

function createBtn( gmap: google.maps.Map, text: string, eventOnClick: (event: MouseEvent) => void, attrs: Record<string, any> = {}) {

  if (!gmap) {
    return;
  }
  if (attrs.id) {
    const existingBtn = document.getElementById(attrs.id);
    existingBtn?.remove();
  }
  const button = document.createElement('button');
  button.textContent = text;
  button.style.position = 'absolute';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.margin = '10px';
  button.classList.add('rectangle-edit-button');
  for (const [key, value] of Object.entries(attrs)) {
    (button as any)[key] = value;
  }
  gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(button);

  button.addEventListener('click', eventOnClick)
  return button;
}

export const createUnselectSegmentButton = ( gmap : google.maps.Map, text: string = 'Unselect' ) => {
  const segmentHasRect = getSavedRectangleBySegment(window.cocoDrawingRectangle.selectedSegment!);
  if (segmentHasRect)
    createNotification('STEP3_SEGMENT_SELECTED_WITH_RECTANGLE', [window.cocoDrawingRectangle.selectedSegment?.data?.stats.areaMeters2.toString()!]);
  else {
    createNotification('STEP3_SEGMENT_SELECTED', [window.cocoDrawingRectangle.selectedSegment?.data?.stats.areaMeters2.toString()!]);
  }
  const unselectBtn = createBtn( gmap, text, handlerClickUnselectButton, {id: 'delete-rectangle-btn'} );
  unselectBtn?.classList.add('coco-btn-danger');
  return unselectBtn;
}

export const convertUnselectButtonIntoDelete = () => {
  const btn = document.getElementById('delete-rectangle-btn');
  if (btn) btn.textContent = 'Delete';
}

export const createSaveSegmentButton = ( gmap : google.maps.Map ) => {
  convertUnselectButtonIntoDelete();
  const saveButtonEl = createBtn( gmap, 'Save', handlerClickSaveRectangleButton, {id: 'save-rectangle-btn'} );
  saveButtonEl?.classList.add('coco-btn-success');
  createOrientationRadio( gmap );
  return saveButtonEl;
}

/**
 * create radio buttons
 * 🔘 Horizontal
 * 🔘 Vertical
 * @param gmap
 * @returns
 */
export const createOrientationRadio = ( gmap: google.maps.Map ) => {
  if (!gmap){
    return;
  }
  // helper fn create a single radio button. We'll call it twice
  function createRadioButton(parentDiv: HTMLElement, value: string, labelText: string) {
    const label = document.createElement('label');
    label.textContent = labelText;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'panels-orientation';
    radio.value = value;
    radio.checked = value === DEFAULT_PANELS_ORIENTATION;
    radio.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      console.log(target.value);
      syncOrientationRadioButton('radioToPanels');
    });

    label.appendChild(radio);
    parentDiv.appendChild(label);
  }

  // create the white container on the top right of the map
  const parentDivId = 'coco-orientation-panels-radiobtns';
  const existingDiv = document.getElementById(parentDivId);
  if (existingDiv) {
    existingDiv.remove();
  }

  const parentDiv = document.createElement('div');
  parentDiv.id = parentDivId;
  parentDiv.classList.add('rectangle-edit-button');

  // create the radio buttons
  createRadioButton(parentDiv, 'horizontal', 'Horizontal');
  createRadioButton(parentDiv, 'vertical', 'Vertical');

  gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(parentDiv);

  // now select the correct radio button, in sync with the edited rectnagle
  syncOrientationRadioButton('panelsToRadio');

  return parentDiv;
}

const getPanelsOrientationByRadioButton = () => {
  const selectedRadio = document.querySelector('input[name="panels-orientation"]:checked') as HTMLInputElement;
  return selectedRadio?.value || DEFAULT_PANELS_ORIENTATION;
}

const syncOrientationRadioButton = ( syncDirection: 'panelsToRadio' | 'radioToPanels' ) => {

  // sync value in the panelOrientation globa var ===> sync the selected Radio button
  if ( syncDirection === 'panelsToRadio' ) {
    let orientation = DEFAULT_PANELS_ORIENTATION; // Default to vertical
    if (window.cocoDrawingRectangle?.selectedSegment) {
      const currentRectangle = getSavedRectangleBySegment(window.cocoDrawingRectangle?.selectedSegment);
      orientation = currentRectangle?.panelOrientation || DEFAULT_PANELS_ORIENTATION;
    }

    // set the selected radio button
    const radios = document.getElementsByName('panels-orientation');
    radios.forEach(radio => {
      const radioEl = radio as HTMLInputElement;
      radioEl.checked = (orientation === radioEl.value);
    });

  }
  // sync the selected Radio button ==> update solar panels
  if ( syncDirection === 'radioToPanels' ) {
    if (window.cocoDrawingRectangle?.selectedSegment) {
      const currentRectangle = getSavedRectangleBySegment(window.cocoDrawingRectangle.selectedSegment);
      if (currentRectangle) {
        currentRectangle.panelOrientation = getPanelsOrientationByRadioButton() as SolarPanelsOrientation;
      }
    }

    // repaint the solar panels with the new orientation
    const currentSegment = window.cocoDrawingRectangle.selectedSegment;
    const currentSavedRectangle = getSavedRectangleBySegment(currentSegment!);
    if (currentSavedRectangle) {
      paintSolarPanelsForSavedRectangle(currentSavedRectangle) ;
    }
    exitEditSolarPanelsMode();
  }
}


const exitFromEditRectangle = function() {
  // rebuild all the segments
  setupSegments();

  // make all rectangles visible again
  (window.cocoSavedRectangles || []).forEach( r => r.polygon?.setOptions(RECTANGLE_OPTIONS) );

  const btns = document.querySelectorAll('.rectangle-edit-button');
  (btns || []).forEach(btn => btn.remove());
}

const handlerClickUnselectButton = function(e: MouseEvent) {

    e.preventDefault();
    const cocoMapSetup = getStep3CocoMapSetup();


    if (window.cocoDrawingRectangle.polygon) {
      window.cocoDrawingRectangle.polygon.setMap(null);
    }

    const segm = window.cocoDrawingRectangle.selectedSegment!;
    const sr = getSavedRectangleBySegment(segm);
    if (sr?.polygon) {
      sr.polygon.setMap(null)
    }

    // The rectangle drawing has been removed.
    removeSavedRectangleBySegmentIndex(window.cocoDrawingRectangle.selectedSegment!.indexInMap!);


    exitFromEditRectangle();


    if (cocoMapSetup?.segments) cocoMapSetup?.segments.forEach(seg => {
      seg.lowRoofLine.setVisible(false);
    });

    // debug action, remove the info of the segment
    const popupInfoDebug = document.getElementById('popup-info');
    if (popupInfoDebug) popupInfoDebug.remove();

    // notification
    const notification_const = window.cocoSavedRectangles.length? 'STEP3_EDIT_OR_SELECT' : 'STEP3_SELECT_SEGMENT';
    const param = window.cocoSavedRectangles.length? window.cocoSavedRectangles.length : window.cocoBuildingSegments.length;
    createNotification(notification_const, [param.toString()] );


}

// saves the current rectangle whose path is defined in window.cocoDrawingRectangle.polygon
export const handlerClickSaveRectangleButton = function(e :MouseEvent | null) {

  if (e)
    e.preventDefault();

  if ( !window.cocoDrawingRectangle?.polygon) {
    console.error('There is no rectangle to save');
    return;
  }
  if (!window.cocoDrawingRectangle.selectedSegment) {
    console.error('There is no selectedSegment to associate the rectangle with');
    return;
  }

  const pathAsString = convertPolygonPathToStringLatLng(window.cocoDrawingRectangle.polygon);

  // check if the rectangle exists
  const existingRectangle = getSavedRectangleBySegment(window.cocoDrawingRectangle.selectedSegment);

  // default saved rectangle
  let savedRectangle: SavedRectangle = {
    polygon: null,
    tempPathAsString: pathAsString,
    segmentIndex: window.cocoDrawingRectangle.selectedSegment?.indexInMap,
    solarPanelsPolygons: [],
    panelOrientation: ( getPanelsOrientationByRadioButton() as SolarPanelsOrientation ),
    deactivatedSolarPanels: new Set(),
  };
  if (existingRectangle) {
    // update the existing rectangle by segment
    const indexInSavedRectanglesArray = window.cocoSavedRectangles.findIndex( r => r.segmentIndex === existingRectangle.segmentIndex );
    savedRectangle = { ...savedRectangle, ...existingRectangle };
    window.cocoSavedRectangles[indexInSavedRectanglesArray] = savedRectangle;
  } else {
    // saving a new rectangle that didnt exist before.
    // all the info for the rectangle is in window.cocoDrawingRectangle
    window.cocoSavedRectangles = window.cocoSavedRectangles || [];
    window.cocoSavedRectangles.push(savedRectangle);
  }

  // the rectangle must be updated:
  const cocomapsetup = getCurrentStepCocoMap();

  paintSavedRectangle(cocomapsetup?.map!, savedRectangle);

  // change the look of the segment now that it has a rectangle
  if (window.cocoDrawingRectangle.selectedSegment) {
    resetSegmentVisibility(window.cocoDrawingRectangle.selectedSegment);
  }

  // delete the selected rectangle and its painted polygon
  exitFromEditRectangle();

  /**
   * Important part. Save the state of the rectangles and panels in a field of GF
   */
  saveSavedRectanglesInTextArea();

  removeNotification();
}

export const createButtonActivateDeactivateSolarPanels = function(gmap: google.maps.Map, savedRectangle: SavedRectangle) {
  createBtn(gmap, 'Edit Solar Panels', handlerClickActivateDeactivateSolarPanels, {id: 'activate-deactivate-solar-panels-btn'});
}

const handlerClickActivateDeactivateSolarPanels = function(e: MouseEvent) {
  e.preventDefault();
  console.log('activate/deactivate solar panels');
  const btn = document.getElementById('activate-deactivate-solar-panels-btn');
  if (btn?.classList.contains('active')) {
    exitEditSolarPanelsMode();
  } else {
    enterEditSolarPanelsMode();
  }
}
