/**
 * Step map 1 does not have custom js to apply.
 * The GF coco-map field works ok out of the box.
 */
import { createNotification } from "./notification-api";
import { CocoMapSetup } from "./types";



/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
const getStep1CocoMapSetup = () : CocoMapSetup | null => {
  const cocoMapSetup = window.cocoMaps[window.step1CocoMapInputId];
  return cocoMapSetup ?? null;
}

/** Start everything  */

document.addEventListener("solarMapReady" as keyof DocumentEventMap, (event: Event) => {

  // setup and validations
  const customEvent = event as CustomEvent<CocoMapSetup>;
  const cocoMapSetup = getStep1CocoMapSetup();
  if ( ! window.cocoIsStepSelectRoof || ! cocoMapSetup
    || ( cocoMapSetup.inputElement.id !== customEvent.detail.inputElement.id )
  ) {
    return;
  }

  // show a message when the user selects a roof
  const inputElement = cocoMapSetup.inputElement;
  inputElement.addEventListener('input', (event: Event) => {
    createNotification('STEP1_ROOF_SELECTED');
  });

  // if on page load there is already a value, we zoom to 19
  if (inputElement.value) {
    const [lat, lng] = inputElement.value.split(',');
    cocoMapSetup.map.panTo({ lat: parseFloat(lat), lng: parseFloat(lng) });
    cocoMapSetup.map.setZoom(19);
  }
});