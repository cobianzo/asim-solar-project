// RENAME TO step 4 TODO:
import { CocoMapSetup } from './types';

/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
const getStep3CocoMapSetup = () : CocoMapSetup | null => {
  const cocoMapSetup = window.cocoMaps[window.step3CocoMapInputId];
  return cocoMapSetup ?? null;
}

document.addEventListener("solarMapReady", (event: Event) => {

  if (!window.cocoIsStepSelectPanelli) {
    return;
  }


  const cocoMapSetup = (event as CustomEvent).detail as CocoMapSetup;
  if (window.step3CocoMapInputId !== cocoMapSetup.inputElement.id) {
    console.error('not found the input id', cocoMapSetup.inputElement);
    return;
  }
  alert('we are in step 3: ' + window.step2RectangleCoords);

  // convert the coords window.step2RectangleCoords
  window.paintAPoygonInMap(cocoMapSetup.map, window.step2RectangleCoords, { fillOpacity: 0.35 });

});
