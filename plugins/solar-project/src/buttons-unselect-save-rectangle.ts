import setupSegments from './setup-segments-interactive-functions';

export const createUnselectSegmentButton = ( gmap : google.maps.Map ) => {
  const unselectButton = document.createElement('button');
  unselectButton.textContent = 'Unselect';
  unselectButton.style.position = 'absolute';
  unselectButton.style.top = '10px';
  unselectButton.style.right = '10px';
  gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(unselectButton);

  unselectButton.addEventListener('click', handlerClickUnselectButton)
  return unselectButton;
}


const handlerClickUnselectButton = function(e: MouseEvent) {
    // rebuild all the segments
    setupSegments();
    const unselectButton = e.currentTarget as HTMLElement;

    if (!unselectButton) return;
    unselectButton.remove();

    // debug action, remove the info of the segment
    const popupInfoDebug = document.getElementById('popup-info');
    if (popupInfoDebug) popupInfoDebug.remove();

}