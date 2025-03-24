// RENAME TO step 4 TODO:
import { createNotification } from './notification-api';
import { updateValuesCoordsSegmentsFromDBOffset } from './setup-drag-all-segments-interaction';
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
  const cocoMapSetup = getStep3CocoMapSetup();
  if ( ! window.cocoIsStepSelectRectangle || ! cocoMapSetup
    || ( cocoMapSetup.inputElement.id !== (event as CustomEvent<CocoMapSetup>).detail.inputElement.id )
  ) return;

  // this also paints the bounding box. It is needed as reference of the offset for all segments.
  updateValuesCoordsSegmentsFromDBOffset();
  window.cocoMovingBoundingBoxPolygon?.setVisible(false);

  // paint paint paint! and make them interactive
  setupSegments();

  // if this in not the first time we load this page
  loadSavedRectanglesFromTextArea();

  // notification
  if (window.cocoSavedRectangles.length) {
    createNotification('STEP3_EDIT_OR_SELECT', [window.cocoSavedRectangles.length.toString()] );
  } else {
    createNotification('STEP3_SELECT_SEGMENT', [window.cocoBuildingSegments.length.toString()] );
  }
});
