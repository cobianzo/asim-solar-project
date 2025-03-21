import { contextConnect } from '@wordpress/components/build-types/context';
import { resetSegmentVisibility } from './drawing-helpers';
import setupSegments from './setup-segments-interactive-functions';
import { convertPolygonPathToStringLatLng } from './trigonometry-helpers';
import { getRectangleBySegment, RECTANGLE_OPTIONS } from './setup-rectangle-interactive';
import { SavedRectangle, SolarPanelsOrientation } from './types';
import { paintSolarPanelsForSavedRectangle } from './setup-solar-panels';

function createBtn( gmap: google.maps.Map, text: string, eventOnClick: (event: MouseEvent) => void, attrs: Record<string, any> = {}) {
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
  return createBtn( gmap, text, handlerClickUnselectButton, {id: 'delete-rectangle-btn'} );
}

export const convertUnselectButtonIntoDelete = () => {
  const btn = document.getElementById('delete-rectangle-btn');
  if (btn) btn.textContent = 'Delete';
}

export const createSaveSegmentButton = ( gmap : google.maps.Map ) => {
  convertUnselectButtonIntoDelete();
  const saveButtonEl = createBtn( gmap, 'Save', handlerClickSaveRectangleButton, {id: 'save-rectangle-btn'} );
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

  // helper fn create a single radio button. We'll call it twice
  function createRadioButton(parentDiv: HTMLElement, value: string, labelText: string) {

    const label = document.createElement('label');
    label.textContent = labelText;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'panels-orientation';
    radio.value = value;
    radio.checked = value === 'horizontal';
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

const syncOrientationRadioButton = ( syncDirection: 'panelsToRadio' | 'radioToPanels' ) => {

  // sync value in the panelOrientation globa var ===> sync the selected Radio button
  if ( syncDirection === 'panelsToRadio' ) {
    let orientation = null;
    if (window.cocoDrawingRectangle?.selectedSegment) {
      const currentRectangle = getRectangleBySegment(window.cocoDrawingRectangle?.selectedSegment);
      orientation = currentRectangle?.panelOrientation;
    }

    const radios = document.getElementsByName('panels-orientation');
    radios.forEach(radio => {
      const radioEl = radio as HTMLInputElement;
      radioEl.checked = (orientation === radioEl.value);
    });
  }
  // sync the selected Radio button ==> update solar panels
  if ( syncDirection === 'radioToPanels' ) {
    const selectedRadio = document.querySelector('input[name="panels-orientation"]:checked') as HTMLInputElement;
    const selectedValue = selectedRadio?.value || null;

    if (window.cocoDrawingRectangle?.selectedSegment) {
      const currentRectangle = getRectangleBySegment(window.cocoDrawingRectangle.selectedSegment);
      if (currentRectangle) {
        currentRectangle.panelOrientation = selectedValue as SolarPanelsOrientation;
      }
    }

    // TODO: replaint the solar panels with the new orientation
    const currentSegment = window.cocoDrawingRectangle.selectedSegment;
    const currentSavedRectangle = getRectangleBySegment(currentSegment!);
    if (currentSavedRectangle) {
      paintSolarPanelsForSavedRectangle(currentSavedRectangle) ;
    }
  }
}


const exitFromEditRectangle = function() {
  // rebuild all the segments
  setupSegments( window.step2RotationInserted ?? 'no-extra-rotation' );

  // make all rectangles visible again
  (window.cocoSavedRectangles || []).forEach( r => r.polygon?.setOptions(RECTANGLE_OPTIONS) );

  const btns = document.querySelectorAll('.rectangle-edit-button');
  (btns || []).forEach(btn => btn.remove());
}

const handlerClickUnselectButton = function(e: MouseEvent) {

    e.preventDefault();

    exitFromEditRectangle();

    // debug action, remove the info of the segment
    const popupInfoDebug = document.getElementById('popup-info');
    if (popupInfoDebug) popupInfoDebug.remove();


}

// saves the current rectangle whose path is defined in window.cocoDrawingRectangle.polygon
const handlerClickSaveRectangleButton = function(e :MouseEvent) {

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
  const selectedRadio = document.querySelector('input[name="panels-orientation"]:checked') as HTMLInputElement;

  // check if the rectangle exists
  const existingRectangle = getRectangleBySegment(window.cocoDrawingRectangle.selectedSegment);

  // default saved rectangle
  let savedRectangle: SavedRectangle = {
    polygon: null,
    tempPathAsString: pathAsString,
    segmentIndex: window.cocoDrawingRectangle.selectedSegment?.indexInMap,
    solarPanelsPolygons: [],
    panelOrientation: ( selectedRadio?.value as SolarPanelsOrientation )?? null,
  };
  if (existingRectangle) {
    // update the existing rectangle
    const indexInSavedRectanglesArray = window.cocoSavedRectangles.findIndex( r => r.segmentIndex === existingRectangle.segmentIndex );
    savedRectangle = { ...savedRectangle, ...existingRectangle };
    window.cocoSavedRectangles[indexInSavedRectanglesArray] = savedRectangle;
  } else {
    // saving a new rectangle that didnt exist before.
    // all the info for the rectangle is in window.cocoDrawingRectangle
    window.cocoSavedRectangles = window.cocoSavedRectangles || [];
    window.cocoSavedRectangles.push(savedRectangle);
  }


  // change the look of the segment now that it has a rectangle
  if (window.cocoDrawingRectangle.selectedSegment) {
    resetSegmentVisibility(window.cocoDrawingRectangle.selectedSegment);
  }

  // delete the selected rectangle and its painted polygon
  exitFromEditRectangle();
}