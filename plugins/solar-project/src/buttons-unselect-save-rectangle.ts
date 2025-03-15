import setupSegments from './setup-segments-interactive-functions';
import { convertPolygonPathIntoStringCoords } from './trigonometry-helpers';

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
  for (const [key, value] of Object.entries(attrs)) {
    (button as any)[key] = value;
  }
  gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(button);

  button.addEventListener('click', eventOnClick)
  return button;
}

export const createUnselectSegmentButton = ( gmap : google.maps.Map ) => {
  return createBtn( gmap, 'Delete', handlerClickUnselectButton, {id: 'delete-rectangle-btn'} );
}

export const createSaveSegmentButton = ( gmap : google.maps.Map ) => {
  return createBtn( gmap, 'Save', handlerClickSaveRectangleButton, {id: 'save-rectangle-btn'} );
}


const handlerClickUnselectButton = function(e: MouseEvent) {
    // rebuild all the segments
    setupSegments( window.step2RotationInserted ?? 'no-extra-rotation' );
    const unselectButton = e.currentTarget as HTMLElement;

    if (!unselectButton) return;
    unselectButton.remove();

    // debug action, remove the info of the segment
    const popupInfoDebug = document.getElementById('popup-info');
    if (popupInfoDebug) popupInfoDebug.remove();

}


const handlerClickSaveRectangleButton = function(e :MouseEvent) {

  if ( !window.cocoDrawingRectangle?.polygon) {
    console.error('There is no rectangle to save');
    return;
  }
  const saveBtn = e.currentTarget as HTMLElement;
  if (!saveBtn) return;
  saveBtn.remove();


  const pathAsString = convertPolygonPathIntoStringCoords(window.cocoDrawingRectangle.polygon);
  const savedRectangle = {
    polygon: null,
    tempPathAsString: pathAsString,
    segmentIndex: window.cocoDrawingRectangle.selectedSegment?.indexInMap
  };

  // all the info for the rectangle is in window.cocoDrawingRectangle
  window.cocoSavedRectangles = window.cocoSavedRectangles || [];
  window.cocoSavedRectangles.push(savedRectangle);

  // delete the selected rectangle and its painted polygon
  handlerClickUnselectButton(e);
}