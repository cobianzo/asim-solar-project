// RENAME TO step 4 TODO:
import { updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion } from './setup-drag-all-segments-interaction';
import { loadSavedRectanglesFromTextArea } from './setup-rectangle-interactive';
import setupSegments from './setup-segments-interactive-functions';
import { CocoMapSetup } from './types';

/**
 * Returns the CocoMapSetup object for the step2 map (the one with the input text element
 * identified by window.step2CocoMapInputId). The default export of this script
 *
 * @returns {CocoMapSetup | null}
 */
export const getStep3CocoMapSetup = function() : CocoMapSetup | null {
  const cocoMapSetup = window.cocoMaps[window.step3CocoMapInputId];
  return cocoMapSetup ?? null;
}

document.addEventListener("solarMapReady", (event: Event) => {

  // setup and validations
  const customEvent = event as CustomEvent<CocoMapSetup>;
  const cocoMapSetup = getStep3CocoMapSetup();
  if ( ! window.cocoIsStepSelectRectangle || ! cocoMapSetup
    || ( cocoMapSetup.inputElement.id !== customEvent.detail.inputElement.id )
  ) {
    return;
  }

  console.log(' Exectued cocoMap for field', window.cocoMapSetup);
  // this also paints the bounding box. It is needed as reference of the offset for all segments.
  updateValuesCoordsSegmentsWithOffsetAsPerFormCompletion();
  window.cocoMovingBoundingBoxPolygon?.setVisible(false);

  setupSegments();

  loadSavedRectanglesFromTextArea();
});
