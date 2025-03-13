/**
 * Origin of call to functions happening in step 2:
 * Step 2 of the GF: setup of the position of the segments: the offset and the orientation.
 */
// types
import { CocoMapSetup } from './types';

import {
  paintPolygonsByArrayOfStrings,
 } from './drawing-helpers';

import { setupSegmentsAndDraggableBoundingBox, updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion, updateValuesCoordsSegmentsWithOffset } from './setup-drag-all-segments-interaction';


/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
const getStep2CocoMapSetup = () : CocoMapSetup | null => {
  const cocoMapSetup = window.cocoMaps[window.step2CocoMapInputId];
  return cocoMapSetup ?? null;
}

/** Start everything  */

document.addEventListener("solarMapReady" as keyof DocumentEventMap, (event: Event) => {

  // setup and validations
  const customEvent = event as CustomEvent<CocoMapSetup>;
  const cocoMapSetup = getStep2CocoMapSetup();
  if ( ! window.cocoIsStepSelectOffset || ! cocoMapSetup
    || ( cocoMapSetup.inputElement.id !== customEvent.detail.inputElement.id )
  ) {
    return;
  }

  console.log(' Exectued cocoMap for field', window.cocoMapSetup);
  const theMap = cocoMapSetup.map;

  /**  ================ ================ ================ ================
   *
   *  PAINTS THE PROFILE OF THE BUILDING. The data has been exposed with PHP.
   *  ================ ================ ================ ================*/
  // design polygon of the whole roof profile (todelete, it does not always work)
  if (window.cocoBuildingProfile?.length) {
    paintPolygonsByArrayOfStrings(theMap, window.cocoBuildingProfile, { strokeColor: 'black' });
  }

  // If this is not the first time we load the step 2, we might have setup already a value for
  // the offset (and it's in window.step2RotationInserted compared to window.cocoOriginalBoundingBoxCenter))
  updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion();

  // Create the segments and the bounding box to drag them
  setupSegmentsAndDraggableBoundingBox();

} );


/** ================ ================ ================ ================
 *
 *
 *
 *  ================ ================ ================ ================ */



export default getStep2CocoMapSetup;