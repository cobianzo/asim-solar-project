import { contextConnect } from '@wordpress/components/build-types/context';
import { resetSegmentVisibility } from './drawing-helpers';
import setupSegments from './setup-segments-interactive-functions';
import { convertPolygonPathToStringLatLng } from './trigonometry-helpers';
import { RECTANGLE_OPTIONS } from './setup-rectangle-interactive';

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
  return createBtn( gmap, 'Save', handlerClickSaveRectangleButton, {id: 'save-rectangle-btn'} );
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


const handlerClickSaveRectangleButton = function(e :MouseEvent) {

  e.preventDefault();

  if ( !window.cocoDrawingRectangle?.polygon) {
    console.error('There is no rectangle to save');
    return;
  }

  // cleanup - delete the rectangle if it existed already.

  const pathAsString = convertPolygonPathToStringLatLng(window.cocoDrawingRectangle.polygon);
  const savedRectangle = {
    polygon: null,
    tempPathAsString: pathAsString,
    segmentIndex: window.cocoDrawingRectangle.selectedSegment?.indexInMap,
    solarPanelsPolygons: []
  };

  // all the info for the rectangle is in window.cocoDrawingRectangle
  window.cocoSavedRectangles = window.cocoSavedRectangles || [];
  window.cocoSavedRectangles.push(savedRectangle);

  // change the look of the segment now that it has a rectangle
  if (window.cocoDrawingRectangle.selectedSegment) {
    resetSegmentVisibility(window.cocoDrawingRectangle.selectedSegment);
  }

  // delete the selected rectangle and its painted polygon
  exitFromEditRectangle();
}